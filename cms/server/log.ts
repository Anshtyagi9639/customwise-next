import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Structured diagnostic log lines for sign-in and the database, readable in Hostinger's Node.js runtime log:
 *
 *   2026-10-16T09:30:12.345Z [CMS_AUTH] email_provider_accepted rid=3f9a1c2b7d10 env=production outcome=success status=200 ms=412 msg="…"
 *
 * One line per event, always with the UTC time, the scope, the event name, the request id (rid) and the environment.
 * Fields are limited to plain values, and every value is screened before it is written: email addresses are masked,
 * and anything shaped like a sign-in token, an API key, a connection string or a sign-in link is replaced. Field names
 * that could only hold a secret (token, password, cookie, …) are refused outright. So a mistake in a caller cannot put
 * a secret in the log.
 */

export type LogScope = "CMS_AUTH" | "CMS_DB";
export type LogOutcome = "success" | "failure" | "rejected" | "info";
type Value = string | number | boolean | null | undefined | string[];
export type LogFields = { rid?: string; outcome?: LogOutcome; status?: number; ms?: number; code?: string; msg?: string } & Record<string, Value>;

/** A short random id for one request, or for one login attempt across requests. Carries no information. */
export const newRequestId = () => randomBytes(6).toString("hex");

/** Milliseconds since `start` (from performance.now()), rounded. */
export const elapsed = (start: number) => Math.round(performance.now() - start);

const FORBIDDEN_KEY = /token|secret|password|passwd|hash|cookie|session_?id|api_?key|authorization|uri|link|url/i;

/** "c•••••••••@gmail.com": enough to recognise the inbox, not enough to learn the address. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}${"•".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

/** Removes anything that looks like a secret from a value about to be logged. */
export function scrub(text: string): string {
  return text
    .replace(/mongodb(\+srv)?:\/\/\S+/gi, "[connection string]")
    .replace(/\bre_[A-Za-z0-9_]{8,}/g, "[api key]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [hidden]")
    .replace(/https?:\/\/\S*#[A-Za-z0-9_-]{20,}/g, "[sign-in link]")
    .replace(/\be\.[A-Za-z0-9_-]{43}\b/g, "[session]")
    .replace(/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g, "[token]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => maskEmail(m));
}

function format(value: Exclude<Value, undefined>): string {
  if (Array.isArray(value)) return value.length ? value.map((v) => scrub(String(v))).join(",") : "none";
  const text = scrub(String(value));
  return /^[A-Za-z0-9._:/@•,+-]+$/.test(text) ? text : JSON.stringify(text.slice(0, 400));
}

export function logEvent(scope: LogScope, event: string, fields: LogFields = {}): void {
  const { rid, outcome = "info", msg, ...rest } = fields;
  const parts = [new Date().toISOString(), `[${scope}]`, event, `rid=${rid ?? "-"}`, `env=${process.env.NODE_ENV === "production" ? "production" : "development"}`, `outcome=${outcome}`];
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || !/^[a-z][a-z0-9_]{0,30}$/.test(key)) continue;
    parts.push(FORBIDDEN_KEY.test(key) ? `${key}=[refused]` : `${key}=${format(value)}`);
  }
  if (msg) parts.push(`msg=${JSON.stringify(scrub(msg).slice(0, 600))}`);
  const line = parts.join(" ");
  if (outcome === "failure") console.error(line);
  else if (outcome === "rejected") console.warn(line);
  else console.info(line);
}
