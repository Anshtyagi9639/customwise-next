import { VehicleImportExportGuide } from "@/components/content/vehicle-import-export-guide";
import { ArticleLayout, insightsAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/insights/vehicle-import-export";
const heading = "How to Import or Export Vehicles in the UK and Ireland: A Guide for Businesses and Individuals";
const title = "How to Import or Export Vehicles in the UK and Ireland | Customs Wise";
const description =
  "Customs paperwork, taxes and registration for permanent vehicle movements between Great Britain, Northern Ireland and Ireland: NOVA, DVLA, VRT and the documents you need.";
const trail = [{ name: "Customs Insights", path: "/insights" }, { name: "Importing and exporting vehicles", path }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, heading, description), breadcrumbSchema(trail)]} />
      <PageHero
        title={heading}
        intro="Customs paperwork, taxes and registration for permanent vehicle movements. Approximately 5-minute read."
        trail={trail}
        image={images.cars}
      />
      <ArticleLayout {...insightsAside}>
        <VehicleImportExportGuide />
      </ArticleLayout>
    </>
  );
}
