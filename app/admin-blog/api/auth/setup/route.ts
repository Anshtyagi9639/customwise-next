import { completeSetup, linkDetails } from "@/cms/server/auth/accounts";
import { runAs } from "@/cms/server/auth/actor";
import { clientIp, isSameOriginRequest } from "@/cms/server/auth/request";
import { lockedFor, recordFailure, throttleKeys } from "@/cms/server/auth/throttle";
import { json, readJson } from "@/cms/server/http";
import { audit, mutateDb } from "@/cms/server/store";
import { StoreUnavailableError } from "@/cms/server/store-errors";

/**
 * Setting a password with a one-time link from an administrator (invitation or password reset). No session needed:
 * the link is the proof. Wrong or expired links count towards the same per-IP lock as failed sign-ins.
 *   { action: "check", token }               which account the link is for (email only)
 *   { action: "complete", token, password }  sets the password; the account can then sign in
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "forbidden", message: "This request was not sent from the CMS." }, 403);
  const body = ((await readJson(request)) ?? {}) as { action?: unknown; token?: unknown; password?: unknown };
  const token = typeof body.token === "string" ? body.token : "";
  const ip = throttleKeys("", clientIp(request)).ip;
  const invalid = "This link is not valid or has expired. Ask an administrator for a new one.";

  try {
    if ((await lockedFor([ip])) > 0) return json({ error: "locked", message: "Too many attempts. Wait 15 minutes, then try again." }, 429);

    if (body.action === "check") {
      const details = await linkDetails(token);
      if (!details) {
        await recordFailure([ip]);
        return json({ error: "invalid", message: invalid }, 400);
      }
      return json({ email: details.email, purpose: details.purpose, expiresAt: details.expiresAt });
    }

    if (body.action === "complete") {
      const password = typeof body.password === "string" ? body.password.slice(0, 1000) : "";
      const r = await completeSetup(token, password);
      if (!r.ok) {
        if (!r.fieldErrors) await recordFailure([ip]); // a bad link, not just a weak password
        return json({ error: "invalid", message: r.message, fieldErrors: r.fieldErrors ?? {} }, r.status);
      }
      await runAs(r.value.email, () => mutateDb((db) => audit(db, { siteId: null, action: r.value.purpose === "invite" ? "auth.invite_accepted" : "auth.password_reset_by_link", targetId: r.value.userId, summary: r.value.email })));
      return json({ ok: true, message: "Your password is set. You can now sign in." });
    }

    return json({ error: "invalid", message: "Unknown action." }, 400);
  } catch (err) {
    if (err instanceof StoreUnavailableError) return json({ error: "unavailable", message: "This is not available at the moment because the CMS database cannot be reached. Try again shortly." }, 503);
    throw err;
  }
}
