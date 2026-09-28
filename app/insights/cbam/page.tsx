import { CbamGuide } from "@/components/content/cbam-guide";
import { ArticleLayout, insightsAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/insights/cbam";
const title = "CBAM Guide for UK and Ireland Importers | Carbon Border Adjustment Mechanism";
const description =
  "Understand CBAM in the UK and Ireland: covered goods, carbon reporting, thresholds, EU CBAM certificates and what importers need to do from 2026 and 2027.";
const trail = [{ name: "Customs Insights", path: "/insights" }, { name: "CBAM", path: "/insights/cbam" }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, "CBAM: a simple guide for UK and Irish importers", description), breadcrumbSchema(trail)]} />
      <PageHero
        title="CBAM: a simple guide for UK and Irish importers"
        intro="Covered goods, carbon reporting, thresholds, EU CBAM certificates and what importers need to do from 2026 and 2027."
        trail={trail}
        image={images.steel}
      />
      <ArticleLayout {...insightsAside}>
        <CbamGuide />
      </ArticleLayout>
    </>
  );
}
