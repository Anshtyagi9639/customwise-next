import { withAdmin } from "@/cms/server/auth/guard";
import { json, notFound, readJson } from "@/cms/server/http";
import { refreshPublicBlog } from "@/cms/server/revalidate";
import { readDb } from "@/cms/server/store";
import { saveSettings } from "@/cms/server/taxonomy";

type Ctx = { params: Promise<{ site: string }> };

/** A website's settings, with the categories and authors that can be used on it. */
export async function GET(request: Request, ctx: Ctx) {
  const { site: key } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const db = await readDb();
    const site = db.sites.find((s) => s.key === key);
    if (!site) return notFound("Website not found.");
    return json({
      site,
      categories: db.categories.filter((c) => c.siteId === site.id).sort((a, b) => a.order - b.order),
      authors: db.authors.filter((a) => a.siteIds.includes(site.id)),
    });
  });
}

/** Website settings change addresses and SEO for every article, so only an administrator can change them. */
export async function PUT(request: Request, ctx: Ctx) {
  const { site: key } = await ctx.params;
  return withAdmin(request, { siteKey: key, role: "admin" }, async () => {
    const site = (await readDb()).sites.find((s) => s.key === key);
    if (!site) return notFound("Website not found.");
    const result = await saveSettings(site, await readJson(request));
    if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
    refreshPublicBlog(result.value);
    return json({ site: result.value });
  });
}
