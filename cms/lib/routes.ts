import type { Site } from "./types";

/**
 * Addresses used by the Blog CMS inside the Customs Wise website.
 * Safe to import from client components: no secrets and no server code.
 */

/** The CMS's record for this website. Its articles are shown by this app at their real addresses. */
export const HOSTED_SITE_KEY = "customs-wise";

/**
 * The websites the admin manages. Other website records in the database (the old "Demo Website" test configuration)
 * are kept untouched but hidden everywhere; see cms/server/sites.ts.
 */
export const ENABLED_SITE_KEYS: readonly string[] = [HOSTED_SITE_KEY];
export const isEnabledSite = (key: string) => ENABLED_SITE_KEYS.includes(key);

export const ADMIN_BASE = "/admin-blog";

export const adminUrl = {
  login: ADMIN_BASE,
  dashboard: `${ADMIN_BASE}/dashboard`,
  /** Where /admin-blog and a successful sign-in lead: the Customs Wise management screen ("Manage Customs Wise"). */
  home: `${ADMIN_BASE}/sites/${HOSTED_SITE_KEY}`,
  account: `${ADMIN_BASE}/account`,
  users: `${ADMIN_BASE}/users`,
  /** A one-time setup link. The token goes after "#", so browsers never send it to the server or in a Referer. */
  setup: (origin: string, token: string) => `${origin}${ADMIN_BASE}/setup#${token}`,
  site: (siteKey: string) => `${ADMIN_BASE}/sites/${siteKey}`,
  rawPreview: (siteKey: string, postId: string) => `${ADMIN_BASE}/preview/${siteKey}/${postId}`,
};

export const adminApi = {
  login: `${ADMIN_BASE}/api/auth/login`,
  logout: `${ADMIN_BASE}/api/auth/logout`,
  password: `${ADMIN_BASE}/api/auth/password`,
  users: `${ADMIN_BASE}/api/users`,
};

/**
 * Where a page of a website really is. For this website it is a path in this app; for any other website it is that
 * website's own address (opened in a new tab).
 */
export function publicUrl(site: Pick<Site, "key" | "baseUrl">, path: string): { href: string; external: boolean } {
  return site.key === HOSTED_SITE_KEY ? { href: path, external: false } : { href: `${site.baseUrl}${path}`, external: true };
}
