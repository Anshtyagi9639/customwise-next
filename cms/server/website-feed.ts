import "server-only";
import type { PublicPost } from "@/cms/lib/types";
import { publicPosts } from "./posts";
import { readDb } from "./store";
import { findSite } from "./sites";

/**
 * The articles a website shows: published, past their publish time, newest first. Drafts, scheduled articles and
 * other websites' articles never leave this function. Read by the public blog pages (lib/content/blog-source.ts).
 */
export async function websitePosts(siteKey: string): Promise<PublicPost[]> {
  const site = findSite(await readDb(), siteKey);
  if (!site) throw new Error(`The CMS has no website "${siteKey}".`);
  return publicPosts(site);
}
