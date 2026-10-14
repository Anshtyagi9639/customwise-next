// Shared helpers for the blog admin tests. Test accounts use the reserved domain example.invalid and random passwords
// that exist only in memory; every test removes the accounts, sessions and locks it created.
import { createHash, randomBytes, scrypt } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const shellUrl = process.env.CMS_TEST_URL;
for (const file of [".env.local", ".env"]) if (existsSync(path.join(process.cwd(), file))) process.loadEnvFile(path.join(process.cwd(), file));
export const BASE = (shellUrl ?? process.env.CMS_TEST_URL ?? "http://127.0.0.1:3100").replace(/\/+$/, "");
export const ORIGIN = new URL(BASE).origin;

/* ---------- results ---------- */
let passed = 0;
const failures = [];
export function check(name, ok, detail = "") {
  if (ok) passed++;
  else failures.push(name);
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}${!ok && detail !== "" ? `  (${String(detail).slice(0, 300)})` : ""}`);
  return ok;
}
export function finish(note = "") {
  console.log(`\n${passed} passed, ${failures.length} failed${note ? `   ${note}` : ""}`);
  if (failures.length) console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(failures.length ? 1 : 0);
}

/* ---------- database (the same MONGODB_URI / MONGODB_DB the website under test uses) ---------- */
export async function openDb() {
  const uri = process.env.MONGODB_URI?.trim();
  const name = process.env.MONGODB_DB?.trim();
  if (!uri || !name) throw new Error("MONGODB_URI and MONGODB_DB must be set for the tests (the same values the website under test uses).");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, appName: "customs-wise-cms-tests" });
  await client.connect();
  return { client, db: client.db(name) };
}

function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFC"), salt, 64, { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(`scrypt$${2 ** 17}$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`))),
  );
}

const created = [];
export const randomPassword = () => `T3st-${randomBytes(18).toString("base64url")}`;

/** A temporary account in the database, with a random password known only to this test. */
export async function createTestUser(db, { role = "admin", siteKeys = [], status = "active" } = {}) {
  const email = `zz-test-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}@example.invalid`;
  const password = randomPassword();
  const id = `user_test_${randomBytes(6).toString("hex")}`;
  const now = new Date();
  await db.collection("admin_users").insertOne({ _id: id, email, name: "Automated test", role, siteKeys, status, passwordHash: await hashPassword(password), passwordChangedAt: now, createdAt: now, updatedAt: now, lastLoginAt: null });
  created.push({ id, email });
  return { id, email, password };
}

export const emailThrottleId = (email) => `email:${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}`;

/** Removes every account this test created, with its sessions and sign-in locks. */
export async function removeTestUsers(db, extraThrottleIds = []) {
  const ids = created.map((u) => u.id);
  const users = await db.collection("admin_users").deleteMany({ _id: { $in: ids } });
  const sessions = await db.collection("admin_sessions").deleteMany({ userId: { $in: ids } });
  const locks = await db.collection("admin_login_throttle").deleteMany({ _id: { $in: [...created.map((u) => emailThrottleId(u.email)), ...extraThrottleIds] } });
  return { users: users.deletedCount, sessions: sessions.deletedCount, locks: locks.deletedCount };
}

/* ---------- HTTP, as a browser on this website would send it ---------- */
export async function request(url, { method = "GET", body, cookie, origin = ORIGIN, headers = {}, redirect = "manual" } = {}) {
  const isForm = body instanceof FormData;
  const h = { ...headers };
  if (cookie) h.Cookie = cookie;
  if (origin && method !== "GET") h.Origin = origin;
  if (body && !isForm) h["Content-Type"] = "application/json";
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(`${BASE}${url}`, { method, headers: h, body: body ? (isForm ? body : JSON.stringify(body)) : undefined, redirect });
      break;
    } catch (err) {
      // Retried only when no connection was made at all, so nothing can have been sent twice.
      if (attempt >= 4 || !["ETIMEDOUT", "ECONNREFUSED", "UND_ERR_CONNECT_TIMEOUT"].includes(err?.cause?.code)) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: res.status, ok: res.ok, data, text, headers: res.headers, setCookies: res.headers.getSetCookie?.() ?? [] };
}

export const SESSION_COOKIE = "__Secure-cw_admin";

/** Signs in through the real API and returns the Cookie header value to send afterwards. */
export async function signIn(email, password, extra = {}) {
  const res = await request("/admin-blog/api/auth/login", { method: "POST", body: { email, password }, ...extra });
  const raw = res.setCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  const value = raw?.split(";")[0];
  return { ...res, cookie: value && !value.endsWith("=") ? value : null, rawCookie: raw ?? "" };
}

/** A small client that sends the session cookie and this website's Origin with every request. */
export function asUser(cookie) {
  return (url, method = "GET", body, extra = {}) => request(url, { method, body, cookie, ...extra });
}
