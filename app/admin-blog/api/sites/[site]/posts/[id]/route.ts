import { withAdmin } from "@/cms/server/auth/guard";
import { json, notFound, readJson, siteByKey } from "@/cms/server/http";
import { deletePost, getPost, updatePost } from "@/cms/server/posts";
import { refreshPublicBlog } from "@/cms/server/revalidate";

type Ctx = { params: Promise<{ site: string; id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { site: key, id } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const site = await siteByKey(key);
    const post = site && (await getPost(site, id));
    return post ? json({ post }) : notFound("Article not found on this website.");
  });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { site: key, id } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const site = await siteByKey(key);
    if (!site) return notFound("Website not found.");
    const before = await getPost(site, id);
    const result = await updatePost(site, id, await readJson(request));
    if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
    // Refresh the old and the new address: the slug may have changed, or the article may have been unpublished.
    if (before?.status === "published" || result.post.status === "published") refreshPublicBlog(site, [before?.slug, result.post.slug]);
    return json({ post: result.post });
  });
}

/** Only drafts can be deleted; a published article must be unpublished first. */
export async function DELETE(request: Request, ctx: Ctx) {
  const { site: key, id } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const site = await siteByKey(key);
    if (!site) return notFound("Website not found.");
    const result = await deletePost(site, id);
    return result.ok ? json({ ok: true }) : json({ error: "invalid", message: result.message }, 409);
  });
}
