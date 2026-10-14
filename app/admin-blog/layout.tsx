import type { Metadata } from "next";
import "./admin.css";

/**
 * Everything under /admin-blog: the blog administration. Never indexed and never cached (see also proxy.ts).
 * The website's navigation, footer, chat and analytics are left out of these pages by components/layout/public-only.tsx.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Blog admin | Customs Wise", template: "%s · Blog admin | Customs Wise" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "same-origin",
};

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="cms-admin">{children}</div>;
}
