import { withAdmin } from "@/cms/server/auth/guard";
import { json, readJson } from "@/cms/server/http";
import { deleteAuthor, saveAuthor } from "@/cms/server/taxonomy";

/**
 * Create (no id), update (with id) or delete (with id and delete: true) an author.
 * Authors are shared across websites, so only an administrator can change them.
 */
export async function POST(request: Request) {
  return withAdmin(request, { role: "admin" }, async () => {
    const body = ((await readJson(request)) ?? {}) as { id?: string; delete?: boolean };
    const result = body.delete && body.id ? await deleteAuthor(body.id) : await saveAuthor(body.id ?? null, body);
    if (!result.ok) return json({ error: "invalid", message: result.message, fieldErrors: result.fieldErrors }, result.status);
    return json({ author: result.value });
  });
}
