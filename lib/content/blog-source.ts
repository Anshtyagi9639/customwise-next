import "server-only";
import { cache } from "react";
import type { BlogBlock, BlogPost, RichText } from "./blog";
import { blogPosts } from "./blog";

/**
 * Where the public blog gets its articles.
 *
 *   BLOG_SOURCE=static (default)  the built-in posts in ./blog-posts.ts, exactly as before the CMS existed.
 *   BLOG_SOURCE=cms               the articles published in the blog CMS (MongoDB), converted to the same shape.
 *
 * If the CMS cannot be read, or has no published articles at all, the built-in posts are shown instead, so an outage
 * never empties the blog. Changing BLOG_SOURCE back to static (and restarting) is the rollback.
 */

/**
 * origin: "built-in" (BLOG_SOURCE=static), "cms", "cms-empty" (the CMS has no published article for this website, so
 * the built-in ones are shown), or "cms-unavailable" (the CMS could not be read, so the built-in ones are shown and
 * an article that exists only in the CMS is a temporary error, never a 404).
 */
export type BlogSource = { posts: BlogPost[]; origin: "built-in" | "cms" | "cms-empty" | "cms-unavailable" };

/** The CMS's record for this website (see cms/lib/routes.ts). */
const SITE_KEY = "customs-wise";

export const blogSourceSetting = (): "cms" | "static" => (process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms" ? "cms" : "static");

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(Object.assign(new Error("timed out"), { name: "TimeoutError" })), ms))]);
}

/** Read once per render, however many components ask. */
export const loadBlog = cache(async (): Promise<BlogSource> => {
  if (blogSourceSetting() !== "cms") return { posts: blogPosts, origin: "built-in" };
  try {
    // Loaded only when the CMS is the source, so the static blog never touches the CMS code.
    const [{ websitePosts }, { parseInline }] = await Promise.all([import("@/cms/server/website-feed"), import("@/cms/lib/content")]);
    const published = await withTimeout(websitePosts(SITE_KEY), 10_000);
    if (published.length === 0) {
      console.warn("[blog] The CMS has no published articles for this website; showing the built-in articles instead.");
      return { posts: blogPosts, origin: "cms-empty" };
    }
    const rich = (text: string): RichText => {
      const parts = parseInline(text);
      return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts.length === 0 ? "" : parts;
    };
    const posts = published.map((p): BlogPost => {
      const body: BlogBlock[] = [];
      for (const b of p.body) {
        if (b.type === "p") body.push({ type: "p", text: rich(b.text) });
        else if (b.type === "h2" || b.type === "h3") body.push({ type: b.type, text: b.text });
        else if (b.type === "ul" || b.type === "ol") body.push({ type: b.type, items: b.items.map(rich) });
        else if (b.type === "callout") body.push({ type: "callout", text: b.text });
        else if (b.type === "quote") body.push({ type: "quote", text: rich(b.text), ...(b.cite ? { cite: b.cite } : {}) });
        else if (b.type === "image" && b.image.url) body.push({ type: "image", image: { src: b.image.url, alt: b.image.alt, width: b.image.width, height: b.image.height, ...(b.image.caption ? { caption: b.image.caption } : {}) } });
      }
      const ownCanonical = p.canonicalUrl.endsWith(p.path);
      return {
        slug: p.slug,
        title: p.title,
        excerpt: p.summary,
        topic: p.category?.slug ?? "practical-guidance",
        ...(p.category ? { topicLabel: p.category.label } : {}),
        ...(p.displayDate ? { date: p.displayDate.slice(0, 10) } : {}),
        readMinutes: p.readMinutes,
        ...(p.coverImage ? { image: { src: p.coverImage.url, alt: p.coverImage.alt, width: p.coverImage.width, height: p.coverImage.height, ...(p.coverImage.caption ? { caption: p.coverImage.caption } : {}) } } : {}),
        body,
        related: p.relatedLinks,
        seoTitle: p.seo.title,
        ...(p.seo.description && p.seo.description !== p.summary ? { seoDescription: p.seo.description } : {}),
        ...(ownCanonical ? {} : { canonical: p.canonicalUrl }),
        ...(p.faq.length ? { faq: p.faq } : {}),
        ...(p.sources.length ? { sources: p.sources } : {}),
        ...(p.lastReviewedAt ? { lastReviewedAt: p.lastReviewedAt } : {}),
      };
    });
    return { posts, origin: "cms" };
  } catch (err) {
    console.error(`[blog] The CMS could not be read (${(err as Error)?.name ?? "Error"}); showing the built-in articles instead. Articles that exist only in the CMS answer "temporarily unavailable" until it is back, not 404.`);
    return { posts: blogPosts, origin: "cms-unavailable" };
  }
});
