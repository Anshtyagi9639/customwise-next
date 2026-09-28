import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/icons/brand-icon";
import { CTASection } from "@/components/sections/cta-section";
import { FaqList } from "@/components/sections/faq-list";
import { HeroActions } from "@/components/sections/hero-actions";
import { ImageCard } from "@/components/sections/image-card";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading } from "@/components/sections/section-heading";
import { CheckList } from "@/components/ui/check-list";
import { JsonLd } from "@/components/ui/json-ld";
import { foodGuides } from "@/lib/content";
import { capabilities, challenges, clearanceSteps, documents, foodChallengesIntro, foodFaqs, products, regions, whyFoodMatters } from "@/lib/content/food-customs";
import { images, imageQuality } from "@/lib/content/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/structured-data/schemas";

const title = "Food Customs Specialists: POAO, CATCH & Fresh Produce | Customs Wise";
const description =
  "Specialist food customs broker for the UK and Ireland. POAO, CATCH certificates, fresh produce, CHED-P, CHED-PP and TRACES and IPAFFS pre-notifications.";

export const metadata = buildMetadata({ title, description, path: "/food-customs" });

const cheds = [
  { doc: "CHED-P", use: "Products of animal origin, such as meat, dairy, eggs, fish and honey" },
  { doc: "CHED-PP", use: "Regulated plants and plant products, including many fresh fruits and vegetables" },
  { doc: "CHED-D", use: "Food or feed of non-animal origin under enhanced food-safety controls, such as pesticide residue checks" },
];

const related = [
  { title: "TRACES & IPAFFS entries", text: "Pre-notifications for Great Britain and Ireland", href: "/services#traces-ipaffs-entries" },
  { title: "Import customs clearance", text: "At any port in the UK and Ireland", href: "/services#import-customs-clearance" },
  { title: "Food and beverages", text: "How we support food businesses", href: "/industries#food-and-beverages" },
  { title: "Incoterms and food shipments", text: "Who handles TRACES, IPAFFS and CHEDs", href: "/insights/incoterms" },
];

export default function FoodCustomsPage() {
  return (
    <>
      <JsonLd data={[webPageSchema("/food-customs", title, description), breadcrumbSchema([{ name: "Food Customs", path: "/food-customs" }]), faqSchema(foodFaqs)]} />
      <PageHero
        title="Food customs specialists"
        intro="POAO, fish, fresh produce and the TRACES and IPAFFS entries that go with them, for food moving into and out of the UK and Ireland."
        trail={[{ name: "Food Customs", path: "/food-customs" }]}
        image={images.food}
      >
        <HeroActions href="/contact?service=food#enquiry" />
      </PageHero>

      {/* Overview */}
      <section aria-labelledby="overview-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Overview</p>
            <h2 id="overview-title" className="text-[clamp(2rem,3.6vw,3rem)]">Food is our core business</h2>
            <p className="mt-5 text-[1.12rem] text-ink-soft">
              Customs Wise specialises in supporting the food industry, with over half of our business being food and POAO clearances.
            </p>
            <p className="mt-4 text-ink-soft">
              We have over thirty years of experience supporting businesses importing and exporting food and beverages. Our dedicated food team
              has in-depth technical knowledge across a wide range of products and agricultural commodities.
            </p>
            <h3 className="mt-7 font-sans text-[0.85rem] font-bold tracking-wider text-overnight uppercase">Products we clear</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {products.map((p) => (
                <li key={p} className="rounded-full border border-line bg-mist px-3.5 py-1.5 text-[0.88rem] font-semibold text-ship">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-brand">
            <Image src={images.food.src} alt={images.food.alt} fill sizes="(min-width:1024px) 50vw, 100vw" quality={imageQuality} className="object-cover" />
          </div>
        </div>
      </section>

      {/* Why customs matters for food */}
      <section aria-labelledby="why-title" className="bg-mist py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading kicker="Why it matters" title="Why food needs a specialist broker" id="why-title" intro={foodChallengesIntro} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyFoodMatters.map((w, i) => (
              <li key={w.title} className="rounded-brand border-t-4 border-freight bg-salt p-6 shadow-[0_1px_2px_rgb(0_3_21/0.06)]">
                <span aria-hidden className="font-display text-[2.2rem] leading-none text-atlantic/25">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-[1.35rem] text-overnight">{w.title}</h3>
                <p className="mt-2 text-[0.93rem] text-ink-soft">{w.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl text-ink-soft">
            Using a specialist broker ensures maximum efficiency, so your goods are cleared as quickly and compliantly as possible.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section aria-labelledby="capabilities-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading kicker="What we handle" title="Food customs capabilities" id="capabilities-title" />
          <ul className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="group flex h-full gap-5 rounded-brand border border-line p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-atlantic hover:shadow-card"
                >
                  <BrandIcon src={c.icon} size={52} className="size-13 shrink-0" />
                  <span>
                    <span className="block font-display text-[1.5rem] leading-tight text-atlantic group-hover:text-freight">{c.title}</span>
                    <span className="mt-2 block text-ink-soft">{c.text}</span>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[0.92rem] font-bold text-atlantic">
                      Learn more <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Import / export considerations */}
      <section aria-labelledby="regions-title" className="bg-mist py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading
            kicker="Import and export"
            title="Great Britain and Ireland run different systems"
            id="regions-title"
            intro="The process depends on the commodity, its origin, the country of dispatch and the destination, not simply the route the vehicle takes."
          />
          <ul className="grid gap-5 lg:grid-cols-3">
            {regions.map((r) => (
              <li key={r.title} className="flex flex-col rounded-brand bg-salt p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[1.5rem]">{r.title}</h3>
                  <span className="rounded-full bg-ship px-3 py-1 text-[0.78rem] font-bold tracking-wide text-cargo">{r.system}</span>
                </div>
                <ul className="mt-4 space-y-3 border-t border-line pt-4">
                  {r.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5 text-[0.93rem] text-ink-soft">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-freight" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[0.93rem] text-ink-soft">
            Full detail in our guides to{" "}
            <Link href="/food-customs/products-of-animal-origin" className="font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              POAO
            </Link>
            ,{" "}
            <Link href="/food-customs/catch-certificates" className="font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              CATCH certificates
            </Link>{" "}
            and{" "}
            <Link href="/food-customs/fresh-produce" className="font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              fresh produce
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Process */}
      <section aria-labelledby="process-title" className="bg-clearance py-16 text-[#e3ecf0] sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading
            tone="dark"
            kicker="How it works"
            title="How we clear a controlled food consignment"
            id="process-title"
            intro="We handle the full process, so the health certificate, CHED, customs declaration and the goods all match."
          />
          <ol className="grid gap-px overflow-hidden rounded-brand border border-salt/12 bg-salt/12 md:grid-cols-5">
            {clearanceSteps.map((s, i) => (
              <li key={s.title} className="bg-overnight/60 p-6">
                <span aria-hidden className="font-display text-[2.6rem] leading-none text-cargo">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-[1.3rem] text-salt">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.9rem] text-[#c9d8de]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Documents + CHED */}
      <section aria-labelledby="documents-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Documentation</p>
            <h2 id="documents-title" className="text-[clamp(2rem,3.6vw,3rem)]">What your consignment may need</h2>
            <p className="mt-4 text-ink-soft">The exact set depends on the product, its origin and destination. We confirm it for your shipment before goods move.</p>
            <CheckList items={documents} className="mt-6" />
          </div>
          <div>
            <h3 className="text-[1.6rem] text-overnight">Which CHED does my consignment need?</h3>
            <p className="mt-2 text-ink-soft">A Common Health Entry Document (CHED) accompanies controlled food consignments through the Border Control Post.</p>
            <div className="table-cw">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Document</th>
                    <th scope="col">Used for</th>
                  </tr>
                </thead>
                <tbody>
                  {cheds.map((c) => (
                    <tr key={c.doc}>
                      <th scope="row" className="whitespace-nowrap">
                        {c.doc}
                      </th>
                      <td>{c.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Common challenges */}
      <section aria-labelledby="challenges-title" className="bg-mist py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading kicker="Common challenges" title="Where food shipments get held, and how we prevent it" id="challenges-title" />
          <ul className="grid gap-5 lg:grid-cols-3">
            {challenges.map((c) => (
              <li key={c.problem} className="flex flex-col overflow-hidden rounded-brand bg-salt">
                <div className="flex-1 p-6">
                  <AlertTriangle aria-hidden className="size-6 text-freight" />
                  <h3 className="mt-3 text-[1.35rem] text-overnight">{c.problem}</h3>
                  <p className="mt-2 text-[0.93rem] text-ink-soft">{c.impact}</p>
                </div>
                <p className="flex items-start gap-2.5 border-t border-line bg-salt px-6 py-4 text-[0.93rem] font-semibold text-ship">
                  <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-transit" />
                  {c.fix}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="food-faq-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site grid items-start gap-10 lg:grid-cols-[0.8fr_1.5fr] lg:gap-16">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">FAQs</p>
            <h2 id="food-faq-title" className="text-[clamp(2rem,3.6vw,3rem)]">Food customs questions</h2>
            <Link href="/faqs" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              General customs FAQs <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <FaqList items={foodFaqs} />
        </div>
      </section>

      {/* Guides */}
      <section aria-labelledby="guides-title" className="bg-mist py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading kicker="In-depth guides" title="Food customs guides" id="guides-title" intro="Practical guidance on the rules for each type of food consignment." />
          <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {foodGuides.map((g) => (
              <li key={g.href}>
                <ImageCard href={g.href} title={g.title} summary={g.summary} image={g.image} cta="Read the guide" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Related services */}
      <section aria-labelledby="related-title" className="py-16 sm:py-20">
        <div data-reveal className="container-site">
          <h2 id="related-title" className="mb-7 text-[clamp(1.8rem,3vw,2.4rem)]">
            Related services
          </h2>
          <ul className="grid gap-px overflow-hidden rounded-brand border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.href} className="bg-salt">
                <Link href={r.href} className="group block h-full p-5.5 transition-colors hover:bg-mist">
                  <span className="block font-display text-[1.25rem] leading-tight text-atlantic group-hover:text-freight">{r.title}</span>
                  <span className="mt-1 block text-[0.9rem] text-ink-soft">{r.text}</span>
                  <ArrowRight aria-hidden className="mt-3 size-4 text-freight transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTASection title="Moving food into the UK or Ireland?" text="Our food team handles certificates, CHEDs, pre-notifications and BCP checks." href="/contact?service=food#enquiry" />
    </>
  );
}
