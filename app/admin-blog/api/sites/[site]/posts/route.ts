import { withAdmin } from "@/cms/server/auth/guard";
import { json, notFound, readJson, siteByKey } from "@/cms/server/http";
import { createPost, listPosts } from "@/cms/server/posts";
import { refreshPublicBlog } from "@/cms/server/revalidate";

type Ctx = { params: Promise<{ site: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { site: key } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const site = await siteByKey(key);
    if (!site) return notFound("Website not found.");
    return json({ posts: await listPosts(site) });
  });
}

export async function POST(request: Request, ctx: Ctx) {
  const { site: key } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async () => {
    const site = await siteByKey(key);
    if (!site) return notFound("Website not found.");
    const result = await createPost(site, await readJson(request));
    if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
    if (result.post.status === "published") refreshPublicBlog(site, [result.post.slug]);
    return json({ post: result.post }, 201);
  });
}
