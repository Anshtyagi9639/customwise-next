import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { elapsed, logEvent, maskEmail } from "../log";
import { type EnvAdmin, envAdmin } from "./env-admin";
import { getRecord, listRecords, putRecord, removeRecord, takeRecord } from "./file-store";

export { maskEmail };

/**
 * Sign-in by email link, for the administrator from the server settings (ADMIN_EMAIL) only. Nobody types an address:
 * the link always goes to ADMIN_EMAIL. A link holds a random token after "#" (so it never reaches a server log or a
 * mail scanner's request), is kept here only as a SHA-256 hash, works once, and expires after 15 minutes. Asking for a
 * new link cancels the previous one. Opening it creates the same session as a password sign-in (env-sessions.ts).
 *
 * Links are kept as small files (file-store.ts), shared by every process of the website and kept across restarts.
 * Email goes through Resend with the website's EMAIL_API_KEY / EMAIL_FROM (EMAIL_API_URL overrides the endpoint).
 */

export const LINK_LIFETIME_MS = 15 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** attempt: a random id shared by the log lines of one login attempt (the send and the later use of its link). */
type PendingLink = { email: string; expiresAt: number; attempt?: string };
/**
 * What happened to a link that can no longer be used, kept for a day under the same hashed name, only so that the log
 * can say "already used", "replaced" or "expired" instead of "unknown". It never makes a link usable again.
 */
type SpentLink = { why: "used" | "replaced" | "expired"; until: number; attempt?: string };
const SPENT_KEPT_MS = 24 * 60 * 60 * 1000;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Where links point. Never taken from the request in production, so a forged Host header cannot make the
 * administrator's inbox receive a link to another website: CMS_PUBLIC_URL, else NEXT_PUBLIC_SITE_URL. Under next dev,
 * the address the page was opened at is used when it is this computer (localhost, 127.x, or a 169.254.x.x address).
 */
export function linkBaseUrl(requestUrl: string): string | null {
  const configured = [process.env.CMS_PUBLIC_URL, process.env.NEXT_PUBLIC_SITE_URL].map((v) => v?.trim()).find((v) => v && /^https?:\/\/[^\s/]+/.test(v));
  if (process.env.NODE_ENV === "development") {
    try {
      const u = new URL(requestUrl);
      if (isLocalHost(u.hostname)) return u.origin;
    } catch {}
    return configured ? new URL(configured).origin : null;
  }
  // Production: never a link to this computer or over plain http, even if a setting says so by mistake.
  if (!configured) return null;
  const u = new URL(configured);
  if (u.protocol !== "https:" || isLocalHost(u.hostname)) {
    warnOnce(`[auth] Sign-in emails are off: CMS_PUBLIC_URL / NEXT_PUBLIC_SITE_URL must be the live https:// address of the website (it is ${u.protocol === "https:" ? "a local address" : "not https"}). No link to a local or insecure address is ever emailed.`);
    return null;
  }
  return u.origin;
}

const isLocalHost = (host: string) => host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "0.0.0.0" || host === "[::1]" || /^127\./.test(host) || /^169\.254\./.test(host);

const warned = new Set<string>();
function warnOnce(message: string) {
  if (!warned.has(message)) logEvent("CMS_AUTH", "configuration_warning", { outcome: "rejected", msg: message });
  warned.add(message);
}

/**
 * The sender of sign-in emails: CMS_EMAIL_FROM if set (for example "Customs Wise CMS <cms@customswise.ie>" once
 * customswise.ie is verified in Resend), otherwise the website's EMAIL_FROM. Returns null if it is not a valid
 * "Name <address>" or "address". Warns once about senders that mailbox providers tend to put in Spam.
 */
export function signInSender(): { from: string; domain: string; testSender: boolean } | null {
  const raw = (process.env.CMS_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim() || "").replace(/^(["'])(.*)\1$/, "$2");
  // "Name <address>", '"Name" <address>' (quoted, as in the email standard) or a plain address.
  const m = raw.match(/^(?:("[^"<>]{1,80}"|[^<>"]{1,80}?)\s*)?<([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>$/) ?? raw.match(/^()([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)$/);
  if (!m) return null;
  const name = (m[1] ?? "").trim().replace(/^"|"$/g, "").trim();
  const domain = m[2].split("@")[1].toLowerCase();
  const testSender = domain === "resend.dev";
  if (testSender) {
    warnOnce(
      "[auth] Sign-in emails come from Resend's shared test sender (@resend.dev). Resend delivers it only to the address that owns the Resend account, and mailbox providers such as Gmail often put it in Spam. " +
        "Verify customswise.ie in Resend → Domains, then set CMS_EMAIL_FROM=Customs Wise CMS <cms@customswise.ie>.",
    );
    if (/customs\s*wise/i.test(name)) warnOnce(`[auth] The sender's display name ("${name}") names Customs Wise but its address is on resend.dev: a brand name on an unrelated domain is a common spam signal.`);
  }
  return { from: name ? `${name} <${m[2]}>` : m[2], domain, testSender };
}

/**
 * The sign-in email: a plain transactional message (no images, no tracking, no marketing), with a text part that says
 * the same as the HTML part. `now` and `refId` are parameters so the content can be tested exactly.
 */
export function buildLinkEmail(link: string, now = new Date(), refId = randomBytes(12).toString("hex")) {
  const minutes = Math.round(LINK_LIFETIME_MS / 60000);
  const host = new URL(link).host;
  const when = `${now.toISOString().slice(0, 16).replace("T", " ")} UTC`;
  const subject = "Sign in to the Customs Wise blog admin";
  const text = [
    "Sign in to the Customs Wise blog admin",
    "",
    `A sign-in link was requested for the blog admin of ${host} on ${when}.`,
    "",
    `Open this link to sign in. It works once, within ${minutes} minutes:`,
    link,
    "",
    "If you did not request it, ignore this email. Nobody can sign in without the link, and it expires on its own.",
    "",
    `This is an automatic security email from the Customs Wise website (${host}). Replies are not read.`,
  ].join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:24px;background:#f1f5f7;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#000315">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px">
<tr><td style="padding:22px 24px">
<p style="margin:0 0 12px;font-size:18px;font-weight:700">Sign in to the Customs Wise blog admin</p>
<p style="margin:0 0 16px">A sign-in link was requested for the blog admin of ${escapeHtml(host)} on ${escapeHtml(when)}.</p>
<p style="margin:0 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#17698a;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:4px">Sign in to the blog admin</a></p>
<p style="margin:0 0 16px">The link works once, within ${minutes} minutes. If the button does not work, copy this address into your browser:<br><span style="word-break:break-all;color:#4a6876">${escapeHtml(link)}</span></p>
<p style="margin:0 0 12px">If you did not request it, ignore this email. Nobody can sign in without the link, and it expires on its own.</p>
<p style="margin:0;color:#747576;font-size:13px">This is an automatic security email from the Customs Wise website (${escapeHtml(host)}). Replies are not read.</p>
</td></tr></table></body></html>`;
  // A unique reference, so Gmail does not thread separate sign-in emails into one conversation.
  return { subject, text, html, headers: { "X-Entity-Ref-ID": refId } };
}

/** A new single-use link token for the configured administrator. Earlier unused links stop working. */
export function issueLinkToken(env: Extract<EnvAdmin, { state: "ok" }>, now = Date.now(), attempt?: string): string {
  for (const { id, value } of listRecords<PendingLink>("link")) if (value.expiresAt <= now) retire(id, "expired", value.attempt, now);
  for (const { id, value } of listRecords<SpentLink>("spent")) if (value.until <= now) removeRecord("spent", id);
  const token = randomBytes(32).toString("base64url");
  putRecord("link", sha256(token), { email: env.email, expiresAt: now + LINK_LIFETIME_MS, ...(attempt ? { attempt } : {}) } satisfies PendingLink);
  return token;
}

/** Removes a link record and notes why (see SpentLink). */
function retire(id: string, why: SpentLink["why"], attempt: string | undefined, now: number) {
  removeRecord("link", id);
  putRecord("spent", id, { why, until: now + SPENT_KEPT_MS, ...(attempt ? { attempt } : {}) } satisfies SpentLink);
}

/**
 * After the provider accepted the email with this token: every older link of the same address stops working, so only
 * the newest email's link works. Not done before, so a send that fails never cancels a link already in the inbox.
 */
export function keepOnlyNewestLink(env: Extract<EnvAdmin, { state: "ok" }>, token: string, now = Date.now()): number {
  const keep = sha256(token);
  let cancelled = 0;
  for (const { id, value } of listRecords<PendingLink>("link")) {
    if (id !== keep && value.email === env.email) {
      retire(id, "replaced", value.attempt, now);
      cancelled++;
    }
  }
  return cancelled;
}

/** The email with this token was not sent: the token must not work. */
export function cancelLinkToken(token: string): void {
  if (TOKEN_PATTERN.test(token)) removeRecord("link", sha256(token));
}

/**
 * Seconds since the newest link for this address was sent, or null. Used to pause new requests for a minute, so a
 * second click does not cancel the link of an email that is still on its way.
 */
export function secondsSinceLastLink(env: Extract<EnvAdmin, { state: "ok" }>, now = Date.now()): number | null {
  const sent = listRecords<PendingLink>("link")
    .filter(({ value }) => value.email === env.email && value.expiresAt > now)
    .map(({ value }) => value.expiresAt - LINK_LIFETIME_MS);
  return sent.length ? Math.floor((now - Math.max(...sent)) / 1000) : null;
}

/**
 * Uses a link: valid only once, before it expires, and only while its address is still ADMIN_EMAIL. Returns the
 * administrator's settings, or null.
 */
export function redeemLinkToken(token: string, now = Date.now()): Extract<EnvAdmin, { state: "ok" }> | null {
  const result = consumeLinkToken(token, now);
  return result.ok ? result.env : null;
}

/**
 * Why a link did not sign anyone in, for the server log only (the person always sees the same message):
 * missing (no token), malformed, unknown (never issued, or cancelled because its email was not sent), already_used,
 * replaced (a newer email was sent), expired, admin_changed (ADMIN_EMAIL changed since it was sent).
 */
export type LinkRefusal = "missing" | "malformed" | "unknown" | "already_used" | "replaced" | "expired" | "admin_changed";

/** redeemLinkToken, with the reason when it fails and the login attempt it belongs to. */
export function consumeLinkToken(token: unknown, now = Date.now()): { ok: true; env: Extract<EnvAdmin, { state: "ok" }>; attempt?: string } | { ok: false; reason: LinkRefusal; attempt?: string } {
  if (typeof token !== "string" || token === "") return { ok: false, reason: "missing" };
  if (!TOKEN_PATTERN.test(token)) return { ok: false, reason: "malformed" };
  const id = sha256(token);
  // Single use, across every process: only one caller can take the record, even at the same moment.
  const link = takeRecord<PendingLink>("link", id);
  if (!link) {
    const spent = getRecord<SpentLink>("spent", id);
    if (!spent || spent.until <= now) return { ok: false, reason: "unknown" };
    return { ok: false, reason: spent.why === "used" ? "already_used" : spent.why, attempt: spent.attempt };
  }
  if (link.expiresAt <= now) {
    putRecord("spent", id, { why: "expired", until: now + SPENT_KEPT_MS, attempt: link.attempt } satisfies SpentLink);
    return { ok: false, reason: "expired", attempt: link.attempt };
  }
  const env = envAdmin();
  if (env.state !== "ok" || env.email !== link.email) return { ok: false, reason: "admin_changed", attempt: link.attempt };
  putRecord("spent", id, { why: "used", until: now + SPENT_KEPT_MS, attempt: link.attempt } satisfies SpentLink);
  return { ok: true, env, attempt: link.attempt };
}

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Why an email was not sent, for the person at the sign-in page (no detail) and for the server log (detail). */
/** provider-timeout: Resend did not answer in time, so the email MAY still have been sent (its link is kept). */
export type SendFailure = "not-configured" | "sender-not-allowed" | "key-rejected" | "provider-rate-limited" | "provider-error" | "provider-timeout" | "unreachable";
export type SendOutcome = { sent: true; id: string | null } | { sent: false; reason: SendFailure };

/** How long Resend has to answer (CMS_EMAIL_TIMEOUT_MS, 10 seconds by default, at least 1 second). */
const SEND_TIMEOUT_MS = Number(process.env.CMS_EMAIL_TIMEOUT_MS) >= 1000 ? Number(process.env.CMS_EMAIL_TIMEOUT_MS) : 10_000;

/** Resend's endpoint for sending; EMAIL_API_URL replaces it (tests point it at a fake provider on this computer). */
const sendEndpoint = () => (process.env.EMAIL_API_URL?.trim() || "https://api.resend.com/emails").replace(/\/+$/, "");

/** Email addresses in provider text are masked before logging (Resend names the account owner in some refusals). */
const maskAddresses = (text: string) => text.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (a) => maskEmail(a.toLowerCase()));

function classifyRefusal(status: number, detail: string): { reason: SendFailure; log: string } {
  if (/testing emails|your own email/i.test(detail)) {
    return { reason: "sender-not-allowed", log: "Resend's test sender (an EMAIL_FROM @resend.dev) only delivers to the address that owns the Resend account. Verify your own domain in Resend → Domains and send from an address on it." };
  }
  if (/domain is not verified|not verified|verify a domain/i.test(detail)) return { reason: "sender-not-allowed", log: "The domain in EMAIL_FROM is not verified in Resend → Domains." };
  if (status === 401 || status === 403 || /api[_ ]?key|unauthori[sz]ed/i.test(detail)) return { reason: "key-rejected", log: "EMAIL_API_KEY was rejected or may not send: check it in Resend → API Keys." };
  if (status === 422 || /validation_error|invalid_from|from field/i.test(detail)) return { reason: "sender-not-allowed", log: "Resend refused the sender or recipient format: check EMAIL_FROM (for example Customs Wise <cms@customswise.ie>)." };
  if (status === 429) return { reason: "provider-rate-limited", log: "Resend's own sending limit was reached; try again later." };
  return { reason: "provider-error", log: "Resend could not take the email right now." };
}


/**
 * Sends the link email. Logs only that it was sent or why not: never the link, the token or the API key. `rid` and
 * `attempt` tie the log lines to the request and to the later use of the link.
 */
export async function sendLinkEmail(to: string, link: string, ids: { rid?: string; attempt?: string } = {}): Promise<SendOutcome> {
  const { rid, attempt } = ids;
  const apiKey = process.env.EMAIL_API_KEY?.trim();
  const sender = signInSender();
  if (!apiKey || !sender) {
    const missing = [!apiKey && "EMAIL_API_KEY", !sender && (process.env.CMS_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim() ? "a valid sender (CMS_EMAIL_FROM or EMAIL_FROM, as Name <address>)" : "EMAIL_FROM")].filter(Boolean).join(" and ");
    logEvent("CMS_AUTH", "email_send_failed", { rid, attempt, outcome: "failure", code: "not_configured", msg: `Email sign-in is not set up: missing ${missing}. No email was sent.` });
    return { sent: false, reason: "not-configured" };
  }
  const email = buildLinkEmail(link);
  const start = performance.now();
  logEvent("CMS_AUTH", "email_send_started", { rid, attempt, provider: "resend", to: maskEmail(to), sender_domain: sender.domain });
  try {
    const res = await fetch(sendEndpoint(), {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: sender.from, to: [to], subject: email.subject, text: email.text, html: email.html, headers: email.headers }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      // The provider's answer says why. It contains no secret of ours; addresses in it are masked.
      const detail = maskAddresses((await res.text().catch(() => "")).slice(0, 300));
      const refusal = classifyRefusal(res.status, detail);
      logEvent("CMS_AUTH", "email_send_failed", { rid, attempt, outcome: "failure", status: res.status, ms: elapsed(start), code: refusal.reason, msg: `Sign-in email NOT sent: Resend refused it (${res.status}, ${refusal.reason}). ${refusal.log} Resend said: ${detail}` });
      return { sent: false, reason: refusal.reason };
    }
    // The provider's id lets the email be found in its logs (Resend → Emails). It is not a secret.
    const raw = ((await res.json().catch(() => ({}))) as { id?: unknown }).id;
    const id = typeof raw === "string" && /^[A-Za-z0-9-]{8,80}$/.test(raw) ? raw : null;
    logEvent("CMS_AUTH", "email_provider_accepted", { rid, attempt, outcome: "success", status: res.status, ms: elapsed(start), provider_id: id ?? "none", msg: `Sign-in email to ${maskEmail(to)} ACCEPTED by Resend${id ? ` (id ${id})` : ""}. Accepted is not yet delivered.` });
    if (id) logDeliveryLater(id, attempt);
    return { sent: true, id };
  } catch (err) {
    const name = (err as Error)?.name ?? "Error";
    if (name === "TimeoutError") {
      logEvent("CMS_AUTH", "email_send_failed", { rid, attempt, outcome: "failure", ms: elapsed(start), code: "provider-timeout", msg: `Resend did not answer within ${SEND_TIMEOUT_MS} ms. The email may or may not have been sent; its link is kept, so it works if it arrives.` });
      return { sent: false, reason: "provider-timeout" };
    }
    logEvent("CMS_AUTH", "email_send_failed", { rid, attempt, outcome: "failure", ms: elapsed(start), code: "unreachable", msg: `Sign-in email NOT sent: Resend could not be reached (${name}).` });
    return { sent: false, reason: "unreachable" };
  }
}

/** What Resend's last_event values mean, for the server log and `npm run cms:email-status`. */
export const DELIVERY_MEANING: Record<string, string> = {
  queued: "waiting to be sent",
  scheduled: "scheduled for later",
  sent: "sent; the recipient's mail server has not confirmed it yet",
  delivered: "DELIVERED: the recipient's mail server accepted it (look in Inbox, Promotions and Spam)",
  delivery_delayed: "DELAYED: the recipient's mail server is not accepting it yet; Resend keeps trying",
  bounced: "BOUNCED: the recipient's mail server refused it",
  suppressed: "SUPPRESSED: Resend did not send it, because this address bounced or complained before (Resend → Suppressions)",
  complained: "delivered, then marked as spam by the recipient",
  failed: "FAILED: Resend could not send it",
  canceled: "canceled",
  opened: "delivered and opened",
  clicked: "delivered, opened and a link clicked",
};

/** Looks up one email's delivery status. Reads only: it never sends. */
export async function deliveryStatus(id: string, key: string): Promise<{ ok: true; event: string } | { ok: false; why: string }> {
  try {
    const res = await fetch(`${sendEndpoint()}/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as { last_event?: unknown; name?: unknown };
    if (res.ok && typeof body.last_event === "string") return { ok: true, event: body.last_event };
    if (body.name === "restricted_api_key") return { ok: false, why: "the key may only send emails (use a full-access key as RESEND_READ_API_KEY)" };
    return { ok: false, why: `Resend answered ${res.status}${typeof body.name === "string" ? ` (${body.name})` : ""}` };
  } catch (err) {
    return { ok: false, why: `Resend could not be reached (${(err as Error)?.name ?? "Error"})` };
  }
}

/**
 * "Accepted" only means Resend took the email. With a full-access key in RESEND_READ_API_KEY, the server asks Resend
 * about 30 seconds later what happened to it and logs the answer. It only reads; it never sends again. Without the
 * key, it says how to check. Logs only the status, never the email, the link or the key.
 */
function logDeliveryLater(id: string, attempt?: string): void {
  const key = process.env.RESEND_READ_API_KEY?.trim();
  if (!key) {
    logEvent("CMS_AUTH", "email_delivery_unconfirmed", { attempt, provider_id: id, msg: `Delivery not confirmed. To check it: Resend → Emails, or set RESEND_READ_API_KEY and run npm run cms:email-status -- ${id}` });
    return;
  }
  setTimeout(async () => {
    const status = await deliveryStatus(id, key);
    if (!status.ok) {
      logEvent("CMS_AUTH", "email_delivery_status", { attempt, provider_id: id, code: "unknown", msg: `Delivery status of sign-in email ${id} unknown: ${status.why}` });
      return;
    }
    const bad = ["bounced", "suppressed", "failed", "complained", "canceled"].includes(status.event);
    logEvent("CMS_AUTH", "email_delivery_status", { attempt, provider_id: id, outcome: status.event === "delivered" ? "success" : bad ? "failure" : "info", code: status.event, msg: `Delivery status of sign-in email ${id}: ${status.event} - ${DELIVERY_MEANING[status.event] ?? "see Resend → Emails"}` });
  }, DELIVERY_CHECK_DELAY_MS).unref?.();
}

/** How long after sending the status is checked (Resend usually knows within seconds). */
export const DELIVERY_CHECK_DELAY_MS = Number(process.env.CMS_EMAIL_STATUS_DELAY_MS) > 0 ? Number(process.env.CMS_EMAIL_STATUS_DELAY_MS) : 30_000;
