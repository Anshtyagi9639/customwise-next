import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView, SiteChrome, TestBanner } from "@/cms/components/public/site-view";
import { displayStatus } from "@/cms/lib/content";
import { requireAdminPage } from "@/cms/server/auth/guard";
import { siteByKey } from "@/cms/server/http";
import { previewPost } from "@/cms/server/posts";

export const metadata: Metadata = { title: "Preview" };

/**
 * Full-page preview of one saved article in its website's design, whatever its status. It can show unpublished
 * content, so it is only for signed-in users who manage that website.
 */
export default async function RawPreview({ params }: { params: Promise<{ site: string; id: string }> }) {
  const { site: key, id } = await params;
  await requireAdminPage({ siteKey: key });
  const site = await siteByKey(key);
  const found = site && (await previewPost(site, id));
  if (!site || !found) notFound();
  const status = displayStatus(found.raw);
  return (
    <>
      <TestBanner site={site}>
        <span className="rounded-full bg-overnight px-2.5 py-0.5 text-salt" data-testid="preview-status">
          {status === "published" ? "PUBLISHED" : status === "scheduled" ? "SCHEDULED: not visible to the public yet" : "DRAFT: not visible to the public"}
        </span>
      </TestBanner>
      <SiteChrome site={site}>
        <ArticleView site={site} post={found.post} related={found.related} />
      </SiteChrome>
    </>
  );
}
