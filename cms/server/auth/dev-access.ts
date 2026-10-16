import type { AdminUser } from "./users";

/**
 * Local development access: the admin opens without signing in, as a stand-in administrator. For `npm run dev:admin`
 * only (scripts/cms/dev-admin.mjs), which starts `next dev` on a local-only address with a local test database.
 *
 * Every condition must hold, and all of them come from the server's own environment; nothing a browser sends (URL,
 * query string, header, cookie) can switch it on. The host check below can only switch it off.
 * - NODE_ENV is "development" (next dev). A production build replaces process.env.NODE_ENV with "production", so
 *   this function always returns false there and the rest of it is removed from the built code.
 * - CMS_DEV_ACCESS is "1" (set by the dev:admin script, not by plain `npm run dev`).
 * - The database is not the production one (blog_cms) and not on MongoDB Atlas.
 * - The request is not addressed to customswise.ie.
 */
export function devAccessEnabled(host: string | null | undefined): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.CMS_DEV_ACCESS !== "1") return false;
  const db = process.env.MONGODB_DB?.trim() ?? "";
  const uri = process.env.MONGODB_URI?.trim() ?? "";
  if (!db || db === "blog_cms" || !/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(uri)) {
    warnOnce("[cms] Local development access is OFF: it only works with a local database, never blog_cms or Atlas.");
    return false;
  }
  if (host && /(^|\.)customswise\.ie(:\d+)?$/i.test(host.trim())) return false;
  return true;
}

export const DEV_ADMIN_ID = "local-dev";

/** Who changes are recorded as (audit log) while local development access is on. Not a real account. */
export const DEV_ADMIN: AdminUser = { id: DEV_ADMIN_ID, email: "local-dev@localhost", name: "Local development", role: "admin", siteKeys: [] };

let warned = false;
function warnOnce(message: string) {
  if (!warned) console.warn(message);
  warned = true;
}
