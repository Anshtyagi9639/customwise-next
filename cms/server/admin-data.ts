import "server-only";
import { headers } from "next/headers";
import { currentLoginAttempt } from "./auth/guard";
import { elapsed, logEvent, requestIdOf, withLogContext } from "./log";
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
    logEvent("CMS_DATA", "dashboard_load_failed", {
      rid,
      attempt,
      screen,
      outcome: "failure",
      status: 500,
      ms: elapsed(start),
      code: known ? (err.kind ?? err.reason) : ((err as Error)?.name ?? "Error"),
      reason: known ? err.reason : "error",
      msg: known
        ? "Signed in, but the CMS database could not be read, so the screen shows 'This screen could not be loaded'. The [CMS_DB] lines say why."
        : "Signed in, but loading the screen's data failed unexpectedly.",
    });
    throw err;
  }
}

/** For the screens of one website: the website is not in the database (a 404 for the person). */
export async function logSiteNotFound(screen: string, siteKey: string) {
  logEvent("CMS_DATA", "site_not_found", { rid: requestIdOf(await headers()), attempt: await currentLoginAttempt(), screen, site: siteKey, outcome: "rejected", status: 404 });
}
