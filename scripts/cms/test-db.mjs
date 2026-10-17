// The CMS database layer: how each kind of MongoDB failure is classified and logged, which database and collections
// are read, and what happens to records with a broken shape. WITHOUT SENDING ANY EMAIL (a fake provider stands in).
//
//   npm run cms:test:db          (after `npm run build`, with the local test database running:
//                                 cd ../customs-wise-blog-cms-local && npm run mongo:local)
//
// MONGODB_URI must point at this computer and MONGODB_DB must not be blog_cms: the test refuses to run otherwise,
// so it can never touch the production database. It adds two records of its own and removes them at the end.
// 1. Unit: the failure categories (from errors shaped like the driver's), the record shape check.
// 2. HTTP: a production build against the local database (connection, counts, correct database, a broken record),
//    and against settings that fail in each way (missing, malformed, unknown host, nothing listening).
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { check, finish } from "./lib/test-kit.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const require = createRequire(path.join(process.cwd(), "package.json"));
const URI = process.env.CMS_TEST_MONGODB_URI ?? "mongodb://127.0.0.1:27018";
const DB = process.env.CMS_TEST_MONGODB_DB ?? "blog_cms_local_test";
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(URI) || DB === "blog_cms") {
  console.error("Refusing to run: the test database must be on this computer (mongodb://127.0.0.1:…) and not named blog_cms.");
  process.exit(1);
}
const ADMIN = `zz-db-admin-${Date.now().toString(36)}@example.invalid`;

/* ---------- 1. Unit ---------- */
const unitDir = mkdtempSync(path.join(os.tmpdir(), "cms-db-unit-"));
const ts = require("typescript");
for (const [name, file] of Object.entries({ "mongo-failure": "cms/server/mongo-failure.ts", "doc-check": "cms/server/doc-check.ts" })) {
  writeFileSync(path.join(unitDir, `${name}.js`), ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const req = createRequire(path.join(unitDir, "x.js"));
const { describeMongoUri, mongoFailure } = req("./mongo-failure.js");
const { checkDocs } = req("./doc-check.js");
rmSync(unitDir, { recursive: true, force: true });

console.log("Failure categories (errors shaped like the MongoDB driver's)");
// A server-selection error, as the driver throws it, carrying the error of each server it tried.
const selection = (serverError) => Object.assign(new Error("Server selection timed out after 8000 ms"), { name: "MongoServerSelectionError", reason: { servers: new Map([["shard-00-00.example.mongodb.net:27017", { error: serverError }]]) } });
const kinds = {
  "network-access": selection(Object.assign(new Error("C0A1E7F5:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:../deps/openssl/ssl/record/rec_layer_s3.c:1605:SSL alert number 80"), { name: "MongoNetworkError", cause: { code: "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR" } })),
  authentication: Object.assign(new Error("bad auth : authentication failed"), { name: "MongoServerError", code: 8000, codeName: "AtlasError" }),
  dns: Object.assign(new Error("querySrv ENOTFOUND _mongodb._tcp.zz-no-such-cluster.example.mongodb.net"), { name: "MongoAPIError", code: "ENOTFOUND" }),
  network: selection(Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:27999"), { name: "MongoNetworkError", cause: { code: "ECONNREFUSED" } })),
  permission: Object.assign(new Error("user is not allowed to do action [find] on [blog_cms.posts]"), { name: "MongoServerError", code: 13, codeName: "Unauthorized" }),
  timeout: Object.assign(new Error("Server selection timed out after 8000 ms"), { name: "MongoServerSelectionError" }),
};
for (const [expected, err] of Object.entries(kinds)) check(`${expected}`, mongoFailure(err).kind === expected, mongoFailure(err).kind);
check("a plain server-selection timeout is NOT reported as an IP access problem", mongoFailure(kinds.timeout).kind === "timeout");
check("only TLS alert 80 (Atlas's answer to an IP not on its list) is network-access", mongoFailure(selection(Object.assign(new Error("connect ETIMEDOUT"), { cause: { code: "ETIMEDOUT" } }))).kind === "network");
check("an unexplained failure while connecting: unknown", mongoFailure(new Error("something odd"), "connection").kind === "unknown");
check("an unexplained failure after connecting (a read or write): query-failed", mongoFailure(Object.assign(new Error("Executor error during find command"), { name: "MongoServerError", code: 96 }), "read").kind === "query-failed");
check("the summary has the error's name and code only, never its message (which can hold host names)", !mongoFailure(kinds.dns).summary.includes("zz-no-such-cluster") && !mongoFailure(kinds.network).summary.includes("127.0.0.1") && /MongoAPIError code=ENOTFOUND/.test(mongoFailure(kinds.dns).summary));

console.log("\nWhat the log may say about MONGODB_URI");
const atlas = describeMongoUri("mongodb+srv://cms_user:p%40ss@w/rd@blog-cms-cluster.abcde.mongodb.net/blog_cms?retryWrites=true&authSource=admin&appName=x");
check("Atlas: scheme, cluster label, one host, the path database, authSource set", atlas.scheme === "mongodb+srv" && atlas.cluster_label === "blog-cms-cluster" && atlas.hosts === 1 && atlas.path_db === "blog_cms" && atlas.auth_source_set === true, JSON.stringify(atlas));
check("…never the user, the password (even with @ and / in it), the full host or the other parameters", !/cms_user|p%40ss|rd@|abcde|mongodb\.net|retryWrites|appName/.test(JSON.stringify(atlas)));
const local = describeMongoUri("mongodb://127.0.0.1:27018");
check("local: scheme mongodb, the address as label, no path database, no authSource", local.scheme === "mongodb" && local.cluster_label === "127.0.0.1" && local.path_db === "none" && local.auth_source_set === false);
check("a value that is not a connection string: scheme invalid", describeMongoUri("not-a-uri").scheme === "invalid" && describeMongoUri("not-a-uri").connection_string_set === true);
const multi = describeMongoUri("mongodb://u:p@db1.example.org:27017,db2.example.org:27017/x");
check("several hosts are counted, only the first one's label is kept", multi.hosts === 2 && multi.cluster_label === "db1");

console.log("\nRecord shape check");
const posts = [
  { _id: "p1", siteId: "s", slug: "a", status: "published", body: [], publishAt: new Date() },
  { _id: "p2", siteId: "s", slug: "b", status: "draft", body: [] },
  { _id: "p3", siteId: "s", status: "published", body: [] },
  { _id: "p4", siteId: "s", slug: "d", status: "archived", body: [] },
  { siteId: "s", slug: "e", status: "draft", body: [] },
  { _id: "p6", siteId: "s", slug: "f", status: "draft", body: "text" },
];
const r = checkDocs("posts", posts);
check("usable articles kept (a date stored as a Date object is fine); no slug, an unknown status, no id or a body that is not a list: left out", r.valid.map((d) => d._id).join(",") === "p1,p2" && r.invalid === 4, `${r.valid.map((d) => d._id)} / ${r.invalid}`);
check("sites need a key, media an address; other collections are not over-checked", checkDocs("sites", [{ _id: "x", key: "k" }, { _id: "y" }]).invalid === 1 && checkDocs("media", [{ _id: "m", siteId: "s", url: "/a.png" }]).invalid === 0 && checkDocs("audit", [{ _id: "a" }]).invalid === 0);

/* ---------- 2. Fake email provider and servers ---------- */
const outbox = [];
const provider = createServer((rq, rs) => {
  let body = "";
  rq.on("data", (d) => (body += d));
  rq.on("end", () => {
    outbox.push(JSON.parse(body || "{}"));
    rs.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ id: `dddddddd-0000-4000-8000-${String(outbox.length).padStart(12, "0")}` }));
  });
});
await new Promise((ok) => provider.listen(0, "127.0.0.1", ok));
const PROVIDER = `http://127.0.0.1:${provider.address().port}/emails`;

const servers = {};
const logs = {};
const serverDir = mkdtempSync(path.join(os.tmpdir(), "cms-db-servers-"));
function start(port, extra) {
  const env = {
    ...process.env,
    NODE_ENV: "production",
    CMS_AUTH_DIR: path.join(serverDir, String(port)),
    MONGODB_URI: URI,
    MONGODB_DB: DB,
    BLOG_SOURCE: "cms",
    CMS_IMAGES: "local",
    CMS_DATA_DIR: path.join(serverDir, `data-${port}`),
    ADMIN_EMAIL: ADMIN,
    ADMIN_PASSWORD_HASH: "",
    EMAIL_API_KEY: "re_test_send_key_not_real_000000000",
    EMAIL_FROM: "Customs Wise <cms@example.invalid>",
    CMS_PUBLIC_URL: `https://cms-db-${port}.example`,
    CMS_LINK_COOLDOWN_SECONDS: "0",
    RESEND_READ_API_KEY: "",
    ...extra,
    EMAIL_API_URL: PROVIDER, // always last: no server here can reach the real Resend
  };
  delete env.CMS_DEV_ACCESS;
  delete env.CMS_STORE;
  const child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], { env, stdio: ["ignore", "pipe", "pipe"] });
  logs[port] = "";
  child.stdout.on("data", (d) => (logs[port] += d));
  child.stderr.on("data", (d) => (logs[port] += d));
  servers[port] = child;
}
start(3361, {}); // the local test database
start(3362, { MONGODB_URI: "not-a-connection-string" });
start(3363, { MONGODB_DB: "" });
start(3364, { MONGODB_URI: "mongodb+srv://zz-no-such-cluster.invalid/" });
start(3365, { MONGODB_URI: "mongodb://127.0.0.1:27999" }); // nothing listens there
start(3366, { CMS_DEBUG: "0" }); // the temporary [CMS_DEBUG] lines switched off

const http = async (port, p, { method = "GET", body, cookie } = {}) => {
  const h = {};
  if (cookie) h.Cookie = cookie;
  if (method !== "GET") h.Origin = `http://127.0.0.1:${port}`;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(`http://127.0.0.1:${port}${p}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: res.status, data, text, headers: res.headers, setCookie: res.headers.getSetCookie?.() ?? [] };
};
const lines = (port, re) => logs[port].split(/\r?\n/).filter((l) => re.test(l));
const field = (line, name) => line?.match(new RegExp(`\\b${name}=([^\\s]+)`))?.[1];

const { MongoClient } = require("mongodb");
const client = new MongoClient(URI, { serverSelectionTimeoutMS: 5000 });
const stamp = Date.now().toString(36);
const BROKEN_ID = `post_zz_broken_${stamp}`;
const DRAFT_ID = `post_zz_draft_${stamp}`;
let db;

try {
  await client.connect();
  db = client.db(DB);
  for (const port of Object.keys(servers)) {
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(`http://127.0.0.1:${port}/admin-blog/api/health`);
        break;
      } catch {}
      await sleep(1000);
    }
  }

  console.log("\nThe local test database (connection, correct database and collections)");
  const health = await http(3361, "/admin-blog/api/health");
  check("health: database.ok, store mongodb, the public blog reads the CMS", health.status === 200 && health.data.database?.ok === true && health.data.store === "mongodb" && health.data.publicBlog === "cms", JSON.stringify(health.data.database));
  const connected = lines(3361, /\[CMS_DB\] connection_succeeded /);
  check("[CMS_DB] connection_started, then connection_succeeded with the database name and a duration", lines(3361, /\[CMS_DB\] connection_started /).length >= 1 && connected.length >= 1 && field(connected[0], "db") === DB && /^\d+$/.test(field(connected[0], "ms") ?? ""));
  check("one connection for many requests (it is reused, not opened per query)", (await Promise.all([1, 2, 3, 4].map(() => http(3361, "/admin-blog/api/health")))).every((h) => h.status === 200) && lines(3361, /\[CMS_DB\] connection_succeeded /).length === 1);

  const site = await db.collection("sites").findOne({ key: "customs-wise" });
  await db.collection("posts").insertOne({ _id: DRAFT_ID, siteId: site._id, slug: `zz-db-draft-${stamp}`, title: `ZZ db test draft ${stamp}`, summary: "", body: [], coverImage: null, categoryId: null, authorId: null, tags: [], seo: { title: "", description: "" }, canonicalOverride: "", status: "draft", publishAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await db.collection("posts").insertOne({ _id: BROKEN_ID, siteId: site._id, title: "ZZ broken record without a slug", status: "published", body: [] });
  const inDb = await db.collection("posts").countDocuments({});

  await http(3361, "/admin-blog/api/auth/link", { method: "POST", body: { action: "send" } });
  const token = (outbox.at(-1)?.text ?? "").match(/#([A-Za-z0-9_-]{43})/)?.[1];
  const signIn = await http(3361, "/admin-blog/api/auth/link", { method: "POST", body: { action: "verify", token } });
  const cookie = (signIn.setCookie.find((c) => c.startsWith("__Secure-cw_admin=")) ?? "").split(";")[0];
  check("signed in through the email link (fake provider)", signIn.status === 200 && !!cookie);
  const dash = await http(3361, "/admin-blog/sites/customs-wise/posts", { cookie });
  check("the articles screen loads (200) and lists the test draft from this database", dash.status === 200 && dash.text.includes(`ZZ db test draft ${stamp}`), `${dash.status}`);
  const rid = dash.headers.get("x-request-id");
  const done = lines(3361, new RegExp(`\\[CMS_DATA\\] dashboard_query_completed rid=${rid} `))[0];
  check("[CMS_DATA] dashboard_query_completed, under the page's request id, with a duration and counts only", !!done && /^\d+$/.test(field(done, "ms") ?? "") && !done.includes("ZZ db test draft"), done ?? "(no line)");
  check("the count of articles is what the database holds, minus the one broken record: the right database and collection", Number(field(done, "posts")) === inDb - 1 && field(done, "invalid_documents") === "1", `${field(done, "posts")} vs ${inDb} - 1`);
  check("the broken record: [CMS_DATA] invalid_documents collection=posts count=1 code=invalid-document", lines(3361, /\[CMS_DATA\] invalid_documents /).some((l) => /collection=posts/.test(l) && /count=1/.test(l) && /code=invalid-document/.test(l) && /db=blog_cms_local_test/.test(l)));
  check("…the screen still works, and the broken record is not shown", dash.status === 200 && !dash.text.includes("ZZ broken record"));
  const site2 = await http(3361, "/admin-blog/api/sites/customs-wise", { cookie });
  const saved = await http(3361, `/admin-blog/api/sites/customs-wise/posts/${DRAFT_ID}`, { method: "PUT", cookie, body: { title: `ZZ db test draft ${stamp} edited`, slug: `zz-db-draft-${stamp}`, summary: "A test article made by the database test; it is removed at the end.", body: [{ type: "h2", text: "Test" }, { type: "p", text: "A paragraph of test content, long enough to publish." }], coverImage: null, categoryId: site2.data.categories?.[0]?.id ?? null, authorId: site2.data.authors?.[0]?.id ?? null, tags: [], seo: { title: "", description: "" }, canonicalOverride: "", status: "draft", publishAt: null, hideDate: false, faq: [], sources: [], relatedLinks: [], lastReviewedAt: null, readMinutesOverride: null } });
  check("a save after that read works", site2.status === 200 && saved.status === 200, `${site2.status} ${saved.status} ${saved.data?.message ?? ""}`);
  check("…and never deletes or changes the broken record (existing data is preserved)", !!(await db.collection("posts").findOne({ _id: BROKEN_ID, title: "ZZ broken record without a slug" })) && (await db.collection("posts").findOne({ _id: DRAFT_ID }))?.title === `ZZ db test draft ${stamp} edited`);
  check("the draft stays private: not on /blog, and its address is a 404", !(await http(3361, "/blog")).text.includes(`zz-db-draft-${stamp}`) && (await http(3361, `/insights/blog/zz-db-draft-${stamp}`)).status === 404);
  check("editing a draft refreshes no public page (nothing public changed)", lines(3361, /\[CMS_CACHE\] public_pages_revalidated /).length === 0);
  const pub = await http(3361, `/admin-blog/api/sites/customs-wise/posts/${DRAFT_ID}/publish`, { method: "POST", cookie });
  const refreshed = lines(3361, /\[CMS_CACHE\] public_pages_revalidated /).at(-1);
  check("publishing it: [CMS_CACHE] public_pages_revalidated, naming /blog and the article's address", pub.status === 200 && /\/blog/.test(refreshed ?? "") && (refreshed ?? "").includes(`/insights/blog/zz-db-draft-${stamp}`), refreshed ?? `${pub.status} ${pub.data?.message ?? ""}`);
  check("…and the article is public at once (no rebuild)", (await http(3361, `/insights/blog/zz-db-draft-${stamp}`)).status === 200);
  const unpub = await http(3361, `/admin-blog/api/sites/customs-wise/posts/${DRAFT_ID}/unpublish`, { method: "POST", cookie });
  check("unpublishing it: private again (404) and the pages are refreshed again", unpub.status === 200 && (await http(3361, `/insights/blog/zz-db-draft-${stamp}`)).status === 404 && lines(3361, /\[CMS_CACHE\] public_pages_revalidated /).length >= 2);

  console.log("\n[CMS_DEBUG]: one login, from the sign-in page to the dashboard's queries");
  const debug = (port) =>
    logs[port]
      .split(/\r?\n/)
      .filter((l) => l.startsWith("[CMS_DEBUG] "))
      .map((l) => {
        const space = l.indexOf(" ", 12);
        try {
          return { name: l.slice(12, space), data: JSON.parse(l.slice(space + 1)), raw: l };
        } catch {
          return { name: l.slice(12, space), data: null, raw: l };
        }
      });
  check("every [CMS_DEBUG] line is one JSON object with a UTC time, the event, rid, attempt and outcome", debug(3361).length > 0 && debug(3361).every((d) => d.data && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(d.data.ts) && d.data.event === d.name && "rid" in d.data && "attempt" in d.data && typeof d.data.outcome === "string"), debug(3361).find((d) => !d.data)?.raw ?? "");
  const loginAttempt = debug(3361).find((d) => d.name === "session_created")?.data.attempt;
  const ofAttempt = debug(3361).filter((d) => d.data?.attempt === loginAttempt).map((d) => d.name);
  const FLOW = ["email_provider_request_started", "email_provider_response", "token_validation_completed", "session_created", "session_cookie_set", "dashboard_redirect", "session_validation_completed", "dashboard_route_requested", "dashboard_load_started", "database_query_started", "database_query_completed", "dashboard_load_completed"];
  check(`one attempt id from the email to the dashboard's queries: ${FLOW.join(" → ")}`, !!loginAttempt && FLOW.every((e) => ofAttempt.includes(e)) && ofAttempt.indexOf("email_provider_response") < ofAttempt.indexOf("session_created") && ofAttempt.indexOf("session_created") < ofAttempt.indexOf("dashboard_load_completed"), ofAttempt.join(","));
  check("signin_request_received and magic_link_callback_started (requests before the attempt exists) are logged too", debug(3361).some((d) => d.name === "signin_request_received") && debug(3361).some((d) => d.name === "magic_link_callback_started"));
  check("token_validation_started says whether a token was sent (true/false only)", debug(3361).some((d) => d.name === "token_validation_started" && d.data.token_present === true));
  const queries = debug(3361).filter((d) => d.name === "database_query_completed" && d.data.attempt === loginAttempt);
  check("one database_query_completed per collection (sites, categories, authors, posts, media) with operation, count and ms", ["sites", "categories", "authors", "posts", "media"].every((c) => queries.some((q) => q.data.collection === c && q.data.operation === "find" && Number.isInteger(q.data.count) && Number.isInteger(q.data.ms))), queries.map((q) => q.data.collection).join(","));
  const conn = debug(3361).find((d) => d.name === "mongodb_connection_started")?.data ?? {};
  check("mongodb_connection_started: connection string set, scheme, cluster label, the database selected and configured, and whether it is blog_cms", conn.connection_string_set === true && conn.scheme === "mongodb" && conn.cluster_label === "127.0.0.1" && conn.db_selected === DB && conn.db_configured === DB && conn.matches_expected === false && conn.path_db === "none", JSON.stringify(conn));
  check("dashboard_route_requested says the session cookie was present", debug(3361).some((d) => d.name === "dashboard_route_requested" && d.data.cookie_present === true && d.data.attempt === loginAttempt));
  check("login_page_loaded gives the route and whether the public addresses are set", (await http(3361, "/admin-blog")).status === 200 && debug(3361).some((d) => d.name === "login_page_loaded" && d.data.route === "/admin-blog" && typeof d.data.site_address_set === "boolean"));
  check("the link's page logs that it opened, and that the token is not in the request", (await http(3361, "/admin-blog/auth")).status === 200 && debug(3361).some((d) => d.name === "magic_link_page_opened" && d.data.token_in_request === false));
  const noCookie = await http(3361, "/admin-blog/dashboard");
  check("no session cookie: 307 to the sign-in page, logged by the proxy as login_redirect with the reason", noCookie.status === 307 && lines(3361, /\[CMS_ROUTE\] login_redirect /).some((l) => /code=no_session_cookie/.test(l) && /path=\/admin-blog\/dashboard/.test(l)) && debug(3361).some((d) => d.name === "login_redirect" && d.data.reason === "no_session_cookie"));
  const hDb = await http(3361, "/admin-blog/api/health");
  check("health: database.connectionString and databaseIsBlogCms (statuses, not values)", hDb.data.database?.connectionString === "mongodb" && hDb.data.database?.databaseIsBlogCms === false && !hDb.text.includes("127.0.0.1") && !hDb.text.includes(DB));
  check("no [CMS_DEBUG] line holds a token, a sign-in link, the full admin address, a session token or a connection string", debug(3361).every((d) => !/[A-Za-z0-9_-]{43}/.test(d.raw) && !/#[A-Za-z0-9_-]{20,}/.test(d.raw) && !d.raw.includes(ADMIN) && !/mongodb:\/\//.test(d.raw)));
  await http(3366, "/admin-blog");
  check("CMS_DEBUG=0: no [CMS_DEBUG] lines, the ordinary log lines remain", debug(3366).length === 0 && lines(3366, /\[CMS_AUTH\] login_page_loaded /).length === 1);

  console.log("\nSettings and connections that fail (the first failure is logged, with its category)");
  const failing = [
    [3362, "not-configured", "MONGODB_URI is set but is not a MongoDB connection string"],
    [3363, "not-configured", "MONGODB_DB is not set"],
    [3364, "dns", null],
    [3365, "network", null],
  ];
  for (const [port, kind, says] of failing) {
    const h = await http(port, "/admin-blog/api/health");
    const failed = lines(port, /\[CMS_DB\] connection_failed /);
    check(`port ${port}: health 503 database.kind=${kind}, and [CMS_DB] connection_failed code=${kind}${says ? ` saying "${says}"` : ""}`, h.status === 503 && h.data.database?.kind === kind && failed.some((l) => field(l, "code") === kind && (!says || l.includes(says))), `${h.status} ${JSON.stringify(h.data.database)} | ${failed.map((l) => field(l, "code")).join(",")}`);
  }
  check("failed connections are in [CMS_DEBUG] too, as mongodb_connection_failed with the category", debug(3364).some((d) => d.name === "mongodb_connection_failed" && d.data.code === "dns") && debug(3365).some((d) => d.name === "mongodb_connection_failed" && d.data.code === "network"));
  check("not-configured names the missing setting", lines(3363, /\[CMS_DB\] connection_failed /).some((l) => field(l, "missing") === "MONGODB_DB"));
  // The server log may name the cluster (its first label, cluster_label=zz-no-such-cluster); never the full host.
  check("no log line contains a connection string or a full host name, and the health answer not even the cluster's name", Object.values(logs).every((l) => !/mongodb(\+srv)?:\/\/(?!\[)/.test(l) && !l.includes("zz-no-such-cluster.invalid"))
    && !(await http(3364, "/admin-blog/api/health")).text.includes("zz-no-such-cluster"), Object.entries(logs).flatMap(([port, l]) => l.split(/\r?\n/).filter((x) => /mongodb(\+srv)?:\/\/(?!\[)|zz-no-such-cluster\.invalid/.test(x)).map((x) => `${port}: ${x.replace(/mongodb(\+srv)?:\/\/\S*/g, "mongodb://…").slice(0, 160)}`)).slice(0, 3).join(" || "));
  check("database down: the public blog still answers, and a CMS article address is a server error, not a 404", (await http(3365, "/blog")).status === 200 && (await http(3365, "/insights/blog/zz-only-in-the-cms")).status === 500);
} finally {
  await db?.collection("posts").deleteMany({ _id: { $in: [BROKEN_ID, DRAFT_ID] } }).catch(() => undefined);
  await client.close().catch(() => undefined);
  provider.close();
  for (const s of Object.values(servers)) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(s.pid), "/T", "/F"]);
    else s.kill();
  }
  rmSync(serverDir, { recursive: true, force: true });
  finish(`(test records removed: ${BROKEN_ID}, ${DRAFT_ID})`);
}
