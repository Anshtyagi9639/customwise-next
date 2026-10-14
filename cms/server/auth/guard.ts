import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "@/cms/lib/auth-shared";
import { adminUrl } from "@/cms/lib/routes";
import { json } from "../http";
import { StoreUnavailableError } from "../store-errors";
import { runAs } from "./actor";
import { isSameOriginRequest } from "./request";
import { readSession } from "./sessions";
import { type AdminRole, type AdminUser, canAccessSite } from "./users";

/**
 * Every admin page and every admin API calls one of these. They are the real access check: the proxy (proxy.ts) only
 * redirects visitors without a session cookie early, and is never relied on.
 */

/** The signed-in administrator for this request, read once per render. */
export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? ((await readSession(token))?.user ?? null) : null;
});

/** For admin pages: the signed-in user, or a redirect to the sign-in page. A website the user may not manage is a 404. */
export async function requireAdminPage(opts: { siteKey?: string; role?: AdminRole } = {}): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect(adminUrl.login);
  if (opts.role === "admin" && user.role !== "admin") notFound();
  if (opts.siteKey && !canAccessSite(user, opts.siteKey)) notFound();
  return user;
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
    if (!user) return json({ error: "unauthenticated", message: "Your session has ended. Sign in again." }, 401);
    if (opts.role === "admin" && user.role !== "admin") return json({ error: "forbidden", message: "Only an administrator can do this." }, 403);
    if (opts.siteKey && !canAccessSite(user, opts.siteKey)) return json({ error: "forbidden", message: "You do not have access to this website." }, 403);
    return await runAs(user.email, () => handler(user));
  } catch (err) {
    if (err instanceof StoreUnavailableError) return json({ error: "unavailable", message: "The CMS database is not reachable at the moment. Nothing was changed. Try again shortly." }, 503);
    throw err;
  }
}
