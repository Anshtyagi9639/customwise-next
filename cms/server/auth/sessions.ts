import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { SESSION_ABSOLUTE_MS, SESSION_COOKIE, SESSION_COOKIE_PATH, SESSION_COOKIE_SECURE, SESSION_IDLE_MS } from "@/cms/lib/auth-shared";
import { endEnvSession, isEnvSessionToken, readEnvSession } from "./env-sessions";
import { type AdminUser, authDb, authUnavailable, toAdminUser, usersCollection } from "./users";

/**
 * Server-side sessions in the MongoDB collection "admin_sessions".
 * The browser holds only a random token; the database stores its SHA-256 hash, so a copy of the database cannot be
 * used to sign in. A session ends after 2 hours without activity or 12 hours after sign-in, on sign-out, when the
 * account is disabled, and when its password changes. Expired sessions are removed by a TTL index.
 * Sessions of the administrator from the server settings are kept apart, without the database (env-sessions.ts).
 */

type SessionDoc = { _id: string; userId: string; createdAt: Date; lastSeenAt: Date; idleExpiresAt: Date; expiresAt: Date; ip: string; userAgent: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TOUCH_EVERY_MS = 5 * 60 * 1000;

async function sessions() {
  return (await authDb()).collection<SessionDoc>("admin_sessions");
}

export async function createSession(user: AdminUser, meta: { ip: string; userAgent: string }): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  try {
    await (await sessions()).insertOne({
      _id: hashToken(token),
      userId: user.id,
      createdAt: now,
      lastSeenAt: now,
      idleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MS),
      expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
      ip: meta.ip.slice(0, 64),
      userAgent: meta.userAgent.slice(0, 200),
    });
  } catch (err) {
    throw authUnavailable(err);
  }
  return token;
}

/** The signed-in user for a session token, or null. Also extends the idle timeout while the user is active. */
export async function readSession(token: string | undefined): Promise<{ sessionId: string; user: AdminUser; attempt?: string } | null> {
  if (isEnvSessionToken(token)) return readEnvSession(token);
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const id = hashToken(token);
  try {
    const col = await sessions();
    const session = await col.findOne({ _id: id });
    if (!session) return null;
    const now = Date.now();
    if (session.expiresAt.getTime() <= now || session.idleExpiresAt.getTime() <= now) {
      await col.deleteOne({ _id: id });
      return null;
    }
    const doc = await (await usersCollection()).findOne({ _id: session.userId });
    // A disabled account, or a password changed after this session began, ends the session.
    if (!doc || doc.status !== "active" || doc.passwordChangedAt.getTime() > session.createdAt.getTime()) {
      await col.deleteOne({ _id: id });
      return null;
    }
    if (now - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
      await col.updateOne({ _id: id }, { $set: { lastSeenAt: new Date(now), idleExpiresAt: new Date(Math.min(now + SESSION_IDLE_MS, session.expiresAt.getTime())) } });
    }
    return { sessionId: id, user: toAdminUser(doc) };
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function endSession(token: string | undefined): Promise<void> {
  if (isEnvSessionToken(token)) return endEnvSession(token);
  if (!token || !TOKEN_PATTERN.test(token)) return;
  try {
    await (await sessions()).deleteOne({ _id: hashToken(token) });
  } catch (err) {
    throw authUnavailable(err);
  }
}

/** Signs the user out everywhere, optionally keeping one session (the one making the change). */
export async function endAllSessions(userId: string, keepSessionId?: string): Promise<number> {
  try {
    const result = await (await sessions()).deleteMany(keepSessionId ? { userId, _id: { $ne: keepSessionId } } : { userId });
    return result.deletedCount;
  } catch (err) {
    throw authUnavailable(err);
  }
}

/** Cookie settings: HttpOnly (no JavaScript access), Secure (HTTPS only; see auth-shared.ts for next dev), SameSite=Strict, admin paths only. */
export function sessionCookie(token: string) {
  return { name: SESSION_COOKIE, value: token, httpOnly: true, secure: SESSION_COOKIE_SECURE, sameSite: "strict" as const, path: SESSION_COOKIE_PATH, maxAge: Math.floor(SESSION_ABSOLUTE_MS / 1000) };
}

export function clearedSessionCookie() {
  return { name: SESSION_COOKIE, value: "", httpOnly: true, secure: SESSION_COOKIE_SECURE, sameSite: "strict" as const, path: SESSION_COOKIE_PATH, maxAge: 0 };
}
