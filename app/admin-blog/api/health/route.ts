import { imageStoreKind } from "@/cms/server/cloudinary";
import { json } from "@/cms/server/http";
import { readDb, storeKind } from "@/cms/server/store";

/** Can the CMS read its database? Reports the kind of storage only: no counts, content, addresses or account details. */
export async function GET() {
  const blogSource = process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms" ? "cms" : "static";
  try {
    await readDb();
    return json({ ok: true, store: storeKind(), images: imageStoreKind(), blogSource });
  } catch {
    return json({ ok: false, message: "The CMS database could not be read.", blogSource }, 503);
  }
}
