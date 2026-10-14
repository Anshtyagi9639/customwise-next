// Sign-in and access-control tests for /admin-blog, against a running website (CMS_TEST_URL, default
// http://127.0.0.1:3100) and the database it uses (MONGODB_URI / MONGODB_DB). Creates temporary accounts and removes them.
//   npm run cms:test:auth
import { randomBytes } from "node:crypto";
import { BASE, SESSION_COOKIE, asUser, check, createTestUser, emailThrottleId, finish, openDb, randomPassword, removeTestUsers, request, signIn } from "./lib/test-kit.mjs";

const { client, db } = await openDb();
const health = await request("/admin-blog/api/health").catch(() => null);
if (!health?.ok) {
  console.error(`The website is not reachable at ${BASE}, or the CMS database cannot be read.`);
  process.exit(1);
}
const isAtlas = await client.db("admin").command({ atlasVersion: 1 }).then(() => true, () => false);
console.log(`Website: ${BASE}  |  database: ${isAtlas ? "MongoDB Atlas" : "NOT Atlas (local test database)"}  |  images: ${health.data.images}  |  blog source: ${health.data.blogSource}\n`);
const extraLocks = [];

try {
  const admin = await createTestUser(db, { role: "admin" });
  const editor = await createTestUser(db, { role: "editor", siteKeys: ["demo-website"] });
  const disabled = await createTestUser(db, { role: "admin", status: "disabled" });
  const unknown = `zz-nobody-${randomBytes(4).toString("hex")}@example.invalid`;
  extraLocks.push(emailThrottleId(unknown));

  console.log("Sign-in page");
  const page = await request("/admin-blog");
  check("/admin-blog shows the sign-in page", page.status === 200 && /id="login-email"/.test(page.text) && /id="login-password"/.test(page.text) && /type="submit"/.test(page.text));
  check("it has a show/hide password control", /data-testid="toggle-password"/.test(page.text) && /aria-label="Show password"/.test(page.text));
  check("it explains how to recover a forgotten password", /Forgotten your password\?/.test(page.text));
  check("it is not indexed and not cached", (page.headers.get("x-robots-tag") ?? "").includes("noindex") && /no-store/.test(page.headers.get("cache-control") ?? "") && /noindex/.test(page.text));
  check("it cannot be framed by another website", page.headers.get("x-frame-options") === "SAMEORIGIN" && /frame-ancestors 'self'/.test(page.headers.get("content-security-policy") ?? ""));
  check("the website's navigation, footer and chat are not on it", !/aria-label="Main"/.test(page.text) && !/<footer/.test(page.text));
  check("analytics does not record it", page.text.includes("if (!location.pathname.startsWith('/admin-blog')) gtag('config'"));

  console.log("\nWithout signing in");
  for (const path of ["/admin-blog/dashboard", "/admin-blog/account", "/admin-blog/sites/customs-wise", "/admin-blog/sites/customs-wise/posts/new", "/admin-blog/preview/customs-wise/anything"]) {
    const r = await request(path);
    check(`${path} redirects to sign-in`, [307, 308].includes(r.status) && new URL(r.headers.get("location") ?? "", BASE).pathname === "/admin-blog", `${r.status} ${r.headers.get("location")}`);
  }
  const forged = `${SESSION_COOKIE}=${randomBytes(32).toString("base64url")}`;
  for (const path of ["/admin-blog/dashboard", "/admin-blog/sites/customs-wise/posts"]) {
    const r = await request(path, { cookie: forged });
    check(`${path} with a made-up session cookie redirects to sign-in (checked on the server, not only by the proxy)`, [307, 308].includes(r.status) && new URL(r.headers.get("location") ?? "", BASE).pathname === "/admin-blog", `${r.status}`);
  }
  const writes = [
    ["POST", "/admin-blog/api/sites/customs-wise/posts", { title: "x", slug: "x" }],
    ["PUT", "/admin-blog/api/sites/customs-wise/posts/any", { title: "x" }],
    ["DELETE", "/admin-blog/api/sites/customs-wise/posts/any"],
    ["POST", "/admin-blog/api/sites/customs-wise/posts/any/publish"],
    ["POST", "/admin-blog/api/sites/customs-wise/media", new FormData()],
    ["POST", "/admin-blog/api/sites/customs-wise/categories", { label: "x" }],
    ["POST", "/admin-blog/api/authors", { name: "x" }],
    ["PUT", "/admin-blog/api/sites/customs-wise", { name: "x" }],
    ["GET", "/admin-blog/api/sites/customs-wise/posts"],
    ["POST", "/admin-blog/api/auth/password", { currentPassword: "x", newPassword: "y" }],
  ];
  for (const [method, path, body] of writes) {
    const none = await request(path, { method, body });
    const fake = await request(path, { method, body, cookie: forged });
    check(`${method} ${path} without a session: 401 (no cookie and made-up cookie)`, none.status === 401 && fake.status === 401, `${none.status}/${fake.status}`);
  }

  console.log("\nSigning in");
  const wrong = await signIn(admin.email, "not-the-password");
  const nobody = await signIn(unknown, "not-the-password");
  const off = await signIn(disabled.email, disabled.password);
  check("a wrong password is refused", wrong.status === 401 && !wrong.cookie);
  check("an unknown email address gets exactly the same answer", nobody.status === 401 && nobody.data.message === wrong.data.message && !nobody.cookie, `${nobody.data.message} | ${wrong.data.message}`);
  check("a disabled account gets exactly the same answer", off.status === 401 && off.data.message === wrong.data.message && !off.cookie);
  const t0 = Date.now();
  await signIn(unknown, "x");
  const tUnknown = Date.now() - t0;
  const t1 = Date.now();
  await signIn(editor.email, "x");
  const tWrong = Date.now() - t1;
  check("an unknown email address takes about as long as a wrong password (the password check runs anyway)", tUnknown > 0.4 * tWrong, `unknown ${tUnknown} ms, wrong password ${tWrong} ms`);
  check("missing fields are refused with a clear message", (await signIn("", "")).status === 400);
  check("a sign-in sent from another website is refused", (await signIn(admin.email, admin.password, { origin: "https://evil.example" })).status === 403);
  check("a sign-in with no Origin at all is refused", (await signIn(admin.email, admin.password, { origin: null })).status === 403);

  const good = await signIn(admin.email, admin.password);
  check("the right email and password are accepted", good.status === 200 && Boolean(good.cookie), `${good.status} ${good.data.message ?? ""}`);
  check("the answer sends the browser to the dashboard", good.data.redirect === "/admin-blog/dashboard");
  const attrs = good.rawCookie.toLowerCase();
  check("the session cookie is HttpOnly, Secure, SameSite=Strict and limited to /admin-blog", attrs.includes("httponly") && attrs.includes("secure") && attrs.includes("samesite=strict") && attrs.includes("path=/admin-blog"), good.rawCookie.replace(/=([^;]{6})[^;]*/, "=$1…"));
  check("no password or hash is ever in the answer", !/password|scrypt\$/i.test(JSON.stringify(good.data)));
  const stored = await db.collection("admin_users").findOne({ _id: admin.id });
  check("the database holds only a scrypt hash, never the password", stored.passwordHash.startsWith("scrypt$131072$8$1$") && !stored.passwordHash.includes(admin.password));
  const sessionDoc = await db.collection("admin_sessions").findOne({ userId: admin.id });
  check("the database holds only a hash of the session token", sessionDoc && /^[a-f0-9]{64}$/.test(sessionDoc._id) && !good.cookie.includes(sessionDoc._id));

  const as = asUser(good.cookie);
  const dash = await as("/admin-blog/dashboard");
  check("signed in, the dashboard opens", dash.status === 200 && dash.text.includes(admin.email) && dash.text.includes("Dashboard"));
  const again = await as("/admin-blog");
  check("signed in, /admin-blog goes straight to the dashboard", [307, 308].includes(again.status) && (again.headers.get("location") ?? "").endsWith("/admin-blog/dashboard"));
  check("signed in, the site screens open", (await as("/admin-blog/sites/customs-wise")).status === 200 && (await as("/admin-blog/sites/customs-wise/posts/new")).status === 200);

  console.log("\nCross-site request forgery");
  const csrfBody = { title: "ZZ forged", slug: `zz-forged-${Date.now().toString(36)}`, summary: "", body: [], coverImage: null, categoryId: null, authorId: null, tags: [], seo: { title: "", description: "" }, canonicalOverride: "", status: "draft", publishAt: null, hideDate: false, faq: [], sources: [], relatedLinks: [], lastReviewedAt: null, readMinutesOverride: null };
  const evil = await as("/admin-blog/api/sites/customs-wise/posts", "POST", csrfBody, { origin: "https://evil.example" });
  const noOrigin = await as("/admin-blog/api/sites/customs-wise/posts", "POST", csrfBody, { origin: null });
  check("a change sent from another website is refused, even with a valid session", evil.status === 403);
  check("a change with no Origin header is refused", noOrigin.status === 403);
  check("nothing was created by those attempts", (await db.collection("posts").countDocuments({ slug: csrfBody.slug })) === 0);

  console.log("\nEditor limited to one website");
  const ed = await signIn(editor.email, editor.password);
  const asEd = asUser(ed.cookie);
  check("the editor can open their website", ed.status === 200 && (await asEd("/admin-blog/sites/demo-website")).status === 200);
  check("the editor cannot open another website's screens", (await asEd("/admin-blog/sites/customs-wise")).status === 404);
  check("the editor cannot use another website's API", (await asEd("/admin-blog/api/sites/customs-wise/posts")).status === 403 && (await asEd("/admin-blog/api/sites/customs-wise/posts", "POST", csrfBody)).status === 403);
  check("the editor cannot change authors or website settings", (await asEd("/admin-blog/api/authors", "POST", { name: "x" })).status === 403 && (await asEd("/admin-blog/api/sites/demo-website", "PUT", { name: "x" })).status === 403);
  check("the editor's dashboard lists only their website", (await asEd("/admin-blog/dashboard")).text.includes("Demo Website") && !(await asEd("/admin-blog/dashboard")).text.includes('data-testid="site-customs-wise"'));

  console.log("\nSessions ending");
  await db.collection("admin_sessions").updateOne({ userId: editor.id }, { $set: { idleExpiresAt: new Date(Date.now() - 1000) } });
  check("a session idle for more than 2 hours is no longer accepted", (await asEd("/admin-blog/api/sites/demo-website/posts")).status === 401);
  const ed2 = await signIn(editor.email, editor.password);
  await db.collection("admin_sessions").updateMany({ userId: editor.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  check("a session older than 12 hours is no longer accepted", (await asUser(ed2.cookie)("/admin-blog/api/sites/demo-website/posts")).status === 401);
  const ed3 = await signIn(editor.email, editor.password);
  await db.collection("admin_users").updateOne({ _id: editor.id }, { $set: { status: "disabled" } });
  check("disabling an account ends its sessions at once", (await asUser(ed3.cookie)("/admin-blog/api/sites/demo-website/posts")).status === 401);

  const second = await signIn(admin.email, admin.password);
  const out = await as("/admin-blog/api/auth/logout", "POST");
  check("signing out clears the cookie", out.status === 200 && out.setCookies.some((c) => c.startsWith(`${SESSION_COOKIE}=;`) || /max-age=0/i.test(c)));
  check("after signing out, the old cookie no longer works", (await as("/admin-blog/api/sites/customs-wise/posts")).status === 401 && [307, 308].includes((await as("/admin-blog/dashboard")).status));
  check("signing out in one browser leaves other sessions alone", (await asUser(second.cookie)("/admin-blog/api/sites/customs-wise/posts")).status === 200);

  console.log("\nChanging the password");
  const third = await signIn(admin.email, admin.password);
  const as2 = asUser(second.cookie);
  check("a wrong current password is refused", (await as2("/admin-blog/api/auth/password", "POST", { currentPassword: "wrong", newPassword: randomPassword() })).status === 400);
  check("a too-short new password is refused", (await as2("/admin-blog/api/auth/password", "POST", { currentPassword: admin.password, newPassword: "short" })).data.fieldErrors?.newPassword !== undefined);
  const newPw = randomPassword();
  const changed = await as2("/admin-blog/api/auth/password", "POST", { currentPassword: admin.password, newPassword: newPw });
  const fresh = changed.setCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`))?.split(";")[0];
  check("the password is changed", changed.status === 200 && Boolean(fresh), `${changed.status} ${changed.data.message ?? ""}`);
  check("other sessions are signed out", (await asUser(third.cookie)("/admin-blog/api/sites/customs-wise/posts")).status === 401);
  check("the browser that changed it stays signed in", (await asUser(fresh)("/admin-blog/api/sites/customs-wise/posts")).status === 200);
  check("the old password no longer works and the new one does", (await signIn(admin.email, admin.password)).status === 401 && (await signIn(admin.email, newPw)).status === 200);

  console.log("\nBrute force");
  const target = await createTestUser(db, { role: "admin" });
  for (let i = 0; i < 5; i++) await signIn(target.email, `wrong-${i}`);
  const locked = await signIn(target.email, target.password);
  check("after 5 wrong passwords the account is locked, even for the right password", locked.status === 429 && !locked.cookie && Boolean(locked.headers.get("retry-after")), `${locked.status}`);
  check("the lock message does not say whether the account exists", (await (async () => { for (let i = 0; i < 5; i++) await signIn(unknown, `wrong-${i}`); return (await signIn(unknown, "x")).status === 429; })()));
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 20}`;
  extraLocks.push(`ip:${ip}`);
  for (let i = 0; i < 20; i++) {
    const sprayed = `zz-spray-${i}-${randomBytes(2).toString("hex")}@example.invalid`;
    extraLocks.push(emailThrottleId(sprayed));
    await signIn(sprayed, "x", { headers: { "X-Forwarded-For": ip } });
  }
  check("after 20 failures from one IP address, that address is locked", (await signIn(target.email, target.password, { headers: { "X-Forwarded-For": ip } })).status === 429);
} catch (err) {
  check("test script error", false, err?.stack ?? err);
} finally {
  const spray = await db.collection("admin_login_throttle").deleteMany({ _id: { $in: extraLocks } }).catch(() => ({ deletedCount: 0 }));
  const removed = await removeTestUsers(db, extraLocks);
  console.log(`\nCleaned up: ${removed.users} test account(s), ${removed.sessions} session(s), ${removed.locks + spray.deletedCount} lock record(s).`);
  await client.close();
}
finish();
