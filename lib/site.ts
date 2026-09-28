import type { NavItem, Office } from "@/types";

/**
 * Verified Customs Wise business information.
 * Sources: Website Content 2.0 (client document) and the current customswise.ie contact page.
 * Do not add facts here that have not been confirmed by the client.
 */
export const site = {
  name: "Customs Wise",
  tagline: "Keeping customs simple",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.customswise.ie").replace(/\/$/, ""),
  description:
    "Independent customs experts in the UK and Ireland, with specialist food and POAO clearance and a partner network in more than 50 countries.",
  phone: { display: "+353 1 866 5644", href: "tel:+35318665644", e164: "+35318665644" },
  email: "info@customswise.ie",
  /** Official social profiles (confirmed by client). Shown in the footer only. */
  social: [
    { network: "x", label: "X", href: "https://x.com/CustomsWise" },
    { network: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UCxweGOp2ZKaY6lsURMCpFPg" },
    { network: "facebook", label: "Facebook", href: "https://www.facebook.com/customswise/" },
    { network: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/customs-wise" },
  ] as const,
  privacyPolicy: "https://www.customswise.ie/privacy-policy",
  hours: [
    { days: "Monday to Friday", short: "Mon–Fri", time: "5am – 9pm", schemaDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "05:00", closes: "21:00" },
    { days: "Saturday and Sunday", short: "Sat–Sun", time: "9am – 4pm", schemaDays: ["Saturday", "Sunday"], opens: "09:00", closes: "16:00" },
  ],
} as const;

export const offices: Office[] = [
  {
    city: "Dublin",
    isHeadOffice: true,
    lines: ["Unit B4, Centrepoint", "Rosemount Industrial Estate", "Dublin 11, Ireland"],
    street: "Unit B4, Centrepoint, Rosemount Industrial Estate",
    locality: "Dublin 11",
    country: "Ireland",
    countryCode: "IE",
  },
  {
    city: "Liverpool",
    lines: ["12 Jordan Street", "Liverpool L1 0BP", "United Kingdom"],
    street: "12 Jordan Street",
    locality: "Liverpool",
    postalCode: "L1 0BP",
    country: "United Kingdom",
    countryCode: "GB",
  },
  {
    city: "India",
    lines: ["91 Springboard, 21-B", "Udyog Vihar, Sector 18", "Gurugram, Haryana 122008"],
    street: "91 Springboard, 21-B, Udyog Vihar, Sector 18",
    locality: "Gurugram",
    region: "Haryana",
    postalCode: "122008",
    country: "India",
    countryCode: "IN",
  },
  {
    city: "Morocco",
    lines: ["39 Av. Sanhaja", "Tangier 90060", "Morocco"],
    street: "39 Av. Sanhaja",
    locality: "Tangier",
    postalCode: "90060",
    country: "Morocco",
    countryCode: "MA",
  },
];

/** Main navigation, in the client-approved order. FAQs and Contact are reached via the footer and in-page CTAs. */
export const mainNav: NavItem[] = [
  { kind: "link", label: "Home", href: "/" },
  { kind: "link", label: "About", href: "/about" },
  {
    kind: "menu",
    label: "Services",
    href: "/services",
    allLabel: "All services",
    items: [
      { label: "Import customs clearance", href: "/services#import-customs-clearance" },
      { label: "Export customs clearance", href: "/services#export-customs-clearance" },
      { label: "Customs audit", href: "/services#customs-audit" },
      { label: "T1 transits", href: "/services#t1-transits" },
      { label: "Worldwide customs clearance", href: "/services#worldwide-customs-clearance" },
      { label: "TRACES & IPAFFS entries", href: "/services#traces-ipaffs-entries" },
    ],
  },
  {
    kind: "menu",
    label: "Food Customs",
    href: "/food-customs",
    allLabel: "Food customs overview",
    items: [
      { label: "Products of animal origin (POAO)", href: "/food-customs/products-of-animal-origin" },
      { label: "CATCH certificates", href: "/food-customs/catch-certificates" },
      { label: "Fresh produce", href: "/food-customs/fresh-produce" },
      { label: "TRACES & IPAFFS entries", href: "/services#traces-ipaffs-entries" },
    ],
  },
  { kind: "link", label: "Industries", href: "/industries" },
  {
    kind: "menu",
    label: "Insights",
    href: "/insights",
    allLabel: "All insights",
    items: [
      { label: "CBAM for UK and Irish importers", href: "/insights/cbam" },
      { label: "EUDR explained", href: "/insights/eudr" },
      { label: "Incoterms® 2020 and customs", href: "/insights/incoterms" },
    ],
  },
];

export const primaryCta = { label: "Get an Enquiry", href: "/contact#enquiry" } as const;
