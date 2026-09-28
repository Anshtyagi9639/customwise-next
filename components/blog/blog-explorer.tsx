"use client";

import { Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { BlogPostSummary } from "@/lib/content/blog";
import { type BlogTopic, blogTopics } from "@/lib/content/blog-topics";
import { cn } from "@/lib/utils/cn";
import { BlogCard } from "./blog-card";

type BlogExplorerProps = {
  posts: BlogPostSummary[];
  /** Shown above the list as the featured article, so it is left out of the grid until the reader filters or searches. */
  featuredSlug?: string;
};

/** Article list with a text search and a topic filter. Receives card fields only, never article bodies. */
export function BlogExplorer({ posts, featuredSlug }: BlogExplorerProps) {
  const [topic, setTopic] = useState<BlogTopic | "all">("all");
  const [query, setQuery] = useState("");
  const searchId = useId();

  const filtering = topic !== "all" || query.trim() !== "";
  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((p) => {
      if (!filtering && p.slug === featuredSlug) return false;
      if (topic !== "all" && p.topic !== topic) return false;
      const haystack = `${p.title} ${p.excerpt} ${blogTopics[p.topic]}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }, [posts, topic, query, filtering, featuredSlug]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length };
    for (const p of posts) c[p.topic] = (c[p.topic] ?? 0) + 1;
    return c;
  }, [posts]);

  const reset = () => {
    setTopic("all");
    setQuery("");
  };

  const chip = (value: BlogTopic | "all", label: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={topic === value}
      onClick={() => setTopic(value)}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[0.9rem] font-semibold transition-colors",
        topic === value ? "border-atlantic bg-atlantic text-salt" : "border-line bg-salt text-ship hover:border-atlantic hover:text-atlantic",
      )}
    >
      {label}
      <span className={cn("rounded-full px-2 text-[0.76rem]", topic === value ? "bg-salt/20" : "bg-mist")}>{counts[value] ?? 0}</span>
    </button>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter articles by topic" className="flex flex-wrap gap-2">
          {chip("all", "All articles")}
          {(Object.keys(blogTopics) as BlogTopic[]).map((t) => chip(t, blogTopics[t]))}
        </div>
        <div className="relative w-full lg:w-72">
          <label htmlFor={searchId} className="sr-only">
            Search articles
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-pebble" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search insights…"
            autoComplete="off"
            className="min-h-12 w-full rounded-brand border border-line bg-salt pr-3.5 pl-10 text-base text-overnight placeholder:text-pebble focus-visible:outline-atlantic"
          />
        </div>
      </div>

      <p aria-live="polite" className="mt-5 text-[0.9rem] text-ink-soft">
        {filtering ? `${results.length} ${results.length === 1 ? "article" : "articles"} found` : "More articles"}
      </p>

      {results.length > 0 ? (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p.slug}>
              <BlogCard post={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-brand border border-dashed border-line bg-salt px-6 py-10 text-center">
          <p className="font-semibold text-overnight">No articles match your search.</p>
          <button type="button" onClick={reset} className="mt-3 inline-flex items-center gap-1.5 font-bold text-atlantic underline underline-offset-3 hover:text-freight">
            <X aria-hidden className="size-4" /> Clear search and filters
          </button>
        </div>
      )}
    </div>
  );
}
