import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNav } from "@/cms/components/admin/admin-nav";
import { BlogSourceNote, blogShowsCms } from "@/cms/components/admin/blog-source-note";
import { HOSTED_SITE_KEY, publicUrl } from "@/cms/lib/routes";
import { requireAdminPage } from "@/cms/server/auth/guard";
import { canAccessSite } from "@/cms/server/auth/users";
import { logSiteNotFound, readDbForScreen } from "@/cms/server/admin-data";
import { enabledSites, findSite } from "@/cms/server/sites";

/** The screens of one website: the website switcher and its menu on the left. */
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ site: string }> }) {
  const { site: key } = await params;
  const user = await requireAdminPage({ siteKey: key });
  const db = await readDbForScreen("site");
  const site = findSite(db, key);
  if (!site) {
    await logSiteNotFound("site", key);
    notFound();
  }
  const listing = publicUrl(site, site.listingPath);

  return (
    <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="bg-overnight p-4 text-salt lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <AdminNav
          siteKey={site.key}
          role={user.role}
          sites={enabledSites(db).filter((s) => canAccessSite(user, s.key)).map((s) => ({ key: s.key, name: s.name, note: s.note }))}
        />
        <a href={listing.href} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center gap-2 rounded-brand border border-salt/25 px-3 text-[0.9rem] font-semibold text-salt hover:bg-salt/10">
          <ExternalLink aria-hidden className="size-4" /> Open the website&apos;s blog
        </a>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:py-8">
        {site.key === HOSTED_SITE_KEY && !blogShowsCms() && <BlogSourceNote className="mb-5" />}
        {children}
      </div>
    </div>
  );
}
