// Blog admin accounts from the command line: create the first administrator, and recover access when no administrator
// can sign in. Run by someone with access to the database (MONGODB_URI and MONGODB_DB in .env.local). Once an
// administrator can sign in, other people are invited from the Users screen instead. Nothing secret is printed.
//
//   npm run cms:admin -- check                                       (which database this would change; changes nothing)
//   npm run cms:admin -- create --email you@example.com --name "Your Name"          (administrator: every website)
//   npm run cms:admin -- create --email ed@example.com --role editor --sites customs-wise
//   npm run cms:admin -- set-password --email you@example.com      (forgotten password; signs the account out everywhere)
//   npm run cms:admin -- list
//   npm run cms:admin -- disable --email ed@example.com             (also signs out)   |   enable --email ...
//   npm run cms:admin -- unlock --email you@example.com              (clear a lock after too many failed sign-ins)
//   npm run cms:admin -- sign-out --email you@example.com            (end every session of the account)
//
// The password is asked for twice and not shown. For automation only, it can be given in the environment variable
// CMS_ADMIN_PASSWORD instead (never on the command line, where it would be kept in the shell history).
//
// Every command that changes something first shows the database it is connected to (server address and database
// name, never the user name or password) and asks you to type the database name to continue. Without a terminal,
// give it as --confirm-db <name> instead. Other people are added from the Users screen, with an invitation link.
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { mongoFailure } from "./lib/mongo-failure.mjs";
import { askNewPassword, hashPassword } from "./lib/password-cli.mjs";

for (const file of [".env.local", ".env"]) if (existsSync(path.join(process.cwd(), file))) process.loadEnvFile(path.join(process.cwd(), file));

const [command, ...rest] = process.argv.slice(2);
const opt = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const stop = (message) => {
  console.error(message);
  process.exit(1);
};

const uri = process.env.MONGODB_URI?.trim() ?? "";
const dbName = process.env.MONGODB_DB?.trim() ?? "";
if (!/^mongodb(\+srv)?:\/\/\S+$/.test(uri) || !/^[A-Za-z0-9_-]{1,38}$/.test(dbName)) stop("MONGODB_URI and MONGODB_DB must be set (in .env.local, or the environment).");
/** The server part of the connection string only: no user name, no password, no options. */
const serverAddress = uri.replace(/^mongodb(\+srv)?:\/\//, "").split(/[/?]/)[0].split("@").pop();

/** Reads a line that may be shown (not a password). */
function visiblePrompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (line) => {
      process.stdin.pause();
      resolve(String(line).trim());
    });
  });
}

/** Before any change: shows where it will happen and needs the database name typed (or --confirm-db) to go on. */
async function confirmTarget() {
  const given = opt("confirm-db");
  if (given !== undefined) {
    if (given !== dbName) stop(`--confirm-db ${given} does not match the database this would change (${dbName}). Nothing was changed.`);
    return;
  }
  if (!process.stdin.isTTY) stop("This needs an interactive terminal to confirm the database (or give --confirm-db <name>). Nothing was changed.");
  if ((await visiblePrompt(`Type the database name (${dbName}) to continue: `)) !== dbName) stop("The name does not match. Nothing was changed.");
}

const newPassword = (email) => askNewPassword(email, stop);

if (!["check", "list", "create", "set-password", "disable", "enable", "unlock", "sign-out"].includes(command)) {
  stop("Commands: check, create, set-password, list, disable, enable, unlock, sign-out. See the top of scripts/cms/admin-users.mjs.");
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, appName: "customs-wise-cms-admin-tool" });
try {
  console.log(`Database: ${dbName} on ${serverAddress}${/^(127\.0\.0\.1|localhost)(:|$)/.test(serverAddress) ? " (this computer)" : ""}`);
  await client.connect();
  const db = client.db(dbName);
  const readOnly = command === "list" || command === "check";
  const users = db.collection("admin_users");
  if (!readOnly) await confirmTarget();
  await users.createIndex({ email: 1 }, { unique: true, name: "email_unique" });
  const sessions = db.collection("admin_sessions");
  const throttle = db.collection("admin_login_throttle");
  const setupLinks = db.collection("admin_setup_tokens");
  const log = (action, targetId, summary) => db.collection("audit").insertOne({ _id: `log_${randomBytes(9).toString("base64url")}`, at: new Date().toISOString(), siteId: null, actor: "admin-tool", action, targetId, summary });
  const email = opt("email")?.trim().toLowerCase();
  const needEmail = () => {
    if (!email || !/^[^\s@]+@[^\s@]+$/.test(email)) stop("Give the account's email address: --email name@example.com");
    return email;
  };
  const findUser = async () => (await users.findOne({ email: needEmail() })) ?? stop(`There is no account for ${email}.`);
  const emailThrottleId = (e) => `email:${createHash("sha256").update(e).digest("hex")}`;

  if (command === "create") {
    needEmail();
    if (await users.findOne({ email })) stop(`An account for ${email} already exists. Use set-password to change its password.`);
    const role = opt("role") ?? "admin";
    if (!["admin", "editor"].includes(role)) stop('--role must be "admin" or "editor".');
    const siteKeys = (opt("sites") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (role === "editor" && siteKeys.length === 0) stop("An editor needs at least one website: --sites customs-wise");
    const known = new Set((await db.collection("sites").find({}, { projection: { key: 1 } }).toArray()).map((s) => s.key));
    const unknown = siteKeys.filter((k) => !known.has(k));
    if (unknown.length) stop(`Unknown website(s): ${unknown.join(", ")}. Known: ${[...known].join(", ") || "none yet"}.`);
    const now = new Date();
    const id = `user_${randomBytes(9).toString("base64url")}`;
    const passwordHash = await hashPassword(await newPassword(email));
    await users.insertOne({ _id: id, email, name: opt("name") ?? "", role, siteKeys: role === "admin" ? [] : siteKeys, status: "active", passwordHash, passwordChangedAt: now, createdAt: now, updatedAt: now, lastLoginAt: null });
    await log("auth.user_create", id, `${email} (${role})`);
    console.log(`Account created: ${email} (${role === "admin" ? "administrator, every website" : `editor: ${siteKeys.join(", ")}`}). Sign in at /admin-blog.`);
  } else if (command === "set-password") {
    if ((process.env.ADMIN_EMAIL ?? "").trim().toLowerCase() === needEmail()) {
      stop(`${email} is the administrator from the server settings (ADMIN_EMAIL). Its password is ADMIN_PASSWORD_HASH: change it with npm run cms:admin-env.`);
    }
    const user = await findUser();
    const passwordHash = await hashPassword(await newPassword(email));
    const now = new Date();
    // An invited account becomes active, as if its owner had used the invitation link.
    await users.updateOne({ _id: user._id }, { $set: { passwordHash, passwordChangedAt: now, updatedAt: now, ...(user.status === "invited" ? { status: "active" } : {}) } });
    await setupLinks.deleteMany({ userId: user._id });
    const ended = (await sessions.deleteMany({ userId: user._id })).deletedCount;
    await throttle.deleteOne({ _id: emailThrottleId(email) });
    await log("auth.password_reset", user._id, `${email} (${ended} session(s) ended)`);
    console.log(`Password changed for ${email}. ${ended} session(s) signed out.`);
  } else if (command === "disable" || command === "enable") {
    const user = await findUser();
    if (command === "enable" && user.status === "invited") stop(`${email} has not set a password yet. Send a new invitation link from Users, or use set-password.`);
    if (command === "disable" && user.role === "admin" && user.status === "active" && (await users.countDocuments({ role: "admin", status: "active" })) <= 1) {
      stop(`${email} is the only active administrator, so it is not disabled. Create or enable another administrator first.`);
    }
    await users.updateOne({ _id: user._id }, { $set: { status: command === "disable" ? "disabled" : "active", updatedAt: new Date() } });
    if (command === "disable") await setupLinks.deleteMany({ userId: user._id });
    const ended = command === "disable" ? (await sessions.deleteMany({ userId: user._id })).deletedCount : 0;
    await log(`auth.user_${command}`, user._id, email);
    console.log(`${email} ${command === "disable" ? `disabled; ${ended} session(s) signed out` : "enabled"}.`);
  } else if (command === "unlock") {
    needEmail();
    const removed = (await throttle.deleteOne({ _id: emailThrottleId(email) })).deletedCount;
    console.log(removed ? `Sign-in lock cleared for ${email}.` : `${email} was not locked.`);
  } else if (command === "sign-out") {
    const user = await findUser();
    const ended = (await sessions.deleteMany({ userId: user._id })).deletedCount;
    await log("auth.sign_out_everywhere", user._id, email);
    console.log(`${ended} session(s) of ${email} signed out.`);
  } else if (command === "list") {
    const all = await users.find({}, { projection: { passwordHash: 0 } }).sort({ email: 1 }).toArray();
    if (all.length === 0) console.log("No accounts yet. Create the first one with: npm run cms:admin -- create --email you@example.com");
    for (const u of all) console.log(`${u.email.padEnd(36)} ${u.role.padEnd(7)} ${u.status.padEnd(9)} ${u.role === "admin" ? "all websites" : u.siteKeys.join(", ")}   last sign-in: ${u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().slice(0, 16).replace("T", " ") : "never"}`);
  } else if (command === "check") {
    const sites = await db.collection("sites").countDocuments();
    const admins = await users.countDocuments({ role: "admin", status: "active" });
    const all = await users.countDocuments();
    console.log(`Connected. Websites: ${sites}. Accounts: ${all}, of which active administrators: ${admins}. Nothing was changed.`);
    if (sites === 0) console.log("Warning: this database has no websites. If you expected the live blog data, check MONGODB_DB.");
    if (all === 0) console.log("No accounts yet: create the first administrator with the create command.");
  } else {
    stop("Commands: check, create, set-password, list, disable, enable, unlock, sign-out. See the top of scripts/cms/admin-users.mjs.");
  }
} catch (err) {
  const f = mongoFailure(err);
  stop(`Stopped (${f.kind}): ${f.advice}. [${f.summary}]`);
} finally {
  await client.close().catch(() => undefined);
}
