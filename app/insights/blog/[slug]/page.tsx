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
import { formatPostDate, getPost, postPath, toSummary, topicLabel } from "@/lib/content/blog";
import { loadBlog } from "@/lib/content/blog-source";
import { imageQuality } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/lib/site";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

/**
 * Posts are pre-rendered from the blog source (lib/content/blog-source.ts) and refreshed every 10 minutes, and at once
 * when an article is published, changed or unpublished in the blog admin. A slug that is not a post is a 404.
 */
export const revalidate = 600;

/** Social previews use the article's own image when it is large enough to share well; otherwise the site image. */
const MIN_SHARE_WIDTH = 600;

/** Image addresses from the blog CMS can be absolute (hosted images); the built-in ones are paths on this website. */
const absolute = (src: string) => (/^https?:\/\//i.test(src) ? src : `${site.url}${src}`);

export async function generateStaticParams() {
  return (await loadBlog()).posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug, (await loadBlog()).posts);
  if (!post) return {};
  const base = buildMetadata({ title: post.seoTitle ?? `${post.title} | Customs Wise`, description: post.seoDescription ?? post.excerpt, path: postPath(post), type: "article" });
  const shareImage = post.image && post.image.width >= MIN_SHARE_WIDTH ? { url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt } : undefined;
  return {
    ...base,
    // An article first published elsewhere points search engines at the original.
    ...(post.canonical ? { alternates: { canonical: post.canonical } } : {}),
    openGraph: {
      ...base.openGraph,
      type: "article",
      section: topicLabel(post),
      ...(post.date ? { publishedTime: post.date } : {}),
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    twitter: { ...base.twitter, ...(shareImage ? { images: [shareImage.url] } : {}) },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blog = await loadBlog();
  const post = getPost(slug, blog.posts);
  if (!post) {
    // While the CMS cannot be read, an article that exists only there must not be replaced by a 404:
    // failing here keeps the last good version of the page (see blog-source.ts).
    if (blog.origin === "cms-unavailable") throw new Error("The blog source is temporarily unavailable.");
    notFound();
  }
  const path = postPath(post);
  const trail = [
    { name: "Insights", path: "/insights" },
    { name: post.title, path },
  ];
  // BlogPosting with only the facts the source supplies: no author names, and a date only where one is given.
  const schema = {
    ...articleSchema(path, post.title, post.excerpt),
    "@type": "BlogPosting",
    articleSection: topicLabel(post),
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.image ? { image: absolute(post.image.src) } : {}),
  };
  const faqSchema = post.faq?.length
    ? { "@type": "FAQPage", mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }
    : null;

  return (
    <>
      <JsonLd data={faqSchema ? [schema, breadcrumbSchema(trail), faqSchema] : [schema, breadcrumbSchema(trail)]} />
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
          {post.faq && post.faq.length > 0 && (
            <section aria-labelledby="faq-title">
              <h2 id="faq-title">Frequently asked questions</h2>
              {post.faq.map((f, i) => (
                <div key={i}>
                  <h3>{f.question}</h3>
                  <p>{f.answer}</p>
                </div>
              ))}
            </section>
          )}
          {post.sources && post.sources.length > 0 && (
            <section aria-labelledby="sources-title">
              <h3 id="sources-title">Sources</h3>
              <ul>
                {post.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {post.lastReviewedAt && <p className="text-[0.88rem] text-pebble">Last reviewed {formatPostDate(post.lastReviewedAt)}</p>}
        </article>
      </ArticleLayout>
      <RelatedPosts post={post} posts={blog.posts} />
      <CTASection title="Need help with your customs requirements?" />
    </>
  );
}
