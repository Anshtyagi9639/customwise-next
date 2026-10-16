import { imageStoreKind } from "@/cms/server/cloudinary";
import { json } from "@/cms/server/http";
import { readDb, storeKind } from "@/cms/server/store";
import { StoreUnavailableError } from "@/cms/server/store-errors";

/**
 * Can the CMS read its database? 200 only after the database has actually been queried; 503 otherwise.
 * Reports the kind of storage and, on failure, a coarse reason. Never counts, content, addresses or account details.
 */
export async function GET() {
  const blogSource = process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms" ? "cms" : "static";
  try {
    await readDb();
    return json({ ok: true, store: storeKind(), images: imageStoreKind(), blogSource });
  } catch (err) {
    const reason = err instanceof StoreUnavailableError ? err.reason : "unreachable";
    const message =
      reason === "not-configured"
        ? "The CMS database settings (MONGODB_URI, MONGODB_DB) are missing or invalid on the server."
        : "The CMS database could not be reached or read.";
    return json({ ok: false, reason, message, blogSource }, 503);
  }
}
