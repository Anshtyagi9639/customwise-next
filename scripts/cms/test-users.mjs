// Users screen, invitation links and password-reset links for /admin-blog, against a running website (CMS_TEST_URL,
// default http://127.0.0.1:3100) and the database it uses (MONGODB_URI / MONGODB_DB). Creates temporary accounts on the
// reserved domain example.invalid and removes them, with their sessions, links and sign-in locks.
//   npm run cms:test:users
import { createHash, randomBytes } from "node:crypto";
import { BASE, asUser, check, createTestUser, emailThrottleId, finish, openDb, randomPassword, removeTestUsers, request, signIn } from "./lib/test-kit.mjs";

const { client, db } = await openDb();
const health = await request("/admin-blog/api/health").catch(() => null);
if (!health?.ok) {
  console.error(`The website is not reachable at ${BASE}, or the CMS database cannot be read.`);
  process.exit(1);
}
const isAtlas = await client.db("admin").command({ atlasVersion: 1 }).then(() => true, () => false);
console.log(`Website: ${BASE}  |  database: ${isAtlas ? "MongoDB Atlas" : "NOT Atlas (local test database)"}\n`);

// A made-up client address for this run, so its failed-link lock never affects anyone else, and is removed at the end.
const testIp = `10.${[1, 2, 3].map(() => Math.floor(Math.random() * 250)).join(".")}`;
const headers = { "X-Forwarded-For": testIp };
const setup = (body, extra = {}) => request("/admin-blog/api/auth/setup", { method: "POST", body, headers, ...extra });
const login = (email, password) => signIn(email, password, { headers });
const sha = (t) => createHash("sha256").update(t).digest("hex");
const invitedIds = [];
const invitedEmails = [];
const newEmail = (tag) => `zz-test-${tag}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}@example.invalid`;
const isSignInRedirect = (r) => [307, 308].includes(r.status) && new URL(r.headers.get("location") ?? "", BASE).pathname === "/admin-blog";

try {
  const siteKey = (await db.collection("sites").findOne({ key: "customs-wise" }, { projection: { key: 1 } }))?.key;
  if (!siteKey) throw new Error("The test database has no websites.");
  const admin = await createTestUser(db, { role: "admin" });
  const editor = await createTestUser(db, { role: "editor", siteKeys: [siteKey] });
  const asAdmin = asUser((await login(admin.email, admin.password)).cookie);
  const asEditor = asUser((await login(editor.email, editor.password)).cookie);

  console.log("Who can manage accounts");
  check("/admin-blog/users without signing in redirects to sign-in", isSignInRedirect(await request("/admin-blog/users")));
  check("an editor gets 404 for the Users screen", (await asEditor("/admin-blog/users")).status === 404);
  const screen = await asAdmin("/admin-blog/users");
  check("an administrator sees the Users screen with the invite form", screen.status === 200 && /Invite someone/.test(screen.text) && screen.text.includes(admin.email));
  check("the Users link is in the header for administrators only", /href="\/admin-blog\/users"/.test((await asAdmin("/admin-blog/dashboard")).text) && !/href="\/admin-blog\/users"/.test((await asEditor("/admin-blog/dashboard")).text));
  check("GET /admin-blog/api/users: 401 without a session, 403 for an editor", (await request("/admin-blog/api/users")).status === 401 && (await asEditor("/admin-blog/api/users")).status === 403);
  const list = await asAdmin("/admin-blog/api/users");
  check("an administrator gets the account list, with no password hashes", list.status === 200 && Array.isArray(list.data.accounts) && !/passwordHash|scrypt\$/.test(list.text));
  check("an editor cannot invite anyone", (await asEditor("/admin-blog/api/users", "POST", { action: "invite", email: newEmail("x"), role: "admin" })).status === 403);
  check("an invitation sent from another website is refused", (await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: newEmail("x"), role: "admin" }, { origin: "https://evil.example" })).status === 403);
  check("there is no public sign-up address", (await request("/admin-blog/api/auth/register", { method: "POST", body: {} })).status === 401 && (await asAdmin("/admin-blog/api/auth/register", "POST", {})).status === 404);

  console.log("\nInviting someone");
  check("a wrong email address is refused", (await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: "not-an-email", role: "admin" })).status === 400);
  check("an editor without a website is refused", (await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: newEmail("x"), role: "editor", siteKeys: [] })).status === 400);
  check("an unknown website is refused", (await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: newEmail("x"), role: "editor", siteKeys: ["no-such-site"] })).status === 400);
  check("an email address that already has an account is refused", (await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: editor.email.toUpperCase(), role: "editor", siteKeys: [siteKey] })).status === 409);
  const inviteeEmail = newEmail("invitee");
  invitedEmails.push(inviteeEmail);
  const invite = await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: inviteeEmail, name: "Invited Tester", role: "editor", siteKeys: [siteKey] });
  const doc = await db.collection("admin_users").findOne({ email: inviteeEmail });
  if (doc) invitedIds.push(doc._id);
  check("an invitation creates an invited account and returns a one-time link once", invite.status === 201 && typeof invite.data.token === "string" && invite.data.token.length === 43 && doc?.status === "invited" && doc?.passwordHash === "");
  const inviteToken = invite.data.token;
  const stored = await db.collection("admin_setup_tokens").find({ userId: doc?._id }).toArray();
  check("the database keeps only a hash of the link", stored.length === 1 && stored[0]._id === sha(inviteToken) && !JSON.stringify(stored).includes(inviteToken));
  const hours = (new Date(invite.data.expiresAt).getTime() - Date.now()) / 3600000;
  check("an invitation link lasts 72 hours", hours > 71.9 && hours <= 72);
  check("the invitation is recorded in the audit log", !!(await db.collection("audit").findOne({ action: "auth.user_invite", targetId: doc?._id, actor: admin.email })));
  check("the list shows the open invitation, not the link", (await asAdmin("/admin-blog/api/users")).data.accounts?.find((a) => a.email === inviteeEmail)?.pendingLink?.purpose === "invite" && !(await asAdmin("/admin-blog/api/users")).text.includes(inviteToken));
  const pending = await login(inviteeEmail, "");
  const pending2 = await login(inviteeEmail, randomPassword());
  check("an invited account cannot sign in before choosing a password", pending.status !== 200 && pending2.status === 401 && !pending.cookie && !pending2.cookie);

  console.log("\nUsing the link");
  const page = await request("/admin-blog/setup");
  check("/admin-blog/setup opens without a session (not redirected)", page.status === 200 && /Set your password/.test(page.text));
  check("the page is not indexed or cached", /noindex/.test(page.headers.get("x-robots-tag") ?? "") && /no-store/.test(page.headers.get("cache-control") ?? ""));
  check("a made-up link is refused", (await setup({ action: "check", token: randomBytes(32).toString("base64url") })).status === 400);
  check("a malformed link is refused", (await setup({ action: "check", token: "../../x" })).status === 400);
  const details = await setup({ action: "check", token: inviteToken });
  check("a valid link shows only the account's email and purpose", details.status === 200 && details.data.email === inviteeEmail && details.data.purpose === "invite" && Object.keys(details.data).sort().join() === "email,expiresAt,purpose");
  check("setting a password from another website is refused", (await setup({ action: "complete", token: inviteToken, password: randomPassword() }, { origin: "https://evil.example" })).status === 403);
  const weak = await setup({ action: "complete", token: inviteToken, password: "short" });
  check("a weak password is refused with a reason, and the link still works", weak.status === 400 && !!weak.data.fieldErrors?.password && (await setup({ action: "check", token: inviteToken })).status === 200);
  const first = randomPassword();
  const done = await setup({ action: "complete", token: inviteToken, password: first });
  check("the invited person sets their password", done.status === 200);
  check("the link works only once", (await setup({ action: "complete", token: inviteToken, password: randomPassword() })).status === 400 && (await setup({ action: "check", token: inviteToken })).status === 400);
  check("the account is now active and the link is gone", (await db.collection("admin_users").findOne({ _id: doc?._id }))?.status === "active" && (await db.collection("admin_setup_tokens").countDocuments({ userId: doc?._id })) === 0);
  check("acceptance is recorded in the audit log", !!(await db.collection("audit").findOne({ action: "auth.invite_accepted", targetId: doc?._id })));
  const inviteeLogin = await login(inviteeEmail, first);
  check("the new account can sign in", inviteeLogin.status === 200 && !!inviteeLogin.cookie);
  const asInvitee = asUser(inviteeLogin.cookie);
  check("as an editor, it cannot open Users", (await asInvitee("/admin-blog/api/users")).status === 403 && (await asInvitee("/admin-blog/users")).status === 404);
  check("it can use the website it was given", (await asInvitee(`/admin-blog/api/sites/${siteKey}/posts`)).status === 200);

  console.log("\nForgotten password: a reset link from an administrator");
  const reset = await asAdmin("/admin-blog/api/users", "POST", { action: "reset-link", userId: doc?._id });
  const resetHours = (new Date(reset.data.expiresAt).getTime() - Date.now()) / 3600000;
  check("an administrator gets a reset link that lasts 24 hours", reset.status === 200 && reset.data.purpose === "reset" && resetHours > 23.9 && resetHours <= 24);
  const newer = await asAdmin("/admin-blog/api/users", "POST", { action: "reset-link", userId: doc?._id });
  check("a newer link replaces the older one", (await setup({ action: "check", token: reset.data.token })).status === 400 && (await setup({ action: "check", token: newer.data.token })).status === 200);
  check("an editor cannot create reset links", (await asInvitee("/admin-blog/api/users", "POST", { action: "reset-link", userId: editor.id })).status === 403);
  const second = randomPassword();
  check("the person sets a new password with the link", (await setup({ action: "complete", token: newer.data.token, password: second })).status === 200);
  check("this signs out every existing session", (await asInvitee(`/admin-blog/api/sites/${siteKey}/posts`)).status === 401);
  check("the old password no longer works, the new one does", (await login(inviteeEmail, first)).status === 401 && (await login(inviteeEmail, second)).status === 200);
  const expiring = await asAdmin("/admin-blog/api/users", "POST", { action: "reset-link", userId: doc?._id });
  await db.collection("admin_setup_tokens").updateOne({ _id: sha(expiring.data.token) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  check("an expired link is refused", (await setup({ action: "check", token: expiring.data.token })).status === 400 && (await setup({ action: "complete", token: expiring.data.token, password: randomPassword() })).status === 400);

  console.log("\nDisable, enable, sign out, withdraw");
  const session = await login(inviteeEmail, second);
  const off = await asAdmin("/admin-blog/api/users", "POST", { action: "disable", userId: doc?._id });
  check("disabling signs the person out", off.status === 200 && off.data.signedOut >= 1 && (await asUser(session.cookie)(`/admin-blog/api/sites/${siteKey}/posts`)).status === 401);
  check("a disabled account cannot sign in", (await login(inviteeEmail, second)).status === 401);
  check("no reset link for a disabled account", (await asAdmin("/admin-blog/api/users", "POST", { action: "reset-link", userId: doc?._id })).status === 409);
  check("enabling lets it sign in again", (await asAdmin("/admin-blog/api/users", "POST", { action: "enable", userId: doc?._id })).status === 200 && (await login(inviteeEmail, second)).status === 200);
  const out = await asAdmin("/admin-blog/api/users", "POST", { action: "sign-out", userId: doc?._id });
  check("Sign out ends the person's sessions", out.status === 200 && out.data.signedOut >= 1 && (await db.collection("admin_sessions").countDocuments({ userId: doc?._id })) === 0);
  const me = (await db.collection("admin_users").findOne({ email: admin.email }))._id;
  check("an administrator cannot disable their own account", (await asAdmin("/admin-blog/api/users", "POST", { action: "disable", userId: me })).status === 409);
  check("an administrator cannot reset their own password with a link (Account is for that)", (await asAdmin("/admin-blog/api/users", "POST", { action: "reset-link", userId: me })).status === 409);
  // Disabling needs a signed-in active administrator who is not the target, so the website itself can never leave no
  // active administrator; the account tool (scripts/cms/admin-users.mjs) refuses it as well.
  const ghostEmail = newEmail("withdrawn");
  const ghost = await asAdmin("/admin-blog/api/users", "POST", { action: "invite", email: ghostEmail, role: "admin" });
  const ghostId = (await db.collection("admin_users").findOne({ email: ghostEmail }))?._id;
  if (ghostId) invitedIds.push(ghostId);
  check("an unused invitation can be withdrawn, and its link stops working", (await asAdmin("/admin-blog/api/users", "POST", { action: "withdraw", userId: ghostId })).status === 200 && !(await db.collection("admin_users").findOne({ _id: ghostId })) && (await setup({ action: "check", token: ghost.data.token })).status === 400);
  check("an account in use cannot be withdrawn (it is disabled instead)", (await asAdmin("/admin-blog/api/users", "POST", { action: "withdraw", userId: doc?._id })).status === 409);

  console.log("\nSign-in page");
  const signInPage = await request("/admin-blog");
  check("'Forgotten your password?' says to ask an administrator for a reset link", /Forgotten your password\?/.test(signInPage.text) && /password-reset link/.test(signInPage.text) && /admin-users\.mjs set-password/.test(signInPage.text));
  check("there is no sign-up link", !/sign up|register|create an account/i.test(signInPage.text));
} finally {
  const ids = invitedIds;
  await db.collection("admin_setup_tokens").deleteMany({ userId: { $in: ids } }).catch(() => undefined);
  await db.collection("admin_sessions").deleteMany({ userId: { $in: ids } }).catch(() => undefined);
  await db.collection("admin_users").deleteMany({ _id: { $in: ids } }).catch(() => undefined);
  const removed = await removeTestUsers(db, [`ip:${testIp}`, ...invitedEmails.map(emailThrottleId)]);
  await db.collection("admin_setup_tokens").deleteMany({ createdBy: /@example\.invalid$/ }).catch(() => undefined);
  await client.close();
  finish(`(temporary accounts removed: ${removed.users + ids.length})`);
}
