import "server-only";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logEvent } from "../log";

/**
 * Sign-in records of the administrator from the server settings (email links and sessions), kept as small files so
 * that every process of the website sees the same records and they survive a restart, without needing MongoDB.
 * Each record is one file named after the SHA-256 hash of its token (the token itself is never stored), holding only
 * its expiry times. Folder: CMS_AUTH_DIR, else .cms-data/auth in the app folder (git-ignored, never served).
 *
 * take() is the single-use step: it renames the file first, which only one process can do, then reads it.
 */

export type RecordKind = "session" | "link" | "spent";
export class AuthStoreError extends Error {}

const ID = /^[0-9a-f]{64}$/;
const root = () => process.env.CMS_AUTH_DIR?.trim() || path.join(process.cwd(), ".cms-data", "auth");

function folder(kind: RecordKind): string {
  const dir = path.join(root(), kind);
  try {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  } catch (err) {
    throw fail("create", err);
  }
  return dir;
}

function fail(action: string, err: unknown): AuthStoreError {
  // Names the operation and the error code, never a token. The folder is named in the server log only.
  const code = (err as NodeJS.ErrnoException)?.code ?? "error";
  logEvent("CMS_AUTH", "auth_store_failed", { outcome: "failure", code, action, msg: `Could not ${action} a sign-in record in ${root()} (${code}). Check that CMS_AUTH_DIR (or .cms-data/auth in the app folder) exists, is writable by the Node.js process and is kept between deployments.` });
  return new AuthStoreError("The sign-in records could not be read or written.");
}

/** For the health check: can sign-in records be written right now? Yes or no, never where. */
export function authStoreWritable(): boolean {
  try {
    const dir = path.join(root(), "probe");
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const probe = path.join(dir, `${randomBytes(6).toString("hex")}.tmp`);
    writeFileSync(probe, "1", { mode: 0o600 });
    rmSync(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

const file = (kind: RecordKind, id: string) => {
  if (!ID.test(id)) throw new AuthStoreError("Invalid record id.");
  return path.join(folder(kind), `${id}.json`);
};

export function putRecord(kind: RecordKind, id: string, value: object): void {
  const target = file(kind, id);
  const temp = `${target}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    writeFileSync(temp, JSON.stringify(value), { mode: 0o600 });
    renameSync(temp, target); // replaces the record in one step
  } catch (err) {
    rmSync(temp, { force: true });
    throw fail("write", err);
  }
}

export function getRecord<T>(kind: RecordKind, id: string): T | null {
  try {
    return JSON.parse(readFileSync(file(kind, id), "utf8")) as T;
  } catch (err) {
    if (err instanceof AuthStoreError) throw err;
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    if (err instanceof SyntaxError) return null;
    throw fail("read", err);
  }
}

/** Reads and removes a record in one step that only one caller, in any process, can win. */
export function takeRecord<T>(kind: RecordKind, id: string): T | null {
  const source = file(kind, id);
  const claimed = `${source}.${randomBytes(6).toString("hex")}.taken`;
  try {
    renameSync(source, claimed);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    throw fail("claim", err);
  }
  try {
    return JSON.parse(readFileSync(claimed, "utf8")) as T;
  } catch {
    return null;
  } finally {
    rmSync(claimed, { force: true });
  }
}

export function removeRecord(kind: RecordKind, id: string): void {
  try {
    rmSync(file(kind, id), { force: true });
  } catch (err) {
    if (err instanceof AuthStoreError) throw err;
    throw fail("remove", err);
  }
}

/** Every record of a kind, for clean-up. Leftover temporary files older than a minute are removed as well. */
export function listRecords<T>(kind: RecordKind): { id: string; value: T }[] {
  const dir = folder(kind);
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch (err) {
    throw fail("list", err);
  }
  const out: { id: string; value: T }[] = [];
  for (const name of names) {
    const id = name.replace(/\.json$/, "");
    if (!ID.test(id) || name !== `${id}.json`) continue;
    const value = getRecord<T>(kind, id);
    if (value) out.push({ id, value });
  }
  return out;
}
