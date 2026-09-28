import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BlogBody } from "@/components/blog/blog-body";
import { PostMeta } from "@/components/blog/post-meta";
import { RelatedPosts } from "@/components/blog/related-posts";
import { ArticleLayout, insightsAside } from "@/components/layout/article-layout";
import { CTASection } from "@/components/sections/cta-section";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { blogPosts, blogTopics, getPost, postPath, toSummary } from "@/lib/content/blog";
import { imageQuality } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/lib/site";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

/** Blog posts are pre-rendered from lib/content/blog-posts.ts; any other slug is a 404. */
export const dynamicParams = false;

/** Social previews use the article's own image when it is large enough to share well; otherwise the site image. */
const MIN_SHARE_WIDTH = 600;

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const base = buildMetadata({ title: `${post.title} | Customs Wise`, description: post.excerpt, path: postPath(post), type: "article" });
  const shareImage = post.image && post.image.width >= MIN_SHARE_WIDTH ? { url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt } : undefined;
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      section: blogTopics[post.topic],
      ...(post.date ? { publishedTime: post.date } : {}),
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    twitter: { ...base.twitter, ...(shareImage ? { images: [shareImage.url] } : {}) },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const path = postPath(post);
  const trail = [
    { name: "Insights", path: "/insights" },
    { name: post.title, path },
  ];
  // BlogPosting with only the facts the source supplies: no author names, and a date only where one is given.
  const schema = {
    ...articleSchema(path, post.title, post.excerpt),
    "@type": "BlogPosting",
    articleSection: blogTopics[post.topic],
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.image ? { image: `${site.url}${post.image.src}` } : {}),
  };

  return (
    <>
      <JsonLd data={[schema, breadcrumbSchema(trail)]} />
      <PageHero title={post.title} intro={<PostMeta post={toSummary(post)} tone="dark" className="text-[0.92rem]" />} trail={trail} />
      <ArticleLayout
        cta={{ ...insightsAside.cta, title: "Need help with your customs requirements?" }}
        related={{ title: "Related Customs Wise pages", links: post.related }}
      >
        <article aria-label={post.title}>
          {post.image && (
            <figure className="mb-8">
              {/* Shown at its natural size at most: the supplied images are small, so they are never stretched to the column. */}
              <Image
                src={post.image.src}
                alt={post.image.alt}
                width={post.image.width}
                height={post.image.height}
                sizes="(min-width:1024px) 48rem, 100vw"
                quality={imageQuality}
                loading="eager"
                fetchPriority="high"
                className="h-auto w-full rounded-brand"
                style={{ maxWidth: post.image.width }}
              />
              {post.image.caption && <figcaption className="mt-2.5 text-[0.86rem] text-pebble">{post.image.caption}</figcaption>}
            </figure>
          )}
          <BlogBody blocks={post.body} />
        </article>
      </ArticleLayout>
      <RelatedPosts post={post} />
      <CTASection title="Need help with your customs requirements?" />
    </>
  );
}
