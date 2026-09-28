import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BlogPostSummary } from "@/lib/content/blog";
import { blogTopics } from "@/lib/content/blog-topics";
import { imageQuality } from "@/lib/content/images";
import { NoImagePanel } from "./no-image-panel";
import { PostMeta } from "./post-meta";

/** Article card: the whole card opens the article. Client-safe (no article body is imported). */
export function BlogCard({ post, headingLevel = "h3" }: { post: BlogPostSummary; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const href = `/insights/blog/${post.slug}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-brand border border-line bg-salt transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-atlantic hover:shadow-card focus-within:border-atlantic">
      <div className="relative aspect-video overflow-hidden bg-ship">
        {post.image ? (
          <Image
            src={post.image.src}
            alt=""
            fill
            sizes="(min-width:1024px) 24rem, (min-width:640px) 50vw, 100vw"
            quality={imageQuality}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <NoImagePanel label={blogTopics[post.topic]} />
        )}
      </div>
      <div className="flex flex-1 flex-col px-5.5 pt-5 pb-6">
        <PostMeta post={post} className="mb-2" />
        <Heading className="text-[1.4rem] group-hover:text-freight">{post.title}</Heading>
        <p className="mt-2 flex-1 text-[0.93rem] text-ink-soft">{post.excerpt}</p>
        <Link
          href={href}
          aria-label={`Read article: ${post.title}`}
          className="mt-4 inline-flex items-center gap-1.5 text-[0.93rem] font-bold text-atlantic after:absolute after:inset-0 after:content-['']"
        >
          Read article <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
