// Blog admin accounts: create the first administrator, reset a forgotten password, lock or unlock an account.
// Run by someone with access to the database (MONGODB_URI and MONGODB_DB in .env.local); there is no web page or API
// that creates accounts or resets passwords. Nothing secret is printed.
//
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
import { createHash, randomBytes, scrypt } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

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

/* Same format and parameters as cms/server/auth/password.ts */
const N = 2 ** 17;
const R = 8;
const P = 1;
function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFC"), salt, 64, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(`scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`))),
  );
}
function passwordProblem(password, email) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 200) return "Use at most 200 characters.";
  if (/^(.)\1+$/.test(password)) return "Do not use one character repeated.";
  const local = email.toLowerCase().split("@")[0];
  if (local.length >= 4 && password.toLowerCase().includes(local)) return "Do not include your email address in the password.";
  return null;
}

/** Reads a line without showing what is typed. */
function hiddenPrompt(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    if (!stdin.isTTY) stop("\nThis needs an interactive terminal to ask for the password (or set CMS_ADMIN_PASSWORD).");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") process.exit(130); // Ctrl+C
        if (c === "\u0008" || c === "\u007f") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

async function newPassword(email) {
  if (process.env.CMS_ADMIN_PASSWORD) {
    const problem = passwordProblem(process.env.CMS_ADMIN_PASSWORD, email);
    if (problem) stop(`The password in CMS_ADMIN_PASSWORD is not accepted: ${problem}`);
    return process.env.CMS_ADMIN_PASSWORD;
  }
  for (;;) {
    const first = await hiddenPrompt("New password (at least 12 characters, not shown): ");
    const problem = passwordProblem(first, email);
    if (problem) {
      console.log(problem);
      continue;
    }
    if ((await hiddenPrompt("Type it again: ")) === first) return first;
    console.log("The two passwords are not the same. Try again.");
  }
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, appName: "customs-wise-cms-admin-tool" });
try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("admin_users");
  await users.createIndex({ email: 1 }, { unique: true, name: "email_unique" });
  const sessions = db.collection("admin_sessions");
  const throttle = db.collection("admin_login_throttle");
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
    const user = await findUser();
    const passwordHash = await hashPassword(await newPassword(email));
    const now = new Date();
    await users.updateOne({ _id: user._id }, { $set: { passwordHash, passwordChangedAt: now, updatedAt: now } });
    const ended = (await sessions.deleteMany({ userId: user._id })).deletedCount;
    await throttle.deleteOne({ _id: emailThrottleId(email) });
    await log("auth.password_reset", user._id, `${email} (${ended} session(s) ended)`);
    console.log(`Password changed for ${email}. ${ended} session(s) signed out.`);
  } else if (command === "disable" || command === "enable") {
    const user = await findUser();
    await users.updateOne({ _id: user._id }, { $set: { status: command === "disable" ? "disabled" : "active", updatedAt: new Date() } });
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
  } else {
    stop("Commands: create, set-password, list, disable, enable, unlock, sign-out. See the top of scripts/cms/admin-users.mjs.");
  }
} catch (err) {
  stop(`Stopped: ${err?.name ?? "Error"}${err?.code !== undefined ? ` (code ${err.code})` : ""}. Check MONGODB_URI, the database user and the Atlas network access list.`);
} finally {
  await client.close().catch(() => undefined);
}
