import { ArrowRight, Barcode, ClipboardList, FileText, Leaf, Scale, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/icons/brand-icon";
import { CTASection } from "@/components/sections/cta-section";
import { FaqList } from "@/components/sections/faq-list";
import { HeroActions } from "@/components/sections/hero-actions";
import { PageHero } from "@/components/sections/page-hero";
import { ProcessSection } from "@/components/sections/process-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { CheckList } from "@/components/ui/check-list";
import { JsonLd } from "@/components/ui/json-ld";
import { faqs, industries, services } from "@/lib/content";
import { images, imageQuality } from "@/lib/content/images";
import { considerations, serviceDetails } from "@/lib/content/service-details";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, servicesSchema, webPageSchema } from "@/lib/structured-data/schemas";
import { midSentence } from "@/lib/utils/text";
import { cn } from "@/lib/utils/cn";

const title = "Customs Services: Import, Export, T1 Transit & Audit | Customs Wise";
const description =
  "Import and export customs clearance at any UK or Irish port, T1 transits via NCTS, customs audits, worldwide clearance and TRACES and IPAFFS entries.";

export const metadata = buildMetadata({ title, description, path: "/services" });

const considerationIcons = { "file-text": FileText, barcode: Barcode, users: Users, scale: Scale, clipboard: ClipboardList, leaf: Leaf } as const;
const serviceFaqs = faqs.filter((_, i) => [0, 1, 2, 4].includes(i));

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={[webPageSchema("/services", title, description), breadcrumbSchema([{ name: "Services", path: "/services" }]), ...servicesSchema(services)]} />
      <PageHero
        title="Customs services"
        intro="Import, export, transit, audit and food notifications, handled by one independent team across the UK and Ireland."
        trail={[{ name: "Services", path: "/services" }]}
        image={images.shipAerial}
      >
        <HeroActions />
      </PageHero>

      {/* Overview + service index */}
      <section aria-labelledby="overview-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site grid items-start gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Overview</p>
            <h2 id="overview-title" className="text-[clamp(2rem,3.6vw,3rem)]">Every customs formality, one team</h2>
            <p className="mt-5 text-[1.1rem] text-ink-soft">
              We are independent customs experts in the UK and Ireland, backed by 30 years&apos; experience in customs compliance.
            </p>
            <p className="mt-4 text-ink-soft">
              Our focus is on accurate declarations, timely processing and proactive communication, with access to a global network of customs
              brokers for support worldwide.
            </p>
          </div>
          <ul className="grid gap-3.5 sm:grid-cols-2">
            {services.map((s, i) => (
              <li key={s.slug}>
                <Link
                  href={`#${s.slug}`}
                  className="group flex h-full gap-4 rounded-brand border border-line bg-salt p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-atlantic hover:shadow-card"
                >
                  <BrandIcon src={s.icon} size={44} className="size-11 shrink-0" />
                  <span>
                    <span className="block text-[0.78rem] font-bold tracking-wider text-freight">0{i + 1}</span>
                    <span className="mt-0.5 block font-display text-[1.3rem] leading-tight text-atlantic group-hover:text-freight">{s.title}</span>
                    <span className="mt-1.5 block text-[0.9rem] leading-snug text-ink-soft">{s.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Detailed services */}
      {services.map((s, i) => {
        const d = serviceDetails[s.slug];
        const reverse = i % 2 === 1;
        return (
          <section key={s.slug} id={s.slug} aria-labelledby={`${s.slug}-title`} className={cn("scroll-mt-4 py-16 sm:py-20", i % 2 === 0 ? "bg-mist" : "bg-salt")}>
            <div data-reveal className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
              <div className={cn("lg:sticky lg:top-[calc(var(--nav-h)+2rem)]", reverse && "lg:order-2")}>
                {/* Natural aspect ratio, capped at the file's width: several service photos are small panoramic files that a fixed 4:3 crop would upscale */}
                <div className="relative mx-auto overflow-hidden rounded-brand bg-ship" style={{ aspectRatio: `${s.image.width} / ${s.image.height}`, maxWidth: s.image.width }}>
                  <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:1024px) 40vw, 100vw" quality={imageQuality} className="object-cover" />
                </div>
              </div>
              <div>
                <p className="text-[0.8rem] font-bold tracking-[0.14em] text-freight uppercase">Service 0{i + 1}</p>
                <h2 id={`${s.slug}-title`} tabIndex={-1} className="mt-2 text-[clamp(1.9rem,3.2vw,2.7rem)]">
                  {s.title}
                </h2>
                {s.body.map((p, k) => (
                  <p key={p} className={cn("mt-4 text-ink-soft", k === 0 && "text-[1.1rem]")}>
                    {p}
                  </p>
                ))}
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div className="border-t-2 border-atlantic pt-3.5">
                    <h3 className="font-sans text-[0.85rem] font-bold tracking-wider text-overnight uppercase">Who it&apos;s for</h3>
                    <p className="mt-2 text-[0.95rem] text-ink-soft">{d.whoFor}</p>
                  </div>
                  <div className="border-t-2 border-freight pt-3.5">
                    <h3 className="font-sans text-[0.85rem] font-bold tracking-wider text-overnight uppercase">What it achieves</h3>
                    <p className="mt-2 text-[0.95rem] text-ink-soft">{d.outcome}</p>
                  </div>
                </div>
                <h3 className="mt-8 font-sans text-[0.85rem] font-bold tracking-wider text-overnight uppercase">What we handle</h3>
                <CheckList items={d.handles} className="mt-3.5" />
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link
                    href={`/contact?service=${s.enquiryValue}#enquiry`}
                    className="inline-flex min-h-12 items-center gap-2 rounded-brand border-2 border-atlantic px-5 font-bold text-atlantic transition-colors hover:bg-atlantic hover:text-salt"
                  >
                    Enquire about {midSentence(s.title)} <ArrowRight aria-hidden className="size-4" />
                  </Link>
                  {d.more.map((l) => (
                    <Link key={l.href + l.label} href={l.href} className="text-[0.95rem] font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <ProcessSection />

      {/* Considerations */}
      <section aria-labelledby="considerations-title" className="bg-clearance py-16 text-[#e3ecf0] sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading
            tone="dark"
            kicker="Before your goods move"
            title="Key things to settle before a shipment"
            id="considerations-title"
            intro="Getting these right at the start prevents most delays, unexpected charges and compliance issues."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {considerations.map((c, i) => {
              const Icon = considerationIcons[c.icon];
              return (
                <li key={c.title} className="flex flex-col rounded-brand border border-salt/12 bg-overnight/45 p-6 transition-colors hover:border-cargo/60">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-brand bg-cargo text-overnight">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span aria-hidden className="font-display text-[2rem] leading-none text-salt/15">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[1.35rem] text-salt">{c.title}</h3>
                  <p className="mt-2 flex-1 text-[0.93rem] text-[#c9d8de]">{c.text}</p>
                  <Link href={c.link.href} className="mt-2 -mb-2 inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9rem] font-semibold text-cargo hover:underline">
                    {c.link.label} <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Industries */}
      <section aria-labelledby="industries-title" className="py-16 sm:py-24">
        <div data-reveal className="container-site">
          <SectionHeading
            kicker="Who we work with"
            title="Services shaped around your sector"
            id="industries-title"
            intro="Each sector moves goods differently. We understand the documents, licences and timings that matter in yours."
          />
          <ul className="grid gap-px overflow-hidden rounded-brand border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind) => (
              <li key={ind.slug} className="bg-salt">
                <Link href={`/industries#${ind.slug}`} className="group flex h-full gap-4 p-5.5 transition-colors hover:bg-mist">
                  <BrandIcon src={ind.icon} size={40} className="size-10 shrink-0" />
                  <span>
                    <span className="block font-display text-[1.3rem] leading-tight text-atlantic group-hover:text-freight">{ind.title}</span>
                    <span className="mt-1 block text-[0.9rem] text-ink-soft">{ind.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs */}
      <section aria-labelledby="services-faq-title" className="bg-mist py-16 sm:py-24">
        <div data-reveal className="container-site grid items-start gap-10 lg:grid-cols-[0.8fr_1.5fr] lg:gap-16">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">FAQs</p>
            <h2 id="services-faq-title" className="text-[clamp(2rem,3.6vw,3rem)]">Questions about our services</h2>
            <Link href="/faqs" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
              See all customs FAQs <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <FaqList items={serviceFaqs} />
        </div>
      </section>

      {/* Related: Food customs */}
      <section aria-labelledby="related-food-title" className="py-16 sm:py-20">
        <div data-reveal className="container-site grid items-center gap-8 overflow-hidden rounded-brand border border-line lg:grid-cols-2">
          <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-80">
            <Image src={images.food.src} alt={images.food.alt} fill sizes="(min-width:1024px) 50vw, 100vw" quality={imageQuality} className="object-cover" />
          </div>
          <div className="p-6 sm:p-10 lg:pl-2">
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Related</p>
            <h2 id="related-food-title" className="text-[clamp(1.9rem,3.2vw,2.6rem)]">Moving food? It&apos;s our core business</h2>
            <p className="mt-4 text-ink-soft">
              Over half of our business is food and POAO clearance, from health certificates and CHEDs to Border Control Post checks.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 font-semibold">
              <Link href="/food-customs" className="inline-flex items-center gap-1.5 text-atlantic underline underline-offset-3 hover:text-freight">
                Explore food customs <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/industries" className="inline-flex items-center gap-1.5 text-atlantic underline underline-offset-3 hover:text-freight">
                Explore industries <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
