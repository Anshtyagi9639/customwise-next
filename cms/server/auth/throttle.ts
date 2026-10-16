import "server-only";
import { createHash } from "node:crypto";
import { authDb, authUnavailable } from "./users";

/**
 * Limits on failed sign-in attempts, kept in MongoDB ("admin_login_throttle") so they survive restarts.
 *
 * - Per email address: 5 failures within 15 minutes locks that address for 15 minutes. This applies whether or not
 *   the account exists, so it cannot be used to find out which addresses have accounts.
 * - Per IP address: 20 failures within 15 minutes locks that address for 15 minutes. The IP comes from the
 *   X-Forwarded-For header set by the hosting proxy; the per-email limit does not depend on it.
 *
 * Someone who knows an administrator's email address can keep that account locked by failing on purpose; the lock
 * lifts by itself after 15 minutes, and scripts/cms/admin-users.mjs can clear it.
 */

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type ThrottleDoc = { _id: string; count: number; windowStart: Date; lockedUntil: Date | null; expiresAt: Date };
export type ThrottleKey = { id: string; limit: number };

export function throttleKeys(email: string, ip: string): { email: ThrottleKey; ip: ThrottleKey } {
  return {
    email: { id: `email:${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}`, limit: 5 },
    ip: { id: `ip:${ip.slice(0, 64)}`, limit: 20 },
  };
}

async function collection() {
  return (await authDb()).collection<ThrottleDoc>("admin_login_throttle");
}

/** Milliseconds until the longest current lock ends, or 0. */
export async function lockedFor(keys: ThrottleKey[]): Promise<number> {
  try {
    const docs = await (await collection()).find({ _id: { $in: keys.map((k) => k.id) } }).toArray();
    const now = Date.now();
    return Math.max(0, ...docs.map((d) => (d.lockedUntil ? d.lockedUntil.getTime() - now : 0)));
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function recordFailure(keys: ThrottleKey[]): Promise<void> {
  try {
    const col = await collection();
    const now = Date.now();
    for (const key of keys) {
      const doc = await col.findOne({ _id: key.id });
      const fresh = !doc || now - doc.windowStart.getTime() > WINDOW_MS;
      const count = fresh ? 1 : doc.count + 1;
      const lockedUntil = count >= key.limit ? new Date(now + LOCK_MS) : fresh ? null : doc.lockedUntil;
      await col.updateOne(
        { _id: key.id },
        { $set: { count, windowStart: fresh ? new Date(now) : doc.windowStart, lockedUntil, expiresAt: new Date(now + WINDOW_MS + LOCK_MS) } },
        { upsert: true },
      );
    }
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function clearFailures(key: ThrottleKey): Promise<void> {
  try {
    await (await collection()).deleteOne({ _id: key.id });
  } catch (err) {
    throw authUnavailable(err);
  }
}

/* ---------- In memory, for the administrator from the server settings (signs in without the database) ---------- */

type MemoryEntry = { count: number; windowStart: number; lockedUntil: number };
const MEMORY = Symbol.for("cms.auth.memoryThrottle");
const gm = globalThis as typeof globalThis & { [MEMORY]?: Map<string, MemoryEntry> };
const memory = () => (gm[MEMORY] ??= new Map());

/** The same limits as above, kept in this process's memory (cleared when the server restarts). */
export function memoryLockedFor(keys: ThrottleKey[], now = Date.now()): number {
  return Math.max(0, ...keys.map((k) => (memory().get(k.id)?.lockedUntil ?? 0) - now));
}

export function memoryRecordFailure(keys: ThrottleKey[], now = Date.now()): void {
  const m = memory();
  for (const [id, e] of m) if (now - e.windowStart > WINDOW_MS + LOCK_MS) m.delete(id);
  for (const key of keys) {
    const e = m.get(key.id);
    const fresh = !e || now - e.windowStart > WINDOW_MS;
    const count = fresh ? 1 : e.count + 1;
    m.set(key.id, { count, windowStart: fresh ? now : e.windowStart, lockedUntil: count >= key.limit ? now + LOCK_MS : fresh ? 0 : e.lockedUntil });
  }
}

export function memoryClearFailures(key: ThrottleKey): void {
  memory().delete(key.id);
}
