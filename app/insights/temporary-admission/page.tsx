import { TemporaryAdmissionGuide } from "@/components/content/temporary-admission-guide";
import { ArticleLayout, insightsAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/insights/temporary-admission";
const heading = "Temporary Admission and Returned Goods Relief: A UK and Ireland Guide for Businesses";
const title = "Temporary Admission and Returned Goods Relief: UK and Ireland Guide | Customs Wise";
const description =
  "Temporary admission, returned goods relief, inward processing, outward processing and ATA carnets: which customs procedure fits goods moving into or out of Great Britain and Ireland.";
const trail = [{ name: "Customs Insights", path: "/insights" }, { name: "Temporary admission and returned goods", path }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, heading, description), breadcrumbSchema(trail)]} />
      <PageHero
        title={heading}
        intro="Temporary admission, returned goods relief, inward and outward processing and ATA carnets. Approximately 5-minute read."
        trail={trail}
        image={images.pallets}
      />
      <ArticleLayout {...insightsAside}>
        <TemporaryAdmissionGuide />
      </ArticleLayout>
    </>
  );
}
