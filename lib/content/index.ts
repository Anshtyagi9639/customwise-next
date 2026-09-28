import type { Faq, Guide, ImageAsset, Industry, InsightCategory, Service } from "@/types";
import { blogPosts, blogTopics, postPath } from "./blog";
import { images } from "./images";

/** Copy from the client's Website Content 2.0 document, lightly edited for the web. */
export const services: Service[] = [
  {
    slug: "import-customs-clearance",
    title: "Import customs clearance",
    shortTitle: "Import clearance",
    summary: "Full import clearance at any port in the UK and Ireland, including inventory-linked and Ro-Ro movements.",
    body: [
      "We provide full import customs clearance at any port in the UK and Ireland, supported by a team experienced in both inventory-linked and Ro-Ro movements.",
      "Our focus is on accurate declarations, timely processing and proactive communication to keep your supply chain moving.",
    ],
    icon: "/icons/ship.png",
    image: images.shipAerial,
    enquiryValue: "import",
    related: [{ label: "How Incoterms affect import valuation", href: "/insights/incoterms" }],
  },
  {
    slug: "export-customs-clearance",
    title: "Export customs clearance",
    shortTitle: "Export clearance",
    summary: "Documentation, routing and carrier coordination for exports from any UK or Irish port.",
    body: [
      "We handle export customs clearance for shipments from any port in the UK and Ireland, with strong expertise in inventory-based and Ro-Ro movements.",
      "Our team manages documentation, routing and carrier coordination to minimise delays and keep your export operations compliant and efficient.",
    ],
    icon: "/icons/crane.png",
    image: images.exportStamp,
    enquiryValue: "export",
  },
  {
    slug: "customs-audit",
    title: "Customs audit",
    shortTitle: "Customs audit",
    summary: "A review of your declarations and data to find HS code, valuation and origin errors before they cost you.",
    body: [
      "Our dedicated compliance team delivers focused customs audits to help your business stay compliant and reduce risk.",
      "We review your import and export processes, declarations and supporting data to identify issues such as mis-declared HS codes, incorrect valuations, origin claims and other errors that could trigger penalties or delays.",
    ],
    icon: "/icons/docs.png",
    image: images.inspector,
    enquiryValue: "audit",
  },
  {
    slug: "t1-transits",
    title: "T1 transits",
    shortTitle: "T1 transits",
    summary: "T1 declarations opened at departure and closed at destination through NCTS for non-EU goods.",
    body: [
      "Using the NCTS, we arrange and manage T1 transit documents for non-EU goods moving through the UK, Ireland and the EU, keeping your consignments compliant while in transit.",
      "Our team opens T1 declarations at departure and closes them at destination.",
    ],
    icon: "/icons/lorry.png",
    image: images.hero,
    enquiryValue: "t1",
  },
  {
    slug: "worldwide-customs-clearance",
    title: "Worldwide customs clearance",
    shortTitle: "Worldwide clearance",
    summary: "End-to-end compliance through partner brokers in more than 50 countries on the AEB platform.",
    body: [
      "We are part of a global network of trusted customs brokers, with access to partners in more than 50 countries through the AEB platform.",
      "This means we can arrange end-to-end customs compliance for your shipments, wherever your goods are moving.",
    ],
    icon: "/icons/plane.png",
    image: images.shipPlane,
    enquiryValue: "worldwide",
  },
  {
    slug: "traces-ipaffs-entries",
    title: "TRACES & IPAFFS entries",
    shortTitle: "TRACES & IPAFFS",
    summary: "Notifications and supporting documents prepared and submitted for food consignments entering the UK and Ireland.",
    body: [
      "As food customs experts, we prepare and submit entries through both the UK IPAFFS and EU TRACES NT systems.",
      "Our experienced team helps ensure the correct notifications and supporting documentation are completed accurately and on time for food consignments entering the UK and Ireland.",
    ],
    icon: "/icons/officer.png",
    image: images.fishCrates,
    enquiryValue: "traces",
    related: [{ label: "Food customs overview", href: "/food-customs" }],
  },
];

export const industries: Industry[] = [
  {
    slug: "food-and-beverages",
    title: "Food and beverages",
    summary: "Dairy, meat, fresh produce and processed foods cleared quickly and compliantly.",
    body: [
      "Food and beverage is where our greatest expertise lies. We clear all major commodity groups, including dairy, meat, fresh produce and processed foods, for customers worldwide who rely on us to move perishable goods quickly and compliantly.",
      "Our team understands the critical role of temperature control, shelf life and port timing, and works to ensure declarations, health certificates and any SPS checks are in place before arrival.",
    ],
    icon: "/icons/warehouse.png",
    image: images.food,
    links: [
      { label: "Food customs services", href: "/food-customs" },
      { label: "Make a food enquiry", href: "/contact?service=food#enquiry" },
    ],
  },
  {
    slug: "freight-partners",
    title: "Freight partners",
    summary: "Timely declarations for hauliers and forwarders working to port cut-offs.",
    body: [
      "As an independent customs broker, we work closely alongside hauliers and freight forwarders across the UK and Ireland, providing timely, accurate declarations that keep trucks, trailers and containers moving.",
      "We understand the pressures of tight schedules, port cut-offs and Ro-Ro operations.",
    ],
    icon: "/icons/express.png",
    image: images.hero,
    links: [
      { label: "T1 transit declarations", href: "/services#t1-transits" },
      { label: "Talk to our team", href: "/contact" },
    ],
  },
  {
    slug: "chemicals-and-gases",
    title: "Chemicals and gases",
    summary: "Hazardous and non-hazardous products moving daily between the UK and Ireland.",
    body: [
      "We support some of the largest operators in the chemicals and gases sector, moving hazardous and non-hazardous products between the UK and Ireland on a daily basis.",
      "With dedicated partners in chemical transport, we understand the full logistics process for these goods.",
    ],
    icon: "/icons/hazard.png",
    image: images.gas,
    links: [
      { label: "Import and export clearance", href: "/services#import-customs-clearance" },
      { label: "Talk to our team", href: "/contact" },
    ],
  },
  {
    slug: "manufacturing",
    title: "Manufacturing",
    summary: "Consistent, repeatable customs processes for manufactured and retail goods.",
    body: [
      "With over 75 employees across five countries, we have extensive experience clearing a wide variety of manufactured and retail goods, from specialist electrical equipment and components to fashion, clothing and consumer products.",
      "We understand global supply chains and the need for consistent, repeatable customs processes across multiple sites and suppliers.",
    ],
    icon: "/icons/forklift.png",
    image: images.pallets,
    links: [
      { label: "Customs audit", href: "/services#customs-audit" },
      { label: "Worldwide clearance", href: "/services#worldwide-customs-clearance" },
    ],
  },
  {
    slug: "construction",
    title: "Construction",
    summary: "Declarations aligned to project timelines for materials, machinery and project cargo.",
    body: [
      "We support the construction sector with tailored customs solutions for specialist materials and equipment, including structural products, machinery and project cargo.",
      "Working with trusted partners who move construction materials regularly, we understand the documentation, licensing and routing requirements for these shipments. Our team coordinates declarations to align with project timelines and site delivery schedules, helping to avoid hold-ups at ports and borders.",
    ],
    icon: "/icons/scale.png",
    image: images.steel,
    links: [{ label: "CBAM for steel and aluminium imports", href: "/insights/cbam" }],
  },
  {
    slug: "vehicles",
    title: "Vehicles",
    summary: "Vehicle imports and high-volume car parts, with accurate classification and valuation.",
    body: [
      "We assist both private individuals and businesses importing vehicles into the UK and Ireland, handling everything from customs declarations to VAT and duty calculations.",
      "We also work with companies importing high volumes of car parts and components, where accurate HS classification, origin claims and valuation are critical to controlling duty costs and compliance.",
    ],
    icon: "/icons/truck.png",
    image: images.cars,
    links: [{ label: "Enquire about a vehicle import", href: "/contact?service=import#enquiry" }],
  },
];

export const foodGuides: (Guide & { image: ImageAsset })[] = [
  { href: "/food-customs/products-of-animal-origin", title: "Products of animal origin", tag: "Food customs", category: "food-customs", summary: "Health certificates, CHED-P, pre-notification and veterinary checks at the BCP.", image: images.cattle },
  { href: "/food-customs/catch-certificates", title: "CATCH certificates", tag: "Food customs", category: "food-customs", summary: "The EU CATCH system and the UK IUU catch certificate regime for wild-caught fish.", image: images.fishCrates },
  { href: "/food-customs/fresh-produce", title: "Fresh produce", tag: "Food customs", category: "food-customs", summary: "Phytosanitary certificates, CHED-PP and marketing standards for fruit and vegetables.", image: images.produce },
];

export const insights: (Guide & { image: ImageAsset })[] = [
  { href: "/insights/cbam", title: "CBAM for UK and Irish importers", tag: "Carbon pricing", category: "trade-compliance", summary: "Covered goods, thresholds and what changes in 2026 and 2027.", image: images.steel },
  { href: "/insights/eudr", title: "EUDR explained", tag: "Due diligence", category: "trade-compliance", summary: "Which commodities are in scope and how the due diligence statement works.", image: images.forest },
  { href: "/insights/incoterms", title: "Incoterms® 2020 and customs", tag: "Trade terms", category: "trade-compliance", summary: "Who declares, who pays duty and VAT, and how terms affect valuation.", image: images.shipPlane },
];

/** Insight categories. To publish a new article: add its page under app/, then add an entry to the list for its category. */
export const insightCategories: InsightCategory[] = [
  { slug: "blog", label: "Blog", description: "News and updates from the Customs Wise team." },
  { slug: "trade-compliance", label: "Trade compliance", description: "Regulations and trade terms shaping goods moving between Great Britain, Ireland and the EU." },
  { slug: "food-customs", label: "Food customs", description: "In-depth guidance from our food team on POAO, fish and fresh produce." },
];

const blogArticles: Guide[] = blogPosts.map((p) => ({
  href: postPath(p),
  title: p.title,
  tag: blogTopics[p.topic],
  category: "blog",
  summary: p.excerpt,
  image: p.image,
}));

/** Every article, blog posts first (newest first), then guides. */
export const allArticles: Guide[] = [...blogArticles, ...insights, ...foodGuides];

/** Categories that currently have at least one article (empty categories are never shown). */
export const activeInsightCategories = insightCategories.filter((c) => allArticles.some((a) => a.category === c.slug));

export const faqs: Faq[] = [
  {
    question: "Which documents are needed for customs clearance?",
    answer:
      "At minimum you need a commercial invoice, packing list and transport document, plus any licences, certificates of origin or health and SPS documents required for your goods and route. We'll confirm the exact document set for your shipment based on commodity, origin and destination.",
  },
  {
    question: "What is the difference between direct and indirect representation?",
    answer:
      "In direct representation we act in your name and on your behalf, but you remain legally responsible for the declaration and any duty or VAT due. In indirect representation we act in our own name but on your behalf, and we share joint liability with you for the accuracy of the declaration and payment of duties and taxes.",
  },
  {
    question: "How do I find the correct commodity code for my goods?",
    answer:
      "Commodity (HS) codes are determined by the product's nature, composition, function and packaging, using the UK Global Tariff and EU TARIC databases. Because classification can be complex, we recommend a professional review of your product details and technical specifications to make sure the correct code is used.",
  },
  {
    question: "Can you help with classification and binding tariff information (BTI)?",
    answer:
      "Yes. We work with a trusted classification partner who specialises in HS commodity code reviews and can provide expert advice. We can also prepare and submit BTI applications to HMRC or Revenue on your behalf where you need a legally binding ruling.",
  },
  {
    question: "How are customs duties calculated?",
    answer:
      "Duty is calculated by applying the duty rate for your commodity code to the customs value of the goods, usually the transaction price plus transport and insurance to the EU or UK border. VAT is then charged on the duty-inclusive value. Preferential rates or reliefs may apply if you can prove origin or meet specific conditions.",
  },
  {
    question: "What is a PBN number, a GMR number and an ENS declaration?",
    answer:
      "A PBN (pre-notification number) is generated when you submit a pre-notification in IPAFFS for certain animal, plant or food products entering Great Britain. A GMR (Goods Movement Reference) is created in the UK's Goods Vehicle Movement Service to link your import or export declaration to a specific border crossing. An ENS (Entry Summary Declaration) is a safety and security declaration lodged before goods arrive in the EU, or GB where applicable, to allow risk assessment before arrival.",
  },
];
