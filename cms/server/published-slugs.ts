import "server-only";
import { isVisible } from "@/cms/lib/content";
import { readDb } from "./store";
import { findSite } from "./sites";

/**
 * The slugs of a website's public articles, kept for 30 seconds. Used by proxy.ts so that an address under
 * /insights/blog/ that is not an article goes straight to the website's ready-made 404 page, instead of being
 * rendered and cached as a new page (which would let anyone fill the server's disk by requesting random addresses).
 *
 * Kept on globalThis so the admin can clear it the moment an article is published or unpublished (forgetPublishedSlugs).
 */
const TTL_MS = 30_000;
const READ_TIMEOUT_MS = 2_000;
const KEY = Symbol.for("cms.published-slugs");
type Entry = { at: number; slugs: Set<string> };
const g = globalThis as typeof globalThis & { [KEY]?: Map<string, Entry> };

/**
 * The public slugs of the website. If the CMS cannot be read, the last list that was read is used (so made-up
 * addresses still get the 404 page during an outage); null only if no list has been read since the server started
 * (the caller then lets the page decide).
 */
export async function publishedSlugs(siteKey: string): Promise<Set<string> | null> {
  const cache = (g[KEY] ??= new Map());
  const hit = cache.get(siteKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.slugs;
  try {
    // Never hold a visitor's request for long: after 2 seconds the last list is used instead.
    const db = await Promise.race([readDb(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), READ_TIMEOUT_MS))]);
    const site = findSite(db, siteKey);
    if (!site) return hit?.slugs ?? null;
    const now = Date.now();
    const slugs = new Set(db.posts.filter((p) => p.siteId === site.id && isVisible(p, now)).map((p) => p.slug));
    cache.set(siteKey, { at: Date.now(), slugs });
    return slugs;
  } catch {
    if (hit) hit.at = Date.now(); // try the database again in 30 seconds, not on every request
    return hit?.slugs ?? null;
  }
}

/** Called after a publish or unpublish: the next request reads the list again (the old one stays as the fallback). */
export function forgetPublishedSlugs() {
  for (const entry of g[KEY]?.values() ?? []) entry.at = 0;
}

/**
 * next dev only (diagnostics for proxy.ts): why an address under the article path is not public. Reads the database
 * once; returns null if it cannot be read. Never used in production, so made-up addresses cannot cause extra reads.
 */
export async function unpublishedReason(siteKey: string, slug: string): Promise<"draft" | "scheduled" | "not-in-cms" | null> {
  try {
    const db = await readDb();
    const site = findSite(db, siteKey);
    const post = site && db.posts.find((p) => p.siteId === site.id && p.slug === slug);
    if (!post) return "not-in-cms";
    return post.status === "draft" ? "draft" : "scheduled";
  } catch {
    return null;
  }
}
