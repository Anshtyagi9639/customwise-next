import type { NavLink } from "@/types";

/**
 * Extended service information for the Services page.
 * Every statement is drawn from the client's Website Content 2.0 document (service descriptions,
 * industry copy, FAQs, and the POAO / CATCH / Fresh produce / Incoterms guides). Nothing here is invented.
 */
export type ServiceDetail = {
  whoFor: string;
  handles: string[];
  outcome: string;
  more: NavLink[];
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "import-customs-clearance": {
    whoFor: "Importers bringing goods into the UK or Ireland, and the hauliers and freight forwarders moving them.",
    handles: [
      "Import declarations at any port in the UK and Ireland",
      "Inventory-linked and Ro-Ro movements",
      "Customs value, duty and import VAT, using the Incoterm and named place on your invoice",
      "Confirming the documents your goods need, including any health, SPS or origin paperwork",
      "Proactive updates until your goods are released",
    ],
    outcome: "Accurate declarations and timely processing, so your shipments pass customs without delay.",
    more: [
      { label: "How Incoterms affect import valuation", href: "/insights/incoterms" },
      { label: "Importing food? See food customs", href: "/food-customs" },
    ],
  },
  "export-customs-clearance": {
    whoFor: "Exporters shipping from any port in the UK and Ireland.",
    handles: [
      "Export declarations from any UK or Irish port",
      "Inventory-based and Ro-Ro movements",
      "Documentation, routing and carrier coordination",
      "Export formalities in line with your agreed Incoterm (under most terms, the seller completes export clearance)",
    ],
    outcome: "Fewer delays and export operations that stay compliant and efficient.",
    more: [
      { label: "Who handles export clearance under each Incoterm", href: "/insights/incoterms" },
      { label: "Exporting fresh produce", href: "/food-customs/fresh-produce" },
    ],
  },
  "customs-audit": {
    whoFor: "Businesses that import or export regularly and want to reduce compliance risk.",
    handles: [
      "A review of your import and export processes",
      "Checks on declarations and supporting data",
      "Identifying mis-declared HS codes, incorrect valuations and origin claims",
      "Commodity code reviews through our trusted classification partner",
      "Binding Tariff Information (BTI) applications to HMRC or Revenue where you need a legally binding ruling",
    ],
    outcome: "Errors found and fixed before they trigger penalties or delays.",
    more: [
      { label: "How to find the correct commodity code", href: "/faqs" },
      { label: "CBAM: check if your imports are in scope", href: "/insights/cbam" },
    ],
  },
  "t1-transits": {
    whoFor: "Hauliers, freight forwarders and traders moving non-EU goods through the UK, Ireland and the EU.",
    handles: [
      "T1 transit documents arranged and managed through the NCTS",
      "T1 declarations opened at departure",
      "T1 declarations closed at destination",
      "Keeping consignments compliant while in transit",
    ],
    outcome: "Transit movements that stay compliant from departure to destination.",
    more: [{ label: "Customs support for freight partners", href: "/industries#freight-partners" }],
  },
  "worldwide-customs-clearance": {
    whoFor: "Businesses whose goods move beyond the UK and Ireland.",
    handles: [
      "Access to trusted partner brokers in more than 50 countries",
      "Coordination through the AEB platform",
      "End-to-end customs compliance, wherever your goods are moving",
    ],
    outcome: "One point of contact for customs compliance across your international supply chain.",
    more: [{ label: "Customs for global manufacturing supply chains", href: "/industries#manufacturing" }],
  },
  "traces-ipaffs-entries": {
    whoFor: "Importers of food, products of animal origin, fish and regulated plant products into the UK and Ireland.",
    handles: [
      "IPAFFS pre-notifications and CHEDs for Great Britain",
      "TRACES NT entries and CHEDs for Ireland",
      "Supporting documents completed accurately and on time",
      "Linking CATCH entries for wild-caught fish",
      "Coordinating checks at the Border Control Post with Port Health and the HSE",
    ],
    outcome: "Notifications that match the health certificate, the load and the customs declaration, avoiding holds and late fees.",
    more: [
      { label: "Food customs overview", href: "/food-customs" },
      { label: "POAO guide: CHED-P, IPAFFS and TRACES", href: "/food-customs/products-of-animal-origin" },
    ],
  },
};

/** "Before your goods move" considerations, drawn from the FAQs and the Incoterms, CBAM and EUDR guides. */
export const considerations = [
  {
    icon: "file-text",
    title: "Agree the Incoterm and named place",
    text: "The delivery term decides who handles export and import clearance, and it affects the customs value declared. \u201cDAP Dublin Port\u201d is clearer than \u201cDAP Ireland\u201d.",
    link: { label: "Incoterms guide", href: "/insights/incoterms" },
  },
  {
    icon: "barcode",
    title: "Confirm the commodity code",
    text: "The HS code sets the duty rate and any controls. It depends on the product\u2019s nature, composition, function and packaging, so a professional review is worthwhile.",
    link: { label: "Commodity code FAQ", href: "/faqs" },
  },
  {
    icon: "users",
    title: "Know who is importer and exporter of record",
    text: "Establish who holds the EORI and VAT registrations, who appoints the customs broker, and who pays duty, import VAT and inspection fees.",
    link: { label: "Choosing the right Incoterm", href: "/insights/incoterms" },
  },
  {
    icon: "scale",
    title: "Choose direct or indirect representation",
    text: "Under direct representation you stay legally responsible for the declaration. Under indirect representation we share joint liability with you.",
    link: { label: "Representation FAQ", href: "/faqs" },
  },
  {
    icon: "clipboard",
    title: "Prepare the core documents",
    text: "At minimum a commercial invoice, packing list and transport document, plus any licences, certificates of origin or health and SPS documents your goods need.",
    link: { label: "Documents FAQ", href: "/faqs" },
  },
  {
    icon: "leaf",
    title: "Check for extra regulatory controls",
    text: "Food, plants and fish face SPS controls. Some goods are also affected by CBAM (steel, aluminium, cement, fertilisers, hydrogen) or the EUDR.",
    link: { label: "Customs Insights", href: "/insights" },
  },
] as const;
