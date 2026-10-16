// End-to-end check of the publishing workflow through the same HTTP API the blog admin uses, signed in as a temporary
// test administrator. Nothing is mocked: every step is a real request to the running website and a real write to its
// database. Run it against a local test database with local images (CMS_IMAGES=local), not against live services.
//
//   npm run cms:test:workflow                (website must be running; CMS_TEST_URL, default http://127.0.0.1:3100)
//   npm run cms:test:workflow -- --keep      leave the test articles in place
//   npm run cms:test:workflow -- --verify <file>   after a restart, check the kept articles are still there
// With BLOG_SOURCE=cms on the website, the public pages (/blog, /insights/blog/<slug>) are checked as well.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, ORIGIN, check, createTestUser, finish, openDb, removeTestUsers, request, signIn } from "./lib/test-kit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CMS = BASE;
const args = process.argv.slice(2);
const keep = args.includes("--keep");
const verifyFile = args.includes("--verify") ? args[args.indexOf("--verify") + 1] : null;
const CW = "customs-wise";
const HIDDEN = "demo-website"; // the old demo website: still in older databases, hidden from the CMS

const { client: mongo, db } = await openDb();
const tester = await createTestUser(db, { role: "admin" });
const session = await signIn(tester.email, tester.password);
if (!session.cookie) {
  console.error(`Could not sign in as the temporary test administrator (HTTP ${session.status}).`);
  await removeTestUsers(db);
  process.exit(1);
}
async function cleanupAccounts() {
  await removeTestUsers(db);
  await mongo.close();
}

/** Every request as the signed-in test administrator, from this website (Origin), like the admin screens. */
async function call(url, method = "GET", body, headers = {}) {
  const { Origin, ...rest } = headers;
  const r = await request(url, { method, body, cookie: session.cookie, origin: Origin ?? ORIGIN, headers: rest });
  const isJson = (r.headers.get("content-type") ?? "").includes("json");
  return { status: r.status, ok: r.ok, data: isJson ? r.data : r.text, headers: r.headers };
}

/** Public pages are refreshed by the publish request; give the server a moment to rebuild them. */
async function eventually(test, ms = 15000) {
  const end = Date.now() + ms;
  for (;;) {
    if (await test()) return true;
    if (Date.now() > end) return false;
    await new Promise((r) => setTimeout(r, 700));
  }
}

const upload = (site, bytes, name) => {
  const form = new FormData();
  form.append("file", new Blob([bytes]), name);
  return call(`/admin-blog/api/sites/${site}/media`, "POST", form);
};

const health = await call("/admin-blog/api/health").catch(() => null);
if (!health?.ok) {
  console.error(`The website is not reachable at ${CMS}, or its CMS database cannot be read.`);
  await cleanupAccounts();
  process.exit(1);
}

/* ---------- Restart check: the articles written by an earlier run must still be there ---------- */
if (verifyFile) {
  console.log("\nPersistence after restart");
  const saved = JSON.parse(readFileSync(verifyFile, "utf8"));
  const admin = await call(`/admin-blog/api/sites/${CW}/posts/${saved.id}`);
  check("the article is still in the store", admin.ok && admin.data.post.title === saved.title, `status ${admin.status}`);
  const pub = await call(`/api/public/v1/sites/${CW}/posts/${saved.slug}`);
  check("it is still published on its website", pub.ok && pub.data.post.title === saved.title, `status ${pub.status}`);
  const img = await fetch(`${CMS}${saved.imageUrl}`);
  const bytes = (await img.arrayBuffer()).byteLength;
  check("its uploaded image is still served, byte for byte the same size", img.ok && bytes === saved.imageBytes, `status ${img.status}, ${bytes} bytes`);
  await cleanupAccounts();
  finish();
}

// This test uploads several images and checks them as local files. Against a real image host it would leave test
// images and records behind, so it refuses to run there.
if (health.data.images !== "local-folder") {
  console.error("The website under test is not using local images. This test only runs with CMS_IMAGES=local (and preferably a local test");
  console.error("database), so that it cannot leave test images on a real account. Use  npm run cms:test:live  to test the real services.");
  await cleanupAccounts();
  process.exit(1);
}
if (health.data.store === "mongodb") console.log("Note: this CMS is using MongoDB. Test articles are removed at the end; records of the test images and activity-log lines stay.");

const samples = path.join(here, "fixtures");
const png = readFileSync(path.join(samples, "sample-cover.png"));
const stamp = Date.now().toString(36);
const slug = `workflow-test-${stamp}`;
const created = []; // [siteKey, postId] to remove at the end

const cw = (await call(`/admin-blog/api/sites/${CW}`)).data;
// Records of the hidden website, read from the database (only present in databases created before it was removed).
const hiddenSite = await db.collection("sites").findOne({ key: HIDDEN });
const hiddenCategory = hiddenSite ? await db.collection("categories").findOne({ siteId: hiddenSite._id }) : null;
const hiddenPost = hiddenSite ? await db.collection("posts").findOne({ siteId: hiddenSite._id }) : null;
const base = {
  title: `Workflow test article ${stamp}`,
  slug,
  summary: "A test article created by the automated workflow check.",
  body: [
    { type: "h2", text: "What this checks" },
    { type: "p", text: "A paragraph with **bold text** and [a link](/services)." },
    { type: "ul", items: ["First point", "Second point"] },
  ],
  coverImage: null,
  categoryId: cw.categories[0].id,
  authorId: cw.authors[0].id,
  tags: ["test"],
  seo: { title: "", description: "" },
  canonicalOverride: "",
  status: "draft",
  publishAt: null,
  hideDate: false,
  faq: [{ question: "Is this a real article?", answer: "No, it is test content." }],
  sources: [{ label: "Example source", url: "https://example.com/source" }],
  relatedLinks: [],
  lastReviewedAt: "2026-01-15",
  readMinutesOverride: null,
};

console.log("\nImage upload");
const up = await upload(CW, png, "sample-cover.png");
check("a PNG image is accepted", up.status === 201, `status ${up.status}`);
const media = up.data.media;
check("its real dimensions are recorded", media?.width === 1200 && media?.height === 630);
check("the stored name is generated, not taken from the upload", media && !media.fileName.includes("sample"));
const served = await fetch(`${CMS}${media.url}`);
check("the image is served back", served.ok && served.headers.get("content-type") === "image/png");
const text = await upload(CW, readFileSync(path.join(samples, "not-an-image.txt")), "not-an-image.txt");
check("a text file is refused", text.status === 415, `status ${text.status}`);
const disguised = await upload(CW, Buffer.from("<script>alert(1)</script> not really a picture"), "photo.png");
check("a non-image named .png is refused", disguised.status === 415, `status ${disguised.status}`);
const big = Buffer.alloc(5 * 1024 * 1024 + 4096);
png.copy(big);
const tooBig = await upload(CW, big, "big.png");
check("an image over 5 MB is refused", tooBig.status === 413, `status ${tooBig.status}`);
const empty = await upload(CW, Buffer.alloc(0), "empty.png");
check("an empty file is refused", empty.status === 400, `status ${empty.status}`);
const traversal = await fetch(`${CMS}/media/${CW}/..%2F..%2Fdb.json`);
check("the image address cannot be used to read other files", traversal.status === 404 || traversal.status === 400, `status ${traversal.status}`);

console.log("\nRequired fields");
const noTitle = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, title: "", slug: "" });
check("a draft without a title is refused", noTitle.status === 400 && !!noTitle.data.fieldErrors?.title);
const badSlug = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, slug: "Not A Slug!" });
check("an invalid slug is refused", badSlug.status === 400 && !!badSlug.data.fieldErrors?.slug);
const thin = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, slug: `${slug}-thin`, status: "published", summary: "", body: [], categoryId: null, authorId: null });
const thinErrors = thin.data.fieldErrors ?? {};
check("publishing without summary, content, category and author is refused", thin.status === 400 && ["summary", "body", "categoryId", "authorId"].every((k) => thinErrors[k]), JSON.stringify(thinErrors));
const noAlt = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, slug: `${slug}-alt`, status: "published", coverImage: { mediaId: media.id, url: media.url, alt: "", caption: "", width: media.width, height: media.height } });
check("publishing with an image but no alt text is refused", noAlt.status === 400 && !!noAlt.data.fieldErrors?.coverImageAlt);
if (hiddenCategory) {
  const foreignCategory = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, slug: `${slug}-cat`, categoryId: hiddenCategory._id });
  check("a category of another (hidden) website is refused", foreignCategory.status === 400 && !!foreignCategory.data.fieldErrors?.categoryId);
}
const hiddenCreate = await call(`/admin-blog/api/sites/${HIDDEN}/posts`, "POST", { ...base, slug: `${slug}-img` });
check("nothing can be created on the hidden website", hiddenCreate.status === 404 && (await db.collection("posts").countDocuments({ slug: `${slug}-img` })) === 0, `status ${hiddenCreate.status}`);

console.log("\nDraft, publish, edit, unpublish, republish");
const cover = { mediaId: media.id, url: media.url, alt: "Blue test gradient", caption: "Test image", width: media.width, height: media.height };
const draft = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, coverImage: cover });
check("a draft is saved", draft.status === 201 && draft.data.post.status === "draft", `status ${draft.status} ${JSON.stringify(draft.data.fieldErrors ?? {})}`);
const id = draft.data.post.id;
created.push([CW, id]);
const listHas = async (site, s) => (await call(`/api/public/v1/sites/${site}/posts?limit=50`)).data.posts.some((p) => p.slug === s);
check("the draft is not in the public list", !(await listHas(CW, slug)));
check("the draft's public address returns 404", (await call(`/api/public/v1/sites/${CW}/posts/${slug}`)).status === 404);
const websitePages = health.data.blogSource === "cms";
if (!websitePages) console.log("  note  the website shows its built-in articles (BLOG_SOURCE=static), so its public pages are not checked");
if (websitePages) check("the draft's page on the website returns 404", (await call(`/insights/blog/${slug}`)).status === 404);
check("the draft can be previewed in the dashboard", (await call(`/admin-blog/preview/${CW}/${id}`)).status === 200);

const publish = await call(`/admin-blog/api/sites/${CW}/posts/${id}/publish`, "POST");
check("the draft is published", publish.ok && publish.data.post.status === "published" && !!publish.data.post.publishAt);
check("it appears in the public list", await listHas(CW, slug));
const pub = await call(`/api/public/v1/sites/${CW}/posts/${slug}`);
const p = pub.data.post;
check("its public address returns the article", pub.ok && p.title === base.title);
check("the canonical address points at the website's own URL", p?.canonicalUrl === `https://www.customswise.ie/insights/blog/${slug}`, p?.canonicalUrl);
check("the HTML is generated from the blocks", p?.html.includes("<h2") && p.html.includes("<strong>bold text</strong>") && p.html.includes('href="/services"'));
const types = (p?.jsonLd ?? []).map((j) => j["@type"]);
check("structured data includes article, breadcrumb and FAQ", ["BlogPosting", "BreadcrumbList", "FAQPage"].every((t) => types.includes(t)), types.join(","));
if (websitePages) {
  check("its page on the website is served", await eventually(async () => { const r = await call(`/insights/blog/${slug}`); return r.status === 200 && r.data.includes(base.title); }));
  const page = await call(`/insights/blog/${slug}`);
  check("the page has its canonical link and structured data", page.data.includes(`rel="canonical" href="https://www.customswise.ie/insights/blog/${slug}"`) && page.data.includes("application/ld+json") && page.data.includes("FAQPage"));
  check("the website's blog page shows it", await eventually(async () => (await call("/blog")).data.includes(base.title)));
  check("the homepage shows it among the latest articles", await eventually(async () => (await call("/")).data.includes(base.title)));
  check("the website's sitemap lists it", await eventually(async () => (await call("/sitemap.xml")).data.includes(`/insights/blog/${slug}<`)));
}
check("the sitemap lists it", (await call(`/api/public/v1/sites/${CW}/sitemap`)).data.urls.some((u) => u.path.endsWith(slug)));

const edited = await call(`/admin-blog/api/sites/${CW}/posts/${id}`, "PUT", { ...publish.data.post, title: `${base.title} (edited)`, body: [...publish.data.post.body, { type: "p", text: "<img src=x onerror=alert(1)> stays as text." }] });
check("an edit is saved", edited.ok && edited.data.post.title.endsWith("(edited)"));
const after = (await call(`/api/public/v1/sites/${CW}/posts/${slug}`)).data.post;
check("the public article shows the edit", after.title.endsWith("(edited)"));
check("HTML typed into the content is escaped, not run", after.html.includes("&lt;img") && !after.html.includes("<img src=x"));
const unsafe = await call(`/admin-blog/api/sites/${CW}/posts/${id}`, "PUT", { ...edited.data.post, body: [{ type: "p", text: "[click](javascript:alert(1))" }] });
const unsafeHtml = (await call(`/api/public/v1/sites/${CW}/posts/${slug}`)).data.post.html;
check("a javascript: link is left as plain text, not turned into a link", unsafe.ok && !unsafeHtml.includes("<a") && !unsafeHtml.includes("href"), unsafeHtml);

const unpublish = await call(`/admin-blog/api/sites/${CW}/posts/${id}/unpublish`, "POST");
check("the article is unpublished", unpublish.ok && unpublish.data.post.status === "draft");
check("it leaves the public list", !(await listHas(CW, slug)));
if (websitePages) check("its page on the website returns 404 again, and the blog page no longer lists it", await eventually(async () => (await call(`/insights/blog/${slug}`)).status === 404 && !(await call("/blog")).data.includes(base.title)));
const republish = await call(`/admin-blog/api/sites/${CW}/posts/${id}/publish`, "POST");
check("it is republished", republish.ok && (await listHas(CW, slug)));
check("deleting a published article is refused", (await call(`/admin-blog/api/sites/${CW}/posts/${id}`, "DELETE")).status === 409);

const future = new Date(Date.now() + 7 * 86400000).toISOString();
const scheduled = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, slug: `${slug}-later`, title: `${base.title} scheduled`, status: "published", publishAt: future });
created.push([CW, scheduled.data.post?.id]);
check("an article with a future publish time is saved", scheduled.status === 201);
check("it is not public before that time", !(await listHas(CW, `${slug}-later`)) && (await call(`/api/public/v1/sites/${CW}/posts/${slug}-later`)).status === 404);

console.log("\nSlugs, and the hidden demo website");
const duplicate = await call(`/admin-blog/api/sites/${CW}/posts`, "POST", { ...base, title: "Duplicate" });
check("the same slug on the same website is refused", duplicate.status === 409 && !!duplicate.data.fieldErrors?.slug, `status ${duplicate.status}`);
const cwAdmin = (await call(`/admin-blog/api/sites/${CW}/posts`)).data.posts;
check("the Customs Wise list has only Customs Wise articles", cwAdmin.every((x) => x.siteId === cw.site.id));
const cwPublic = (await call(`/api/public/v1/sites/${CW}/posts?limit=50`)).data.posts;
check("the public Customs Wise list has no article of another website", cwPublic.every((x) => !hiddenPost || x.id !== hiddenPost._id));
check("the hidden website's admin API is not found", (await call(`/admin-blog/api/sites/${HIDDEN}`)).status === 404 && (await call(`/admin-blog/api/sites/${HIDDEN}/posts`)).status === 404);
check("the hidden website's public API is not found", (await call(`/api/public/v1/sites/${HIDDEN}/posts`)).status === 404 && (await call(`/api/public/v1/sites/${HIDDEN}/categories`)).status === 404);
check("a Customs Wise article cannot be read, edited, unpublished or previewed through the hidden website",
  (await call(`/admin-blog/api/sites/${HIDDEN}/posts/${id}`)).status === 404 &&
  (await call(`/admin-blog/api/sites/${HIDDEN}/posts/${id}`, "PUT", { ...base, title: "Hijacked" })).status === 404 &&
  (await call(`/admin-blog/api/sites/${HIDDEN}/posts/${id}/unpublish`, "POST")).status === 404 &&
  (await call(`/admin-blog/preview/${HIDDEN}/${id}`)).status === 404);
if (hiddenPost) {
  check("an article of the hidden website cannot be read or changed through Customs Wise",
    (await call(`/admin-blog/api/sites/${CW}/posts/${hiddenPost._id}`)).status === 404 &&
    (await call(`/admin-blog/api/sites/${CW}/posts/${hiddenPost._id}/unpublish`, "POST")).status === 404 &&
    (await call(`/api/public/v1/sites/${CW}/posts/${hiddenPost.slug}`)).status === 404);
  check("the hidden website's article is unchanged", JSON.stringify(await db.collection("posts").findOne({ _id: hiddenPost._id })) === JSON.stringify(hiddenPost));
}
check("an unknown website returns 404", (await call(`/api/public/v1/sites/nope/posts`)).status === 404);

console.log("\nCopy to another website");
const copy = await call(`/admin-blog/api/sites/${CW}/posts/${id}/copy`, "POST", { targetSiteKey: HIDDEN, canonicalToOriginal: true });
check("an article cannot be copied to the hidden website", copy.status === 404 && (await db.collection("posts").countDocuments({ slug: `${slug}-2` })) === 0, `status ${copy.status}`);
const editorScreen = (await call(`/admin-blog/sites/${CW}/posts`)).data;
check("the article list offers no other website to copy to", typeof editorScreen === "string" && !editorScreen.includes("Demo Website") && !editorScreen.includes("Copy to"));

console.log("\nRequests from other websites");
const cross = await call(`/admin-blog/api/sites/${CW}/posts/${id}/unpublish`, "POST", undefined, { Origin: "https://evil.example" });
check("a change sent from another origin is refused", cross.status === 403, `status ${cross.status}`);
check("the public API has no way to write", [404, 405].includes((await call(`/api/public/v1/sites/${CW}/posts`, "POST", base)).status));

if (keep) {
  const out = path.join(process.cwd(), ".cms-data", "workflow-test.json");
  writeFileSync(out, JSON.stringify({ id, slug, title: `${base.title} (edited)`, imageUrl: media.url, imageBytes: png.length }));
  console.log(`\nTest articles kept. After restarting the website run:  npm run cms:test:workflow -- --verify "${out}"`);
} else {
  for (const [site, postId] of created.filter(([, x]) => x)) {
    await call(`/admin-blog/api/sites/${site}/posts/${postId}/unpublish`, "POST");
    await call(`/admin-blog/api/sites/${site}/posts/${postId}`, "DELETE");
  }
  check("the test articles are removed again", !(await listHas(CW, slug)));
}

await cleanupAccounts();
finish();
