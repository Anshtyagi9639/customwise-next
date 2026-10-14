import "server-only";
import path from "node:path";

/**
 * Where local files live: images when CMS_IMAGES=local, and db.json when CMS_STORE=json. Both are for local testing
 * only; production uses MongoDB and Cloudinary. Ignored by git.
 */
export function dataDir(): string {
  return process.env.CMS_DATA_DIR?.trim() || path.join(process.cwd(), ".cms-data");
}

export function uploadsDir(): string {
  return path.join(dataDir(), "uploads");
}
