import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { readDb } from "../store";
import { hashPassword, passwordProblem } from "./password";
import { isEnvAdminEmail } from "./env-admin";
import { endAllSessions } from "./sessions";
import { type AdminRole, type AdminUser, type AdminUserDoc, authDb, authUnavailable, usersCollection } from "./users";
import { enabledSites } from "../sites";

/**
 * Accounts managed by administrators, from the Users screen. There is no public sign-up: an administrator invites a
 * person, and the person chooses their own password through a one-time setup link. The same kind of link resets a
 * forgotten password. Links are random, stored only as a hash, single-use, and expire (72 hours for an invitation,
 * 24 hours for a reset). The first administrator is created with scripts/cms/admin-users.mjs.
 */

const INVITE_MS = 72 * 60 * 60 * 1000;
const RESET_MS = 24 * 60 * 60 * 1000;

type Purpose = "invite" | "reset";
type TokenDoc = { _id: string; userId: string; purpose: Purpose; expiresAt: Date; createdAt: Date; createdBy: string };

export type AccountSummary = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  siteKeys: string[];
  status: AdminUserDoc["status"];
  createdAt: string;
  lastLoginAt: string | null;
  /** An unused invitation or reset link, if one is waiting. The link itself is never stored, so it cannot be shown again. */
  pendingLink: { purpose: Purpose; expiresAt: string } | null;
};

export type AccountResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404 | 409; message: string; fieldErrors?: Record<string, string> };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const fail = <T>(status: 400 | 404 | 409, message: string, fieldErrors?: Record<string, string>): AccountResult<T> => ({ ok: false, status, message, ...(fieldErrors ? { fieldErrors } : {}) });

async function tokens() {
  return (await authDb()).collection<TokenDoc>("admin_setup_tokens");
}

/** Replaces any earlier link of the account with a new one. Returns the token, which is shown to the administrator once. */
async function issueToken(userId: string, purpose: Purpose, createdBy: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = new Date(now + (purpose === "invite" ? INVITE_MS : RESET_MS));
  const col = await tokens();
  await col.deleteMany({ userId });
  await col.insertOne({ _id: hashToken(token), userId, purpose, expiresAt, createdAt: new Date(now), createdBy });
  return { token, expiresAt };
}

export async function listAccounts(): Promise<AccountSummary[]> {
  try {
    const users = await (await usersCollection()).find({}, { projection: { passwordHash: 0 } }).sort({ email: 1 }).toArray();
    const pending = await (await tokens()).find({ expiresAt: { $gt: new Date() } }).toArray();
    return users.map((u) => {
      const link = pending.find((t) => t.userId === u._id);
      return {
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        siteKeys: u.siteKeys ?? [],
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        pendingLink: link ? { purpose: link.purpose, expiresAt: link.expiresAt.toISOString() } : null,
      };
    });
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function inviteAccount(by: AdminUser, input: { email?: unknown; name?: unknown; role?: unknown; siteKeys?: unknown }): Promise<AccountResult<{ id: string; email: string; token: string; expiresAt: string }>> {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 100) : "";
  const role = input.role === "admin" ? "admin" : input.role === "editor" ? "editor" : null;
  const siteKeys = Array.isArray(input.siteKeys) ? [...new Set(input.siteKeys.filter((k): k is string => typeof k === "string"))] : [];
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "Enter the person's email address.";
  if (!role) errors.role = "Choose administrator or editor.";
  const known = new Set(enabledSites(await readDb()).map((s) => s.key));
  if (role === "editor" && siteKeys.length === 0) errors.siteKeys = "Choose at least one website this editor may manage.";
  if (siteKeys.some((k) => !known.has(k))) errors.siteKeys = "Choose websites from the list.";
  if (Object.keys(errors).length) return fail(400, "Some details need attention.", errors);
  try {
    const users = await usersCollection();
    if (await users.findOne({ email })) return fail(409, "There is already an account for this email address.", { email: "Already has an account." });
    const now = new Date();
    const id = `user_${randomBytes(9).toString("base64url")}`;
    await users.insertOne({ _id: id, email, name, role: role!, siteKeys: role === "admin" ? [] : siteKeys, status: "invited", passwordHash: "", passwordChangedAt: now, createdAt: now, updatedAt: now, lastLoginAt: null });
    const { token, expiresAt } = await issueToken(id, "invite", by.email);
    return { ok: true, value: { id, email, token, expiresAt: expiresAt.toISOString() } };
  } catch (err) {
    if ((err as { code?: unknown })?.code === 11000) return fail(409, "There is already an account for this email address.", { email: "Already has an account." });
    throw authUnavailable(err);
  }
}

/** A new setup link for someone who has forgotten their password (or whose invitation expired). */
export async function issueResetLink(by: AdminUser, userId: string): Promise<AccountResult<{ email: string; token: string; expiresAt: string; purpose: Purpose }>> {
  try {
    const user = await (await usersCollection()).findOne({ _id: userId });
    if (!user) return fail(404, "This account no longer exists.");
    if (user.status === "disabled") return fail(409, "This account is disabled. Enable it first.");
    if (user._id === by.id) return fail(409, "To change your own password, use Account.");
    if (isEnvAdminEmail(user.email)) return fail(409, "This administrator's password is set in the server settings (ADMIN_PASSWORD_HASH). Change it there with npm run cms:admin-env.");
    const purpose: Purpose = user.status === "invited" ? "invite" : "reset";
    const { token, expiresAt } = await issueToken(user._id, purpose, by.email);
    return { ok: true, value: { email: user.email, token, expiresAt: expiresAt.toISOString(), purpose } };
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function setAccountStatus(by: AdminUser, userId: string, status: "active" | "disabled"): Promise<AccountResult<{ email: string; signedOut: number }>> {
  try {
    const users = await usersCollection();
    const user = await users.findOne({ _id: userId });
    if (!user) return fail(404, "This account no longer exists.");
    if (user._id === by.id) return fail(409, "You cannot disable or enable your own account.");
    if (status === "active" && user.status !== "disabled") return fail(409, "Only a disabled account can be enabled. An invited account becomes active when its owner sets a password.");
    if (status === "disabled" && user.role === "admin" && user.status === "active" && (await users.countDocuments({ role: "admin", status: "active" })) <= 1) {
      return fail(409, "This is the only active administrator, so it cannot be disabled.");
    }
    await users.updateOne({ _id: userId }, { $set: { status, updatedAt: new Date() } });
    let signedOut = 0;
    if (status === "disabled") {
      signedOut = await endAllSessions(userId);
      await (await tokens()).deleteMany({ userId });
    }
    return { ok: true, value: { email: user.email, signedOut } };
  } catch (err) {
    throw authUnavailable(err);
  }
}

export async function signOutAccount(by: AdminUser, userId: string): Promise<AccountResult<{ email: string; signedOut: number }>> {
  try {
    const user = await (await usersCollection()).findOne({ _id: userId });
    if (!user) return fail(404, "This account no longer exists.");
    if (user._id === by.id) return fail(409, "To sign yourself out, use Sign out.");
    return { ok: true, value: { email: user.email, signedOut: await endAllSessions(userId) } };
  } catch (err) {
    throw authUnavailable(err);
  }
}

/** Removes an invitation that was never used. Accounts that have been set up are disabled instead, never deleted. */
export async function withdrawInvitation(by: AdminUser, userId: string): Promise<AccountResult<{ email: string }>> {
  try {
    const users = await usersCollection();
    const user = await users.findOne({ _id: userId });
    if (!user) return fail(404, "This account no longer exists.");
    if (user.status !== "invited") return fail(409, "Only an invitation that has not been used can be withdrawn. Disable the account instead.");
    await (await tokens()).deleteMany({ userId });
    await users.deleteOne({ _id: userId, status: "invited" });
    return { ok: true, value: { email: user.email } };
  } catch (err) {
    throw authUnavailable(err);
  }
}

/** What the setup page may show for a link: the account's email and what the link is for. Null if invalid or expired. */
export async function linkDetails(token: string): Promise<{ email: string; purpose: Purpose; expiresAt: string } | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  try {
    const doc = await (await tokens()).findOne({ _id: hashToken(token) });
    if (!doc || doc.expiresAt.getTime() <= Date.now()) return null;
    const user = await (await usersCollection()).findOne({ _id: doc.userId });
    if (!user || user.status === "disabled") return null;
    return { email: user.email, purpose: doc.purpose, expiresAt: doc.expiresAt.toISOString() };
  } catch (err) {
    throw authUnavailable(err);
  }
}

/** Uses a setup link: sets the password, activates an invited account, ends every session and every other link. */
export async function completeSetup(token: string, password: string): Promise<AccountResult<{ email: string; userId: string; purpose: Purpose }>> {
  if (!TOKEN_PATTERN.test(token)) return fail(400, "This link is not valid or has expired. Ask an administrator for a new one.");
  try {
    const col = await tokens();
    const doc = await col.findOne({ _id: hashToken(token) });
    if (!doc || doc.expiresAt.getTime() <= Date.now()) return fail(400, "This link is not valid or has expired. Ask an administrator for a new one.");
    const users = await usersCollection();
    const user = await users.findOne({ _id: doc.userId });
    if (!user || user.status === "disabled") return fail(400, "This link is not valid or has expired. Ask an administrator for a new one.");
    const problem = passwordProblem(password, user.email);
    if (problem) return fail(400, "Some details need attention.", { password: problem });
    // Single use: the link is removed before the password is saved, so it cannot be used twice even at the same time.
    const removed = await col.deleteOne({ _id: doc._id });
    if (removed.deletedCount !== 1) return fail(400, "This link has already been used. Ask an administrator for a new one.");
    const now = new Date();
    await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(password), status: "active", passwordChangedAt: now, updatedAt: now } });
    await col.deleteMany({ userId: user._id });
    await endAllSessions(user._id);
    return { ok: true, value: { email: user.email, userId: user._id, purpose: doc.purpose } };
  } catch (err) {
    throw authUnavailable(err);
  }
}
