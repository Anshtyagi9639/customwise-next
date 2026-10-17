import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS } from "@/cms/lib/auth-shared";
import { type EnvAdmin, envAdmin } from "./env-admin";
import { AuthStoreError, getRecord, listRecords, putRecord, removeRecord } from "./file-store";
import type { AdminUser } from "./users";

/**
 * Sessions of the administrator from the server settings (ADMIN_EMAIL / ADMIN_PASSWORD_HASH), kept as small files
 * (file-store.ts) so that signing in does not need MongoDB, every process of the website sees them, and they survive
 * a restart. Same rules as the database sessions (sessions.ts): the browser holds a random token, only its SHA-256
 * hash is kept, 2 hours idle / 12 hours at most, ended on sign-out, and when ADMIN_EMAIL or ADMIN_PASSWORD_HASH
 * changes or is removed. Deleting the folder ends every such session.
 *
 * Tokens start with "e." (never produced for database sessions, whose tokens are plain base64url), so a request can be
 * checked without asking the database which kind it is.
 */

export const ENV_TOKEN_PREFIX = "e.";
const TOKEN_PATTERN = /^e\.[A-Za-z0-9_-]{43}$/;
const MAX_SESSIONS = 500;
const TOUCH_EVERY_MS = 60 * 1000;

/** attempt: the login attempt that created the session (the email link's), so later requests can be matched to it. */
type EnvSession = { createdAt: number; lastSeenAt: number; idleExpiresAt: number; expiresAt: number; settings: string; attempt?: string };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
/** Which settings a session was made with: any change to them ends every session. */
const fingerprint = (env: Extract<EnvAdmin, { state: "ok" }>) => sha256(`${env.email}\n${env.passwordHash}`);

export const ENV_ADMIN_ID = "settings-admin";
export const envAdminUser = (env: Extract<EnvAdmin, { state: "ok" }>): AdminUser => ({ id: ENV_ADMIN_ID, email: env.email, name: "Administrator", role: "admin", siteKeys: [] });

export const isEnvSessionToken = (token: string | undefined): token is string => !!token && token.startsWith(ENV_TOKEN_PREFIX);

function prune(now: number) {
  const all = listRecords<EnvSession>("session");
  const live = all.filter(({ id, value }) => {
    const expired = value.expiresAt <= now || value.idleExpiresAt <= now;
    if (expired) removeRecord("session", id);
    return !expired;
  });
  // A flood of sign-ins cannot grow the folder without limit: the oldest sessions go first.
  live.sort((x, y) => x.value.createdAt - y.value.createdAt);
  while (live.length >= MAX_SESSIONS) removeRecord("session", live.shift()!.id);
}

export function createEnvSession(env: Extract<EnvAdmin, { state: "ok" }>, now = Date.now(), attempt?: string): string {
  prune(now);
  const token = `${ENV_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  putRecord("session", sha256(token), { createdAt: now, lastSeenAt: now, idleExpiresAt: now + SESSION_IDLE_MS, expiresAt: now + SESSION_ABSOLUTE_MS, settings: fingerprint(env), ...(attempt ? { attempt } : {}) } satisfies EnvSession);
  return token;
}

/** The administrator for a valid settings session, or null. Also extends the idle timeout while it is used. */
export function readEnvSession(token: string, now = Date.now()): { sessionId: string; user: AdminUser; attempt?: string } | null {
  if (!TOKEN_PATTERN.test(token)) return null;
  const id = sha256(token);
  try {
    const session = getRecord<EnvSession>("session", id);
    if (!session) return null;
    const env = envAdmin();
    if (env.state !== "ok" || session.settings !== fingerprint(env) || session.expiresAt <= now || session.idleExpiresAt <= now) {
      removeRecord("session", id);
      return null;
    }
    if (now - session.lastSeenAt > TOUCH_EVERY_MS) {
      putRecord("session", id, { ...session, lastSeenAt: now, idleExpiresAt: Math.min(now + SESSION_IDLE_MS, session.expiresAt) });
    }
    return { sessionId: id, user: envAdminUser(env), ...(session.attempt ? { attempt: session.attempt } : {}) };
  } catch (err) {
    // The records cannot be read (logged by the store): treated as signed out, never as signed in.
    if (err instanceof AuthStoreError) return null;
    throw err;
  }
}

export function endEnvSession(token: string): void {
  if (TOKEN_PATTERN.test(token)) removeRecord("session", sha256(token));
}
