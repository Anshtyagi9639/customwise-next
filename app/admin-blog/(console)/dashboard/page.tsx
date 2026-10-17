import { FilePlus2 } from "lucide-react";
import type { Metadata } from "next";
import { BlogSourceNote } from "@/cms/components/admin/blog-source-note";
import { displayStatus, formatDateTime } from "@/cms/lib/content";
import { HOSTED_SITE_KEY, adminUrl } from "@/cms/lib/routes";
import { requireAdminPage } from "@/cms/server/auth/guard";
import { canAccessSite } from "@/cms/server/auth/users";
import { readDbForScreen } from "@/cms/server/admin-data";
import { enabledSites } from "@/cms/server/sites";

export const metadata: Metadata = { title: "Dashboard" };

/** /admin-blog/dashboard: every website this account manages, with its drafts, scheduled and published articles. */
export default async function DashboardPage() {
  const user = await requireAdminPage();
  const db = await readDbForScreen("dashboard");
  const sites = enabledSites(db).filter((s) => canAccessSite(user, s.key));
  const blogSource = process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms" ? "cms" : "static";
  const siteIds = new Set(sites.map((s) => s.id));
  // One website (the usual case): its card takes the full width instead of half of it.
  const single = sites.length === 1;
  const activity = db.audit.filter((a) => (a.siteId ? siteIds.has(a.siteId) : user.role === "admin")).slice(0, 10);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-[0.95rem] text-ink-soft">Signed in as {user.name || user.email}.</p>
      </div>

      {sites.some((s) => s.key === HOSTED_SITE_KEY) && blogSource !== "cms" && <BlogSourceNote />}

      {sites.length === 0 ? (
        <p className="card text-[0.95rem]">This account has not been given any websites yet. Ask an administrator to add one.</p>
      ) : (
        <ul className={`grid gap-4 ${single ? "" : "md:grid-cols-2"}`}>
          {sites.map((site) => {
            const posts = db.posts.filter((p) => p.siteId === site.id);
            const count = (status: "draft" | "scheduled" | "published") => posts.filter((p) => displayStatus(p) === status).length;
            return (
              <li
                key={site.id}
                className={`card grid gap-4 ${single ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center lg:gap-x-8" : ""}`}
                data-testid={`site-${site.key}`}
              >
                <div>
                  <h2 className="section-title">{site.name}</h2>
                  <p className="text-[0.88rem] text-pebble">{site.note}</p>
                </div>
                <div className={`grid grid-cols-3 gap-2 text-center ${single ? "lg:col-start-2 lg:row-span-2 lg:row-start-1" : ""}`}>
                  {(["draft", "scheduled", "published"] as const).map((status) => (
                    <div key={status} className="rounded-brand bg-mist px-2 py-3">
                      <span className="block text-[1.6rem] leading-none font-bold" data-testid={`count-${site.key}-${status}`}>
                        {count(status)}
                      </span>
                      <span className="mt-1 block text-[0.82rem] text-ink-soft">{status === "draft" ? "Drafts" : status === "scheduled" ? "Scheduled" : "Published"}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={adminUrl.site(site.key)} className="btn btn-primary">
                    Manage {site.name}
                  </a>
                  <a href={`${adminUrl.site(site.key)}/posts/new`} className="btn btn-accent">
                    <FilePlus2 aria-hidden className="size-4" /> New post
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="card" aria-labelledby="h-activity">
        <h2 id="h-activity" className="section-title mb-3">
          Recent activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-[0.92rem] text-pebble">Nothing has been changed yet.</p>
        ) : (
          <ul className="grid gap-1.5 text-[0.88rem]">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-3">
                <span className="text-pebble">{formatDateTime(a.at)}</span>
                <code className="text-ship">{a.action}</code>
                <span>{a.summary}</span>
                <span className="text-pebble">by {a.actor}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
