import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { ContactDetails } from "@/components/sections/contact-details";
import { OfficeList } from "@/components/sections/office-list";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { site } from "@/lib/site";
import { breadcrumbSchema, webPageSchema } from "@/lib/structured-data/schemas";
import { isEnquiryService } from "@/lib/validation/enquiry";

const title = "Contact Customs Wise | Dublin, Liverpool, India & Morocco";
const description =
  "Contact Customs Wise on +353 1 866 5644 or info@customswise.ie. Offices in Dublin, Liverpool, Gurugram and Tangier. Open 7 days a week.";

export const metadata = buildMetadata({ title, description, path: "/contact" });

const methods = [
  { icon: Phone, title: "Call us", value: site.phone.display, href: site.phone.href, note: "Open 7 days a week" },
  { icon: Mail, title: "Email us", value: site.email, href: `mailto:${site.email}`, note: "For enquiries and documents" },
  { icon: MapPin, title: "Visit us", value: "Dublin head office", href: "#offices", note: "Plus Liverpool, India and Morocco" },
];

type ContactPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { service } = await searchParams;
  const defaultService = isEnquiryService(service) ? service : undefined;

  return (
    <>
      <JsonLd data={[webPageSchema("/contact", title, description, "ContactPage"), breadcrumbSchema([{ name: "Contact", path: "/contact" }])]} />
      <PageHero title="Contact Customs Wise" intro="Send an enquiry, call the team, or visit one of our four offices." trail={[{ name: "Contact", path: "/contact" }]}>
        <ul className="mt-9 grid gap-3.5 sm:grid-cols-3">
          {methods.map((m) => {
            const Icon = m.icon;
            return (
              <li key={m.title}>
                <a
                  href={m.href}
                  className="group flex h-full items-start gap-3.5 rounded-brand border border-salt/15 bg-overnight/45 p-4.5 transition-[border-color,background-color] hover:border-cargo hover:bg-overnight/70"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-brand bg-cargo text-overnight">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.85rem] text-starlight">{m.title}</span>
                    <span className="block font-semibold break-words text-salt group-hover:text-cargo">{m.value}</span>
                    <span className="mt-0.5 block text-[0.82rem] text-starlight">{m.note}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </PageHero>

      <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-[calc(var(--nav-h)+1rem)] py-16 sm:py-20">
        <div data-reveal className="container-site grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Make an Enquiry</p>
            <h2 id="enquiry-title" className="text-[clamp(2rem,3.6vw,3rem)]">Tell us what you need to move</h2>
            <p className="mt-4 text-ink-soft">
              Share the commodity, origin, destination and route. Our team replies with the documents and steps your shipment needs.
            </p>
            <ContactDetails tone="light" />
            <div className="mt-8 rounded-brand bg-mist p-5">
              <h3 className="text-[1.3rem] text-overnight">Have a general question?</h3>
              <p className="mt-1.5 text-[0.95rem] text-ink-soft">Our FAQs cover documents, representation, commodity codes and duty.</p>
              <Link href="/faqs" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
                Read the customs FAQs <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
          <EnquiryForm idPrefix="contact" defaultService={defaultService} />
        </div>
      </section>

      <section id="offices" aria-labelledby="offices-title" className="scroll-mt-[calc(var(--nav-h)+1rem)] bg-mist py-16 sm:py-20">
        <div data-reveal className="container-site">
          <h2 id="offices-title" className="mb-8 text-[clamp(2rem,3.6vw,3rem)]">Our offices</h2>
          <OfficeList />
          <div className="mt-10 flex flex-wrap gap-3.5">
            <Button asChild>
              <a href={site.phone.href}>
                <Phone aria-hidden /> Call {site.phone.display}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${site.email}`}>
                <Mail aria-hidden /> Email {site.email}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
