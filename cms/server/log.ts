import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
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

/**
 * CMS_AUTH sign-in and sessions · CMS_EMAIL the email provider · CMS_CONFIG settings · CMS_DB the database connection
 * and queries · CMS_DATA what the admin screens load · CMS_ROUTE admin page requests · CMS_CACHE public page refreshes.
 */
export type LogScope = "CMS_AUTH" | "CMS_EMAIL" | "CMS_CONFIG" | "CMS_DB" | "CMS_DATA" | "CMS_ROUTE" | "CMS_CACHE";
export type LogOutcome = "success" | "failure" | "rejected" | "info";
type Value = string | number | boolean | null | undefined | string[];
export type LogFields = { rid?: string; outcome?: LogOutcome; status?: number; ms?: number; code?: string; msg?: string } & Record<string, Value>;

/** A short random id for one request, or for one login attempt across requests. Carries no information. */
export const newRequestId = () => randomBytes(6).toString("hex");

/**
 * The request id that proxy.ts gives every /admin-blog request (header X-Request-Id, also sent back to the browser),
 * so that the page, its API calls and their database work all log the same rid. A new one if there is none.
 */
export const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;
export function requestIdOf(headers: { get(name: string): string | null }): string {
  const value = headers.get(REQUEST_ID_HEADER)?.trim() ?? "";
  return REQUEST_ID.test(value) ? value : newRequestId();
}

/** Milliseconds since `start` (from performance.now()), rounded. */
export const elapsed = (start: number) => Math.round(performance.now() - start);

// Whole parts of a field name (split at "_"), so "during" or "curious" are not refused for containing "uri".
const FORBIDDEN_KEY = /(^|_)(token|secret|password|passwd|hash|cookie|session_?id|sessionid|api_?key|apikey|authorization|auth_header|uri|link|url)(_|$)/i;

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

/**
 * The request a piece of work belongs to, for log lines written deep inside it (a database query does not know which
 * page asked for it). Set by the admin screens (admin-data.ts) and the admin APIs (guard.ts withAdmin).
 */
const context = new AsyncLocalStorage<{ rid?: string; attempt?: string }>();
export const withLogContext = <T>(ctx: { rid?: string; attempt?: string }, run: () => T): T => context.run(ctx, run);

export function logEvent(scope: LogScope, event: string, given: LogFields = {}): void {
  const ctx = context.getStore();
  const fields: LogFields = ctx ? { ...given, rid: given.rid ?? ctx.rid, attempt: given.attempt ?? ctx.attempt } : given;
  debugEcho(scope, event, fields);
  const { rid, outcome = "info", msg, ...rest } = fields;
  const parts = [new Date().toISOString(), `[${scope}]`, event, `rid=${rid ?? "-"}`, `env=${process.env.NODE_ENV === "production" ? "production" : "development"}`, `outcome=${outcome}`];
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || !/^[a-z][a-z0-9_]{0,30}$/.test(key)) continue;
    // A name that could hold a secret is refused when its value is text; a true/false or a number cannot hold one.
    parts.push(FORBIDDEN_KEY.test(key) && (typeof value === "string" || Array.isArray(value)) ? `${key}=[refused]` : `${key}=${format(value)}`);
  }
  if (msg) parts.push(`msg=${JSON.stringify(scrub(msg).slice(0, 600))}`);
  const line = parts.join(" ");
  if (outcome === "failure") console.error(line);
  else if (outcome === "rejected") console.warn(line);
  else console.info(line);
}

/* ---------------------------------------------------------------------------------------------------------------- */
/*
 * TEMPORARY [CMS_DEBUG] lines, for following one login from the email request to the dashboard in Hostinger's runtime
 * log. Each is one JSON object (UTC time, event, rid, attempt, outcome, ms, …), screened like every other line.
 * On by default while the dashboard problem is being investigated; set CMS_DEBUG=0 to switch them off (no rebuild
 * needed, a restart is enough). To remove them for good: delete this block, the debugEcho() call in logEvent, and the
 * debugEvent() calls (search for "debugEvent(").
 */
const DEBUG_NAMES: Record<string, string | ((f: LogFields) => string | null)> = {
  "CMS_AUTH login_page_loaded": "login_page_loaded",
  "CMS_AUTH link_page_opened": "magic_link_page_opened",
  "CMS_AUTH request_received": (f) => (f.action === "send" ? "signin_request_received" : f.action === "verify" ? "magic_link_callback_started" : null),
  "CMS_AUTH admin_validation_completed": "admin_validation_completed",
  "CMS_AUTH request_completed": "api_request_completed",
  "CMS_AUTH request_rejected": "api_request_rejected",
  "CMS_EMAIL send_started": "email_provider_request_started",
  "CMS_EMAIL provider_accepted": "email_provider_response",
  "CMS_EMAIL send_failed": "email_provider_response",
  "CMS_AUTH verification_started": "token_validation_started",
  "CMS_AUTH token_validation_completed": "token_validation_completed",
  "CMS_AUTH session_created": "session_created",
  "CMS_AUTH session_create_failed": "session_created",
  "CMS_AUTH session_cookie_set": "session_cookie_set",
  "CMS_AUTH dashboard_redirect": "dashboard_redirect",
  "CMS_AUTH session_validated": "session_validation_completed",
  "CMS_ROUTE admin_page_request": "dashboard_route_requested",
  "CMS_ROUTE admin_api_request": "admin_api_request",
  "CMS_DB connection_started": "mongodb_connection_started",
  "CMS_DB connection_succeeded": "mongodb_connection_succeeded",
  "CMS_DB connection_failed": "mongodb_connection_failed",
  "CMS_DB query_failed": "database_query_completed",
  "CMS_DATA dashboard_query_started": "dashboard_load_started",
  "CMS_DATA dashboard_query_completed": "dashboard_load_completed",
  "CMS_DATA dashboard_load_failed": "dashboard_load_failed",
  "CMS_DATA invalid_documents": "invalid_cms_records",
};

export const debugEnabled = () => process.env.CMS_DEBUG?.trim() !== "0";

function debugEcho(scope: LogScope, event: string, fields: LogFields) {
  if (!debugEnabled()) return;
  const name = DEBUG_NAMES[`${scope} ${event}`];
  const debugName = typeof name === "function" ? name(fields) : name;
  if (debugName) writeDebug(debugName, { source: `${scope}.${event}`, ...fields });
}

/** A [CMS_DEBUG] line of its own (for checkpoints that have no ordinary log line, such as each database query). */
export function debugEvent(event: string, fields: LogFields = {}): void {
  if (!debugEnabled()) return;
  const ctx = context.getStore();
  writeDebug(event, ctx ? { ...fields, rid: fields.rid ?? ctx.rid, attempt: fields.attempt ?? ctx.attempt } : fields);
}

function writeDebug(event: string, fields: LogFields) {
  const { rid, attempt, outcome = "info", ...rest } = fields;
  const out: Record<string, unknown> = { ts: new Date().toISOString(), event, rid: rid ?? null, attempt: attempt ?? null, outcome };
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || !/^[a-z][a-z0-9_.]{0,40}$/i.test(key)) continue;
    out[key] = FORBIDDEN_KEY.test(key) && (typeof value === "string" || Array.isArray(value)) ? "[refused]" : Array.isArray(value) ? value.map((v) => scrub(String(v))) : typeof value === "string" ? scrub(value).slice(0, 600) : value;
  }
  const line = `[CMS_DEBUG] ${event} ${JSON.stringify(out)}`;
  if (outcome === "failure") console.error(line);
  else console.info(line);
}
