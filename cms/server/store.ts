import "server-only";
import { randomBytes } from "node:crypto";
import type { AuditEntry, Author, Category, Media, Post, Site } from "@/cms/lib/types";
import { currentActor } from "./auth/actor";
import { loadJson, saveJson } from "./store-json";
import { loadMongo, saveMongo, snapshot } from "./store-mongo";

/**
 * Storage layer. All reads and writes in the application go through `readDb` and `mutateDb` below.
 *
 * - MongoDB (MongoDB Atlas): always, in production and by default. See store-mongo.ts.
 * - The JSON file .cms-data/db.json: only when CMS_STORE=json is set, for local testing. See store-json.ts.
 *
 * Uploaded image FILES are not stored here: they stay in the local folder handled by media.ts. Only the record
 * describing each image (name, size, dimensions, website) is kept in the store.
 *
 * Both stores work on the whole data set per request. That keeps every rule in one place and is fine for a blog of
 * this size; replacing the reads with targeted queries is the next step before the content grows large.
 */

export { dataDir, uploadsDir } from "./paths";
export { StoreConflictError, StoreUnavailableError } from "./store-errors";

export type Database = {
  version: 1;
  sites: Site[];
  categories: Category[];
  authors: Author[];
  posts: Post[];
  media: Media[];
  audit: AuditEntry[];
};

export type StoreKind = "mongodb" | "json-file";

/**
 * Which store is in use. MongoDB, always, unless CMS_STORE=json is set on purpose for a local test.
 * There is no automatic fallback: a missing or unreachable database is an error, never a quiet switch to a local file.
 */
export function storeKind(): StoreKind {
  return process.env.CMS_STORE?.trim().toLowerCase() === "json" ? "json-file" : "mongodb";
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

// One queue per process, shared by every route, so two saves cannot interleave.
const KEY = Symbol.for("cms.local.store.queue");
const g = globalThis as typeof globalThis & { [KEY]?: Promise<unknown> };

/** A fresh copy of the stored data, read from the store every time so another process's changes are picked up. */
export async function readDb(): Promise<Database> {
  await (g[KEY] ?? Promise.resolve()).catch(() => undefined);
  return storeKind() === "mongodb" ? loadMongo() : loadJson();
}

/** Applies a change and saves it. Changes run one at a time. Throwing inside `change` saves nothing. */
export function mutateDb<T>(change: (db: Database) => T): Promise<T> {
  const run = (g[KEY] ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      if (storeKind() === "mongodb") {
        const db = await loadMongo();
        const before = snapshot(db);
        const result = change(db);
        await saveMongo(db, before);
        return result;
      }
      const db = loadJson();
      const result = change(db);
      saveJson(db);
      return result;
    });
  g[KEY] = run;
  return run;
}

export function audit(db: Database, entry: Omit<AuditEntry, "id" | "at" | "actor">) {
  // Recorded against the signed-in administrator (see auth/actor.ts); "system" for command-line tools.
  db.audit.unshift({ id: newId("log"), at: new Date().toISOString(), actor: currentActor(), ...entry });
  db.audit.length = Math.min(db.audit.length, 500);
}
