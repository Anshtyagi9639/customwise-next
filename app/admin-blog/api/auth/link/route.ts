import { NextResponse } from "next/server";
import { SIGN_IN_LOCKED, SIGN_IN_NOT_CONFIGURED } from "@/cms/lib/auth-shared";
import { LINK_LIFETIME_MS, type SendFailure, cancelLinkToken, issueLinkToken, keepOnlyNewestLink, linkBaseUrl, secondsSinceLastLink, sendLinkEmail, signInSender, consumeLinkToken } from "@/cms/server/auth/email-link";
import { envAdmin } from "@/cms/server/auth/env-admin";
import { AuthStoreError } from "@/cms/server/auth/file-store";
import { createEnvSession, envAdminUser } from "@/cms/server/auth/env-sessions";
import { landingPage } from "@/cms/server/auth/guard";
import { clientIp, isSameOriginRequest } from "@/cms/server/auth/request";
import { sessionCookie } from "@/cms/server/auth/sessions";
import { type ThrottleKey, memoryClearFailures, memoryLockedFor, memoryRecordFailure } from "@/cms/server/auth/throttle";
import { json, readJson } from "@/cms/server/http";
import { elapsed, logEvent, newRequestId } from "@/cms/server/log";

/**
 * Sign-in by email link (cms/server/auth/email-link.ts). No session needed, no database used.
 *   { action: "send" }            emails a single-use link to ADMIN_EMAIL (nobody types an address)
 *   { action: "verify", token }   uses a link: signs in and answers where to go
 * Limits: 5 links per IP and 10 in all per 15 minutes; 20 failed link uses per IP per 15 minutes.
 *
 * Every step is logged as a [CMS_AUTH] line (cms/server/log.ts) with this request's id (rid), which is also returned
 * to the browser as requestId and the X-Request-Id header. A login attempt has its own id (attempt), kept with the
 * link, so the send and the later use of its link can be matched in the log.
 */
export async function POST(request: Request) {
  const rid = newRequestId();
  const start = performance.now();
  let res: Response;
  try {
    res = await handle(request, rid);
  } catch (err) {
    // The sign-in records could not be read or written (logged by the store, without any token).
    if (!(err instanceof AuthStoreError)) {
      logEvent("CMS_AUTH", "request_failed", { rid, outcome: "failure", status: 500, ms: elapsed(start), code: (err as Error)?.name ?? "Error" });
      throw err;
    }
    res = json({ error: "unavailable", message: "Sign-in is not available at the moment. Try again shortly." }, 503);
  }
  logEvent("CMS_AUTH", "request_completed", { rid, outcome: res.status < 300 ? "success" : res.status < 500 ? "rejected" : "failure", status: res.status, ms: elapsed(start) });
  res.headers.set("X-Request-Id", rid);
  return res;
}

/** Seconds between two link emails (CMS_LINK_COOLDOWN_SECONDS on the server; 60 by default). */
const LINK_COOLDOWN_SECONDS = Number.isFinite(Number(process.env.CMS_LINK_COOLDOWN_SECONDS)) && process.env.CMS_LINK_COOLDOWN_SECONDS?.trim() !== "" ? Math.max(0, Number(process.env.CMS_LINK_COOLDOWN_SECONDS)) : 60;

/** What the person at the sign-in page is told when no email went out. The server log has the detail. */
const SEND_FAILED: Record<SendFailure, string> = {
  "not-configured": "Email sign-in is not set up on this website yet. No email was sent.",
  "sender-not-allowed": "The email service refused to send from the website's sender address, so no email was sent. The website's administrator needs to check the email settings (the server log says what to change).",
  "key-rejected": "The email service did not accept the website's credentials, so no email was sent. The website's administrator needs to check the email settings.",
  "provider-rate-limited": "The email service is limiting how many emails can be sent right now. No email was sent; try again in a few minutes.",
  "provider-error": "The email service could not take the email right now. No email was sent; try again in a few minutes.",
  "provider-timeout": "The email service did not answer in time. The email may still arrive: if it does, its link works. If nothing arrives within a few minutes, ask for another.",
  unreachable: "The email service could not be reached. No email was sent; try again in a few minutes.",
};

/** The settings sending needs, by name only (never values). */
function missingForSend(requestUrl: string): string[] {
  const missing: string[] = [];
  if (!process.env.EMAIL_API_KEY?.trim()) missing.push("EMAIL_API_KEY");
  if (!signInSender()) missing.push(process.env.CMS_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim() ? "EMAIL_FROM (not a valid address)" : "EMAIL_FROM");
  if (!linkBaseUrl(requestUrl)) missing.push("CMS_PUBLIC_URL (an https:// address)");
  return missing;
}

async function handle(request: Request, rid: string): Promise<Response> {
  const body = ((await readJson(request)) ?? {}) as { action?: unknown; token?: unknown };
  const action = body.action === "send" || body.action === "verify" ? body.action : "unknown";
  logEvent("CMS_AUTH", "request_received", { rid, action });
  const reply = (data: Record<string, unknown>, status = 200, headers?: Record<string, string>) => json({ ...data, requestId: rid }, status, headers);

  if (!isSameOriginRequest(request)) {
    logEvent("CMS_AUTH", "request_rejected", { rid, outcome: "rejected", status: 403, code: "cross_origin", action });
    return reply({ error: "forbidden", message: "This request was not sent from the CMS." }, 403);
  }
  const ip = clientIp(request);
  const env = envAdmin();
  logEvent("CMS_AUTH", "email_validation", { rid, outcome: env.state === "ok" ? "success" : "failure", code: env.state === "ok" ? "admin_email_ok" : env.state === "off" ? "admin_email_missing" : "admin_email_invalid" });
  if (env.state !== "ok") {
    logEvent("CMS_AUTH", "configuration_check", { rid, outcome: "failure", status: 503, missing: ["ADMIN_EMAIL"], code: env.state === "invalid" ? "invalid" : "missing" });
    return reply({ error: "unavailable", message: env.state === "invalid" ? SIGN_IN_NOT_CONFIGURED : "Email sign-in is not set up on this website." }, 503);
  }

  if (action === "send") {
    // A minute's pause after each email: a second click would otherwise cancel the link of an email still on its way.
    const since = secondsSinceLastLink(env);
    if (since !== null && since < LINK_COOLDOWN_SECONDS) {
      const wait = LINK_COOLDOWN_SECONDS - since;
      logEvent("CMS_AUTH", "request_rejected", { rid, outcome: "rejected", status: 429, code: "cooldown", retry_after_s: wait });
      return reply({ error: "wait", message: `A sign-in email was requested ${since < 5 ? "just now" : `${since} seconds ago`}. Give it a minute or two to arrive, and check Spam and Promotions too. You can ask for another in ${wait} seconds; only the newest email's link will work.`, retryAfter: wait }, 429, { "Retry-After": String(wait) });
    }
    const keys: ThrottleKey[] = [
      { id: `link-send:ip:${ip}`, limit: 5 },
      { id: "link-send:all", limit: 10 },
    ];
    const lockedMs = memoryLockedFor(keys);
    if (lockedMs > 0) {
      logEvent("CMS_AUTH", "request_rejected", { rid, outcome: "rejected", status: 429, code: "rate_limited", retry_after_s: Math.ceil(lockedMs / 1000) });
      return reply({ error: "locked", message: "Too many sign-in emails were asked for. Wait 15 minutes, then try again." }, 429, { "Retry-After": String(Math.ceil(lockedMs / 1000)) });
    }
    // Each request counts towards the limit, whether or not the email goes out.
    memoryRecordFailure(keys);
    const missing = missingForSend(request.url);
    logEvent("CMS_AUTH", "configuration_check", { rid, outcome: missing.length ? "failure" : "success", missing });
    const base = linkBaseUrl(request.url);
    if (!base) {
      logEvent("CMS_AUTH", "email_send_failed", { rid, outcome: "failure", status: 503, code: "not_configured", msg: "Email sign-in links need the website's address: set CMS_PUBLIC_URL (or NEXT_PUBLIC_SITE_URL) to the live https:// address. No email was sent." });
      return reply({ error: "unavailable", message: SEND_FAILED["not-configured"] }, 503);
    }
    const attempt = newRequestId();
    const t = performance.now();
    logEvent("CMS_AUTH", "token_created", { rid, attempt, lifetime_s: LINK_LIFETIME_MS / 1000 });
    let token: string;
    try {
      token = issueLinkToken(env, Date.now(), attempt);
    } catch (err) {
      logEvent("CMS_AUTH", "token_persist_failed", { rid, attempt, outcome: "failure", status: 503, ms: elapsed(t), code: "auth_store" });
      throw err;
    }
    logEvent("CMS_AUTH", "token_persisted", { rid, attempt, outcome: "success", ms: elapsed(t), store: "file" });
    const sent = await sendLinkEmail(env.email, `${base}/admin-blog/auth#${token}`, { rid, attempt });
    if (!sent.sent) {
      // Never emailed, so it must not work; links already sent keep working. After a timeout the email may have gone,
      // so its link is kept (and the pause between emails still applies).
      if (sent.reason !== "provider-timeout") cancelLinkToken(token);
      return reply({ error: "unavailable", reason: sent.reason, message: SEND_FAILED[sent.reason] }, 503);
    }
    const cancelled = keepOnlyNewestLink(env, token);
    if (cancelled) logEvent("CMS_AUTH", "older_links_cancelled", { rid, attempt, count: cancelled });
    const minutes = Math.round(LINK_LIFETIME_MS / 60000);
    // Accepted by the email service is all that is known here: it is not proof of delivery, so it is not presented as such.
    return reply({
      ok: true,
      message: `The email service accepted the request to email a sign-in link to the administrator's inbox. Delivery is not confirmed yet: it usually arrives within a minute or two (check Spam and Promotions too). The link works once, within ${minutes} minutes, and only the newest email's link works.`,
      retryAfter: LINK_COOLDOWN_SECONDS,
    });
  }

  if (action === "verify") {
    logEvent("CMS_AUTH", "verification_started", { rid });
    const failures: ThrottleKey[] = [{ id: `link-verify:ip:${ip}`, limit: 20 }];
    if (memoryLockedFor(failures) > 0) {
      logEvent("CMS_AUTH", "request_rejected", { rid, outcome: "rejected", status: 429, code: "verify_locked" });
      return reply({ error: "locked", message: SIGN_IN_LOCKED }, 429);
    }
    const used = consumeLinkToken(body.token);
    if (!used.ok) {
      memoryRecordFailure(failures);
      logEvent("CMS_AUTH", "token_validation_failed", { rid, attempt: used.attempt, outcome: "rejected", status: 400, code: used.reason });
      return reply({ error: "invalid", message: "This sign-in link has expired or has already been used." }, 400);
    }
    memoryClearFailures(failures[0]);
    logEvent("CMS_AUTH", "token_consumed", { rid, attempt: used.attempt, outcome: "success" });
    const t = performance.now();
    let session: string;
    try {
      session = createEnvSession(used.env);
    } catch (err) {
      // The link is used up, but no session could be stored: the person needs a new link once the store works again.
      logEvent("CMS_AUTH", "session_create_failed", { rid, attempt: used.attempt, outcome: "failure", status: 503, ms: elapsed(t), code: err instanceof AuthStoreError ? "auth_store" : ((err as Error)?.name ?? "Error") });
      throw err;
    }
    logEvent("CMS_AUTH", "session_created", { rid, attempt: used.attempt, outcome: "success", ms: elapsed(t), store: "file", ip });
    const redirect = landingPage(envAdminUser(used.env));
    const res = NextResponse.json({ ok: true, redirect, requestId: rid }, { headers: { "Cache-Control": "no-store" } });
    const cookie = sessionCookie(session);
    res.cookies.set(cookie);
    logEvent("CMS_AUTH", "session_cookie_set", { rid, attempt: used.attempt, name: cookie.name, http_only: cookie.httpOnly, secure: cookie.secure, same_site: cookie.sameSite, path: cookie.path, max_age_s: cookie.maxAge });
    logEvent("CMS_AUTH", "dashboard_redirect", { rid, attempt: used.attempt, to: redirect });
    return res;
  }

  logEvent("CMS_AUTH", "request_rejected", { rid, outcome: "rejected", status: 400, code: "unknown_action" });
  return reply({ error: "invalid", message: "Unknown action." }, 400);
}
