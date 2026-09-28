import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/icons/brand-icon";
import { ContactDetails } from "@/components/sections/contact-details";
import { CTASection } from "@/components/sections/cta-section";
import { OfficeList } from "@/components/sections/office-list";
import { PageHero } from "@/components/sections/page-hero";
import { ProcessSection } from "@/components/sections/process-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { JsonLd } from "@/components/ui/json-ld";
import { services } from "@/lib/content";
import { images, imageQuality } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/structured-data/schemas";

const title = "About Customs Wise | Independent Customs Experts, UK & Ireland";
const description =
  "Independent customs broker for the UK and Ireland, backed by 30 years in customs compliance, with specialist food customs and partners in 50+ countries.";

export const metadata = buildMetadata({ title, description, path: "/about" });

/** Every statement below is taken from the client's Website Content 2.0 document. */
const pillars = [
  {
    icon: "/icons/officer.png",
    title: "Food customs is our core business",
    text: "Over half of our business is food and POAO clearance. Our dedicated food team has in-depth technical knowledge across a wide range of products and agricultural commodities.",
    link: { label: "Food customs", href: "/food-customs" },
  },
  {
    icon: "/icons/ship.png",
    title: "Any port in the UK and Ireland",
    text: "We clear imports and exports at any UK or Irish port, with a team experienced in both inventory-linked and Ro-Ro movements.",
    link: { label: "Our services", href: "/services" },
  },
  {
    icon: "/icons/map.png",
    title: "A worldwide partner network",
    text: "We are part of a global network of trusted customs brokers, with access to partners in more than 50 countries through the AEB platform.",
    link: { label: "Worldwide clearance", href: "/services#worldwide-customs-clearance" },
  },
  {
    icon: "/icons/express.png",
    title: "Independent, alongside your hauliers",
    text: "As an independent customs broker, we work closely with hauliers and freight forwarders, providing timely, accurate declarations that keep trucks, trailers and containers moving.",
    link: { label: "Industries we support", href: "/industries" },
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={[webPageSchema("/about", title, description, "AboutPage"), breadcrumbSchema([{ name: "About", path: "/about" }])]} />
      <PageHero
        title="About Customs Wise"
        intro="Independent customs experts in the UK and Ireland, keeping customs simple for importers, exporters and their freight partners."
        trail={[{ name: "About", path: "/about" }]}
        image={images.inspector}
      />

      <section aria-labelledby="who-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Who we are</p>
            <h2 id="who-title" className="text-[clamp(2rem,3.6vw,3rem)]">Customs expertise that saves you time and money</h2>
            <p className="mt-5 text-[1.12rem] text-ink-soft">
              We are your trusted independent customs experts in the UK and Ireland, providing the most efficient solutions to save you time and
              money, with access to a global network of customs brokers providing support worldwide.
            </p>
            <p className="mt-4 text-ink-soft">
              Backed by 30 years&apos; experience in customs compliance, our staff understand the intricacies of even the most complex requirements
              and work to get your shipments through customs without delay.
            </p>
            <p className="mt-4 text-ink-soft">
              Our focus is on accurate declarations, timely processing and proactive communication to keep your supply chain moving.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-brand">
            <Image src={images.pallets.src} alt={images.pallets.alt} fill sizes="(min-width:1024px) 50vw, 100vw" quality={imageQuality} className="object-cover" />
          </div>
        </div>
      </section>

      <section aria-labelledby="how-title" className="bg-mist py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading kicker="What sets us apart" title="How we work" id="how-title" />
          <ul className="grid gap-5 sm:grid-cols-2">
            {pillars.map((p) => (
              <li key={p.title} className="flex flex-col gap-4 rounded-brand border border-line bg-salt p-6 sm:flex-row sm:gap-5">
                <BrandIcon src={p.icon} size={52} className="size-13 shrink-0" />
                <div>
                  <h3 className="text-[1.45rem]">{p.title}</h3>
                  <p className="mt-2 text-ink-soft">{p.text}</p>
                  <Link href={p.link.href} className="mt-3 inline-block font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
                    {p.link.label}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="services-list-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">What we do</p>
            <h2 id="services-list-title" className="text-[clamp(2rem,3.6vw,3rem)]">One team for every customs formality</h2>
            <p className="mt-4 text-ink-soft">From a single consignment to regular flows across several ports, we handle the declarations and notifications your goods need.</p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.slug} className="border-t border-line">
                <Link href={`/services#${s.slug}`} className="group flex items-center gap-3.5 py-4">
                  <BrandIcon src={s.icon} size={36} className="size-9 shrink-0" />
                  <span className="font-semibold text-overnight group-hover:text-atlantic group-hover:underline group-hover:underline-offset-3">{s.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProcessSection />

      <section aria-labelledby="offices-title" className="bg-clearance py-16 text-[#e3ecf0] sm:py-24">
        <div data-reveal className="container-site grid items-start gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Where we are</p>
            <h2 id="offices-title" className="mb-8 text-[clamp(2rem,3.6vw,3rem)] text-salt">Our offices</h2>
            <OfficeList tone="dark" className="lg:grid-cols-2" />
          </div>
          <div>
            <h3 className="font-sans text-[0.95rem] font-semibold text-salt">Contact and opening hours</h3>
            <ContactDetails tone="dark" />
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
