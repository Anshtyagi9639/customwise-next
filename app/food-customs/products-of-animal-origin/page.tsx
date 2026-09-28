import { PoaoGuide } from "@/components/content/poao-guide";
import { ArticleLayout, foodAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/food-customs/products-of-animal-origin";
const title = "Importing POAO into the UK & Ireland: CHED-P, IPAFFS, TRACES | Customs Wise";
const description =
  "A guide to importing products of animal origin: health certificates, CHED-P, IPAFFS and TRACES NT pre-notifications and BCP veterinary checks.";
const trail = [{ name: "Food Customs", path: "/food-customs" }, { name: "Products of animal origin", path: "/food-customs/products-of-animal-origin" }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, "Importing and exporting POAO in the UK and Ireland", description), breadcrumbSchema(trail)]} />
      <PageHero
        title="Importing and exporting POAO in the UK and Ireland"
        intro="A guide to products of animal origin: health certificates, CHED-P, IPAFFS and TRACES pre-notifications, and veterinary checks at the Border Control Post."
        trail={trail}
        image={images.cattle}
      />
      <ArticleLayout {...foodAside}>
        <PoaoGuide />
      </ArticleLayout>
    </>
  );
}
