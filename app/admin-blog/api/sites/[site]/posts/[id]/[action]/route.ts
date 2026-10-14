import { withAdmin } from "@/cms/server/auth/guard";
import { canAccessSite } from "@/cms/server/auth/users";
import { badRequest, json, notFound, readJson, siteByKey } from "@/cms/server/http";
import { copyPost, setPostStatus } from "@/cms/server/posts";
import { refreshPublicBlog } from "@/cms/server/revalidate";

type Ctx = { params: Promise<{ site: string; id: string; action: string }> };

/** publish · unpublish · copy (to another website the user may also manage) */
export async function POST(request: Request, ctx: Ctx) {
  const { site: key, id, action } = await ctx.params;
  return withAdmin(request, { siteKey: key }, async (user) => {
    const site = await siteByKey(key);
    if (!site) return notFound("Website not found.");

    if (action === "publish" || action === "unpublish") {
      const result = await setPostStatus(site, id, action === "publish" ? "published" : "draft");
      if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
      refreshPublicBlog(site, [result.post.slug]);
      return json({ post: result.post });
    }
    if (action === "copy") {
      const body = (await readJson(request)) as { targetSiteKey?: unknown; canonicalToOriginal?: unknown } | undefined;
      if (typeof body?.targetSiteKey !== "string") return badRequest("Choose the website to copy this article to.");
      if (!canAccessSite(user, body.targetSiteKey)) return json({ error: "forbidden", message: "You do not have access to that website." }, 403);
      const result = await copyPost(site, id, body.targetSiteKey, body.canonicalToOriginal === true);
      if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
      return json({ post: result.post, targetSiteKey: result.targetSiteKey }, 201);
    }
    return notFound("Unknown action.");
  });
}
