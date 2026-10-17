/**
 * The fields every stored record must have for the CMS to show it without failing: a record missing one (for example
 * an article without a slug, written by hand in Atlas or by an old import) would otherwise break every screen that
 * lists it. Such records are left out of what is shown and counted in the server log as invalid-document. They are
 * never changed or deleted: a save only writes the records that were loaded and changed (store-mongo.ts).
 *
 * Only the shape is checked, never the content; nothing here is logged except collection names and counts.
 */

type Doc = { _id?: unknown } & Record<string, unknown>;

const str = (v: unknown) => typeof v === "string" && v.length > 0;

/*
 * Deliberately only what identifies a record and what every screen relies on. Optional or loosely typed fields (dates,
 * images, SEO, author details) are not checked, so a record written slightly differently is still shown.
 */
const REQUIRED: Record<string, (d: Doc) => boolean> = {
  posts: (d) => str(d.siteId) && str(d.slug) && (d.status === "draft" || d.status === "published") && Array.isArray(d.body),
  sites: (d) => str(d.key),
  categories: (d) => str(d.siteId) && str(d.slug),
  authors: (d) => typeof d.name === "string",
  media: (d) => str(d.siteId) && str(d.url),
};

/** Splits a collection's documents into those the CMS can use and the number it cannot. */
export function checkDocs<T extends Doc>(collection: string, docs: T[]): { valid: T[]; invalid: number } {
  const rule = REQUIRED[collection];
  const valid: T[] = [];
  let invalid = 0;
  for (const d of docs) {
    if (str(d._id) && (!rule || rule(d))) valid.push(d);
    else invalid++;
  }
  return { valid, invalid };
}
