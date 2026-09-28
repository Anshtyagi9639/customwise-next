import type { BlogPostSummary } from "@/lib/content/blog";
import { blogTopics, formatPostDate } from "@/lib/content/blog-topics";
import { cn } from "@/lib/utils/cn";

/**
 * Topic, date (only when the source gives a full date) and reading time.
 * Each item carries its own leading "/" separator; the separator of an item that starts a new line is clipped by the
 * wrapper, so a wrapped meta line never starts or ends with a stray slash.
 */
export function PostMeta({ post, tone = "light", className }: { post: BlogPostSummary; tone?: "light" | "dark"; className?: string }) {
  const muted = tone === "dark" ? "text-starlight" : "text-pebble";
  const item = cn(
    "whitespace-nowrap before:inline-block before:w-5 before:text-center before:font-normal before:content-['/'_/_'']",
    tone === "dark" ? "before:text-salt/30" : "before:text-line",
  );
  return (
    <div className={cn("overflow-hidden text-[0.8rem] font-bold", className)}>
      <p className="-ml-5 flex flex-wrap items-center gap-y-1">
        <span className={cn(item, tone === "dark" ? "text-cargo" : "text-freight")}>{blogTopics[post.topic]}</span>
        {post.date && (
          <time dateTime={post.date} className={cn(item, muted)}>
            {formatPostDate(post.date)}
          </time>
        )}
        {post.readMinutes && <span className={cn(item, muted)}>{post.readMinutes} min read</span>}
      </p>
    </div>
  );
}
