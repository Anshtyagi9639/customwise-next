// The administrator from the server settings: ADMIN_EMAIL and ADMIN_PASSWORD_HASH (see cms/server/auth/env-admin.ts).
//
//   npm run cms:admin-env -- --email you@example.com              writes both to .env (git-ignored); prints neither
//   npm run cms:admin-env -- --email you@example.com --print      prints the two lines instead, to paste into the hosting
//                                                                  panel; nothing is written
//
// The password is asked for twice and not shown. Only its scrypt hash is kept, in the form scrypt:N:r:p:salt:hash
// (no "$", which Next.js would treat as a variable inside a .env file). Restart the website afterwards.
// For automation only, the password can come from the environment variable CMS_ADMIN_PASSWORD.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { askNewPassword, hashPassword } from "./lib/password-cli.mjs";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const stop = (message) => {
  console.error(message);
  process.exit(1);
};

const email = opt("email")?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) stop("Give the administrator's email address: --email you@example.com");
const print = args.includes("--print");
// .env is where this project keeps its server settings. Only the two ADMIN_ lines are added or replaced; every other line,
// and the file's line endings, stay exactly as they are.
const file = path.join(process.cwd(), opt("file") ?? ".env");

if (!print) {
  // Refuse to write secrets into a file Git would pick up.
  let ignored = false;
  try {
    execFileSync("git", ["check-ignore", "-q", file], { stdio: "ignore" });
    ignored = true;
  } catch {}
  if (!ignored) stop(`${path.basename(file)} is not ignored by Git, so the password hash could be committed. Nothing was written.`);
}

const hash = await hashPassword(await askNewPassword(email, stop));
const value = hash.split("$").join(":");
const lines = { ADMIN_EMAIL: email, ADMIN_PASSWORD_HASH: value };

if (print) {
  console.log("\nAdd these two settings where the website runs (for example the hosting panel's environment variables):\n");
  for (const [k, v] of Object.entries(lines)) console.log(`${k}=${v}`);
  console.log("\nThe hash is not the password, but keep it private like one. Restart the website afterwards.");
} else {
  const before = existsSync(file) ? readFileSync(file, "utf8") : "";
  const eol = before.includes("\r\n") ? "\r\n" : "\n";
  const MARK = "# Blog admin: the administrator from the server settings (npm run cms:admin-env). Never commit this file.";
  const kept = before.split(/\r?\n/).filter((l) => !/^\s*(ADMIN_EMAIL|ADMIN_PASSWORD_HASH)\s*=/.test(l) && l !== MARK);
  while (kept.length && kept[kept.length - 1].trim() === "") kept.pop();
  const block = [MARK, ...Object.entries(lines).map(([k, v]) => `${k}=${v}`)];
  writeFileSync(file, [...kept, ...(kept.length ? [""] : []), ...block, ""].join(eol));
  console.log(`ADMIN_EMAIL and ADMIN_PASSWORD_HASH saved in ${path.basename(file)} (the password itself is not stored). Restart the development server.`);
}
