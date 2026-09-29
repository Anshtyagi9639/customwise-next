import Link from "next/link";
import { AboutSection } from "@/components/sections/about-section";
import { EnquirySection } from "@/components/sections/enquiry-section";
import { FactsBand } from "@/components/sections/facts-band";
import { FaqList } from "@/components/sections/faq-list";
import { FoodFeature } from "@/components/sections/food-feature";
import { GuideCards } from "@/components/sections/guide-cards";
import { NewsletterSection } from "@/components/sections/newsletter-section";
import { Hero } from "@/components/sections/hero";
import { ImageCard } from "@/components/sections/image-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { ServiceGrid } from "@/components/sections/service-grid";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { allArticles, faqs, industries } from "@/lib/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { webPageSchema } from "@/lib/structured-data/schemas";

const title = "Customs Broker for the UK & Ireland | Food & POAO Specialists | Customs Wise";
const description =
  "Independent customs broker for the UK and Ireland: import, export and T1 transit clearance at any port, plus specialist POAO, CATCH, IPAFFS and TRACES food customs.";

export const metadata = buildMetadata({ title, description, path: "/" });

const featuredIndustries = ["food-and-beverages", "chemicals-and-gases", "vehicles"];

export default function HomePage() {
  return (
    <>
      <JsonLd data={webPageSchema("/", title, description)} />
      <Hero />
      <FactsBand />
      <AboutSection />
      <ServiceGrid />
      <FoodFeature />

      <section aria-labelledby="industries-title" className="bg-mist py-16 sm:py-24 lg:py-28">
        <div data-reveal className="container-site">
          <SectionHeading
            kicker="Who we work with"
            title="Industries we clear for"
            id="industries-title"
            action={
              <Button asChild variant="outline">
                <Link href="/industries">View all industries</Link>
              </Button>
            }
          />
          <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {industries
              .filter((i) => featuredIndustries.includes(i.slug))
              .map((i) => (
                <li key={i.slug}>
                  <ImageCard href={`/industries#${i.slug}`} title={i.title} summary={i.summary} image={i.image} wide />
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="insights-title" className="py-16 sm:py-24 lg:py-28">
        <div data-reveal className="container-site">
          <SectionHeading
            kicker="Blog & Insights"
            title="Latest from our blog and insights"
            id="insights-title"
            intro="Practical guidance from the Customs Wise team on the customs rules that affect your goods."
            action={
              <Button asChild variant="outline">
                <Link href="/blog">View all Blog</Link>
              </Button>
            }
          />
          <GuideCards guides={allArticles.slice(0, 3)} />
        </div>
      </section>

      <NewsletterSection />

      <section aria-labelledby="faq-title" className="bg-mist py-16 sm:py-24 lg:py-28">
        <div data-reveal className="container-site">
          <SectionHeading kicker="FAQs" title="Common customs questions" id="faq-title" />
          <FaqList items={faqs.filter((_, i) => [0, 1, 4].includes(i))} />
          <p className="mt-6">
            <Link href="/faqs" className="font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              See all customs FAQs
            </Link>
          </p>
        </div>
      </section>

      <EnquirySection />
    </>
  );
}
