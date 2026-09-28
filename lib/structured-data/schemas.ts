import { offices, site } from "@/lib/site";
import type { Faq, Service } from "@/types";

const orgId = `${site.url}/#organization`;
const abs = (path: string) => `${site.url}${path === "/" ? "/" : path}`;

export function organizationSchema() {
  const [hq, ...branches] = offices;
  const address = (o: (typeof offices)[number]) => ({
    "@type": "PostalAddress",
    streetAddress: o.street,
    addressLocality: o.locality,
    ...(o.region ? { addressRegion: o.region } : {}),
    ...(o.postalCode ? { postalCode: o.postalCode } : {}),
    addressCountry: o.countryCode,
  });
  return {
    "@type": "ProfessionalService",
    "@id": orgId,
    name: site.name,
    slogan: site.tagline,
    url: abs("/"),
    logo: abs("/logos/customs-wise-main-dark.png"),
    image: abs("/opengraph-image.png"),
    description: site.description,
    email: site.email,
    telephone: site.phone.e164,
    areaServed: ["Ireland", "United Kingdom"],
    sameAs: site.social.map((s) => s.href),
    address: address(hq),
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.schemaDays,
      opens: h.opens,
      closes: h.closes,
    })),
    department: branches.map((o) => ({ "@type": "Organization", name: `${site.name} ${o.city}`, address: address(o) })),
  };
}

export function websiteSchema() {
  return { "@type": "WebSite", "@id": `${site.url}/#website`, url: abs("/"), name: site.name, publisher: { "@id": orgId }, inLanguage: "en-GB" };
}

export function webPageSchema(path: string, name: string, description: string, type: "WebPage" | "AboutPage" | "ContactPage" = "WebPage") {
  return { "@type": type, "@id": `${abs(path)}#webpage`, url: abs(path), name, description, isPartOf: { "@id": `${site.url}/#website` }, about: { "@id": orgId }, inLanguage: "en-GB" };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export function servicesSchema(list: Service[]) {
  return list.map((s) => ({
    "@type": "Service",
    "@id": `${abs("/services")}#${s.slug}`,
    name: s.title,
    description: s.body.join(" "),
    provider: { "@id": orgId },
    areaServed: ["Ireland", "United Kingdom"],
    url: `${abs("/services")}#${s.slug}`,
  }));
}

export function articleSchema(path: string, headline: string, description: string) {
  return { "@type": "Article", headline, description, url: abs(path), mainEntityOfPage: abs(path), author: { "@id": orgId }, publisher: { "@id": orgId }, inLanguage: "en-GB" };
}

export function faqSchema(items: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}
