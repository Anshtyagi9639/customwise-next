import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/cms/lib/auth-shared";
import { blogPosts } from "@/lib/content/blog-posts";

/**
 * Runs for /admin-blog and for article addresses under /insights/blog/ only (see the matcher). Every other page of
 * the website is untouched.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return pathname.startsWith("/insights/blog/") ? articleAddress(request, pathname.slice("/insights/blog/".length)) : adminArea(request, pathname);
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
    const url = request.nextUrl.clone();
    url.pathname = "/insights/blog-article-not-found"; // matches no route: the website's 404 page, status 404
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

/* ---------------------------------------------------------------------------------------------------------------- */

/**
 * The blog admin:
 * 1. A quick, early redirect to the sign-in page when there is no session cookie at all. This is only a convenience:
 *    every admin page and API checks the session in full on the server (cms/server/auth/guard.ts).
 * 2. Headers for every admin response: never indexed, never cached by the browser or a proxy cache, never framed by
 *    another website.
 */
function adminArea(request: NextRequest, pathname: string) {
  const isSignIn = pathname === "/admin-blog" || pathname === "/admin-blog/";
  const isApi = pathname.startsWith("/admin-blog/api/");
  const isOpenApi = pathname === "/admin-blog/api/auth/login" || pathname === "/admin-blog/api/auth/logout" || pathname === "/admin-blog/api/health";

  let response: NextResponse;
  if (!request.cookies.has(SESSION_COOKIE) && !isSignIn && !isOpenApi) {
    if (isApi) {
      response = NextResponse.json({ error: "unauthenticated", message: "Your session has ended. Sign in again." }, { status: 401 });
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-blog";
      url.search = "";
      response = NextResponse.redirect(url);
    }
  } else {
    response = NextResponse.next();
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: ["/admin-blog", "/admin-blog/:path*", "/insights/blog/:slug*"],
};
