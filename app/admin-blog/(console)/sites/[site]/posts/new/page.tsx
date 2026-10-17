import { requireAdminPage } from "@/cms/server/auth/guard";
import { notFound } from "next/navigation";
import { PostEditor } from "@/cms/components/admin/post-editor";
import { emptyPostInput } from "@/cms/lib/content";
import { readDbForScreen } from "@/cms/server/admin-data";
import { findSite } from "@/cms/server/sites";

export const metadata = { title: "Create New Post" };

export default async function NewPost({ params }: { params: Promise<{ site: string }> }) {
  const { site: key } = await params;
  await requireAdminPage({ siteKey: key });
  const db = await readDbForScreen("post-new");
  const site = findSite(db, key);
  if (!site) notFound();
  const authors = db.authors.filter((a) => a.siteIds.includes(site.id));
  // A website with a single author (such as an organisation-level author) has it pre-selected.
  const initial = { ...emptyPostInput(), authorId: authors.length === 1 ? authors[0].id : null };

  return (
    <div>
      <h1 className="page-title">Create New Post</h1>
      <p className="mb-4 text-[0.95rem] text-ink-soft">
        For {site.name} <span className="text-pebble">({site.note})</span>
      </p>
      <PostEditor site={site} categories={db.categories.filter((c) => c.siteId === site.id).sort((a, b) => a.order - b.order)} authors={authors} postId={null} initial={initial} />
    </div>
  );
}
