import { FreshProduceGuide } from "@/components/content/fresh-produce-guide";
import { ArticleLayout, foodAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/food-customs/fresh-produce";
const title = "Importing and Exporting Fresh Fruit, Vegetables & Plant Products | UK and Ireland";
const description =
  "A practical guide to customs declarations, phytosanitary certificates, CHED-PP, IPAFFS, TRACES NT and plant-health rules for fresh produce moving to and from the UK and Ireland.";
const trail = [{ name: "Food Customs", path: "/food-customs" }, { name: "Fresh produce", path: "/food-customs/fresh-produce" }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, "Importing and exporting fresh produce", description), breadcrumbSchema(trail)]} />
      <PageHero
        title="Importing and exporting fresh produce"
        intro="A practical UK and Ireland guide to customs declarations, phytosanitary certificates, CHED-PP, IPAFFS, TRACES NT and plant-health rules."
        trail={trail}
        image={images.produce}
      />
      <ArticleLayout {...foodAside}>
        <FreshProduceGuide />
      </ArticleLayout>
    </>
  );
}
