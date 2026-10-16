import type { PublicCard, PublicPost, Site } from "@/cms/lib/types";
import { CwArticle, CwChrome, CwListing } from "./customs-wise";

/** The design of the Customs Wise blog, used for previews in the admin (the only website the CMS manages). */

export function TestBanner({ site, children }: { site: Site; children?: React.ReactNode }) {
  return (
    <div role="note" className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-freight px-4 py-1.5 text-center font-sans text-[0.82rem] font-bold text-overnight">
      <span>
        PREVIEW of {site.name}: how this article looks on the website. Previewing publishes nothing.
      </span>
      {children}
    </div>
  );
}

export function SiteChrome({ site, children }: { site: Site; children: React.ReactNode }) {
  return <CwChrome site={site}>{children}</CwChrome>;
}

export function ArticleView({ site, post, related }: { site: Site; post: PublicPost; related: PublicCard[] }) {
  return <CwArticle site={site} post={post} related={related} />;
}

export function ListingView(props: { site: Site; posts: PublicCard[]; categories: { slug: string; label: string; count: number }[]; active?: string }) {
  return <CwListing {...props} />;
}
