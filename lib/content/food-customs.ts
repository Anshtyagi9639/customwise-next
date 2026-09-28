import type { Faq } from "@/types";

/**
 * Food Customs page content. Every statement is drawn from the client's Website Content 2.0 document:
 * the Food Customs introduction, the Food and Beverages industry copy, and the POAO, CATCH and Fresh Produce guides.
 */

export const foodChallengesIntro =
  "Moving food through customs is often more complex than standard goods, due to additional documentation requirements, TRACES and IPAFFS entries and a higher likelihood of inspections.";

export const whyFoodMatters = [
  { title: "More documents", text: "Health certificates, phytosanitary certificates, catch certificates and CHEDs sit alongside the standard customs declaration." },
  { title: "Pre-notification deadlines", text: "Controlled consignments must be pre-notified in IPAFFS or TRACES NT before arrival, within set time windows." },
  { title: "Higher chance of inspection", text: "Documentary, identity and physical checks can be carried out at an approved Border Control Post before release." },
  { title: "Perishable goods", text: "Temperature control, shelf life and port timing are critical, so everything needs to be in place before arrival." },
] as const;

export const capabilities = [
  { href: "/food-customs/products-of-animal-origin", title: "Products of animal origin", text: "Meat, dairy, eggs, fish, honey, gelatine and composite products, with CHED-P and veterinary checks.", icon: "/icons/officer.png" },
  { href: "/food-customs/catch-certificates", title: "CATCH certificates", text: "Catch certificates for wild-caught fish under the EU CATCH system and the UK IUU regime.", icon: "/icons/ship.png" },
  { href: "/food-customs/fresh-produce", title: "Fresh produce", text: "Phytosanitary certificates, CHED-PP and marketing standards for fruit, vegetables and plant products.", icon: "/icons/warehouse.png" },
  { href: "/services#traces-ipaffs-entries", title: "TRACES & IPAFFS entries", text: "Pre-notifications and supporting documents for food consignments entering the UK and Ireland.", icon: "/icons/docs.png" },
] as const;

export const regions = [
  {
    title: "Into Great Britain",
    system: "IPAFFS",
    points: [
      "All commercial POAO imports must be pre-notified in IPAFFS, from both EU and non-EU countries.",
      "Pre-notify at least 24 hours before arrival for most POAO. Some Ro-Ro traffic may allow 4 to 6 hours.",
      "POAO pass through an approved Border Control Post, where Port Health carries out SPS controls.",
      "EU fresh fruit and vegetables are temporarily treated as low-risk for plant health. Monitor official updates.",
    ],
  },
  {
    title: "Into Ireland",
    system: "TRACES NT",
    points: [
      "CHED-P is created in TRACES NT and linked to the health certificate (and the CATCH entry for fish).",
      "The HSE or Department of Agriculture verifies the file before arrival at the BCP.",
      "Regulated plant products from outside the EU, including Great Britain, need a CHED-PP and 24 hours\u2019 notice to DAFM.",
      "Wild-caught fish are validated by the Sea Fisheries Protection Authority through CATCH.",
    ],
  },
  {
    title: "Exporting food",
    system: "Certificates",
    points: [
      "Most fruit and vegetables exported from Great Britain to the EU need a phytosanitary certificate.",
      "Produce under the Specific Marketing Standard also needs a certificate of conformity.",
      "Irish exporters to non-EU destinations register with DAFM; allow at least 14 days\u2019 notice for phytosanitary certificates.",
      "Re-exported produce may need to meet both UK and EU rules; the original country of production still matters.",
    ],
  },
] as const;

export const clearanceSteps = [
  { title: "Certificates checked", text: "We review the health certificate (or phytosanitary certificate for composite products and produce) against current UK and EU requirements." },
  { title: "CHED raised", text: "We raise the CHED in IPAFFS for Great Britain or TRACES NT for Ireland, with product codes, weights and certificate references consistent." },
  { title: "Pre-notified on time", text: "Pre-notifications are submitted within the correct time window to avoid late fees and holds at the BCP." },
  { title: "Checks coordinated", text: "We coordinate documentary, identity and physical checks with Port Health and the HSE, and respond quickly to queries or sampling requests." },
  { title: "Cleared and aligned", text: "The CHED, customs declaration and any CATCH entry tell the same story, so the goods can move into free circulation." },
] as const;

export const documents = [
  "Health certificate or export health certificate",
  "Phytosanitary certificate for plant products",
  "Common Health Entry Document (CHED-P, CHED-PP or CHED-D)",
  "Validated catch certificate for wild-caught fish",
  "Certificate of conformity where the Specific Marketing Standard applies",
  "Commercial invoice and packing list",
  "Transport documents",
  "Correct commodity code, botanical name and evidence of origin",
] as const;

export const challenges = [
  { problem: "Paperwork doesn\u2019t match the load", impact: "Any mismatch between the health certificate, CHED and the goods can lead to holds, additional testing or refusal of entry.", fix: "We align every document before arrival." },
  { problem: "Late pre-notification", impact: "Missing the pre-notification window can mean late fees or delays at the BCP.", fix: "We manage notifications within the correct time windows." },
  { problem: "Wrong entry point or missing certificates", impact: "Arriving at an unsuitable inspection point, or without the right certificates, can cause delays, extra cost, product deterioration or rejection.", fix: "We confirm the documents and entry point before goods move." },
] as const;

export const products = ["Meat", "Dairy", "Eggs", "Fish and shellfish", "Honey", "Gelatine", "Composite products", "Fresh produce", "Processed foods"] as const;

export const foodFaqs: Faq[] = [
  {
    question: "What is a CHED-P?",
    answer:
      "A Common Health Entry Document for products of animal origin. It is raised in IPAFFS for Great Britain or TRACES NT for Ireland, and the goods can only move into free circulation once the Border Control Post has finalised the CHED as \u201ccleared\u201d.",
  },
  {
    question: "How far in advance must POAO be pre-notified in IPAFFS?",
    answer:
      "As a general rule, at least 24 hours before arrival for most POAO. For some movements, such as certain Ro-Ro ferry traffic, a shorter minimum of 4 to 6 hours may apply, but plan for the 24-hour window to avoid late fees or delays.",
  },
  {
    question: "Do wild-caught fish imports need a catch certificate?",
    answer:
      "Yes, a catch certificate is required for many imports into the EU and UK. It proves the fish were caught legally under IUU rules. For Ireland it runs through the EU CATCH system in TRACES NT; for Great Britain it is submitted to the Marine Management Organisation or relevant UK authority, usually at least three working days before arrival for sea freight.",
  },
  {
    question: "What happens at a Border Control Post?",
    answer:
      "A typical veterinary check has three elements: documentary checks on the certificate, CHED and invoice; identity checks that the load matches the paperwork; and, where required, physical checks such as temperature checks or sampling for laboratory analysis.",
  },
  {
    question: "Do EU fruit and vegetables need plant-health checks entering Great Britain?",
    answer:
      "Currently they are temporarily treated as low-risk for plant-health purposes, so they do not require plant-health controls. Marketing-standard controls for EU produce are not expected before 1 February 2027. This is a temporary position, so monitor official updates before planning future supply chains.",
  },
];
