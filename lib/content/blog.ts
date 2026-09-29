import type { ImageAsset, NavLink } from "@/types";
import { blogPosts } from "./blog-posts";
import type { BlogTopic } from "./blog-topics";

export { type BlogTopic, blogTopics, formatPostDate } from "./blog-topics";

/**
 * Customs Wise blog.
 *
 * Posts live in ./blog-posts.ts (newest first). A post appears automatically on:
 *   - its own page at /insights/blog/<slug>
 *   - the homepage "Blog & Insights" section
 *   - the Insights page (featured article and the filterable article list)
 *   - the sitemap
 * Put the post's image in /public/images/blog/ and set its real width and height.
 * Only publish real Customs Wise posts: no placeholder articles, authors or dates.
 */

/** Inline text: a plain string, or parts with bold lead-ins and links. */
export type RichText = string | (string | { strong: string } | { text: string; href: string })[];

export type BlogBlock =
  | { type: "p"; text: RichText }
  | { type: "h2" | "h3"; text: string }
  | { type: "ul" | "ol"; items: RichText[] }
  /** Text reproduced verbatim from the source, such as a statement template */
  | { type: "callout"; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  /** One or two sentences taken from the article, shown on cards and used as the meta description. */
  excerpt: string;
  topic: BlogTopic;
  /** Optional ISO date (YYYY-MM-DD). Only set when the source gives the full date. */
  date?: string;
  /** Reading time as given in the source. */
  readMinutes?: number;
  /** Optional: a post without a supplied image shows a text panel; no image is substituted. */
  image?: ImageAsset & { caption?: string };
  body: BlogBlock[];
  /** Relevant Customs Wise pages, shown beside the article. */
  related: NavLink[];
};

export { blogPosts };

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export function postPath(post: Pick<BlogPost, "slug">) {
  return `/insights/blog/${post.slug}` as const;
}

/** Card fields only (no article body), for lists and client components. */
export type BlogPostSummary = Pick<BlogPost, "slug" | "title" | "excerpt" | "topic" | "date" | "readMinutes" | "image">;

export function toSummary({ slug, title, excerpt, topic, date, readMinutes, image }: BlogPost): BlogPostSummary {
  return { slug, title, excerpt, topic, date, readMinutes, image };
}

/** Up to `count` related posts: same topic first (newest first), then the newest posts from other topics. */
export function relatedPosts(post: BlogPost, count = 3) {
  const others = blogPosts.filter((p) => p.slug !== post.slug);
  return [...others.filter((p) => p.topic === post.topic), ...others.filter((p) => p.topic !== post.topic)].slice(0, count);
}
