import { withAdmin } from "@/cms/server/auth/guard";
import { json, notFound, readJson, siteByKey } from "@/cms/server/http";
import { refreshPublicBlog } from "@/cms/server/revalidate";
import { deleteCategory, saveCategory } from "@/cms/server/taxonomy";

type Ctx = { params: Promise<{ site: string }> };

/** Create (no id), rename (with id) or delete (with id and delete: true) a category of this website. */
export async function POST(request: Request, ctx: Ctx) {
  const { site: key } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const site = await siteByKey(key);
    if (!site) return notFound("Website not found.");
    const body = ((await readJson(request)) ?? {}) as { id?: string; delete?: boolean };
    const result = body.delete && body.id ? await deleteCategory(site, body.id) : await saveCategory(site, body.id ?? null, body);
    if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
    refreshPublicBlog(site);
    return json({ category: result.value });
  });
}
