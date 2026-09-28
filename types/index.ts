export type NavLink = { label: string; href: string; description?: string };

export type NavItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "menu"; label: string; href: string; items: NavLink[]; allLabel: string };

export type Office = {
  city: string;
  isHeadOffice?: boolean;
  lines: string[];
  country: string;
  countryCode: "IE" | "GB" | "IN" | "MA";
  postalCode?: string;
  locality: string;
  region?: string;
  street: string;
};

export type ImageAsset = { src: string; alt: string; width: number; height: number };

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  body: string[];
  icon: string;
  image: ImageAsset;
  enquiryValue: EnquiryServiceValue;
  related?: NavLink[];
};

export type Industry = {
  slug: string;
  title: string;
  summary: string;
  body: string[];
  icon: string;
  image: ImageAsset;
  links: NavLink[];
};

export type InsightCategory = { slug: "blog" | "trade-compliance" | "food-customs"; label: string; description: string };

export type Guide = {
  href: string;
  title: string;
  tag: string;
  category: InsightCategory["slug"];
  summary: string;
  /** Blog posts without a supplied image have none; cards show a branded panel instead. */
  image?: ImageAsset;
};

export type Faq = { question: string; answer: string };

export type EnquiryServiceValue =
  | "import"
  | "export"
  | "food"
  | "traces"
  | "t1"
  | "audit"
  | "worldwide"
  | "other";
