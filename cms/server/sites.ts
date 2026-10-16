import type { Database } from "./store";
import type { Site } from "@/cms/lib/types";
import { isEnabledSite } from "@/cms/lib/routes";

/**
 * The websites this CMS manages: Customs Wise only (ENABLED_SITE_KEYS in cms/lib/routes.ts). Any other website record
 * in the database, such as the old "Demo Website" test configuration, is left exactly as it is but never listed,
 * opened, edited or served: every screen, admin API and public API finds websites through these two functions.
 */
export function enabledSites(db: Pick<Database, "sites">): Site[] {
  return db.sites.filter((s) => isEnabledSite(s.key));
}

export function findSite(db: Pick<Database, "sites">, key: string): Site | undefined {
  return enabledSites(db).find((s) => s.key === key);
}
