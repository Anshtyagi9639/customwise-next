import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/content/blog";
import { site } from "@/lib/site";

const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "yearly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/food-customs", priority: 0.9, changeFrequency: "monthly" },
  { path: "/food-customs/products-of-animal-origin", priority: 0.8, changeFrequency: "monthly" },
  { path: "/food-customs/catch-certificates", priority: 0.8, changeFrequency: "monthly" },
  { path: "/food-customs/fresh-produce", priority: 0.8, changeFrequency: "monthly" },
  { path: "/industries", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/insights", priority: 0.7, changeFrequency: "weekly" },
  { path: "/insights/cbam", priority: 0.7, changeFrequency: "monthly" },
  { path: "/insights/eudr", priority: 0.7, changeFrequency: "monthly" },
  { path: "/insights/incoterms", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faqs", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = routes.map((r) => ({ url: `${site.url}${r.path === "/" ? "" : r.path}`, changeFrequency: r.changeFrequency, priority: r.priority }));
  const posts = blogPosts.map((p) => ({
    url: `${site.url}/insights/blog/${p.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.6,
    ...(p.date ? { lastModified: p.date } : {}),
  }));
  return [...pages, ...posts];
}
