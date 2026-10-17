// Sign-in by email link, end to end, WITHOUT SENDING ANY REAL EMAIL and without a database:
//   npm run cms:test:email-link                   (after `npm run build`)
//   npm run cms:test:email-link -- --show-log     also prints the log lines of one send and the use of its link
// A fake email provider on this computer stands in for Resend (EMAIL_API_URL, which every server here gets) and
// captures each email; the test takes the link out of it as a mail client would. It can also act out each way Resend
// may answer (refusals, its own rate limit, an outage) and answer delivery-status look-ups. The production build runs on
// ports 3331-3338 with MongoDB unreachable. The test stops before starting anything if the provider is not local.
// 1. Unit: link lifetime, single use, which links a new email cancels, the pause between emails (fake clock).
// 2. HTTP: sending, opening the link, the session, reuse, forged Host headers, limits, every kind of provider failure
//    (including a timeout), missing settings, an unwritable sign-in folder, two processes sharing records, the
//    structured [CMS_AUTH] / [CMS_DB] log lines, the health check, the public blog with the database down or empty,
//    delivery-status look-ups (server log and npm run cms:email-status).
import { execFile, spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { check, finish } from "./lib/test-kit.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const require = createRequire(path.join(process.cwd(), "package.json"));
const ADMIN = `zz-link-admin-${Date.now().toString(36)}@example.invalid`;
const API_KEY = "re_test_send_key_not_real_000000000";
const READ_KEY = "re_test_read_key_not_real_000000000";
const SENDER = "Customs Wise <cms@example.invalid>";

/* ---------- 1. Unit ---------- */
console.log("Links (fake clock)");
const unitDir = mkdtempSync(path.join(os.tmpdir(), "cms-email-link-"));
{
  const ts = require("typescript");
  const files = { "env-admin": "cms/server/auth/env-admin.ts", "email-link": "cms/server/auth/email-link.ts", "file-store": "cms/server/auth/file-store.ts", password: "cms/server/auth/password.ts", "auth-shared": "cms/lib/auth-shared.ts", log: "cms/server/log.ts" };
  for (const [name, file] of Object.entries(files)) {
    const src = readFileSync(file, "utf8").replace(/import "server-only";\n/, "").replace(/"@\/cms\/lib\/auth-shared"/g, '"./auth-shared"').replace(/"\.\.\/log"/g, '"./log"');
    writeFileSync(path.join(unitDir, `${name}.js`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
  }
  const req = createRequire(path.join(unitDir, "x.js"));
  const saved = { ...process.env };
  process.env.CMS_AUTH_DIR = path.join(unitDir, "records");
  process.env.ADMIN_EMAIL = "unit@example.invalid";
  delete process.env.ADMIN_PASSWORD_HASH;
  const L = req("./email-link.js");
  const env = req("./env-admin.js").envAdmin();
  check("ADMIN_EMAIL alone is enough for email sign-in", env.state === "ok" && env.email === "unit@example.invalid" && env.passwordHash === null);
  const t0 = Date.UTC(2026, 0, 1);
  const a = L.issueLinkToken(env, t0);
  const stored = readdirSync(path.join(unitDir, "records", "link")).map((n) => n.replace(/\.json$/, ""));
  check("tokens are random (43 characters) and only their hash is kept", /^[A-Za-z0-9_-]{43}$/.test(a) && stored.every((k) => /^[0-9a-f]{64}$/.test(k)) && !stored.includes(a));
  check("a link works within 15 minutes", L.redeemLinkToken(a, t0 + 14 * 60 * 1000)?.email === "unit@example.invalid");
  check("…and only once", L.redeemLinkToken(a, t0 + 14 * 60 * 1000) === null);
  const b = L.issueLinkToken(env, t0);
  check("a link no longer works after 15 minutes", L.redeemLinkToken(b, t0 + 15 * 60 * 1000 + 1) === null);
  const inbox = L.issueLinkToken(env, t0);
  L.keepOnlyNewestLink(env, inbox);
  const failedSend = L.issueLinkToken(env, t0 + 1000);
  L.cancelLinkToken(failedSend);
  check("a send that failed cancels its own token, not the link already in the inbox", L.redeemLinkToken(failedSend, t0 + 2000) === null && L.redeemLinkToken(inbox, t0 + 2000) !== null);
  const older = L.issueLinkToken(env, t0);
  L.keepOnlyNewestLink(env, older);
  const newer = L.issueLinkToken(env, t0 + 1000);
  L.keepOnlyNewestLink(env, newer);
  check("once a newer email is accepted, only its link works", L.redeemLinkToken(older, t0 + 2000) === null && L.redeemLinkToken(newer, t0 + 2000) !== null);
  const last = L.issueLinkToken(env, t0 + 10_000);
  check("the pause counts from the newest link", L.secondsSinceLastLink(env, t0 + 25_000) === 15);
  L.redeemLinkToken(last, t0 + 26_000);
  const d = L.issueLinkToken(env, t0);
  process.env.ADMIN_EMAIL = "someone-else@example.invalid";
  check("changing ADMIN_EMAIL cancels links sent to the old address", L.redeemLinkToken(d, t0 + 1000) === null);
  check("a malformed token is refused", L.redeemLinkToken("../../x", t0) === null);
  process.env.ADMIN_EMAIL = "unit@example.invalid";
  const envNow = req("./env-admin.js").envAdmin();
  const why = (token, at) => L.consumeLinkToken(token, at);
  check("refusal reason: no token at all → missing; a wrong shape → malformed", why(undefined, t0).reason === "missing" && why("", t0).reason === "missing" && why("../../x", t0).reason === "malformed");
  check("refusal reason: a well-formed token that was never issued → unknown", why("B".repeat(43), t0).reason === "unknown");
  const u1 = L.issueLinkToken(envNow, t0, "attempt0001");
  const usedOnce = why(u1, t0 + 1000);
  check("a link carries its login attempt id to the moment it is used", usedOnce.ok === true && usedOnce.attempt === "attempt0001");
  check("refusal reason: the same link again → already_used (with its attempt id)", why(u1, t0 + 2000).reason === "already_used" && why(u1, t0 + 2000).attempt === "attempt0001");
  const r1 = L.issueLinkToken(envNow, t0);
  L.keepOnlyNewestLink(envNow, r1);
  const r2 = L.issueLinkToken(envNow, t0 + 1000);
  check("keepOnlyNewestLink says how many older links it cancelled", L.keepOnlyNewestLink(envNow, r2) === 1);
  check("refusal reason: a link replaced by a newer email → replaced", why(r1, t0 + 2000).reason === "replaced");
  const e1 = L.issueLinkToken(envNow, t0);
  check("refusal reason: a link used after 15 minutes → expired, and it stays expired", why(e1, t0 + 16 * 60 * 1000).reason === "expired" && why(e1, t0 + 16 * 60 * 1000 + 1).reason === "expired");
  const e2 = L.issueLinkToken(envNow, t0);
  L.issueLinkToken(envNow, t0 + 16 * 60 * 1000); // the clean-up when the next link is issued
  check("refusal reason: an expired link removed by the clean-up → still expired, not unknown", why(e2, t0 + 16 * 60 * 1000 + 5).reason === "expired");
  const c1 = L.issueLinkToken(envNow, t0);
  process.env.ADMIN_EMAIL = "someone-else@example.invalid";
  check("refusal reason: ADMIN_EMAIL changed since the link was sent → admin_changed", why(c1, t0 + 1000).reason === "admin_changed");
  process.env.ADMIN_EMAIL = "unit@example.invalid";
  check("…and that link still does not work afterwards", why(c1, t0 + 2000).ok === false);
  const spentFiles = readdirSync(path.join(unitDir, "records", "spent"));
  check("the notes about spent links are named by hashes only and hold no token", spentFiles.every((f) => /^[0-9a-f]{64}\.json$/.test(f)) && ![u1, r1, e1, e2, c1].some((t) => spentFiles.some((f) => f.includes(t)) || spentFiles.some((f) => readFileSync(path.join(unitDir, "records", "spent", f), "utf8").includes(t))));
  const lines = [];
  const orig = { info: console.info, warn: console.warn, error: console.error };
  console.info = console.warn = console.error = (line) => lines.push(String(line));
  const Log = req("./log.js");
  const fakeToken = "Q".repeat(43);
  Log.logEvent("CMS_AUTH", "token_created", { rid: "abc123def456", attempt: "att000000001", outcome: "success", status: 200, ms: 12, msg: `link https://customswise.ie/admin-blog/auth#${fakeToken} for someone.admin@example.com with re_fake_key_abcdefgh123 and mongodb+srv://user:pw@cluster.example/db and bare ${fakeToken}` });
  Log.logEvent("CMS_AUTH", "x", { token: fakeToken, cookie_value: "e.abc", session_id: "s", api_key: "re_x", password: "p", during: "read", mongo_uri: "x" });
  Object.assign(console, orig);
  check("log line: UTC ISO time, [CMS_AUTH], the event, rid, env, outcome, status and ms", /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z \[CMS_AUTH\] token_created rid=abc123def456 env=(production|development) outcome=success attempt=att000000001 status=200 ms=12 msg=/.test(lines[0] ?? ""), lines[0]);
  check("log line: a sign-in link, a bare token, an API key, a connection string and a full address are all removed", !lines[0].includes(fakeToken) && !lines[0].includes("re_fake_key") && !lines[0].includes("mongodb+srv") && !lines[0].includes("someone.admin@") && lines[0].includes("[sign-in link]") && lines[0].includes("s••••••••••••@example.com"), lines[0]);
  check("log line: fields named token, cookie, session id, API key or password are refused whatever they hold", /token=\[refused\]/.test(lines[1]) && /cookie_value=\[refused\]/.test(lines[1]) && /session_id=\[refused\]/.test(lines[1]) && /api_key=\[refused\]/.test(lines[1]) && /password=\[refused\]/.test(lines[1]) && /mongo_uri=\[refused\]/.test(lines[1]) && /during=read/.test(lines[1]) && !lines[1].includes(fakeToken), lines[1]);
  process.env.NODE_ENV = "production";
  process.env.CMS_PUBLIC_URL = "https://customswise.ie";
  check("production: links use CMS_PUBLIC_URL, never the request's host", L.linkBaseUrl("https://evil.example/admin-blog/api/auth/link") === "https://customswise.ie");
  delete process.env.CMS_PUBLIC_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.customswise.ie";
  check("production without CMS_PUBLIC_URL: the website's own address", L.linkBaseUrl("http://localhost:3000/x") === "https://www.customswise.ie");
  process.env.NODE_ENV = "development";
  check("next dev: the local address the page was opened at", L.linkBaseUrl("http://localhost:3000/x") === "http://localhost:3000" && L.linkBaseUrl("http://169.254.191.165:3000/x") === "http://169.254.191.165:3000");
  check("next dev: never a host that is not this computer", L.linkBaseUrl("http://evil.example/x") === "https://www.customswise.ie");
  check("addresses are masked in logs", L.maskEmail("someone.admin@example.com") === "s••••••••••••@example.com");
  process.env.NODE_ENV = "production";
  process.env.CMS_PUBLIC_URL = "http://localhost:3000";
  check("production: an http or localhost address is never used for links", L.linkBaseUrl("http://localhost:3000/x") === null);
  process.env.CMS_PUBLIC_URL = "https://127.0.0.1";
  check("production: not even an https address on this computer", L.linkBaseUrl("https://127.0.0.1/x") === null);
  process.env.CMS_PUBLIC_URL = "https://customswise.ie";
  check("production: the live https address is used", L.linkBaseUrl("http://localhost:3000/x") === "https://customswise.ie");
  delete process.env.CMS_PUBLIC_URL;
  process.env.EMAIL_FROM = '"Customs Wise Website" <onboarding@resend.dev>';
  const test = L.signInSender();
  check("sender: a quoted display name is read; resend.dev is recognised as the test sender", test?.from === "Customs Wise Website <onboarding@resend.dev>" && test.testSender === true && test.domain === "resend.dev");
  process.env.CMS_EMAIL_FROM = "Customs Wise CMS <cms@customswise.ie>";
  const own = L.signInSender();
  check("sender: CMS_EMAIL_FROM wins over EMAIL_FROM once set (the verified-domain switch)", own?.from === "Customs Wise CMS <cms@customswise.ie>" && own.testSender === false && own.domain === "customswise.ie");
  process.env.CMS_EMAIL_FROM = "cms@customswise.ie";
  check("sender: a plain address works too", L.signInSender()?.from === "cms@customswise.ie");
  process.env.CMS_EMAIL_FROM = "not an address";
  check("sender: something that is not an address is refused", L.signInSender() === null);
  delete process.env.CMS_EMAIL_FROM;
  const linkForTest = `https://customswise.ie/admin-blog/auth#${"A".repeat(43)}`;
  const e = L.buildLinkEmail(linkForTest, new Date(Date.UTC(2026, 0, 2, 9, 30)), "ref123");
  check("message: a plain, factual subject", e.subject === "Sign in to the Customs Wise blog admin");
  check("message: the text part has the site, the time, the link, the 15-minute single use and why it was sent", e.text.includes("blog admin of customswise.ie on 2026-01-02 09:30 UTC") && e.text.includes(linkForTest) && e.text.includes("It works once, within 15 minutes") && /automatic security email/.test(e.text));
  check("message: the HTML part says the same, with the link as a button and as text", e.html.includes(`href="${linkForTest}"`) && e.html.includes(`>${linkForTest}<`) && e.html.includes("2026-01-02 09:30 UTC"));
  check("message: no images, tracking parameters or marketing words", !/<img|utm_|unsubscribe|offer|free|click here|act now|!!/i.test(e.text + e.html));
  check("message: a unique reference header, so Gmail does not thread sign-in emails together", e.headers["X-Entity-Ref-ID"] === "ref123" && L.buildLinkEmail(linkForTest).headers["X-Entity-Ref-ID"] !== L.buildLinkEmail(linkForTest).headers["X-Entity-Ref-ID"]);
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
}
rmSync(unitDir, { recursive: true, force: true });

/* ---------- 2. Fake email provider ---------- */
const outbox = [];
const lookups = [];
let mode = "ok";
const REFUSALS = {
  "test-sender": [403, { name: "validation_error", message: "You can only send testing emails to your own email address (owner.person@example.org). To send emails to other recipients, please verify a domain at resend.com/domains." }],
  "bad-key": [401, { name: "validation_error", message: "API key is invalid" }],
  "invalid-from": [422, { name: "validation_error", message: "Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format." }],
  "rate-limit": [429, { name: "rate_limit_exceeded", message: "Too many requests." }],
  "server-error": [500, { name: "internal_server_error", message: "Something went wrong." }],
};
const ID = (n) => `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, "0")}`; // the shape of Resend ids
const STATUS = { "bbbbbbbb-0000-4000-8000-000000000001": "delivered", "bbbbbbbb-0000-4000-8000-000000000002": "bounced", "bbbbbbbb-0000-4000-8000-000000000003": "suppressed", "bbbbbbbb-0000-4000-8000-000000000004": "delivery_delayed" };
const provider = createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    const reply = (code, json) => res.writeHead(code, { "Content-Type": "application/json" }).end(JSON.stringify(json));
    if (req.method === "GET") {
      // Delivery-status look-up: GET /emails/<id>. It never sends.
      const id = decodeURIComponent(req.url.split("/").pop());
      lookups.push({ id, auth: req.headers.authorization });
      if (req.headers.authorization !== `Bearer ${READ_KEY}`) return reply(401, { name: "restricted_api_key", message: "This API key is restricted to only send emails" });
      if (id.startsWith("aaaaaaaa-")) return reply(200, { id, to: [ADMIN], from: SENDER, last_event: "delivered", created_at: "2026-01-01T00:00:00Z" });
      if (STATUS[id]) return reply(200, { id, to: ["someone@example.invalid"], from: SENDER, last_event: STATUS[id], created_at: "2026-01-01T00:00:00Z" });
      return reply(404, { name: "not_found", message: "Email not found" });
    }
    if (mode === "drop") return req.socket.destroy();
    if (mode === "hang") {
      // Takes the email (it may be delivered) but answers too late: the website gives up first.
      outbox.push({ auth: req.headers.authorization, ...JSON.parse(body || "{}") });
      return setTimeout(() => reply(200, { id: ID(outbox.length) }), 4000);
    }
    if (REFUSALS[mode]) return reply(...REFUSALS[mode]);
    outbox.push({ auth: req.headers.authorization, ...JSON.parse(body || "{}") });
    reply(200, { id: ID(outbox.length) });
  });
});
await new Promise((r) => provider.listen(0, "127.0.0.1", r));
const PROVIDER = `http://127.0.0.1:${provider.address().port}/emails`;
if (new URL(PROVIDER).hostname !== "127.0.0.1") throw new Error("The fake provider must be on this computer: refusing to run.");

/* ---------- Servers (production build), every one pointed at the fake provider ---------- */
const servers = {};
const logs = {};
const serverDir = mkdtempSync(path.join(os.tmpdir(), "cms-email-link-servers-"));
function start(port, extra) {
  const env = {
    ...process.env,
    CMS_AUTH_DIR: path.join(serverDir, String(port)),
    MONGODB_URI: "mongodb://127.0.0.1:27999",
    MONGODB_DB: "blog_cms",
    ADMIN_PASSWORD_HASH: "",
    RESEND_READ_API_KEY: "",
    CMS_PUBLIC_URL: `https://cms-test-${port}.example`,
    EMAIL_API_KEY: API_KEY,
    EMAIL_FROM: SENDER,
    ADMIN_EMAIL: ADMIN,
    CMS_LINK_COOLDOWN_SECONDS: "0",
    ...extra,
    EMAIL_API_URL: PROVIDER, // always last: no server here can reach the real Resend
  };
  delete env.CMS_DEV_ACCESS;
  const child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  logs[port] = "";
  child.stdout.on("data", (d) => (logs[port] += d));
  child.stderr.on("data", (d) => (logs[port] += d));
  servers[port] = child;
}
start(3331, { RESEND_READ_API_KEY: READ_KEY, CMS_EMAIL_STATUS_DELAY_MS: "300" });
start(3332, { EMAIL_API_KEY: "" }); // no API key
start(3333, { ADMIN_EMAIL: "" }); // no administrator in the settings
const SHARED = path.join(serverDir, "shared");
start(3334, { CMS_AUTH_DIR: SHARED, CMS_PUBLIC_URL: "https://cms-test-shared.example" }); // two processes of one website,
start(3335, { CMS_AUTH_DIR: SHARED, CMS_PUBLIC_URL: "https://cms-test-shared.example" }); // sharing their sign-in records
start(3336, { CMS_LINK_COOLDOWN_SECONDS: "" }); // the default one-minute pause between emails
start(3337, { EMAIL_FROM: "" }); // no sender
start(3338, {}); // provider failures
start(3339, { EMAIL_FROM: '"Customs Wise Website" <onboarding@resend.dev>' }); // Resend's shared test sender
start(3340, { CMS_EMAIL_FROM: "Customs Wise CMS <cms@customswise-test.example>" }); // the verified-domain switch
start(3341, { CMS_PUBLIC_URL: "http://localhost:3000" }); // a production server misconfigured with a local address
start(3342, { CMS_EMAIL_TIMEOUT_MS: "1500" }); // the provider answers too late
const NOT_A_FOLDER = path.join(serverDir, "not-a-folder");
writeFileSync(NOT_A_FOLDER, "a file where the sign-in folder should be");
start(3343, { CMS_AUTH_DIR: NOT_A_FOLDER }); // sign-in records cannot be written
start(3344, { BLOG_SOURCE: "cms" }); // the public blog from the CMS, with the database down
const BLOCKED_SESSIONS = path.join(serverDir, "blocked-sessions");
mkdirSync(BLOCKED_SESSIONS);
writeFileSync(path.join(BLOCKED_SESSIONS, "session"), "a file where the session folder should be");
start(3346, { CMS_AUTH_DIR: BLOCKED_SESSIONS }); // links work, sessions cannot be stored
start(3345, { BLOG_SOURCE: "cms", CMS_STORE: "json", CMS_DATA_DIR: path.join(serverDir, "empty-cms") }); // …and with a CMS that has no articles
const ip = () => `10.3.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
async function http(port, p, { method = "GET", body, cookie, origin = `http://127.0.0.1:${port}`, host, xff = ip() } = {}) {
  const h = { "X-Forwarded-For": xff };
  if (cookie) h.Cookie = cookie;
  if (host) h["X-Forwarded-Host"] = host;
  if (method !== "GET") h.Origin = origin;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  const text = await r.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: r.status, data, text, headers: r.headers, setCookie: r.headers.getSetCookie?.() ?? [] };
}
const send = (port, extra = {}) => http(port, "/admin-blog/api/auth/link", { method: "POST", body: { action: "send" }, ...extra });
const verify = async (port, token, extra = {}) => {
  const r = await http(port, "/admin-blog/api/auth/link", { method: "POST", body: { action: "verify", token }, ...extra });
  const raw = r.setCookie.find((c) => c.startsWith("__Secure-cw_admin=")) ?? "";
  const v = raw.split(";")[0];
  return { ...r, cookie: v && !v.endsWith("=") ? v : null, raw };
};
const linkOf = (mail) => (mail?.text ?? "").match(/https?:\/\/\S+\/admin-blog\/auth#[A-Za-z0-9_-]{43}/)?.[0] ?? null;
const tokenOf = (link) => link?.split("#")[1] ?? "";
const toLogin = (r) => [307, 308].includes(r.status) && new URL(r.headers.get("location") ?? "", "http://x").pathname === "/admin-blog";
const waitForLog = async (port, re, ms = 5000) => {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(200)) if (re.test(logs[port])) return true;
  return false;
};

try {
  for (const port of Object.keys(servers)) {
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(`http://127.0.0.1:${port}/`, { redirect: "manual" });
        break;
      } catch {}
      await sleep(1000);
    }
  }
  console.log("\nThe sign-in page");
  const page = await http(3331, "/admin-blog");
  check("shows 'Email me a sign-in link', with no address to type", page.text.includes('data-testid="email-link-button"') && page.text.includes("Email me a sign-in link"));
  check("the password form is only an optional section", page.text.includes('data-testid="password-sign-in"'));

  console.log("\nAsking for a link (accepted by the provider)");
  const first = await send(3331);
  const msg = first.data.message ?? "";
  check("200, and the message says the request was accepted but delivery is NOT confirmed", first.status === 200 && /accepted/.test(msg) && /Delivery is not confirmed/.test(msg) && !/on its way/.test(msg), msg);
  check("the message reveals no address, not even a masked one", !msg.includes("@") && !msg.includes("•") && !first.text.includes(ADMIN));
  const mail = outbox.at(-1);
  check("one email: from EMAIL_FROM, to ADMIN_EMAIL only, with the sending key", outbox.length === 1 && mail.from === SENDER && JSON.stringify(mail.to) === JSON.stringify([ADMIN]) && mail.auth === `Bearer ${API_KEY}`);
  const link = linkOf(mail);
  check("it holds a link to /admin-blog/auth on the configured https address, with the token after #", !!link && link.startsWith("https://cms-test-3331.example/admin-blog/auth#") && (mail.html ?? "").includes(link));
  check("the email has the transactional subject, a text part and an HTML part, and says it works once within 15 minutes", mail.subject === "Sign in to the Customs Wise blog admin" && /It works once, within 15 minutes/.test(mail.text) && /<html/.test(mail.html));
  check("…and a unique X-Entity-Ref-ID header", /^[0-9a-f]{24}$/.test(mail.headers?.["X-Entity-Ref-ID"] ?? ""));
  check("the server log says ACCEPTED, gives the provider's id, and says accepted is not delivered", logs[3331].includes(`ACCEPTED by Resend (id ${ID(1)}). Accepted is not yet delivered.`));
  check("…then looks up the delivery status with the read key and logs it", (await waitForLog(3331, new RegExp(`Delivery status of sign-in email ${ID(1)}: delivered - DELIVERED`))) && lookups.some((l) => l.id === ID(1) && l.auth === `Bearer ${READ_KEY}`));
  check("the status look-up did not send anything", outbox.length === 1);
  check("the token is in neither the answer nor the server log", !first.text.includes(tokenOf(link)) && !logs[3331].includes(tokenOf(link)));
  check("the link page opens without a session", (await http(3331, "/admin-blog/auth")).status === 200);

  console.log("\nOpening the link");
  const ok = await verify(3331, tokenOf(link));
  check("the link signs in and sends the browser to Manage Customs Wise", ok.status === 200 && ok.data.redirect === "/admin-blog/sites/customs-wise" && !!ok.cookie);
  check("session cookie: HttpOnly, Secure, SameSite=Strict, Path=/admin-blog", /HttpOnly/i.test(ok.raw) && /; Secure/i.test(ok.raw) && /SameSite=Strict/i.test(ok.raw) && /Path=\/admin-blog/i.test(ok.raw));
  for (let i = 1; i <= 3; i++) check(`refresh ${i}: still signed in`, (await http(3331, "/admin-blog/account", { cookie: ok.cookie })).status === 200);
  check("no database connection was needed", !/MongoDB \w+ failed|database request failed/.test(logs[3331]));
  check("the same link a second time: 'expired or already been used'", (await verify(3331, tokenOf(link))).status === 400);
  check("a made-up token is refused", (await verify(3331, "A".repeat(43))).status === 400);
  check("protected APIs: 401 without the session; signed in, article data needs the database (503)", (await http(3331, "/admin-blog/api/sites/customs-wise/posts")).status === 401 && (await http(3331, "/admin-blog/api/sites/customs-wise/posts", { cookie: ok.cookie })).status === 503);
  check("sign out ends the session", (await http(3331, "/admin-blog/api/auth/logout", { method: "POST", cookie: ok.cookie })).status === 200 && toLogin(await http(3331, "/admin-blog/account", { cookie: ok.cookie })));

  console.log("\nSafety");
  await send(3331);
  const olderLink = tokenOf(linkOf(outbox.at(-1)));
  await send(3331);
  const newerLink = tokenOf(linkOf(outbox.at(-1)));
  check("once a newer email is accepted, only its link works", (await verify(3331, olderLink)).status === 400 && (await verify(3331, newerLink)).status === 200);
  const forged = await send(3331, { host: "evil.example", origin: "http://evil.example" });
  check("a forged Host header never changes where the link points", forged.status === 403 || (forged.status === 200 && linkOf(outbox.at(-1)).startsWith("https://cms-test-3331.example/")), `${forged.status}`);
  check("asking for a link from another website is refused", (await send(3331, { origin: "https://evil.example" })).status === 403);
  check("using a link from another website is refused", (await verify(3331, "A".repeat(43), { origin: "https://evil.example" })).status === 403);
  const limitIp = ip();
  for (let i = 0; i < 5; i++) await send(3331, { xff: limitIp });
  check("more than 5 link emails in 15 minutes from one address: refused (429)", (await send(3331, { xff: limitIp })).status === 429);

  console.log("\nThe one-minute pause between emails (default setting)");
  const firstOnPause = await send(3336);
  const pauseLink = tokenOf(linkOf(outbox.at(-1)));
  const sentCount = outbox.length;
  const again = await send(3336);
  check("the answer tells the button to rest for 60 seconds", firstOnPause.status === 200 && firstOnPause.data.retryAfter === 60);
  check("a second request within the minute: 429, nothing sent, and it says to check Spam/Promotions", again.status === 429 && outbox.length === sentCount && /Spam and Promotions/.test(again.data.message ?? "") && again.data.retryAfter > 0);
  check("so the first email's link still works", (await verify(3336, pauseLink)).status === 200);

  console.log("\nWhen the provider does not take the email (nothing is ever counted as sent)");
  await send(3338);
  const inInbox = tokenOf(linkOf(outbox.at(-1)));
  const cases = [
    ["test-sender", "sender-not-allowed", /sender address/, /test sender .*only delivers to the address that owns the Resend account/],
    ["bad-key", "key-rejected", /credentials/, /EMAIL_API_KEY was rejected/],
    ["invalid-from", "sender-not-allowed", /sender address/, /check EMAIL_FROM/],
    ["rate-limit", "provider-rate-limited", /limiting how many emails/, /sending limit was reached/],
    ["server-error", "provider-error", /could not take the email/, /could not take the email right now/],
    ["drop", "unreachable", /could not be reached/, /Resend could not be reached/],
  ];
  for (const [m, reason, screen, log] of cases) {
    const before = outbox.length;
    mode = m;
    const r = await send(3338);
    mode = "ok";
    check(`${m}: 503 "${reason}", "No email was sent" on screen, and the log explains it`, r.status === 503 && r.data.reason === reason && screen.test(r.data.message ?? "") && /No email was sent|so no email was sent/.test(r.data.message ?? "") && log.test(logs[3338]) && outbox.length === before, `${r.status} ${r.data.reason}`);
  }
  check("Resend's refusal is logged with the account owner's address masked", /o•+@example\.org/.test(logs[3338]) && !logs[3338].includes("owner.person@example.org"));
  check("after all those failures, the link already in the inbox still works", (await verify(3338, inInbox)).status === 200);

  console.log("\nMissing settings");
  const noKey = await send(3332);
  check("no EMAIL_API_KEY: 503 'not set up', nothing sent, the log names the setting", noKey.status === 503 && /not set up/.test(noKey.data.message ?? "") && /missing EMAIL_API_KEY/.test(logs[3332]));
  const noFrom = await send(3337);
  check("no EMAIL_FROM: 503 'not set up', nothing sent, the log names the setting", noFrom.status === 503 && /not set up/.test(noFrom.data.message ?? "") && /missing EMAIL_FROM/.test(logs[3337]));
  const noAdmin = await send(3333);
  check("no ADMIN_EMAIL: no link is sent to anyone", noAdmin.status === 503 && outbox.every((m) => JSON.stringify(m.to) === JSON.stringify([ADMIN])));
  check("without a read key, the log says delivery is unconfirmed and how to check", /Delivery not confirmed\. To check it/.test(logs[3338]));

  console.log("\nSender and link address settings");
  await send(3339);
  check("Resend's test sender: the email still goes (for the account owner), and the log warns about Spam and the brand-name mismatch", outbox.at(-1)?.from === "Customs Wise Website <onboarding@resend.dev>" && /shared test sender \(@resend\.dev\)/.test(logs[3339]) && /names Customs Wise but its address is on resend\.dev/.test(logs[3339]));
  await send(3340);
  check("CMS_EMAIL_FROM set: sign-in emails come from it", outbox.at(-1)?.from === "Customs Wise CMS <cms@customswise-test.example>" && !/shared test sender/.test(logs[3340]));
  const before3341 = outbox.length;
  const local = await send(3341);
  check("a production server whose site address is http://localhost: nothing is sent, 503, and the log says why", local.status === 503 && outbox.length === before3341 && /must be the live https:\/\/ address/.test(logs[3341]));

  console.log("\nTwo processes of the same website (shared records)");
  await send(3334);
  const shared = tokenOf(linkOf(outbox.at(-1)));
  const onOther = await verify(3335, shared);
  check("a link sent by one process is accepted by the other", onOther.status === 200 && !!onOther.cookie);
  check("the session made by one process is valid on the other", (await http(3334, "/admin-blog/account", { cookie: onOther.cookie })).status === 200 && (await http(3335, "/admin-blog/account", { cookie: onOther.cookie })).status === 200);
  check("the used link is refused by both processes", (await verify(3334, shared)).status === 400 && (await verify(3335, shared)).status === 400);
  await send(3334);
  const race = tokenOf(linkOf(outbox.at(-1)));
  const both = await Promise.all([verify(3334, race), verify(3335, race), verify(3334, race), verify(3335, race)]);
  check("the same link opened 4 times at once on both processes: exactly one sign-in", both.filter((r) => r.status === 200).length === 1, both.map((r) => r.status).join(","));
  const raceCookie = both.find((r) => r.status === 200)?.cookie;
  check("signing out on one process ends the session on the other", (await http(3334, "/admin-blog/api/auth/logout", { method: "POST", cookie: onOther.cookie })).status === 200 && toLogin(await http(3335, "/admin-blog/account", { cookie: onOther.cookie })));
  const files = readdirSync(path.join(SHARED, "session")).concat(readdirSync(path.join(SHARED, "link")));
  check("the record files are named by hashes only and hold no token", files.every((f) => /^[0-9a-f]{64}\.json$/.test(f)) && files.every((f) => !outbox.some((m) => f.includes(tokenOf(linkOf(m))))));
  spawnSync("taskkill", ["/PID", String(servers[3334].pid), "/T", "/F"]);
  await sleep(1500);
  start(3334, { CMS_AUTH_DIR: SHARED, CMS_PUBLIC_URL: "https://cms-test-shared.example" });
  for (let i = 0; i < 60; i++) {
    try {
      await fetch("http://127.0.0.1:3334/", { redirect: "manual" });
      break;
    } catch {}
    await sleep(1000);
  }
  check("after a restart, an existing session is still valid", (await http(3334, "/admin-blog/account", { cookie: raceCookie })).status === 200);

  console.log("\nStructured log lines ([CMS_AUTH] / [CMS_DB]) and request ids");
  const logged = (port, event) => logs[port].split(/\r?\n/).filter((l) => new RegExp(`\[CMS_[A-Z]+\] ${event} `).test(l));
  const field = (line, name) => line?.match(new RegExp(`\\b${name}=([^\\s]+)`))?.[1];
  const sendR = await send(3338);
  const rid = sendR.data.requestId;
  check("the answer carries a request id, also as the X-Request-Id header", /^[0-9a-f]{12}$/.test(rid ?? "") && sendR.headers.get("x-request-id") === rid);
  const ofRid = logs[3338].split(/\r?\n/).filter((l) => l.includes(`rid=${rid} `));
  const events = ofRid.map((l) => l.split(" ")[2]);
  const SEND_ORDER = ["request_received", "admin_validation_completed", "validation_started", "validation_completed", "token_created", "token_persisted", "send_started", "provider_accepted", "request_completed"];
  check(`one send, in order: ${SEND_ORDER.join(" → ")}`, JSON.stringify(events.filter((e) => SEND_ORDER.includes(e))) === JSON.stringify(SEND_ORDER), events.join(","));
  check("…each under its own scope: [CMS_CONFIG] for the settings, [CMS_EMAIL] for the provider, [CMS_AUTH] for the rest", ofRid.some((l) => / \[CMS_CONFIG\] validation_completed /.test(l)) && ofRid.some((l) => / \[CMS_EMAIL\] provider_accepted /.test(l)) && ofRid.some((l) => / \[CMS_AUTH\] token_persisted /.test(l)));
  check("every line: UTC ISO time, env=production, an outcome", ofRid.length > 0 && ofRid.every((l) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z \[CMS_[A-Z]+\] \w+ rid=[0-9a-f]{12} env=production outcome=(success|failure|rejected|info)/.test(l)));
  const acceptedLine = ofRid.find((l) => l.includes(" provider_accepted "));
  check("the provider's acceptance: status=200, ms, the provider id, and 'Accepted is not yet delivered'", field(acceptedLine, "status") === "200" && /^\d+$/.test(field(acceptedLine, "ms") ?? "") && field(acceptedLine, "provider_id")?.startsWith("aaaaaaaa-") && /Accepted is not yet delivered/.test(acceptedLine));
  check("the send's duration is logged on completion", /^\d+$/.test(field(ofRid.find((l) => l.includes(" request_completed ")), "ms") ?? ""));
  const attemptId = field(ofRid.find((l) => l.includes(" token_created ")), "attempt");
  const v = await verify(3338, tokenOf(linkOf(outbox.at(-1))));
  const vLines = logs[3338].split(/\r?\n/).filter((l) => l.includes(`rid=${v.data.requestId} `));
  check("using the link: verification_started → token_consumed → session_created → session_cookie_set → dashboard_redirect, under the SAME attempt id as the send",
    JSON.stringify(vLines.map((l) => l.split(" ")[2]).filter((e) => ["verification_started", "token_consumed", "session_created", "session_cookie_set", "dashboard_redirect"].includes(e))) === JSON.stringify(["verification_started", "token_consumed", "session_created", "session_cookie_set", "dashboard_redirect"]) && !!attemptId && field(vLines.find((l) => l.includes(" token_consumed ")), "attempt") === attemptId);
  const cookieLine = vLines.find((l) => l.includes(" session_cookie_set "));
  check("session_cookie_set says how the cookie was set (never its value)", /name=__Secure-cw_admin/.test(cookieLine) && /http_only=true/.test(cookieLine) && /secure=true/.test(cookieLine) && /same_site=strict/.test(cookieLine) && /path=\/admin-blog/.test(cookieLine) && !cookieLine.includes(v.cookie?.split("=")[1] ?? "@@"));
  if (process.argv.includes("--show-log")) console.log(["", `    --- log lines of one send (rid ${rid}) and the use of its link (rid ${v.data.requestId}) ---`, ...[...ofRid, ...vLines].map((l) => `    ${l}`), ""].join("\n"));
  check("dashboard_redirect names where the browser goes", /to=\/admin-blog\/sites\/customs-wise/.test(vLines.find((l) => l.includes(" dashboard_redirect ")) ?? ""));
  const again2 = await verify(3338, tokenOf(linkOf(outbox.at(-1))));
  check("the same link again: token_validation_completed outcome=rejected code=already_used, same attempt id", field(logged(3338, "token_validation_completed").find((l) => l.includes(`rid=${again2.data.requestId} `)), "code") === "already_used" && logged(3338, "token_validation_completed").some((l) => l.includes(`rid=${again2.data.requestId} `) && l.includes(`attempt=${attemptId}`) && /outcome=rejected/.test(l)));
  const made = await verify(3338, "C".repeat(43));
  const bad = await verify(3338, "short");
  const none = await http(3338, "/admin-blog/api/auth/link", { method: "POST", body: { action: "verify" } });
  const codeOf = (r) => field(logged(3338, "token_validation_completed").find((l) => l.includes(`rid=${r.data.requestId} `)), "code");
  check("a token never issued → code=unknown; a wrong shape → malformed; none at all → missing", codeOf(made) === "unknown" && codeOf(bad) === "malformed" && codeOf(none) === "missing", `${codeOf(made)} ${codeOf(bad)} ${codeOf(none)}`);
  check("all of them: 400 with the same message for the person", [made, bad, none].every((r) => r.status === 400 && /expired or has already been used/.test(r.data.message ?? "")));
  const crossSite = await send(3338, { origin: "https://evil.example" });
  check("a request from another website: request_rejected code=cross_origin, status=403", /code=cross_origin/.test(logged(3338, "request_rejected").find((l) => l.includes(`rid=${crossSite.data.requestId} `)) ?? ""));

  console.log("\nThe provider answers too late (timeout)");
  const beforeHang = outbox.length;
  mode = "hang";
  const late = await send(3342);
  mode = "ok";
  check("503 'provider-timeout', and the person is told the email may still arrive", late.status === 503 && late.data.reason === "provider-timeout" && /may still arrive/.test(late.data.message ?? ""), `${late.status} ${late.data.reason}`);
  check("the log: [CMS_EMAIL] send_failed code=provider-timeout with how long it waited", logged(3342, "send_failed").some((l) => /code=provider-timeout/.test(l) && /ms=\d+/.test(l)));
  check("the email that may have gone out keeps a working link", outbox.length === beforeHang + 1 && (await verify(3342, tokenOf(linkOf(outbox.at(-1))))).status === 200);

  console.log("\nSign-in records cannot be written");
  const sentBeforeStore = outbox.length;
  const noStore = await send(3343);
  check("503 'not available', no email sent, no link", noStore.status === 503 && /not available/.test(noStore.data.message ?? "") && outbox.length === sentBeforeStore);
  check("the log: auth_store_failed with the error code, and the request completes as a failure", logged(3343, "auth_store_failed").some((l) => /code=E[A-Z]+/.test(l)) && logged(3343, "request_completed").some((l) => /status=503/.test(l)));
  const h3343 = await http(3343, "/admin-blog/api/health");
  check("the health check says the sign-in store is not writable, without saying where", h3343.data.signInStore === "not-writable" && !h3343.text.includes(serverDir) && !h3343.text.includes("not-a-folder"));

  console.log("\nA link that works, but the session cannot be stored");
  await send(3346);
  const noSession = await verify(3346, tokenOf(linkOf(outbox.at(-1))));
  check("503 'not available', no session cookie", noSession.status === 503 && !noSession.cookie, `${noSession.status}`);
  check("the log: token_consumed, then session_create_failed code=auth_store (not a token problem)", logged(3346, "token_consumed").length === 1 && logged(3346, "session_create_failed").some((l) => /code=auth_store/.test(l)) && !logged(3346, "token_validation_completed").some((l) => /outcome=rejected/.test(l)));

  console.log("\nThe health check (public: names and statuses only)");
  const sentBeforeHealth = outbox.length;
  const h = await http(3331, "/admin-blog/api/health");
  check("app running; database down → 503, reason unreachable, with the kind of failure", h.status === 503 && h.data.app === "running" && h.data.database?.ok === false && h.data.database?.reason === "unreachable" && typeof h.data.database?.kind === "string", JSON.stringify(h.data.database));
  check("email sign-in: ready, with each part named", h.data.emailSignIn?.ready === true && h.data.emailSignIn.adminEmail === "set" && h.data.emailSignIn.apiKey === "set" && h.data.emailSignIn.sender === "own-domain" && h.data.emailSignIn.linkAddress === "ok");
  check("blog source and sign-in store are reported", h.data.blogSource === (process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms" ? "cms" : "static") && h.data.signInStore === "writable");
  check("never a value: no key, no address, no connection string, no path", !h.text.includes(API_KEY) && !h.text.includes(READ_KEY) && !h.text.includes(ADMIN) && !h.text.includes("mongodb://") && !h.text.includes("27999") && !h.text.includes(serverDir) && !h.text.includes("cms-test-3331"));
  const hNoKey = await http(3332, "/admin-blog/api/health");
  check("a missing setting is named: EMAIL_API_KEY", hNoKey.data.settings?.missing?.includes("EMAIL_API_KEY") && hNoKey.data.emailSignIn?.apiKey === "missing" && hNoKey.data.emailSignIn?.ready === false);
  check("Resend's test sender is named as such", (await http(3339, "/admin-blog/api/health")).data.emailSignIn?.sender?.startsWith("resend-test-sender"));
  check("a local site address: link address not usable", (await http(3341, "/admin-blog/api/health")).data.emailSignIn?.linkAddress === "missing-or-not-https");
  check("the health check sent no email", outbox.length === sentBeforeHealth);
  check("[CMS_DB] connection_failed is logged with the kind, a duration and no connection string", logged(3331, "connection_failed").some((l) => /code=\w/.test(l) && /ms=\d+/.test(l) && !l.includes("mongodb://") && !l.includes("27999")));
  const failuresBefore = logged(3331, "connection_failed").length;
  for (let i = 0; i < 3; i++) await http(3331, "/admin-blog/api/health");
  const during = logged(3331, "connection_failed").slice(failuresBefore);
  check("repeated failures are not logged on every request: at most one line for 3 failing requests, and a later line counts the ones left out", during.length <= 1 && (during.length === 0 || Number(field(during[0], "suppressed") ?? 0) >= 1 || failuresBefore === 0), `${failuresBefore} → ${logged(3331, "connection_failed").length}: ${logged(3331, "connection_failed").map((l) => `${l.slice(11, 19)} ${field(l, "code")} ${field(l, "suppressed") ?? ""}`).join(" | ")}`);

  console.log("\nThe dashboard with the database down");
  await send(3331);
  const dashSession = (await verify(3331, tokenOf(linkOf(outbox.at(-1))))).cookie;
  const dash = await http(3331, "/admin-blog/sites/customs-wise", { cookie: dashSession });
  // The message itself ("This screen could not be loaded…", app/admin-blog/error.tsx) is drawn by the browser.
  check("signed in, but the screen cannot load: a server error (500), not the 404 page and not the sign-in page", dash.status === 500 && !toLogin(dash), `${dash.status} ${(dash.text.match(/<h1[^>]*>([^<]*)/) ?? [])[1] ?? ""} ${(dash.text.match(/<title>([^<]*)/) ?? [])[1] ?? ""}`);
  check("the log: [CMS_DATA] dashboard_load_failed with the screen, status 500, the failure kind and reason=unreachable", logged(3331, "dashboard_load_failed").some((l) => / \[CMS_DATA\] /.test(l) && /screen=site/.test(l) && /status=500/.test(l) && /reason=unreachable/.test(l) && /code=(network|timeout|dns|unknown)/.test(l)));
  const dashRid = dash.headers.get("x-request-id");
  const dashAttempt = field(logged(3331, "session_created").at(-1), "attempt");
  const dashLines = logs[3331].split(/\r?\n/).filter((l) => l.includes(`rid=${dashRid} `));
  check("the dashboard request has one request id across its lines (X-Request-Id), and they carry the login attempt of the email that signed in",
    /^[0-9a-f]{12}$/.test(dashRid ?? "") && !!dashAttempt &&
    dashLines.some((l) => / \[CMS_AUTH\] session_validated /.test(l) && l.includes(`attempt=${dashAttempt}`) && /outcome=success/.test(l)) &&
    dashLines.some((l) => / \[CMS_ROUTE\] admin_page_request /.test(l) && l.includes(`attempt=${dashAttempt}`) && /path=\/admin-blog\/sites\/customs-wise/.test(l)) &&
    dashLines.some((l) => / \[CMS_DATA\] dashboard_query_started /.test(l) && l.includes(`attempt=${dashAttempt}`)) &&
    dashLines.some((l) => / \[CMS_DATA\] dashboard_load_failed /.test(l)), dashLines.map((l) => l.split(" ").slice(1, 3).join(" ")).join(" | "));
  check("the login page logs that it was shown", (await http(3331, "/admin-blog")).status === 200 && logged(3331, "login_page_loaded").some((l) => /code=shown/.test(l)));

  console.log("\nThe public blog: database down versus no articles");
  const downList = await http(3344, "/blog");
  const downMissing = await http(3344, "/insights/blog/zz-only-in-the-cms");
  check("database down: /blog still shows the built-in articles (200)", downList.status === 200 && /insights\/blog\//.test(downList.text));
  check("database down: an address that may be a CMS article is a server error (500), never the 404 page", downMissing.status === 500, `${downMissing.status}`);
  const emptyList = await http(3345, "/blog");
  const emptyMissing = await http(3345, "/insights/blog/zz-only-in-the-cms");
  check("CMS reachable but without articles: /blog shows the built-in articles (200)", emptyList.status === 200 && /insights\/blog\//.test(emptyList.text));
  check("the health check says where the public blog gets its articles: built-in fallback while the database is down, the CMS when it answers", /^built-in fallback/.test((await http(3344, "/admin-blog/api/health")).data.publicBlog ?? "") && (await http(3345, "/admin-blog/api/health")).data.publicBlog === "cms");
  check("…and an address that is not an article is a real 404", emptyMissing.status === 404 && /on the manifest/i.test(emptyMissing.text), `${emptyMissing.status}`);
  check("the two cases are told apart: the log says the CMS could not be read, and the health check says which database answered", /The CMS could not be read/.test(logs[3344]) && (await http(3344, "/admin-blog/api/health")).data.database?.ok === false && (await http(3345, "/admin-blog/api/health")).data.database?.ok === true);

  console.log("\nnpm run cms:email-status (reads only)");
  const sentBeforeStatus = outbox.length;
  // Not execFileSync: it would block this process, where the fake provider has to answer.
  const status = (id, extra = {}) =>
    new Promise((resolve) => {
      execFile(process.execPath, ["scripts/cms/email-status.mjs", id], { env: { ...process.env, EMAIL_API_URL: PROVIDER, RESEND_READ_API_KEY: READ_KEY, ...extra }, encoding: "utf8" }, (_err, stdout, stderr) => resolve(`${stdout ?? ""}${stderr ?? ""}`));
    });
  check("delivered", /status: +delivered - DELIVERED/.test(await status("bbbbbbbb-0000-4000-8000-000000000001")));
  check("bounced", /status: +bounced - BOUNCED/.test(await status("bbbbbbbb-0000-4000-8000-000000000002")));
  check("suppressed", /status: +suppressed - SUPPRESSED/.test(await status("bbbbbbbb-0000-4000-8000-000000000003")));
  check("delayed", /status: +delivery_delayed - delayed/.test(await status("bbbbbbbb-0000-4000-8000-000000000004")));
  check("the recipient is masked in its output", /to: +s•••@example\.invalid/.test(await status("bbbbbbbb-0000-4000-8000-000000000001")));
  check("a send-only key: says a full-access key is needed", /may only send emails/.test(await status("bbbbbbbb-0000-4000-8000-000000000001", { RESEND_READ_API_KEY: API_KEY })));
  check("an unknown id: says Resend has no such email", /no email with this id/.test(await status("cccccccc-0000-4000-8000-000000000009")));
  check("the provider unreachable: says so", /could not be reached/.test(await status("bbbbbbbb-0000-4000-8000-000000000001", { EMAIL_API_URL: "http://127.0.0.1:9/emails" })));
  check("none of these look-ups sent an email", outbox.length === sentBeforeStatus);

  console.log("\nnpm run cms:email-headers (a saved email, read locally)");
  const eml = (from, auth, dkimDomain, body) =>
    [`Delivered-To: anybody@example.invalid`, `Authentication-Results: mx.google.com;`, `       ${auth}`, `Return-Path: <bounce@${dkimDomain === "customswise.ie" ? "send.customswise.ie" : "send.resend.dev"}>`, `DKIM-Signature: v=1; a=rsa-sha256; d=${dkimDomain};`, ` s=resend; h=from:to:subject`, `From: ${from}`, `To: someone.person@example.invalid`, `Subject: Sign in to the Customs Wise blog admin`, ``, body].join("\r\n");
  const tmpEml = mkdtempSync(path.join(os.tmpdir(), "cms-eml-"));
  const headersOf = (name, content) => new Promise((resolve) => {
    const f = path.join(tmpEml, name);
    writeFileSync(f, content);
    execFile(process.execPath, ["scripts/cms/email-headers.mjs", f], { encoding: "utf8" }, (_e, out, err) => resolve(`${out}${err}`));
  });
  const secret = "Z".repeat(43);
  const testMail = await headersOf("test.eml", eml('"Customs Wise Website" <onboarding@resend.dev>', "dkim=pass header.i=@resend.dev; spf=pass smtp.mailfrom=bounce@send.resend.dev; dmarc=pass (p=REJECT) header.from=resend.dev", "resend.dev", `Open http://localhost:3000/admin-blog/auth#${secret}`));
  check("test sender: reports SPF/DKIM/DMARC pass for resend.dev, and why it still lands in Spam", /SPF: +pass for send\.resend\.dev \(aligned/.test(testMail) && /DKIM: +pass signed by resend\.dev \(aligned\)/.test(testMail) && /DMARC: +pass \(policy p=REJECT\)/.test(testMail) && /shared test domain/.test(testMail) && /brand name on an unrelated domain/.test(testMail) && /links to this computer/.test(testMail));
  check("…never printing the token or a full address", !testMail.includes(secret) && !testMail.includes("someone.person@") && !testMail.includes("onboarding@resend.dev") && testMail.includes("o•••@resend.dev"));
  const ownMail = await headersOf("own.eml", eml("Customs Wise CMS <cms@customswise.ie>", "dkim=pass header.i=@customswise.ie; spf=pass smtp.mailfrom=bounce@send.customswise.ie; dmarc=pass (p=NONE) header.from=customswise.ie", "customswise.ie", `https://customswise.ie/admin-blog/auth#${secret}`));
  check("own verified domain: SPF and DKIM aligned with the sender, no warnings", /SPF: +pass for send\.customswise\.ie \(aligned/.test(ownMail) && /DKIM: +pass signed by customswise\.ie \(aligned\)/.test(ownMail) && /Nothing in these headers points to an authentication problem/.test(ownMail));
  const badMail = await headersOf("bad.eml", eml("Customs Wise CMS <cms@customswise.ie>", "dkim=fail header.i=@other.example; spf=softfail smtp.mailfrom=x@other.example; dmarc=fail (p=NONE) header.from=customswise.ie", "other.example", "https://customswise.ie/"));
  check("failed authentication is reported as such", /DMARC did not pass/.test(badMail) && /SPF did not pass/.test(badMail) && /DKIM did not pass/.test(badMail) && /NOT aligned/.test(badMail));
  rmSync(tmpEml, { recursive: true, force: true });

  console.log("\nSecrets");
  check("no server log contains a token, the sending key or the read key", Object.values(logs).every((l) => !l.includes(API_KEY) && !l.includes(READ_KEY) && !outbox.some((m) => l.includes(tokenOf(linkOf(m))))));
  check("no full sign-in link appears in any server log", Object.values(logs).every((l) => !/\/admin-blog\/auth#[A-Za-z0-9_-]{43}/.test(l)));
  check("no server log contains the administrator's full address or a session token", Object.values(logs).every((l) => !l.includes(ADMIN) && !/\be\.[A-Za-z0-9_-]{43}\b/.test(l)));
} finally {
  provider.close();
  for (const s of Object.values(servers)) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(s.pid), "/T", "/F"]);
    else s.kill();
  }
  rmSync(serverDir, { recursive: true, force: true });
  finish();
}
