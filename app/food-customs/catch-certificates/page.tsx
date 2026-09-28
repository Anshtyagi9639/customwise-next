import { CatchGuide } from "@/components/content/catch-guide";
import { ArticleLayout, foodAside } from "@/components/layout/article-layout";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data/schemas";

const path = "/food-customs/catch-certificates";
const title = "Catch Certificates: EU CATCH System & UK IUU Rules | Customs Wise";
const description =
  "What a catch certificate is, how the EU CATCH system in TRACES NT and the UK IUU regime work, and how to import fish without border delays.";
const trail = [{ name: "Food Customs", path: "/food-customs" }, { name: "CATCH certificates", path: "/food-customs/catch-certificates" }];

export const metadata = buildMetadata({ title, description, path, type: "article" });

export default function Page() {
  return (
    <>
      <JsonLd data={[articleSchema(path, "CATCH certificates for fish imports", description), breadcrumbSchema(trail)]} />
      <PageHero
        title="CATCH certificates for fish imports"
        intro="How catch certificates, the EU CATCH system and the UK IUU catch certificate regime work for fresh, frozen and processed fish."
        trail={trail}
        image={images.fishCrates}
      />
      <ArticleLayout {...foodAside}>
        <CatchGuide />
      </ArticleLayout>
    </>
  );
}
