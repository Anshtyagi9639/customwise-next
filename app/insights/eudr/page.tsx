import { EudrGuide } from "@/components/content/eudr-guide";
import { ArticleLayout, insightsAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/insights/eudr";
const title = "EUDR Explained: EU Deforestation Regulation for Importers | Customs Wise";
const description =
  "Which commodities the EUDR covers, operator and trader duties, application dates, due diligence statements in TRACES NT and penalties.";
const trail = [{ name: "Customs Insights", path: "/insights" }, { name: "EUDR", path: "/insights/eudr" }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, "EUDR explained", description), breadcrumbSchema(trail)]} />
      <PageHero
        title="EUDR explained"
        intro="What businesses need to know about the EU Deforestation Regulation."
        trail={trail}
        image={images.forest}
      />
      <ArticleLayout {...insightsAside}>
        <EudrGuide />
      </ArticleLayout>
    </>
  );
}
