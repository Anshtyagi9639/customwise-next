import Link from "next/link";
import { CTASection } from "@/components/sections/cta-section";
import { GuideCards } from "@/components/sections/guide-cards";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading } from "@/components/sections/section-heading";
import { JsonLd } from "@/components/ui/json-ld";
import { activeInsightCategories, allArticles } from "@/lib/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/structured-data/schemas";

const title = "Customs Insights: Blog, CBAM, EUDR & Incoterms Guides | Customs Wise";
const description =
  "Articles and practical guides on food customs, CBAM, the EU Deforestation Regulation, Incoterms and trade policy for businesses trading between the UK, Ireland and the EU.";

/** Blog posts have their own page at /blog, so the Insights page lists only the guide categories. */
const categories = activeInsightCategories.filter((c) => c.slug !== "blog");
const articles = allArticles.filter((a) => a.category !== "blog");

export const metadata = buildMetadata({ title, description, path: "/insights" });

export default function InsightsPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema("/insights", title, description),
          breadcrumbSchema([{ name: "Insights", path: "/insights" }]),
          {
            "@type": "ItemList",
            itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.title, url: a.href })),
          },
        ]}
      />
      <PageHero
        title="Customs Insights"
        intro="Plain-English guides to the regulations shaping trade between Great Britain, Ireland and the EU."
        trail={[{ name: "Insights", path: "/insights" }]}
      >
        <nav aria-label="Insight categories" className="mt-7">
          <ul className="flex flex-wrap gap-2.5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`#${c.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-salt/35 px-4 text-[0.92rem] font-semibold text-salt transition-colors hover:border-cargo hover:text-cargo"
                >
                  {c.label}
                  <span className="ml-2 rounded-full bg-salt/12 px-2 text-[0.78rem]">{articles.filter((a) => a.category === c.slug).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>
      {categories.map((c, i) => (
        <section
          key={c.slug}
          id={c.slug}
          aria-labelledby={`${c.slug}-title`}
          className={i % 2 ? "bg-mist py-16 sm:py-20" : "py-16 sm:py-20"}
        >
          <div data-reveal className="container-site">
            <SectionHeading title={c.label} id={`${c.slug}-title`} intro={c.description} />
            <GuideCards guides={articles.filter((a) => a.category === c.slug)} />
          </div>
        </section>
      ))}
      <CTASection title="Need help with your customs requirements?" />
    </>
  );
}
