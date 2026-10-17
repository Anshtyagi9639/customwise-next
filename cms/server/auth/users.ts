import "server-only";
import type { Db } from "mongodb";
import { storeKind } from "../store";
import { StoreUnavailableError } from "../store-errors";
import { database } from "../store-mongo";
import { logEvent } from "../log";
import { mongoFailure } from "../mongo-failure";

/**
 * Administrator accounts, kept in the MongoDB collection "admin_users".
 * There is no sign-up page and no API that creates accounts: accounts are created and reset with
 * scripts/cms/admin-users.mjs by someone with access to the database (see cms/README.md).
 */

export type AdminRole = "admin" | "editor";

export type AdminUserDoc = {
  _id: string;
  email: string; // stored lower-case; unique
  name: string;
  /** "admin": every website, authors and settings. "editor": articles and categories of the listed websites. */
  role: AdminRole;
  siteKeys: string[];
  /** "invited": created by an administrator, waiting for its owner to choose a password with the setup link. */
  status: "active" | "disabled" | "invited";
  /** Empty until the owner has set a password. */
  passwordHash: string;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

/** What the rest of the app may know about a signed-in user. Never contains the password hash. */
export type AdminUser = { id: string; email: string; name: string; role: AdminRole; siteKeys: string[] };

export const toAdminUser = (doc: AdminUserDoc): AdminUser => ({ id: doc._id, email: doc.email, name: doc.name, role: doc.role, siteKeys: doc.siteKeys ?? [] });

export function canAccessSite(user: Pick<AdminUser, "role" | "siteKeys">, siteKey: string): boolean {
  return user.role === "admin" || user.siteKeys.includes(siteKey);
}

const KEY = Symbol.for("cms.auth.indexes");
const g = globalThis as typeof globalThis & { [KEY]?: Promise<void> };

/** Logs only the kind of failure and what to do: driver messages can contain server addresses. */
export function authUnavailable(err: unknown): StoreUnavailableError {
  if (err instanceof StoreUnavailableError) return err;
  const f = mongoFailure(err, "account read");
  logEvent("CMS_DB", "query_failed", { outcome: "failure", code: f.kind, during: "account read", collection: "admin_users/admin_sessions", error: f.summary, msg: `database request failed (${f.kind}): ${f.advice}.` });
  return new StoreUnavailableError(undefined, "unreachable", f.kind);
}

/** The database for sign-in records. Sign-in always needs MongoDB, even if articles are kept in a local test file. */
export async function authDb(): Promise<Db> {
  if (storeKind() !== "mongodb") throw new StoreUnavailableError("Sign-in needs the MongoDB database (CMS_STORE=json does not support sign-in).");
  const db = await database();
  if (!g[KEY]) {
    const attempt = (async () => {
      await db.collection("admin_users").createIndex({ email: 1 }, { unique: true, name: "email_unique" });
      await db.collection("admin_sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expires_ttl" });
      await db.collection("admin_sessions").createIndex({ userId: 1 }, { name: "user" });
      await db.collection("admin_login_throttle").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expires_ttl" });
      await db.collection("admin_setup_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expires_ttl" });
      await db.collection("admin_setup_tokens").createIndex({ userId: 1 }, { name: "user" });
    })();
    g[KEY] = attempt;
    attempt.catch(() => {
      if (g[KEY] === attempt) g[KEY] = undefined;
    });
  }
  try {
    await g[KEY];
  } catch (err) {
    throw authUnavailable(err);
  }
  return db;
}

export async function usersCollection() {
  return (await authDb()).collection<AdminUserDoc>("admin_users");
}

export async function findUserByEmail(email: string): Promise<AdminUserDoc | null> {
  try {
    return await (await usersCollection()).findOne({ email: email.trim().toLowerCase() });
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function findUserById(id: string): Promise<AdminUserDoc | null> {
  try {
    return await (await usersCollection()).findOne({ _id: id });
  } catch (err) {
    throw authUnavailable(err);
  }
}
