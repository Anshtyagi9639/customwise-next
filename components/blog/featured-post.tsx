import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlogPostSummary } from "@/lib/content/blog";
import { blogTopics } from "@/lib/content/blog-topics";
import { imageQuality } from "@/lib/content/images";
import { NoImagePanel } from "./no-image-panel";
import { PostMeta } from "./post-meta";

/** The newest article, presented large at the top of the blog. */
export function FeaturedPost({ post }: { post: BlogPostSummary }) {
  const href = `/insights/blog/${post.slug}`;
  return (
    <article
      aria-labelledby="featured-post-title"
      className="grid overflow-hidden rounded-brand border border-line bg-salt shadow-card lg:grid-cols-[1.1fr_1fr]"
    >
      <div className="relative bg-ship">
        {post.image ? (
          // Natural aspect ratio, never wider than the file, so a small source image is not enlarged.
          <div className="relative mx-auto h-full w-full" style={{ aspectRatio: `${post.image.width} / ${post.image.height}`, maxWidth: post.image.width }}>
            <Image
              src={post.image.src}
              alt={post.image.alt}
              fill
              sizes="(min-width:1024px) 40rem, 100vw"
              quality={imageQuality}
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative aspect-video h-full">
            <NoImagePanel label={blogTopics[post.topic]} />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
        <p className="mb-3 text-[0.8rem] font-bold tracking-[0.14em] text-freight uppercase">Latest Blog</p>
        <PostMeta post={post} className="mb-3" />
        <h3 id="featured-post-title" className="text-[clamp(1.8rem,3vw,2.5rem)]">
          <Link href={href} className="hover:text-freight">
            {post.title}
          </Link>
        </h3>
        <p className="mt-4 text-[1.05rem] text-ink-soft">{post.excerpt}</p>
        <div className="mt-7">
          <Button asChild variant="outline">
            <Link href={href} aria-label={`Read article: ${post.title}`}>
              Read article <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
