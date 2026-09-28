import { faqs, foodGuides, industries, services } from "@/lib/content";
import { offices, primaryCta, site } from "@/lib/site";

/**
 * Local, rule-based answers for the website assistant. No external AI service is used.
 * Every answer is built from existing site content (lib/site.ts, lib/content and page copy). Do not add facts here
 * that do not already appear on the website.
 */

export type ChatAction =
  | { kind: "route"; label: string; href: string }
  | { kind: "tel" | "mail"; label: string; href: string }
  | { kind: "enquiry"; label: string };

export type Reply = { paragraphs: string[]; bullets?: string[]; actions?: ChatAction[] };

type Topic = { id: string; keywords: string[]; reply: Reply };

const callAction: ChatAction = { kind: "tel", label: `Call ${site.phone.display}`, href: site.phone.href };
const enquiryAction: ChatAction = { kind: "enquiry", label: "Open the enquiry form" };
const hoursLines = site.hours.map((h) => `${h.days}: ${h.time}`);

export const welcome: Reply = { paragraphs: ["Hi! Welcome to Customs Wise. How can we help you today?"] };

/** Main menu, shown under the latest answer. `enquiry` scrolls to (or opens) the existing enquiry form. */
export const quickActions = [
  { id: "services", label: "Our Services" },
  { id: "food", label: "Food Customs" },
  { id: "industries", label: "Industries" },
  { id: "enquiry", label: primaryCta.label },
  { id: "call", label: "Call Us" },
] as const;

export type QuickActionId = (typeof quickActions)[number]["id"];

const main: Record<QuickActionId, Reply> = {
  services: {
    paragraphs: [
      // Services page overview
      "We are independent customs experts in the UK and Ireland, backed by 30 years' experience in customs compliance. Our services:",
    ],
    bullets: services.map((s) => s.title),
    actions: [{ kind: "route", label: "View Services", href: "/services" }],
  },
  food: {
    paragraphs: [
      // Food Customs page overview
      "Customs Wise specialises in supporting the food industry, with over half of our business being food and POAO clearances.",
      "Our dedicated food team has in-depth technical knowledge across a wide range of products and agricultural commodities. We can help with:",
    ],
    bullets: [...foodGuides.map((g) => g.title), "TRACES & IPAFFS entries"],
    actions: [{ kind: "route", label: "Explore Food Customs", href: "/food-customs" }],
  },
  industries: {
    paragraphs: [
      // Industries page intro
      "Every sector moves goods differently. We know the documents, licences and timings that matter in yours. Industries we support:",
    ],
    bullets: industries.map((i) => i.title),
    actions: [{ kind: "route", label: "View Industries", href: "/industries" }],
  },
  enquiry: {
    // Enquiry section copy (home and contact pages)
    paragraphs: ["Tell us what you need to move using our enquiry form, and our team replies with the documents and steps your shipment needs."],
    actions: [enquiryAction],
  },
  call: {
    paragraphs: [`You can call our customs team on ${site.phone.display}.`],
    bullets: hoursLines,
    actions: [callAction],
  },
};

export function quickReply(id: QuickActionId): Reply {
  return main[id];
}

/* Free-text matching: simple keyword scoring over topics built from site content. */

const serviceKeywords: Record<string, string[]> = {
  "import-customs-clearance": ["import", "importing", "ro-ro", "roro"],
  "export-customs-clearance": ["export", "exporting"],
  "customs-audit": ["audit", "compliance review"],
  "t1-transits": ["t1", "transit", "ncts"],
  "worldwide-customs-clearance": ["worldwide", "international", "global", "aeb", "overseas"],
  "traces-ipaffs-entries": ["traces", "ipaffs", "pre-notification", "prenotification"],
};

const industryKeywords: Record<string, string[]> = {
  "food-and-beverages": ["beverage", "drinks"],
  "freight-partners": ["haulier", "forwarder", "freight", "haulage"],
  "chemicals-and-gases": ["chemical", "gas", "gases", "hazardous"],
  manufacturing: ["manufactur", "retail", "electrical", "clothing", "fashion"],
  construction: ["construction", "machinery", "project cargo", "building"],
  vehicles: ["vehicle", "car", "cars", "car parts"],
};

const foodGuideKeywords: Record<string, string[]> = {
  "/food-customs/products-of-animal-origin": ["poao", "animal origin", "meat", "dairy", "eggs", "honey", "ched-p", "veterinary"],
  "/food-customs/catch-certificates": ["catch", "fish", "seafood", "iuu"],
  "/food-customs/fresh-produce": ["produce", "fruit", "vegetable", "phytosanitary", "plant", "ched-pp"],
};

const faqKeywords: string[][] = [
  ["document", "documents", "paperwork", "packing list", "commercial invoice"],
  ["representation", "direct representation", "indirect representation"],
  ["commodity code", "hs code", "tariff code", "classify", "classification"],
  ["bti", "binding tariff"],
  ["duty", "duties", "vat", "tax"],
  ["pbn", "gmr", "ens", "entry summary"],
];

const topics: Topic[] = [
  ...faqs.map((f, i) => ({
    id: `faq-${i}`,
    keywords: faqKeywords[i] ?? [],
    reply: { paragraphs: [f.answer], actions: [{ kind: "route", label: "View all FAQs", href: "/faqs" }] } satisfies Reply,
  })),
  ...foodGuides.map((g) => ({
    id: g.href,
    keywords: foodGuideKeywords[g.href] ?? [],
    reply: { paragraphs: [`${g.title}: ${g.summary}`], actions: [{ kind: "route", label: "Read the guide", href: g.href }] } satisfies Reply,
  })),
  ...services.map((s) => ({
    id: s.slug,
    keywords: serviceKeywords[s.slug] ?? [],
    reply: { paragraphs: [`${s.title}: ${s.summary}`], actions: [{ kind: "route", label: "Read more", href: `/services#${s.slug}` }, enquiryAction] } satisfies Reply,
  })),
  ...industries.map((ind) => ({
    id: ind.slug,
    keywords: industryKeywords[ind.slug] ?? [],
    reply: { paragraphs: [`${ind.title}: ${ind.summary}`], actions: [{ kind: "route", label: "Read more", href: `/industries#${ind.slug}` }] } satisfies Reply,
  })),
  { id: "food", keywords: ["food", "perishable", "border control post", "bcp", "port health"], reply: main.food },
  { id: "services", keywords: ["service", "services", "clearance", "clear", "customs", "broker", "declaration", "what do you do"], reply: main.services },
  { id: "industries", keywords: ["industry", "industries", "sector", "sectors"], reply: main.industries },
  { id: "enquiry", keywords: ["enquiry", "enquire", "inquiry", "quote", "quotation", "form", "get started"], reply: main.enquiry },
  { id: "call", keywords: ["call", "phone", "telephone", "ring", "number", "speak", "talk"], reply: main.call },
  {
    id: "email",
    keywords: ["email", "e-mail", "mail", "write"],
    reply: { paragraphs: [`You can email our team at ${site.email}.`], actions: [{ kind: "mail", label: `Email ${site.email}`, href: `mailto:${site.email}` }] },
  },
  {
    id: "hours",
    keywords: ["hours", "open", "opening", "closed", "weekend", "saturday", "sunday", "when"],
    reply: { paragraphs: ["Our opening hours:"], bullets: hoursLines, actions: [callAction] },
  },
  {
    id: "offices",
    keywords: ["office", "offices", "address", "location", "located", "where", "based", "visit", ...offices.map((o) => o.city.toLowerCase())],
    reply: {
      paragraphs: ["Our offices:"],
      bullets: offices.map((o) => `${o.city}${o.isHeadOffice ? " (head office)" : ""}: ${o.lines.join(", ")}`),
      actions: [{ kind: "route", label: "Contact details", href: "/contact" }],
    },
  },
  { id: "thanks", keywords: ["thanks", "thank you", "cheers"], reply: { paragraphs: ["You're welcome. Is there anything else we can help with?"] } },
  { id: "hello", keywords: ["hello", "hi", "hey", "good morning", "good afternoon"], reply: welcome },
];

const fallback: Reply = {
  paragraphs: [
    "Sorry, I can only answer general questions about Customs Wise. Choose a topic below, or our customs team can help with your shipment directly.",
  ],
  actions: [enquiryAction, callAction],
};

function normalise(text: string) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9&\- ]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

/** Scores each topic by how many of its keywords appear in the message (whole words, or word prefixes ending in a letter). */
export function answer(message: string): Reply {
  const text = normalise(message);
  let best: { score: number; reply: Reply } | undefined;
  for (const t of topics) {
    let score = 0;
    for (const k of t.keywords) {
      // Longer phrases are more specific, so they score higher.
      if (text.includes(` ${k} `) || (k.length > 4 && text.includes(` ${k}`))) score += k.split(" ").length;
    }
    if (score > (best?.score ?? 0)) best = { score, reply: t.reply };
  }
  return best?.reply ?? fallback;
}
