import { CTASection } from "@/components/sections/cta-section";
import { FeatureRow } from "@/components/sections/feature-row";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/ui/json-ld";
import { industries } from "@/lib/content";
import { images } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/structured-data/schemas";

const title = "Industries: Food, Freight, Chemicals, Manufacturing & Vehicles | Customs Wise";
const description =
  "Customs clearance for food and beverages, freight partners, chemicals and gases, manufacturing, construction and vehicle imports across the UK and Ireland.";

export const metadata = buildMetadata({ title, description, path: "/industries" });

export default function IndustriesPage() {
  return (
    <>
      <JsonLd data={[webPageSchema("/industries", title, description), breadcrumbSchema([{ name: "Industries", path: "/industries" }])]} />
      <PageHero
        title="Specialist industries we support"
        intro="Clearing some complex goods often requires in-depth technical knowledge. We have 75 employees across five countries, with expertise across a wide range of industries."
        trail={[{ name: "Industries", path: "/industries" }]}
        image={images.hero}
      />
      <div className="container-site pt-4 pb-10">
        {industries.map((ind, i) => (
          <FeatureRow key={ind.slug} id={ind.slug} title={ind.title} body={ind.body} image={ind.image} icon={ind.icon} links={ind.links} reverse={i % 2 === 1} />
        ))}
      </div>
      <CTASection />
    </>
  );
}
