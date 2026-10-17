import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "@/cms/lib/auth-shared";
import { HOSTED_SITE_KEY, adminUrl } from "@/cms/lib/routes";
import { json } from "../http";
import { elapsed, logEvent, requestIdOf, withLogContext } from "../log";
import { StoreUnavailableError } from "../store-errors";
import { runAs } from "./actor";
import { DEV_ADMIN, devAccessEnabled } from "./dev-access";
import { isSameOriginRequest } from "./request";
import { readSession } from "./sessions";
import { type AdminRole, type AdminUser, canAccessSite } from "./users";

/**
 * Every admin page and every admin API calls one of these. They are the real access check: the proxy (proxy.ts) only
 * redirects visitors without a session cookie early, and is never relied on.
 */

/**
 * The session of this request, read once per render, and logged as [CMS_AUTH] session_validated (with the login
 * attempt that created it, so the dashboard's lines can be matched to the email link that signed the person in).
 */
export const getCurrentSession = cache(async (): Promise<{ user: AdminUser; attempt?: string } | null> => {
  const h = await headers();
  // `npm run dev:admin` only: never true in a production build (see dev-access.ts).
  if (devAccessEnabled(h.get("host"))) return { user: DEV_ADMIN };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rid = requestIdOf(h);
  const start = performance.now();
  try {
    const session = await readSession(token);
    logEvent("CMS_AUTH", "session_validated", { rid, attempt: session?.attempt, outcome: session ? "success" : "rejected", ms: elapsed(start), code: session ? undefined : "no_valid_session", kind: token.startsWith("e.") ? "settings-admin" : "database-account" });
    return session ? { user: session.user, ...(session.attempt ? { attempt: session.attempt } : {}) } : null;
  } catch (err) {
    logEvent("CMS_AUTH", "session_validated", { rid, outcome: "failure", ms: elapsed(start), code: err instanceof StoreUnavailableError ? (err.kind ?? err.reason) : ((err as Error)?.name ?? "Error") });
    throw err;
  }
});

/** The signed-in administrator for this request, read once per render. */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => (await getCurrentSession())?.user ?? null);

/**
 * Where a signed-in user starts: the Customs Wise management screen, or the dashboard for someone who has not been
 * given Customs Wise (where it says they have no websites yet) instead of a "not found" page.
 */
export function landingPage(user: AdminUser): string {
  return canAccessSite(user, HOSTED_SITE_KEY) ? adminUrl.home : adminUrl.dashboard;
}

/** For admin pages: the signed-in user, or a redirect to the sign-in page. A website the user may not manage is a 404. */
export async function requireAdminPage(opts: { siteKey?: string; role?: AdminRole } = {}): Promise<AdminUser> {
  const h = await headers();
  const route = { rid: requestIdOf(h), path: h.get("x-cms-path") ?? undefined, cookie_present: (await cookies()).has(SESSION_COOKIE) };
  const session = await getCurrentSession();
  const user = session?.user;
  if (!user) {
    logEvent("CMS_ROUTE", "admin_page_request", { ...route, outcome: "rejected", status: 307, code: "not_signed_in" });
    redirect(adminUrl.login);
  }
  if ((opts.role === "admin" && user.role !== "admin") || (opts.siteKey && !canAccessSite(user, opts.siteKey))) {
    logEvent("CMS_ROUTE", "admin_page_request", { ...route, attempt: session.attempt, outcome: "rejected", status: 404, code: "not_allowed" });
    notFound();
  }
  // requireAdminPage runs in the layout and in the page: logged once per request.
  if (!loggedRequests.has(route.rid)) {
    loggedRequests.add(route.rid);
    if (loggedRequests.size > 1000) loggedRequests.clear();
    logEvent("CMS_ROUTE", "admin_page_request", { ...route, attempt: session.attempt, outcome: "success", code: "signed_in" });
  }
  return user;
}
const loggedRequests = new Set<string>();

/** The login attempt behind this request's session, for log lines (see email-link.ts). */
export async function currentLoginAttempt(): Promise<string | undefined> {
  return (await getCurrentSession().catch(() => null))?.attempt;
}

/**
 * For admin APIs: checks the request came from this website (for anything that changes data), that a valid session
 * exists and that the user may act on the website and with the role required, then runs the handler with the user
 * recorded as the author of every change. Database problems become a 503 without details.
 */
export async function withAdmin(request: Request, opts: { siteKey?: string; role?: AdminRole }, handler: (user: AdminUser) => Promise<Response>): Promise<Response> {
  const changes = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (changes && !isSameOriginRequest(request)) return json({ error: "forbidden", message: "This request was not sent from the CMS." }, 403);
  try {
    const user = await getCurrentAdmin();
    if (!user) {
      logEvent("CMS_ROUTE", "admin_api_request", { rid: requestIdOf(request.headers), path: new URL(request.url).pathname, outcome: "rejected", status: 401, code: "not_signed_in" });
      return json({ error: "unauthenticated", message: "Your session has ended. Sign in again." }, 401);
    }
    if (opts.role === "admin" && user.role !== "admin") return json({ error: "forbidden", message: "Only an administrator can do this." }, 403);
    if (opts.siteKey && !canAccessSite(user, opts.siteKey)) return json({ error: "forbidden", message: "You do not have access to this website." }, 403);
    const ctx = { rid: requestIdOf(request.headers), attempt: await currentLoginAttempt() };
    return await withLogContext(ctx, () => runAs(user.email, () => handler(user)));
  } catch (err) {
    if (err instanceof StoreUnavailableError) {
      logEvent("CMS_ROUTE", "admin_api_request", { rid: requestIdOf(request.headers), path: new URL(request.url).pathname, method: request.method, outcome: "failure", status: 503, code: err.kind ?? err.reason });
      return json({ error: "unavailable", message: "The CMS database is not reachable at the moment. Nothing was changed. Try again shortly." }, 503);
    }
    throw err;
  }
}
