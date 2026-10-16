import "server-only";
import type { Author, Category, Site } from "@/cms/lib/types";
import type { Database } from "./store";

/**
 * Starting content, created the first time the app runs with no data/db.json.
 * Customs Wise starts with its real category names and no articles (import them with `npm run import:customs-wise`).
 */
export function seedDatabase(): Database {
  const now = new Date().toISOString();

  const customsWise: Site = {
    id: "site_customs_wise",
    key: "customs-wise",
    name: "Customs Wise",
    note: "test configuration",
    baseUrl: "https://www.customswise.ie",
    listingPath: "/blog",
    articlePathPattern: "/insights/blog/{slug}",
    theme: "customs-wise",
    locale: "en-IE",
    seo: {
      titleSuffix: "Customs Wise",
      organisationName: "Customs Wise",
      listingTitle: "Blog",
      listingDescription: "News and updates from the Customs Wise team.",
    },
    createdAt: now,
    updatedAt: now,
  };

  const categories: Category[] = [
    { id: "cat_cw_food", siteId: customsWise.id, slug: "food-customs", label: "Food customs", order: 1 },
    { id: "cat_cw_reg", siteId: customsWise.id, slug: "regulatory-updates", label: "Regulatory updates", order: 2 },
    { id: "cat_cw_trade", siteId: customsWise.id, slug: "trade-policy", label: "Trade policy", order: 3 },
    { id: "cat_cw_guide", siteId: customsWise.id, slug: "practical-guidance", label: "Practical guidance", order: 4 },
  ];

  const authors: Author[] = [
    {
      id: "author_cw_org",
      kind: "organisation",
      name: "Customs Wise",
      slug: "customs-wise",
      jobTitle: "",
      bio: "",
      profileUrls: [],
      siteIds: [customsWise.id],
    },
  ];

  return { version: 1, sites: [customsWise], categories, authors, posts: [], media: [], audit: [] };
}
