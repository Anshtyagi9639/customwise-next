import { IncotermsGuide } from "@/components/content/incoterms-guide";
import { ArticleLayout, insightsAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/insights/incoterms";
const title = "Incoterms 2020 and Customs Responsibilities: A Practical Guide | Customs Wise";
const description =
  "Who handles export and import clearance, duty and VAT under each Incoterms 2020 rule, and how the delivery term affects customs valuation.";
const trail = [{ name: "Customs Insights", path: "/insights" }, { name: "Incoterms® 2020", path: "/insights/incoterms" }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, "Incoterms® 2020: a practical guide to customs responsibilities", description), breadcrumbSchema(trail)]} />
      <PageHero
        title="Incoterms® 2020: a practical guide to customs responsibilities"
        intro="Who arranges transport, who carries risk, and who handles export, import and transit formalities."
        trail={trail}
        image={images.shipPlane}
      />
      <ArticleLayout {...insightsAside}>
        <IncotermsGuide />
      </ArticleLayout>
    </>
  );
}
