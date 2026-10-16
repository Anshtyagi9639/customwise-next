// Password helpers for the command-line tools: the same scrypt format and rules as cms/server/auth/password.ts, and a
// prompt that does not show what is typed. Nothing here prints a password or a hash.
import { randomBytes, scrypt } from "node:crypto";

const N = 2 ** 17;
const R = 8;
const P = 1;

/** scrypt$N$r$p$salt$hash, as stored with database accounts. */
export function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFC"), salt, 64, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(`scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`))),
  );
}

export function passwordProblem(password, email) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 200) return "Use at most 200 characters.";
  if (/^(.)\1+$/.test(password)) return "Do not use one character repeated.";
  const local = email.toLowerCase().split("@")[0];
  if (local.length >= 4 && password.toLowerCase().includes(local)) return "Do not include your email address in the password.";
  return null;
}

/** Reads a line without showing what is typed. Resolves null when there is no interactive terminal. */
export function hiddenPrompt(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return resolve(null);
    process.stdout.write(question);
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

/**
 * A new password, asked for twice without showing it. For automation only, it can come from the environment variable
 * CMS_ADMIN_PASSWORD instead (never from the command line, where it would be kept in the shell history).
 * Calls stop(message) when it cannot get an acceptable password.
 */
export async function askNewPassword(email, stop) {
  if (process.env.CMS_ADMIN_PASSWORD) {
    const problem = passwordProblem(process.env.CMS_ADMIN_PASSWORD, email);
    if (problem) stop(`The password in CMS_ADMIN_PASSWORD is not accepted: ${problem}`);
    return process.env.CMS_ADMIN_PASSWORD;
  }
  for (;;) {
    const first = await hiddenPrompt("New password (at least 12 characters, not shown): ");
    if (first === null) stop("\nThis needs an interactive terminal to ask for the password (or set CMS_ADMIN_PASSWORD).");
    const problem = passwordProblem(first, email);
    if (problem) {
      console.log(problem);
      continue;
    }
    if ((await hiddenPrompt("Type it again: ")) === first) return first;
    console.log("The two passwords are not the same. Try again.");
  }
}
