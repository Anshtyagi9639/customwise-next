import type { Site } from "./types";

/**
 * Addresses used by the Blog CMS inside the Customs Wise website.
 * Safe to import from client components: no secrets and no server code.
 */

/** The CMS's record for this website. Its articles are shown by this app at their real addresses. */
export const HOSTED_SITE_KEY = "customs-wise";

export const ADMIN_BASE = "/admin-blog";

export const adminUrl = {
  login: ADMIN_BASE,
  dashboard: `${ADMIN_BASE}/dashboard`,
  account: `${ADMIN_BASE}/account`,
  site: (siteKey: string) => `${ADMIN_BASE}/sites/${siteKey}`,
  rawPreview: (siteKey: string, postId: string) => `${ADMIN_BASE}/preview/${siteKey}/${postId}`,
};

export const adminApi = {
  login: `${ADMIN_BASE}/api/auth/login`,
  logout: `${ADMIN_BASE}/api/auth/logout`,
  password: `${ADMIN_BASE}/api/auth/password`,
};

/**
 * Where a page of a website really is. For this website it is a path in this app; for any other website it is that
 * website's own address (opened in a new tab).
 */
export function publicUrl(site: Pick<Site, "key" | "baseUrl">, path: string): { href: string; external: boolean } {
  return site.key === HOSTED_SITE_KEY ? { href: path, external: false } : { href: `${site.baseUrl}${path}`, external: true };
}
