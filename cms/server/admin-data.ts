import "server-only";
import { elapsed, logEvent, newRequestId } from "./log";
import { readDb } from "./store";
import { StoreUnavailableError } from "./store-errors";

/**
 * readDb() for the first data an admin screen needs (the dashboard, and the screens of one website). If the database
 * cannot be read, says so in the server log as [CMS_AUTH] dashboard_load_failed (the person is signed in, but the
 * screen cannot be shown), then lets the error reach the admin error page (app/admin-blog/error.tsx), which says the
 * database may be unreachable. It is never turned into a "not found" page.
 */
export async function readDbForScreen(screen: string) {
  const start = performance.now();
  try {
    return await readDb();
  } catch (err) {
    if (err instanceof StoreUnavailableError) {
      logEvent("CMS_AUTH", "dashboard_load_failed", { rid: newRequestId(), outcome: "failure", status: 503, ms: elapsed(start), screen, code: err.reason, kind: err.kind, msg: "Signed in, but the CMS database could not be read, so the screen shows 'This screen could not be loaded'. See the [CMS_DB] lines for why." });
    }
    throw err;
  }
}
