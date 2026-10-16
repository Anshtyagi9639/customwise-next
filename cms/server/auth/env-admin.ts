import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isPasswordHash } from "./password";

/**
 * The administrator defined in the server's settings. ADMIN_EMAIL is the only address that may receive an email
 * sign-in link (email-link.ts). ADMIN_PASSWORD_HASH (made with `npm run cms:admin-env`) is optional: it allows the
 * password sign-in for the same address. Signing in as this administrator uses only these settings: no database account
 * is read or created, and the session is kept in the server's memory (env-sessions.ts), so it works while MongoDB
 * cannot be reached. Everything else in the CMS (articles, images, users, the audit log) still needs the database.
 *
 * With neither variable set, sign-in uses the database accounts only.
 */

/** passwordHash is null when ADMIN_PASSWORD_HASH is missing or unusable: then only the email link signs this admin in. */
export type EnvAdmin = { state: "off" } | { state: "invalid"; reason: string } | { state: "ok"; email: string; passwordHash: string | null };

/**
 * The hash is written as scrypt:N:r:p:salt:hash, because Next.js expands "$NAME" inside .env files and would damage a
 * scrypt$... value. A scrypt$... value works where nothing expands it (a hosting panel), and \$ is accepted too.
 */
function normaliseHash(raw: string): string {
  const unescaped = raw.replace(/\\$/g, "$");
  return /^scrypt:/.test(unescaped) ? unescaped.split(":").join("$") : unescaped;
}

/** Why ADMIN_PASSWORD_HASH cannot be used, or null. Says which mistake it is, never what the value is. */
function hashProblem(passwordHash: string): string | null {
  if (isPasswordHash(passwordHash)) return null;
  if (!/^scrypt/.test(passwordHash)) {
    return "ADMIN_PASSWORD_HASH holds a password, not a hash. Never put the password itself in .env: run `npm run cms:admin-env -- --email <your admin email>`, which asks for it without showing it and replaces this line with its hash.";
  }
  if (/^scrypt\d/.test(passwordHash)) return "ADMIN_PASSWORD_HASH was damaged: written as scrypt$..., its $ parts were read as variables. Run `npm run cms:admin-env` again; it writes the scrypt:... form.";
  return "ADMIN_PASSWORD_HASH is not a hash made by `npm run cms:admin-env` (in a .env file, use the scrypt:... form it writes).";
}

export function envAdmin(): EnvAdmin {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const raw = process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";
  if (!email && !raw) return { state: "off" };
  if (!email) return invalid("ADMIN_PASSWORD_HASH is set but ADMIN_EMAIL is not.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return invalid("ADMIN_EMAIL is not an email address.");
  if (!raw) return { state: "ok", email, passwordHash: null };
  const passwordHash = normaliseHash(raw);
  const problem = hashProblem(passwordHash);
  if (problem) {
    warnOnce(`[auth] Password sign-in for the settings administrator is off (email sign-in links still work): ${problem}`);
    return { state: "ok", email, passwordHash: null };
  }
  return { state: "ok", email, passwordHash };
}

let lastWarning = "";
function warnOnce(message: string) {
  if (lastWarning !== message) console.error(message);
  lastWarning = message;
}

let lastOffHint = 0;
/**
 * Called when a sign-in had to use the database because no administrator is set in the server settings, and the
 * database could not be reached. Says so in the server log (at most once a minute), with the fix. Never logs values.
 */
export function logSettingsAdminOff(): void {
  if (envAdmin().state !== "off" || Date.now() - lastOffHint < 60_000) return;
  lastOffHint = Date.now();
  console.error(
    "[auth] No administrator is set in the server settings (ADMIN_EMAIL / ADMIN_PASSWORD_HASH), so this sign-in needed the database. " +
      "To sign in without it, run `npm run cms:admin-env -- --email you@example.com` (writes .env), then restart." +
      (filledInExample() ? " Note: ADMIN_EMAIL / ADMIN_PASSWORD_HASH are filled in .env.example, which is never read and is published by Git: empty them there." : ""),
  );
}

/** next dev only: whether someone put values into the .env.example template instead of .env. */
function filledInExample(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  try {
    return /^\s*ADMIN_(EMAIL|PASSWORD_HASH)\s*=\s*\S/m.test(readFileSync(path.join(process.cwd(), ".env.example"), "utf8"));
  } catch {
    return false;
  }
}

let warned = "";
function invalid(reason: string): EnvAdmin {
  // The reason names the variable, never its value.
  if (warned !== reason) console.error(`[auth] Sign-in is switched off until the server settings are fixed: ${reason}`);
  warned = reason;
  return { state: "invalid", reason };
}

export const isEnvAdminEmail = (email: string) => {
  const env = envAdmin();
  return env.state === "ok" && env.email === email.trim().toLowerCase();
};
