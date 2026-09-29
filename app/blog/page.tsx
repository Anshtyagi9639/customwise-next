import { BlogExplorer } from "@/components/blog/blog-explorer";
import { FeaturedPost } from "@/components/blog/featured-post";
import { CTASection } from "@/components/sections/cta-section";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { blogPosts, toSummary } from "@/lib/content/blog";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/structured-data/schemas";

const title = "Blog: Customs News & Updates | Customs Wise";
const description =
  "News, updates and practical customs guidance from the Customs Wise team for businesses trading between the UK, Ireland and the EU.";

/** The newest post leads the blog. Same posts and components as the Blog section on /insights. */
const featured = blogPosts[0];

export const metadata = buildMetadata({ title, description, path: "/blog" });

export default function BlogPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema("/blog", title, description),
          breadcrumbSchema([{ name: "Blog", path: "/blog" }]),
          {
            "@type": "ItemList",
            itemListElement: blogPosts.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `/insights/blog/${p.slug}` })),
          },
        ]}
      />
      <PageHero
        title="Blog"
        intro="News and updates from the Customs Wise team."
        trail={[{ name: "Blog", path: "/blog" }]}
      />
      <section aria-label="Blog posts" className="py-16 sm:py-20">
        <div data-reveal className="container-site">
          {featured && (
            <>
              <FeaturedPost post={toSummary(featured)} />
              <div className="mt-12">
                <BlogExplorer posts={blogPosts.map(toSummary)} featuredSlug={featured.slug} />
              </div>
            </>
          )}
        </div>
      </section>
      <CTASection title="Need help with your customs requirements?" />
      <NewsletterSection />
    </>
  );
}
