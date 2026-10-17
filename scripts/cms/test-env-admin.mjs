// The administrator from the server settings (ADMIN_EMAIL / ADMIN_PASSWORD_HASH) signs in and stays signed in while
// MongoDB cannot be reached. Needs no database at all: the servers it starts point at a port where nothing listens.
// A throwaway password is made here; nothing secret is printed. Run after `npm run build`:
//   npm run cms:test:env-admin
//
// 1. Unit: the in-memory sessions and rate limit (cms/server/auth/env-sessions.ts, throttle.ts) with a fake clock.
// 2. The production build, on ports 3311-3313: sign-in, session, sign-out, limits, wrong and incomplete settings.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { check, finish } from "./lib/test-kit.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const require = createRequire(path.join(process.cwd(), "package.json"));
const EMAIL = `zz-env-admin-${Date.now().toString(36)}@example.invalid`;
const PASSWORD = `Env-${randomBytes(18).toString("base64url")}`;
const UNREACHABLE = { MONGODB_URI: "mongodb://127.0.0.1:27999", MONGODB_DB: "blog_cms" };
const H = 60 * 60 * 1000;

/* ---------- 1. Unit ---------- */
console.log("In-memory sessions and rate limit (fake clock)");
const unitDir = mkdtempSync(path.join(os.tmpdir(), "cms-env-admin-"));
{
  const ts = require("typescript");
  const files = { "auth-shared": "cms/lib/auth-shared.ts", "env-admin": "cms/server/auth/env-admin.ts", "env-sessions": "cms/server/auth/env-sessions.ts", "file-store": "cms/server/auth/file-store.ts", password: "cms/server/auth/password.ts", throttle: "cms/server/auth/throttle.ts", log: "cms/server/log.ts" };
  process.env.CMS_AUTH_DIR = path.join(unitDir, "records");
  for (const [name, file] of Object.entries(files)) {
    let src = readFileSync(file, "utf8").replace(/import "server-only";\n/, "").replace(/"@\/cms\/lib\/auth-shared"/g, '"./auth-shared"').replace(/"\.\.\/log"/g, '"./log"');
    // No database in this test: the database-backed half of throttle.ts must never be reached.
    if (name === "throttle") src = src.replace(/import \{ authDb, authUnavailable \} from "\.\/users";/, "const authDb = async () => { throw new Error('the database was used'); }; const authUnavailable = (e) => e;");
    const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText.replace(/require\("\.\/users"\)/g, "({})");
    writeFileSync(path.join(unitDir, `${name}.js`), js);
  }
  const req = createRequire(path.join(unitDir, "x.js"));
  const { hashPassword } = req("./password.js");
  const S = req("./env-sessions.js");
  const T = req("./throttle.js");
  const saved = { email: process.env.ADMIN_EMAIL, hash: process.env.ADMIN_PASSWORD_HASH };
  process.env.ADMIN_EMAIL = "unit@example.invalid";
  process.env.ADMIN_PASSWORD_HASH = (await hashPassword("Unit-test-password-1")).split("$").join(":");
  const env = req("./env-admin.js").envAdmin();
  const t0 = Date.UTC(2026, 0, 1);
  const token = S.createEnvSession(env, t0);
  const stored = readdirSync(path.join(unitDir, "records", "session")).map((n) => n.replace(/\.json$/, ""));
  check('tokens are random and start with "e."', /^e\.[A-Za-z0-9_-]{43}$/.test(token) && token !== S.createEnvSession(env, t0));
  check("only a SHA-256 hash of each token is kept", stored.every((k) => /^[0-9a-f]{64}$/.test(k)) && !stored.includes(token));
  check("a new session is valid, as an administrator", S.readEnvSession(token, t0 + 1000)?.user.role === "admin");
  check("a tampered or malformed token is refused", S.readEnvSession(`${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`, t0) === null && S.readEnvSession("e.x", t0) === null);
  const idle = S.createEnvSession(env, t0);
  check("ends after 2 hours without use", S.readEnvSession(idle, t0 + 2 * H + 1000) === null);
  const active = S.createEnvSession(env, t0);
  let alive = true;
  for (let t = t0 + H; t < t0 + 12 * H; t += H) alive = alive && S.readEnvSession(active, t) !== null;
  check("used every hour it lasts 12 hours, then ends", alive && S.readEnvSession(active, t0 + 12 * H + 1000) === null);
  const out = S.createEnvSession(env, t0);
  S.endEnvSession(out);
  check("sign-out ends it at once", S.readEnvSession(out, t0 + 1000) === null);
  const before = S.createEnvSession(env, t0);
  process.env.ADMIN_PASSWORD_HASH = (await hashPassword("Another-password-22")).split("$").join(":");
  check("changing ADMIN_PASSWORD_HASH ends earlier sessions", S.readEnvSession(before, t0 + 1000) === null);
  const keys = T.throttleKeys("unit@example.invalid", "10.1.2.3");
  for (let i = 0; i < 5; i++) T.memoryRecordFailure([keys.email, keys.ip], t0);
  check("5 failures lock for 15 minutes, then the lock lifts", T.memoryLockedFor([keys.email], t0 + 1000) > 14 * 60 * 1000 && T.memoryLockedFor([keys.email], t0 + 15 * 60 * 1000 + 1000) === 0);
  for (const [k, v] of [["ADMIN_EMAIL", saved.email], ["ADMIN_PASSWORD_HASH", saved.hash]]) if (v === undefined) delete process.env[k]; else process.env[k] = v;
}
rmSync(unitDir, { recursive: true, force: true });

/* ---------- 2. The production build, with the database unreachable ---------- */
const printed = execFileSync(process.execPath, ["scripts/cms/admin-env.mjs", "--email", EMAIL, "--print"], { env: { ...process.env, CMS_ADMIN_PASSWORD: PASSWORD }, encoding: "utf8" });
const HASH = printed.match(/^ADMIN_PASSWORD_HASH=(.+)$/m)?.[1]?.trim() ?? "";
const servers = [];
const logs = {};
const serverDir = mkdtempSync(path.join(os.tmpdir(), "cms-env-admin-servers-"));
function start(port, extra) {
  const env = { ...process.env, ...UNREACHABLE, CMS_AUTH_DIR: path.join(serverDir, String(port)), ...extra };
  // Always set both, empty when not wanted: Next.js would otherwise take them from the developer's own .env.
  for (const k of ["ADMIN_EMAIL", "ADMIN_PASSWORD_HASH"]) if (!(k in extra)) env[k] = "";
  delete env.CMS_DEV_ACCESS;
  const child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  logs[port] = "";
  child.stdout.on("data", (d) => (logs[port] += d));
  child.stderr.on("data", (d) => (logs[port] += d));
  servers.push(child);
}
start(3311, { ADMIN_EMAIL: EMAIL.toUpperCase(), ADMIN_PASSWORD_HASH: HASH });
start(3312, { ADMIN_EMAIL: EMAIL }); // incomplete
start(3313, {}); // no settings administrator at all
const PLAIN = `plain-${randomBytes(6).toString("hex")}`;
start(3314, { ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD_HASH: PLAIN }); // the password itself typed in instead of a hash
start(3315, { ADMIN_EMAIL: EMAIL, ADMIN_PASSWORD_HASH: "scrypt31072" }); // a scrypt$... hash after Next.js expanded its $ parts
const ip = `10.7.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
async function http(port, p, { method = "GET", body, cookie, origin = `http://127.0.0.1:${port}`, xff = ip } = {}) {
  const h = { "X-Forwarded-For": xff };
  if (cookie) h.Cookie = cookie;
  if (method !== "GET") h.Origin = origin;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const t0 = Date.now();
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  const text = await r.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: r.status, data, text, ms: Date.now() - t0, headers: r.headers, setCookie: r.headers.getSetCookie?.() ?? [] };
}
const login = async (port, email, password, extra = {}) => {
  const r = await http(port, "/admin-blog/api/auth/login", { method: "POST", body: { email, password }, ...extra });
  const raw = r.setCookie.find((c) => c.startsWith("__Secure-cw_admin=")) ?? "";
  const v = raw.split(";")[0];
  return { ...r, cookie: v && !v.endsWith("=") ? v : null, raw };
};
const toLogin = (r) => [307, 308].includes(r.status) && new URL(r.headers.get("location") ?? "", "http://x").pathname === "/admin-blog";

try {
  for (const port of [3311, 3312, 3313, 3314, 3315]) {
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(`http://127.0.0.1:${port}/`, { redirect: "manual" });
        break;
      } catch {}
      await sleep(1000);
    }
  }
  console.log("\nSigning in with the database unreachable");
  check("the setup script made a hash without printing the password", /^scrypt:131072:8:1:/.test(HASH) && !printed.includes(PASSWORD));
  check("/admin-blog shows the login page", (await http(3311, "/admin-blog")).text.includes('id="login-email"'));
  check("empty fields are refused (400)", (await login(3311, "", "")).status === 400 && (await login(3311, EMAIL, "")).status === 400);
  const wrong = await login(3311, EMAIL, `${PASSWORD}x`);
  check('wrong password: 401 "Invalid email or password.", no session', wrong.status === 401 && wrong.data.message === "Invalid email or password." && !wrong.cookie);
  const ok = await login(3311, EMAIL, PASSWORD);
  check("correct settings email (any capitals) and password: signed in, sent to Manage Customs Wise", ok.status === 200 && !!ok.cookie && ok.data.redirect === "/admin-blog/sites/customs-wise", `${ok.status} ${ok.data.message ?? ""}`);
  check("without waiting for the database", ok.ms < 3000, `${ok.ms} ms`);
  check("cookie: HttpOnly, Secure, SameSite=Strict, Path=/admin-blog; a settings session token", /HttpOnly/i.test(ok.raw) && /; Secure/i.test(ok.raw) && /SameSite=Strict/i.test(ok.raw) && /Path=\/admin-blog/i.test(ok.raw) && /^__Secure-cw_admin=e\./.test(ok.cookie ?? ""));
  check("no database connection was attempted for it", !/MongoDB \w+ failed|database request failed/.test(logs[3311]));

  console.log("\nThe session, with the database unreachable");
  const as = (p, o = {}) => http(3311, p, { cookie: ok.cookie, ...o });
  for (let i = 1; i <= 3; i++) check(`request ${i}: the session is valid (Account opens)`, (await as("/admin-blog/account")).status === 200);
  check("/admin-blog with the session goes to Manage Customs Wise", ((await as("/admin-blog")).headers.get("location") ?? "").endsWith("/admin-blog/sites/customs-wise"));
  check("article data needs the database: 503 (signed in, so not 401)", (await as("/admin-blog/api/sites/customs-wise/posts")).status === 503);
  check("without a session: pages go to the login page, APIs answer 401", toLogin(await http(3311, "/admin-blog/account")) && (await http(3311, "/admin-blog/api/sites/customs-wise/posts")).status === 401);
  check("a made-up settings token is refused", toLogin(await http(3311, "/admin-blog/account", { cookie: `__Secure-cw_admin=e.${randomBytes(32).toString("base64url")}` })));
  check("a change sent from another website is refused, even signed in", (await as("/admin-blog/api/sites/customs-wise/posts", { method: "POST", body: {}, origin: "https://evil.example" })).status === 403);
  check("sign-in sent from another website is refused", (await login(3311, EMAIL, PASSWORD, { origin: "https://evil.example" })).status === 403);
  check("sign out", (await as("/admin-blog/api/auth/logout", { method: "POST" })).status === 200);
  check("after signing out the session is gone", toLogin(await as("/admin-blog/account")) && (await as("/admin-blog/api/sites/customs-wise/posts")).status === 401);
  const rl = `10.6.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  for (let i = 0; i < 5; i++) await login(3311, EMAIL, `wrong-${i}-password`, { xff: rl });
  check("after 5 wrong passwords even the right one is refused for 15 minutes (429)", (await login(3311, EMAIL, PASSWORD, { xff: rl })).status === 429);
  const other = await login(3311, `zz-nobody-${Date.now()}@example.invalid`, PASSWORD, { xff: `10.5.${Math.floor(Math.random() * 250)}.1` });
  check('wrong email: 401 "Invalid email or password." even with the database unreachable', other.status === 401 && other.data.message === "Invalid email or password." && !other.cookie, `${other.status}`);
  const wx = `10.4.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const nobody = `zz-nobody2-${Date.now()}@example.invalid`;
  for (let i = 0; i < 5; i++) await login(3311, nobody, `wrong-${i}-password`, { xff: wx });
  check("wrong emails are rate limited too while the database is unreachable (429 after 5)", (await login(3311, nobody, "any-password-1", { xff: wx })).status === 429);

  console.log("\nSettings incomplete, or not set");
  const half = await login(3312, EMAIL, PASSWORD);
  check("ADMIN_EMAIL without ADMIN_PASSWORD_HASH: password sign-in refused (401, email links still work)", half.status === 401 && half.data.message === "Invalid email or password." && !half.cookie && !half.text.includes(EMAIL));
  const plain = await login(3314, EMAIL, PLAIN);
  await sleep(300);
  check("a password typed in place of the hash: password sign-in refused (401); the log says it is a password, not a hash", plain.status === 401 && !plain.cookie && /holds a password, not a hash/.test(logs[3314]));
  check("…and neither the answer nor the log contains that value", !plain.text.includes(PLAIN) && !logs[3314].includes(PLAIN));
  const damaged = await login(3315, EMAIL, PASSWORD);
  await sleep(300);
  check("a hash damaged by $ expansion: password sign-in refused (401), and the log says so", damaged.status === 401 && /was damaged/.test(logs[3315]));
  const none = await login(3313, EMAIL, PASSWORD);
  await sleep(500);
  check("no settings administrator: sign-in needs the database (503), and the log says how to fix it", none.status === 503 && /No administrator is set in the server settings/.test(logs[3313]) && /cms:admin-env/.test(logs[3313]));
  check("no log contains the password, the hash or a session token", Object.values(logs).every((l) => !l.includes(PASSWORD) && !l.includes(HASH) && !l.includes(HASH.split(":").join("$")) && !/cw_admin=/.test(l)));
} finally {
  for (const s of servers) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(s.pid), "/T", "/F"]);
    else s.kill();
  }
  rmSync(serverDir, { recursive: true, force: true });
  finish();
}
