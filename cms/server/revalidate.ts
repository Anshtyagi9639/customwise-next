import "server-only";
import { revalidatePath } from "next/cache";
import { articlePath } from "@/cms/lib/content";
import { HOSTED_SITE_KEY } from "@/cms/lib/routes";
import type { Site } from "@/cms/lib/types";
import { logEvent } from "./log";
import { forgetPublishedSlugs } from "./published-slugs";

/**
 * After a change that the public website shows (publishing, unpublishing, editing or deleting an article of this
 * website, or renaming a category), the pages that list or show articles are refreshed straight away instead of at
 * their next timed refresh. Other websites in the CMS read the public API and are not affected.
 */
export function refreshPublicBlog(site: Pick<Site, "key" | "articlePathPattern">, slugs: (string | null | undefined)[] = []) {
  if (site.key !== HOSTED_SITE_KEY) return;
  forgetPublishedSlugs(); // the list of article addresses used by proxy.ts
  const paths = ["/", "/blog", "/insights", "/sitemap.xml", ...new Set(slugs.filter((s): s is string => Boolean(s)).map((slug) => articlePath(site, slug)))];
  try {
    for (const path of paths) revalidatePath(path);
    logEvent("CMS_CACHE", "public_pages_revalidated", { outcome: "success", count: paths.length, paths });
  } catch (err) {
    logEvent("CMS_CACHE", "revalidation_failed", { outcome: "failure", code: (err as Error)?.name ?? "Error", paths, msg: `[blog] public pages could not be refreshed: ${(err as Error)?.name ?? "Error"}. They refresh on their own within 10 minutes.` });
  }
}
