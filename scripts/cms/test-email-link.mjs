// Sign-in by email link, end to end, WITHOUT SENDING ANY REAL EMAIL and without a database:
//   npm run cms:test:email-link        (after `npm run build`)
// A fake email provider on this computer stands in for Resend (EMAIL_API_URL, which every server here gets) and
// captures each email; the test takes the link out of it as a mail client would. It can also act out each way Resend
// may answer (refusals, its own rate limit, an outage) and answer delivery-status look-ups. The production build runs on
// ports 3331-3338 with MongoDB unreachable. The test stops before starting anything if the provider is not local.
// 1. Unit: link lifetime, single use, which links a new email cancels, the pause between emails (fake clock).
// 2. HTTP: sending, opening the link, the session, reuse, forged Host headers, limits, every kind of provider failure,
//    missing settings, two processes sharing records, delivery-status look-ups (server log and npm run cms:email-status).
import { execFile, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
  const files = { "env-admin": "cms/server/auth/env-admin.ts", "email-link": "cms/server/auth/email-link.ts", "file-store": "cms/server/auth/file-store.ts", password: "cms/server/auth/password.ts", "auth-shared": "cms/lib/auth-shared.ts" };
  for (const [name, file] of Object.entries(files)) {
    const src = readFileSync(file, "utf8").replace(/import "server-only";\n/, "").replace(/"@\/cms\/lib\/auth-shared"/g, '"./auth-shared"');
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
} finally {
  provider.close();
  for (const s of Object.values(servers)) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(s.pid), "/T", "/F"]);
    else s.kill();
  }
  rmSync(serverDir, { recursive: true, force: true });
  finish();
}
