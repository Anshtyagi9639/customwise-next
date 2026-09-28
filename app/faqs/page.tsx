import Link from "next/link";
import { CTASection } from "@/components/sections/cta-section";
import { FaqList } from "@/components/sections/faq-list";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { faqs } from "@/lib/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/structured-data/schemas";

const title = "Customs Clearance FAQs | Customs Wise";
const description =
  "Answers on customs documents, direct and indirect representation, commodity codes, BTI, duty calculation, and PBN, GMR and ENS references.";

export const metadata = buildMetadata({ title, description, path: "/faqs" });

export default function FaqsPage() {
  return (
    <>
      <JsonLd data={[faqSchema(faqs), breadcrumbSchema([{ name: "FAQs", path: "/faqs" }])]} />
      <PageHero title="Customs FAQs" intro="Straight answers to the questions importers and exporters ask us most." trail={[{ name: "FAQs", path: "/faqs" }]} />
      <section className="py-16 sm:py-20">
        <div data-reveal className="container-site">
          <FaqList items={faqs} />
          <p className="mt-8 text-ink-soft">
            Have a question that isn&apos;t here?{" "}
            <Link href="/contact" className="font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              Ask our team
            </Link>
            .
          </p>
        </div>
      </section>
      <CTASection />
    </>
  );
}
