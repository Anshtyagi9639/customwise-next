import type { ImageAsset, NavLink } from "@/types";
import { blogPosts } from "./blog-posts";
export { type BlogTopic, blogTopics, formatPostDate, topicLabel } from "./blog-topics";

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
 *
 * When BLOG_SOURCE=cms, the pages read articles published in the blog CMS instead (lib/content/blog-source.ts), and
 * fall back to these built-in posts if the CMS cannot be read.
 */

/** Inline text: a plain string, or parts with bold lead-ins and links. */
export type RichText = string | (string | { strong: string } | { text: string; href: string })[];

export type BlogBlock =
  | { type: "p"; text: RichText }
  | { type: "h2" | "h3"; text: string }
  | { type: "ul" | "ol"; items: RichText[] }
  /** Text reproduced verbatim from the source, such as a statement template */
  | { type: "callout"; text: string }
  /** Articles written in the blog CMS can also contain quotes and images. */
  | { type: "quote"; text: RichText; cite?: string }
  | { type: "image"; image: ImageAsset & { caption?: string } };

export type BlogPost = {
  slug: string;
  title: string;
  /** One or two sentences taken from the article, shown on cards and used as the meta description. */
  excerpt: string;
  /** One of the topics in ./blog-topics.ts; an article from the blog CMS may use another category (see topicLabel). */
  topic: string;
  /** The category name, for articles from the blog CMS. */
  topicLabel?: string;
  /** Optional ISO date (YYYY-MM-DD). Only set when the source gives the full date. */
  date?: string;
  /** Reading time as given in the source. */
  readMinutes?: number;
  /** Optional: a post without a supplied image shows a text panel; no image is substituted. */
  image?: ImageAsset & { caption?: string };
  body: BlogBlock[];
  /** Relevant Customs Wise pages, shown beside the article. */
  related: NavLink[];

  /* Set only for articles from the blog CMS. */
  /** Full <title>, when the editor set one. */
  seoTitle?: string;
  /** Meta description, when it differs from the excerpt. */
  seoDescription?: string;
  /** Absolute canonical address, when it is not the article's own address. */
  canonical?: string;
  faq?: { question: string; answer: string }[];
  sources?: { label: string; url: string }[];
  /** YYYY-MM-DD */
  lastReviewedAt?: string;
};

export { blogPosts };

export function getPost(slug: string, posts: BlogPost[] = blogPosts) {
  return posts.find((p) => p.slug === slug);
}

export function postPath(post: Pick<BlogPost, "slug">) {
  return `/insights/blog/${post.slug}` as const;
}

/** Card fields only (no article body), for lists and client components. */
export type BlogPostSummary = Pick<BlogPost, "slug" | "title" | "excerpt" | "topic" | "topicLabel" | "date" | "readMinutes" | "image">;

export function toSummary({ slug, title, excerpt, topic, topicLabel, date, readMinutes, image }: BlogPost): BlogPostSummary {
  return { slug, title, excerpt, topic, ...(topicLabel ? { topicLabel } : {}), date, readMinutes, image };
}

/** Up to `count` related posts: same topic first (newest first), then the newest posts from other topics. */
export function relatedPosts(post: BlogPost, posts: BlogPost[] = blogPosts, count = 3) {
  const others = posts.filter((p) => p.slug !== post.slug);
  return [...others.filter((p) => p.topic === post.topic), ...others.filter((p) => p.topic !== post.topic)].slice(0, count);
}
