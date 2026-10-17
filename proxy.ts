import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/cms/lib/auth-shared";
import { devAccessEnabled } from "@/cms/server/auth/dev-access";
import { blogPosts } from "@/lib/content/blog-posts";

/**
 * Runs for /admin-blog and for article addresses under /insights/blog/ only (see the matcher). Every other page of
 * the website is untouched.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/insights/blog/")) return articleAddress(request, pathname.slice("/insights/blog/".length));
  if (pathname === "/admin-blog" || pathname.startsWith("/admin-blog/")) return adminArea(request, pathname);
  // Anything else the matcher lets through (such as /insights/blog itself) is a public address: left untouched.
  return NextResponse.next();
}

/* ---------------------------------------------------------------------------------------------------------------- */

const BUILT_IN_SLUGS = new Set(blogPosts.map((p) => p.slug));

/**
 * An address under /insights/blog/ that is not an article is sent to the website's ready-made 404 page, as before the
 * CMS existed. Article pages are generated on demand (so articles published in the CMS appear without a rebuild), and
 * without this check every made-up address would be rendered and stored as a page of its own.
 */
async function articleAddress(request: NextRequest, slug: string) {
  if (!slug || slug.includes("/")) return NextResponse.next(); // not an article address; Next.js answers 404 itself
  let known: boolean | null;
  if (process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms") {
    const { publishedSlugs } = await import("@/cms/server/published-slugs");
    const slugs = await publishedSlugs("customs-wise");
    // Unreadable CMS (null): let the page decide; it shows the built-in articles. No articles in the CMS: the page
    // shows the built-in articles too (see lib/content/blog-source.ts).
    known = slugs === null ? null : slugs.size === 0 ? BUILT_IN_SLUGS.has(slug) : slugs.has(decodeURIComponent(slug));
  } else {
    known = BUILT_IN_SLUGS.has(decodeURIComponent(slug));
  }
  if (known === false) {
    if (process.env.NODE_ENV === "development") await explainNotFound(slug);
    const url = request.nextUrl.clone();
    url.pathname = "/insights/blog-article-not-found"; // matches no route: the website's 404 page, status 404
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

/** next dev only: says in the terminal why an article address is a 404 (production stays quiet). */
async function explainNotFound(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  if (process.env.BLOG_SOURCE?.trim().toLowerCase() !== "cms") {
    console.info(`[blog] /insights/blog/${slug} is a 404: BLOG_SOURCE is not "cms", so the website shows only its built-in articles, not those published in the CMS. Set BLOG_SOURCE=cms in .env and restart.`);
    return;
  }
  const { unpublishedReason } = await import("@/cms/server/published-slugs");
  const reason = await unpublishedReason("customs-wise", slug);
  const why =
    reason === "draft" ? "it is a draft in the CMS (publish it to show it)" :
    reason === "scheduled" ? "it is scheduled in the CMS and not public yet" :
    reason === "not-in-cms" ? "there is no article with this address in the CMS (check the slug)" :
    "the CMS could not be read to say why";
  console.info(`[blog] /insights/blog/${slug} is a 404: ${why}.`);
}

/* ---------------------------------------------------------------------------------------------------------------- */

/**
 * The blog admin:
 * 1. A quick, early redirect to the sign-in page when there is no session cookie at all. This is only a convenience:
 *    every admin page and API checks the session in full on the server (cms/server/auth/guard.ts).
 * 2. Headers for every admin response: never indexed, never cached by the browser or a proxy cache, never framed by
 *    another website.
 * 3. A request id (X-Request-Id) for the server log: passed to the page or API (cms/server/log.ts) and sent back to the
 *    browser. Always made here, so a value sent by the browser is never used.
 */
function adminArea(request: NextRequest, pathname: string) {
  const isSignIn = pathname === "/admin-blog" || pathname === "/admin-blog/";
  const isApi = pathname.startsWith("/admin-blog/api/");
  // Opened from an emailed link (invitation, password reset, or sign-in link), before the person has a session.
  const isSetup = ["/admin-blog/setup", "/admin-blog/setup/", "/admin-blog/auth", "/admin-blog/auth/"].includes(pathname);
  const isOpenApi = ["/admin-blog/api/auth/login", "/admin-blog/api/auth/logout", "/admin-blog/api/auth/setup", "/admin-blog/api/auth/link", "/admin-blog/api/health"].includes(pathname);

  const rid = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const forwarded = new Headers(request.headers);
  forwarded.set("x-request-id", rid);
  forwarded.set("x-cms-path", pathname); // for the [CMS_ROUTE] log line of the page (guard.ts)

  let response: NextResponse;
  if (!request.cookies.has(SESSION_COOKIE) && !isSignIn && !isSetup && !isOpenApi && !devAccessEnabled(request.headers.get("host"))) {
    if (isApi) {
      response = NextResponse.json({ error: "unauthenticated", message: "Your session has ended. Sign in again." }, { status: 401 });
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-blog";
      url.search = "";
      response = NextResponse.redirect(url);
      // The page never runs in this case, so this is the only trace of why the browser went back to the sign-in page.
      logRedirect(rid, pathname);
    }
  } else {
    response = NextResponse.next({ request: { headers: forwarded } });
  }

  response.headers.set("X-Request-Id", rid);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

/** One log line for a redirect to the sign-in page (proxy.ts cannot use cms/server/log.ts, which is server-only). */
function logRedirect(rid: string, path: string) {
  const ts = new Date().toISOString();
  const safePath = path.replace(/[^A-Za-z0-9/_.-]/g, "").slice(0, 120);
  console.warn(`${ts} [CMS_ROUTE] login_redirect rid=${rid} env=${process.env.NODE_ENV === "production" ? "production" : "development"} outcome=rejected status=307 path=${safePath} code=no_session_cookie cookie_present=false`);
  if (process.env.CMS_DEBUG?.trim() !== "0") console.info(`[CMS_DEBUG] login_redirect ${JSON.stringify({ ts, event: "login_redirect", rid, outcome: "rejected", status: 307, path: safePath, reason: "no_session_cookie", cookie_present: false })}`);
}

export const config = {
  matcher: ["/admin-blog", "/admin-blog/:path*", "/insights/blog/:slug*"],
};
