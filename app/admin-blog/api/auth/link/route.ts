import { NextResponse } from "next/server";
import { SIGN_IN_LOCKED, SIGN_IN_NOT_CONFIGURED } from "@/cms/lib/auth-shared";
import { LINK_LIFETIME_MS, type SendFailure, cancelLinkToken, issueLinkToken, keepOnlyNewestLink, linkBaseUrl, redeemLinkToken, secondsSinceLastLink, sendLinkEmail } from "@/cms/server/auth/email-link";
import { envAdmin } from "@/cms/server/auth/env-admin";
import { AuthStoreError } from "@/cms/server/auth/file-store";
import { createEnvSession, envAdminUser } from "@/cms/server/auth/env-sessions";
import { landingPage } from "@/cms/server/auth/guard";
import { clientIp, isSameOriginRequest } from "@/cms/server/auth/request";
import { sessionCookie } from "@/cms/server/auth/sessions";
import { type ThrottleKey, memoryClearFailures, memoryLockedFor, memoryRecordFailure } from "@/cms/server/auth/throttle";
import { json, readJson } from "@/cms/server/http";

/**
 * Sign-in by email link (cms/server/auth/email-link.ts). No session needed, no database used.
 *   { action: "send" }            emails a single-use link to ADMIN_EMAIL (nobody types an address)
 *   { action: "verify", token }   uses a link: signs in and answers where to go
 * Limits: 5 links per IP and 10 in all per 15 minutes; 20 failed link uses per IP per 15 minutes.
 */
export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch (err) {
    // The sign-in records could not be read or written (logged by the store, without any token).
    if (err instanceof AuthStoreError) return json({ error: "unavailable", message: "Sign-in is not available at the moment. Try again shortly." }, 503);
    throw err;
  }
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
  unreachable: "The email service could not be reached. No email was sent; try again in a few minutes.",
};

async function handle(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return json({ error: "forbidden", message: "This request was not sent from the CMS." }, 403);
  const body = ((await readJson(request)) ?? {}) as { action?: unknown; token?: unknown };
  const ip = clientIp(request);
  const env = envAdmin();
  if (env.state !== "ok") {
    return json({ error: "unavailable", message: env.state === "invalid" ? SIGN_IN_NOT_CONFIGURED : "Email sign-in is not set up on this website." }, 503);
  }

  if (body.action === "send") {
    // A minute's pause after each email: a second click would otherwise cancel the link of an email still on its way.
    const since = secondsSinceLastLink(env);
    if (since !== null && since < LINK_COOLDOWN_SECONDS) {
      const wait = LINK_COOLDOWN_SECONDS - since;
      return json({ error: "wait", message: `A sign-in email was requested ${since < 5 ? "just now" : `${since} seconds ago`}. Give it a minute or two to arrive, and check Spam and Promotions too. You can ask for another in ${wait} seconds; only the newest email's link will work.`, retryAfter: wait }, 429, { "Retry-After": String(wait) });
    }
    const keys: ThrottleKey[] = [
      { id: `link-send:ip:${ip}`, limit: 5 },
      { id: "link-send:all", limit: 10 },
    ];
    const lockedMs = memoryLockedFor(keys);
    if (lockedMs > 0) return json({ error: "locked", message: "Too many sign-in emails were asked for. Wait 15 minutes, then try again." }, 429, { "Retry-After": String(Math.ceil(lockedMs / 1000)) });
    // Each request counts towards the limit, whether or not the email goes out.
    memoryRecordFailure(keys);
    const base = linkBaseUrl(request.url);
    if (!base) {
      console.error("[auth] Email sign-in links need the website's address: set CMS_PUBLIC_URL (or NEXT_PUBLIC_SITE_URL). No email was sent.");
      return json({ error: "unavailable", message: SEND_FAILED["not-configured"] }, 503);
    }
    const token = issueLinkToken(env);
    const sent = await sendLinkEmail(env.email, `${base}/admin-blog/auth#${token}`);
    if (!sent.sent) {
      cancelLinkToken(token); // never emailed, so it must not work; links already sent keep working
      return json({ error: "unavailable", reason: sent.reason, message: SEND_FAILED[sent.reason] }, 503);
    }
    keepOnlyNewestLink(env, token);
    const minutes = Math.round(LINK_LIFETIME_MS / 60000);
    // Accepted by the email service is all that is known here: it is not proof of delivery, so it is not presented as such.
    return json({
      ok: true,
      message: `The email service accepted the request to email a sign-in link to the administrator's inbox. Delivery is not confirmed yet: it usually arrives within a minute or two (check Spam and Promotions too). The link works once, within ${minutes} minutes, and only the newest email's link works.`,
      retryAfter: LINK_COOLDOWN_SECONDS,
    });
  }

  if (body.action === "verify") {
    const failures: ThrottleKey[] = [{ id: `link-verify:ip:${ip}`, limit: 20 }];
    if (memoryLockedFor(failures) > 0) return json({ error: "locked", message: SIGN_IN_LOCKED }, 429);
    const admin = typeof body.token === "string" ? redeemLinkToken(body.token) : null;
    if (!admin) {
      memoryRecordFailure(failures);
      return json({ error: "invalid", message: "This sign-in link has expired or has already been used." }, 400);
    }
    memoryClearFailures(failures[0]);
    console.info(`[auth] Administrator signed in with an email link from ${ip}`);
    const res = NextResponse.json({ ok: true, redirect: landingPage(envAdminUser(admin)) }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(createEnvSession(admin)));
    return res;
  }

  return json({ error: "invalid", message: "Unknown action." }, 400);
}
