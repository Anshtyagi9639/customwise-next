import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/cms/lib/auth-shared";

/**
 * Password hashing with scrypt from Node.js's built-in crypto module (OpenSSL), with the parameters OWASP recommends
 * (N=2^17, r=8, p=1). Built-in means no native add-on has to compile on the hosting server.
 *
 * Stored format: scrypt$<N>$<r>$<p>$<salt, base64url>$<hash, base64url>
 * The same format is produced by scripts/cms/admin-users.mjs, which creates and resets accounts.
 */

const N = 2 ** 17;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024; // one hash needs about 128 MB

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password.normalize("NFC"), salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEMORY }, (err, key) => (err ? reject(err) : resolve(key))));
}

// At most two hashes at a time, so a burst of sign-in attempts cannot exhaust the server's memory.
let running = 0;
const waiting: (() => void)[] = [];
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= 2) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await limited(() => derive(password, salt, N, R, P));
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

/** Constant-time comparison. A missing or malformed hash still costs a full hash, so timing does not reveal it. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const parts = (stored ?? "").split("$");
  const valid = parts.length === 6 && parts[0] === "scrypt" && [1, 2, 3].every((i) => /^\d+$/.test(parts[i]));
  const n = valid ? Number(parts[1]) : N;
  const r = valid ? Number(parts[2]) : R;
  const p = valid ? Number(parts[3]) : P;
  // Refuse parameters far outside what this module writes, rather than letting a stored value set the cost.
  const sane = valid && n >= 2 ** 14 && n <= 2 ** 20 && r >= 1 && r <= 16 && p >= 1 && p <= 4;
  const salt = sane ? Buffer.from(parts[4], "base64url") : randomBytes(16);
  const expected = sane ? Buffer.from(parts[5], "base64url") : randomBytes(KEY_LENGTH);
  const key = await limited(() => derive(password, salt, sane ? n : N, sane ? r : R, sane ? p : P));
  return sane && expected.length === key.length && timingSafeEqual(key, expected);
}

/** Whether a value is a stored hash in this module's format, with parameters verifyPassword accepts. */
export function isPasswordHash(value: string): boolean {
  const parts = value.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt" || ![1, 2, 3].every((i) => /^\d+$/.test(parts[i]))) return false;
  const [n, r, p] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const salt = Buffer.from(parts[4], "base64url");
  const key = Buffer.from(parts[5], "base64url");
  return n >= 2 ** 14 && n <= 2 ** 20 && r >= 1 && r <= 16 && p >= 1 && p <= 4 && salt.length >= 16 && key.length === KEY_LENGTH;
}

/** Why a new password is not acceptable, or null. */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  if (/^(.)\1+$/.test(password)) return "Do not use one character repeated.";
  if (email && password.toLowerCase().includes(email.toLowerCase().split("@")[0]) && email.split("@")[0].length >= 4) return "Do not include your email address in the password.";
  return null;
}
