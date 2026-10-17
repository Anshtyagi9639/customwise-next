import "server-only";
import { type AnyBulkWriteOperation, type Db, MongoClient } from "mongodb";
import { seedDatabase } from "./seed";
import type { Database } from "./store";
import { StoreConflictError, StoreUnavailableError } from "./store-errors";
import { debugEvent, elapsed, logEvent } from "./log";
import { checkDocs } from "./doc-check";
import { describeMongoUri, mongoFailure } from "./mongo-failure";

/**
 * MongoDB store (MongoDB Atlas in production use; any MongoDB server for testing).
 *
 * One collection per record type. A record's `id` is stored as the document's `_id`, so ids are the same in the JSON
 * file, in MongoDB and in the API, and importing the same record twice cannot create a duplicate.
 *
 * Rules the database itself enforces (see INDEXES): an article slug is unique within a website, a category slug is
 * unique within a website, and a website key is unique. The application checks these first to give a helpful
 * message; the indexes are the guarantee when two saves race or more than one copy of the app is running.
 *
 * The connection string and database name come from MONGODB_URI and MONGODB_DB on the server only. Neither is ever
 * logged, returned by an API or sent to the browser.
 */

type Doc = { _id: string } & Record<string, unknown>;
export type Snapshot = Record<RecordCollection, Map<string, string>>;

/** Written in this order: articles first, so a refused slug stops the save before anything else is written. */
const RECORD_COLLECTIONS = ["posts", "sites", "categories", "authors", "media"] as const;
type RecordCollection = (typeof RECORD_COLLECTIONS)[number];
const AUDIT_KEPT_IN_MEMORY = 500;

const INDEXES: { collection: string; keys: Record<string, 1 | -1>; unique?: boolean; name: string; onlyWhere?: Record<string, unknown> }[] = [
  { collection: "posts", keys: { siteId: 1, slug: 1 }, unique: true, name: "site_slug_unique" },
  { collection: "posts", keys: { siteId: 1, status: 1, publishAt: -1 }, name: "site_status_publishAt" },
  { collection: "categories", keys: { siteId: 1, slug: 1 }, unique: true, name: "site_slug_unique" },
  { collection: "sites", keys: { key: 1 }, unique: true, name: "key_unique" },
  { collection: "media", keys: { siteId: 1 }, name: "site" },
  // One record per hosted image. Local images have no publicId and are not covered by this rule.
  { collection: "media", keys: { publicId: 1 }, unique: true, name: "public_id_unique", onlyWhere: { publicId: { $type: "string" } } },
  { collection: "audit", keys: { at: -1 }, name: "at_desc" },
];

/** A setting's value without surrounding spaces or one pair of matching quotes (hosting panels may keep typed quotes). */
function setting(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  return /^(["']).*\1$/.test(value) ? value.slice(1, -1).trim() : value;
}

let lastConfigLog = 0;
/** Refuses to connect, and says why in the server log (at most once a minute). Never logs the values themselves. */
function notConfigured(reason: string): never {
  if (Date.now() - lastConfigLog > 60_000) {
    lastConfigLog = Date.now();
    logEvent("CMS_DB", "connection_failed", { outcome: "failure", code: "not-configured", missing: [/MONGODB_DB/.test(reason) ? "MONGODB_DB" : "MONGODB_URI"], msg: `MongoDB is not configured on this server: ${reason}` });
  }
  throw new StoreUnavailableError(`The CMS database is not configured: ${reason}`, "not-configured", "not-configured");
}

function config(): { uri: string; name: string } {
  const uri = setting("MONGODB_URI");
  const name = setting("MONGODB_DB");
  if (!uri) notConfigured("MONGODB_URI is not set.");
  if (!/^mongodb(\+srv)?:\/\/\S+$/.test(uri)) notConfigured(`MONGODB_URI is set but is not a MongoDB connection string${/\s/.test(uri) ? " (it contains a space)" : ""}.`);
  if (!name) notConfigured("MONGODB_DB is not set.");
  if (!/^[A-Za-z0-9_-]{1,38}$/.test(name)) notConfigured("MONGODB_DB is not a valid database name (letters, numbers, hyphens or underscores; no spaces).");
  return { uri, name };
}

/** The database the CMS is meant to use in production. */
const EXPECTED_DB = "blog_cms";

/** Logs what kind of failure happened and what to do, and nothing else: driver messages can contain host names. */
function unavailable(err: unknown, during: string, ms?: number, collection?: string): StoreUnavailableError {
  if (err instanceof StoreUnavailableError) return err;
  const f = mongoFailure(err, during);
  if (shouldLogFailure(`${during}:${f.kind}`)) {
    logEvent("CMS_DB", during === "connection" ? "connection_failed" : "query_failed", { outcome: "failure", ms, code: f.kind, during, db: dbName(), collection, error: f.summary, suppressed: takeSuppressed(), msg: `MongoDB ${during} failed (${f.kind}): ${f.advice}.` });
  }
  return new StoreUnavailableError(undefined, "unreachable", f.kind);
}

/*
 * While the database is down every request retries the connection; the same failure is logged at most once a minute
 * (with the number of repeats left out), so an outage does not flood the log.
 */
let lastFailure = { key: "", at: 0 };
let suppressed = 0;
function shouldLogFailure(key: string): boolean {
  if (key === lastFailure.key && Date.now() - lastFailure.at < 60_000) {
    suppressed++;
    return false;
  }
  lastFailure = { key, at: Date.now() };
  return true;
}
function takeSuppressed(): number | undefined {
  const n = suppressed;
  suppressed = 0;
  return n || undefined;
}
const quietRetry = () => lastFailure.key.startsWith("connection:") && Date.now() - lastFailure.at < 60_000;

const isDuplicateKey = (err: unknown) => (err as { code?: unknown })?.code === 11000;
/** The database name, for log lines (it is not a secret; the connection string never is logged). */
const dbName = () => setting("MONGODB_DB") || undefined;

// One client per process, kept on globalThis so development reloads and every request reuse the same connection pool.
const KEY = Symbol.for("cms.store.mongodb");
const g = globalThis as typeof globalThis & { [KEY]?: Promise<Db> };

async function open(): Promise<Db> {
  const { uri, name } = config();
  const client = new MongoClient(uri, { appName: "multi-site-blog-cms", maxPoolSize: 10, serverSelectionTimeoutMS: 8000, ignoreUndefined: true });
  const start = performance.now();
  // db_selected is what client.db() gets below: always MONGODB_DB, never the database in the URI's path.
  if (!quietRetry()) logEvent("CMS_DB", "connection_started", { db: name, db_selected: name, db_configured: name, matches_expected: name === EXPECTED_DB, ...describeMongoUri(uri) });
  try {
    await client.connect();
    const db = client.db(name);
    for (const index of INDEXES) await db.collection(index.collection).createIndex(index.keys, { unique: index.unique ?? false, name: index.name, ...(index.onlyWhere ? { partialFilterExpression: index.onlyWhere } : {}) });
    await seedIfEmpty(db);
    logEvent("CMS_DB", "connection_succeeded", { outcome: "success", ms: elapsed(start), db: name });
    lastFailure = { key: "", at: 0 };
    return db;
  } catch (err) {
    await client.close().catch(() => undefined);
    throw unavailable(err, "connection", elapsed(start));
  }
}

/** The shared database connection. Also used by the sign-in module for its own collections. */
export function database(): Promise<Db> {
  if (!g[KEY]) {
    const attempt = open();
    g[KEY] = attempt;
    // A failed attempt is forgotten so the next request tries again instead of failing for ever.
    attempt.catch(() => {
      if (g[KEY] === attempt) g[KEY] = undefined;
    });
  }
  return g[KEY];
}

/** A brand-new database gets the two test website configurations. Existing data is never touched. */
async function seedIfEmpty(db: Db) {
  if ((await db.collection("sites").countDocuments({}, { limit: 1 })) > 0) return;
  const seed = seedDatabase();
  for (const name of RECORD_COLLECTIONS) {
    const ops = seed[name].map(({ id, ...rest }): AnyBulkWriteOperation<Doc> => ({ updateOne: { filter: { _id: id }, update: { $setOnInsert: rest }, upsert: true } }));
    if (ops.length) await db.collection<Doc>(name).bulkWrite(ops, { ordered: false });
  }
}

const fromDocs = <T>(docs: Doc[]) => docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }) as T);

/** What the last read found, for the admin screens' log line (cms/server/admin-data.ts). Counts only. */
export type ReadStats = { ms: number; counts: Record<string, number>; invalid: Record<string, number> };
let lastRead: ReadStats | null = null;
export const lastReadStats = () => lastRead;

export async function loadMongo(): Promise<Database> {
  const db = await database();
  const start = performance.now();
  // Each collection is read on its own, so a failure names the collection it happened in.
  const all = async (name: string) => {
    const t = performance.now();
    debugEvent("database_query_started", { operation: "find", collection: name, db: dbName() });
    try {
      const docs = await db.collection<Doc>(name).find().toArray();
      debugEvent("database_query_completed", { operation: "find", collection: name, db: dbName(), outcome: "success", ms: elapsed(t), count: docs.length });
      return docs;
    } catch (err) {
      throw unavailable(err, "read", elapsed(t), name);
    }
  };
  const [sites, categories, authors, posts, media, auditLog] = await Promise.all([
    all("sites"),
    all("categories"),
    all("authors"),
    all("posts"),
    all("media"),
    db
      .collection<Doc>("audit")
      .find()
      .sort({ at: -1 })
      .limit(AUDIT_KEPT_IN_MEMORY)
      .toArray()
      .catch((err) => {
        throw unavailable(err, "read", elapsed(start), "audit");
      }),
  ]);
  const raw = { sites, categories, authors, posts, media };
  const checked = Object.fromEntries(Object.entries(raw).map(([name, docs]) => [name, checkDocs(name, docs)])) as Record<keyof typeof raw, { valid: Doc[]; invalid: number }>;
  const invalid = Object.fromEntries(Object.entries(checked).filter(([, c]) => c.invalid > 0).map(([name, c]) => [name, c.invalid]));
  for (const [collection, count] of Object.entries(invalid)) {
    if (shouldLogFailure(`invalid:${collection}:${count}`)) {
      logEvent("CMS_DATA", "invalid_documents", { outcome: "rejected", code: "invalid-document", db: dbName(), collection, count, msg: `${count} record(s) in "${collection}" lack fields the CMS needs, so they are left out of what is shown. They are not changed or deleted.` });
    }
  }
  lastRead = { ms: elapsed(start), counts: Object.fromEntries(Object.entries(checked).map(([name, c]) => [name, c.valid.length])), invalid };
  return {
    version: 1,
    sites: fromDocs(checked.sites.valid),
    categories: fromDocs(checked.categories.valid),
    authors: fromDocs(checked.authors.valid),
    posts: fromDocs(checked.posts.valid),
    media: fromDocs(checked.media.valid),
    audit: fromDocs(auditLog),
  };
}

/** What each record looked like before a change, so only the records that really changed are written. */
export function snapshot(db: Database): Snapshot & { audit: Set<string> } {
  const of = (items: { id: string }[]) => new Map(items.map((item) => [item.id, JSON.stringify(item)]));
  return { posts: of(db.posts), sites: of(db.sites), categories: of(db.categories), authors: of(db.authors), media: of(db.media), audit: new Set(db.audit.map((a) => a.id)) };
}

export async function saveMongo(after: Database, before: ReturnType<typeof snapshot>): Promise<void> {
  const db = await database();
  for (const name of RECORD_COLLECTIONS) {
    const ops: AnyBulkWriteOperation<Doc>[] = [];
    const seen = new Set<string>();
    for (const item of after[name] as ({ id: string } & Record<string, unknown>)[]) {
      seen.add(item.id);
      if (before[name].get(item.id) === JSON.stringify(item)) continue;
      const { id, ...rest } = item;
      ops.push({ replaceOne: { filter: { _id: id }, replacement: rest, upsert: true } });
    }
    for (const id of before[name].keys()) if (!seen.has(id)) ops.push({ deleteOne: { filter: { _id: id } } });
    if (ops.length === 0) continue;
    try {
      await db.collection<Doc>(name).bulkWrite(ops, { ordered: true });
    } catch (err) {
      if (isDuplicateKey(err)) throw new StoreConflictError(name);
      throw unavailable(err, "write", undefined, name);
    }
  }
  // The activity log only grows. Older entries stay in the database even when they are no longer loaded.
  const added = after.audit.filter((a) => !before.audit.has(a.id)).map(({ id, ...rest }) => ({ _id: id, ...rest }) as Doc);
  if (added.length) {
    try {
      await db.collection<Doc>("audit").insertMany(added, { ordered: false });
    } catch (err) {
      // The change itself is saved. A missing log line must not turn a successful save into an error.
      unavailable(err, "activity log write", undefined, "audit");
    }
  }
}
