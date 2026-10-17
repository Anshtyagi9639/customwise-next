import "server-only";
import { headers } from "next/headers";
import { currentLoginAttempt } from "./auth/guard";
import { CMS_DIAGNOSTIC_PREFIX } from "@/cms/lib/diagnostics";
import { elapsed, logEvent, requestIdOf, withLogContext } from "./log";
import { screenCategory } from "./mongo-failure";
import { readDb, storeKind } from "./store";
import { StoreUnavailableError } from "./store-errors";
import { lastReadStats } from "./store-mongo";

/**
 * readDb() for the first data an admin screen needs (the dashboard, and the screens of one website), logged as
 * [CMS_DATA] dashboard_query_started / dashboard_query_completed (with how many records of each kind, never their
 * content) or dashboard_load_failed (with the reason), under the request id from proxy.ts and the login attempt of the
 * session. A failure then reaches the admin error page (app/admin-blog/error.tsx), which says the database may be
 * unreachable: it is never turned into a "not found" page.
 */
export async function readDbForScreen(screen: string) {
  const rid = requestIdOf(await headers());
  const attempt = await currentLoginAttempt();
  const start = performance.now();
  logEvent("CMS_DATA", "dashboard_query_started", { rid, attempt, screen, store: storeKind() });
  try {
    // The queries inside log under this page's rid and attempt ([CMS_DEBUG] database_query_*).
    const db = await withLogContext({ rid, attempt }, () => readDb());
    // The counts of the read that just finished (MongoDB only). Another request's read at the same moment could
    // replace them; they are for the log, nothing depends on them.
    const stats = storeKind() === "mongodb" ? lastReadStats() : null;
    logEvent("CMS_DATA", "dashboard_query_completed", {
      rid,
      attempt,
      screen,
      outcome: "success",
      ms: elapsed(start),
      sites: db.sites.length,
      posts: db.posts.length,
      categories: db.categories.length,
      authors: db.authors.length,
      media: db.media.length,
      invalid_documents: stats ? Object.values(stats.invalid).reduce((a, b) => a + b, 0) : 0,
    });
    return db;
  } catch (err) {
    const known = err instanceof StoreUnavailableError;
    const kind = known ? (err.kind ?? err.reason) : "unknown";
    const category = known ? screenCategory(err.kind ?? (err.reason === "not-configured" ? "not-configured" : undefined)) : "unknown";
    logEvent("CMS_DATA", "dashboard_load_failed", {
      rid,
      attempt,
      screen,
      operation: "dashboard-data",
      reference: rid,
      category,
      outcome: "failure",
      status: 500,
      ms: elapsed(start),
      code: known ? kind : ((err as Error)?.name ?? "Error"),
      reason: known ? err.reason : "error",
      msg: known
        ? "Signed in, but the CMS database could not be read, so the screen shows 'This screen could not be loaded'. The [CMS_DB] lines say why."
        : "Signed in, but loading the screen's data failed unexpectedly.",
    });
    throw new CmsScreenError(rid, "dashboard-data", 500, category, known ? kind : "unknown");
  }
}

/**
 * What reaches the admin error page (app/admin-blog/error.tsx) instead of the original error. Next.js keeps a digest
 * that an error already has and passes it to the browser, while it hides the message in production. So the digest
 * carries only what is safe to show: the reference (the request id of the [CMS_DATA] dashboard_load_failed line in the
 * server log), the operation, the HTTP status and the category. The message stays generic.
 */
export class CmsScreenError extends Error {
  readonly digest: string;
  constructor(reference: string, operation: string, status: number, category: string, kind: string) {
    super("An admin screen could not load its data. See the server log for this reference.");
    this.name = "CmsScreenError";
    this.digest = [CMS_DIAGNOSTIC_PREFIX, reference, operation, String(status), category, kind].map((part) => part.replace(/[^A-Za-z0-9._-]/g, "")).join(":");
  }
}

/** For the screens of one website: the website is not in the database (a 404 for the person). */
export async function logSiteNotFound(screen: string, siteKey: string) {
  logEvent("CMS_DATA", "site_not_found", { rid: requestIdOf(await headers()), attempt: await currentLoginAttempt(), screen, site: siteKey, outcome: "rejected", status: 404 });
}
