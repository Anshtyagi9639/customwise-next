import Link from "next/link";
import { SectionHeading } from "@/components/sections/section-heading";
import { type BlogPost, relatedPosts, toSummary } from "@/lib/content/blog";
import { BlogCard } from "./blog-card";

/** Up to three related articles: same topic first, then the newest from other topics. */
export function RelatedPosts({ post }: { post: BlogPost }) {
  const related = relatedPosts(post);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-posts-title" className="bg-mist py-16 sm:py-20">
      <div data-reveal className="container-site">
        <SectionHeading
          title="Related articles"
          id="related-posts-title"
          action={
            <Link href="/blog" className="font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              All articles
            </Link>
          }
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <li key={p.slug}>
              <BlogCard post={toSummary(p)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
