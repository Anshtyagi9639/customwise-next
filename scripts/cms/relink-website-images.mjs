// Points the Customs Wise articles that were imported into the CMS at the website's own image files.
//
// When the 20 original blog posts were copied into the CMS, their images were uploaded as local files of the CMS
// (/media/customs-wise/...), which do not exist on the website's server. The same images are already part of this
// website (public/images/blog). This script changes the CMS records to use those files, so the articles look exactly
// as before once the blog reads from the CMS (BLOG_SOURCE=cms).
//
//   npm run cms:relink-images                 show what would change (nothing is written)
//   npm run cms:relink-images -- --apply      make the change
//   npm run cms:relink-images -- --undo       put back the previous addresses
//
// Only articles of the "customs-wise" website whose cover image is a /media/ address and whose slug matches one of the
// built-in posts are changed, and only if the website's file exists. The old address is kept in each image record
// (previousUrl), so --undo restores exactly what was there. Article text, dates and "last updated" are not touched.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";

const root = process.cwd();
for (const file of [".env.local", ".env"]) if (existsSync(path.join(root, file))) process.loadEnvFile(path.join(root, file));
const apply = process.argv.includes("--apply");
const undo = process.argv.includes("--undo");
const uri = process.env.MONGODB_URI?.trim() ?? "";
const dbName = process.env.MONGODB_DB?.trim() ?? "";
if (!/^mongodb(\+srv)?:\/\/\S+$/.test(uri) || !/^[A-Za-z0-9_-]{1,38}$/.test(dbName)) {
  console.error("MONGODB_URI and MONGODB_DB must be set (in .env.local, or the environment).");
  process.exit(1);
}

// The built-in posts: lib/content/blog-posts.ts is an array of plain objects with quoted keys and "// Source" comments.
const text = readFileSync(path.join(root, "lib", "content", "blog-posts.ts"), "utf8");
const builtIn = JSON.parse(
  text
    .slice(text.indexOf("= [", text.indexOf("export const blogPosts")) + 2, text.lastIndexOf("]") + 1)
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[\]}])/g, "$1"),
);
const images = new Map(builtIn.filter((p) => p.image).map((p) => [p.slug, p.image]));

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, appName: "customs-wise-cms-relink" });
let failed = false;
try {
  await client.connect();
  const db = client.db(dbName);
  const site = await db.collection("sites").findOne({ key: "customs-wise" });
  if (!site) throw Object.assign(new Error("The CMS database has no customs-wise website."), { name: "NoSite" });
  const posts = db.collection("posts");
  const media = db.collection("media");
  console.log(`Database "${dbName}"${apply ? "" : undo ? "" : "   (DRY RUN: nothing will be written; add --apply to make the change)"}\n`);

  if (undo) {
    const linked = await media.find({ siteId: site._id, storage: "website", previousUrl: { $type: "string" } }).toArray();
    let restored = 0;
    for (const m of linked) {
      await posts.updateMany({ siteId: site._id, "coverImage.mediaId": m._id, "coverImage.url": m.url }, { $set: { "coverImage.url": m.previousUrl } });
      await media.updateOne({ _id: m._id }, { $set: { url: m.previousUrl, storage: "local" }, $unset: { previousUrl: "" } });
      restored++;
    }
    console.log(`Restored ${restored} image record(s) and their articles to the previous addresses.`);
  } else {
    let changed = 0;
    let already = 0;
    const skipped = [];
    for (const post of await posts.find({ siteId: site._id, "coverImage.url": { $type: "string" } }).toArray()) {
      const builtInImage = images.get(post.slug);
      if (post.coverImage.url.startsWith("/images/blog/")) {
        already++;
        continue;
      }
      if (!post.coverImage.url.startsWith("/media/")) continue; // hosted (Cloudinary) images are left as they are
      if (!builtInImage) {
        skipped.push(`${post.slug}: not one of the built-in posts`);
        continue;
      }
      if (!existsSync(path.join(root, "public", decodeURIComponent(builtInImage.src)))) {
        skipped.push(`${post.slug}: the website file ${builtInImage.src} is missing`);
        continue;
      }
      const record = await media.findOne({ _id: post.coverImage.mediaId, siteId: site._id });
      if (!record) {
        skipped.push(`${post.slug}: its image record was not found`);
        continue;
      }
      console.log(`  ${post.slug}\n      ${post.coverImage.url}  ->  ${builtInImage.src}`);
      if (apply) {
        await posts.updateOne(
          { _id: post._id },
          { $set: { "coverImage.url": builtInImage.src, "coverImage.width": builtInImage.width, "coverImage.height": builtInImage.height } },
        );
        await media.updateOne(
          { _id: record._id },
          { $set: { url: builtInImage.src, storage: "website", previousUrl: record.url, width: builtInImage.width, height: builtInImage.height } },
        );
      }
      changed++;
    }
    if (apply && changed) {
      await db.collection("audit").insertOne({ _id: `log_${randomBytes(9).toString("base64url")}`, at: new Date().toISOString(), siteId: site._id, actor: "relink-script", action: "media.relink_website_images", targetId: null, summary: `${changed} article image(s) pointed at the website's own files` });
    }
    console.log(`\n${apply ? "Changed" : "Would change"}: ${changed}   already pointing at the website's files: ${already}   left alone: ${skipped.length}`);
    for (const s of skipped) console.log(`  left alone: ${s}`);
  }
} catch (err) {
  console.error(`Stopped: ${err?.name ?? "Error"}${err?.code !== undefined ? ` (code ${err.code})` : ""}${err?.name === "NoSite" ? `: ${err.message}` : ""}`);
  failed = true;
} finally {
  await client.close().catch(() => undefined);
}
process.exit(failed ? 1 : 0);
