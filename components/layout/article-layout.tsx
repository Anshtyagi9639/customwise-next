import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { NavLink } from "@/types";

type ArticleLayoutProps = {
  children: ReactNode;
  cta: { title: string; text: string; href: string; label: string };
  related: { title: string; links: NavLink[] };
};

export function ArticleLayout({ children, cta, related }: ArticleLayoutProps) {
  return (
    <div className="container-site grid items-start gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_18.75rem] lg:gap-18">
      <div className="prose-cw min-w-0">{children}</div>
      <aside className="grid gap-4.5 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]" aria-label="Related">
        <div className="bg-clearance rounded-brand p-5.5 text-[#e3ecf0]">
          <h2 className="text-[1.45rem] text-salt">{cta.title}</h2>
          <p className="mt-2 text-[0.93rem]">{cta.text}</p>
          <Button asChild className="mt-4">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </div>
        <nav aria-label={related.title} className="rounded-brand border border-line p-5">
          <h2 className="text-[1.3rem]">{related.title}</h2>
          <ul className="mt-2.5 space-y-2 text-[0.93rem]">
            {related.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-atlantic underline underline-offset-3 hover:text-freight">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}

export const foodAside = {
  cta: { title: "Moving food into the UK or Ireland?", text: "Our food team handles certificates, CHEDs, pre-notifications and BCP checks.", href: "/contact?service=food#enquiry", label: "Make a food enquiry" },
  related: {
    title: "Food customs guides",
    links: [
      { label: "Products of animal origin", href: "/food-customs/products-of-animal-origin" },
      { label: "CATCH certificates", href: "/food-customs/catch-certificates" },
      { label: "Fresh produce", href: "/food-customs/fresh-produce" },
      { label: "TRACES & IPAFFS entries", href: "/services#traces-ipaffs-entries" },
    ],
  },
};

export const insightsAside = {
  cta: { title: "Not sure how this affects you?", text: "Talk it through with our team before your goods move.", href: "/contact?service=other#enquiry", label: "Make an enquiry" },
  related: {
    title: "More insights",
    links: [
      { label: "CBAM for UK and Irish importers", href: "/insights/cbam" },
      { label: "EUDR explained", href: "/insights/eudr" },
      { label: "Incoterms® 2020 and customs", href: "/insights/incoterms" },
      { label: "Importing POAO", href: "/food-customs/products-of-animal-origin" },
      { label: "Customs services", href: "/services" },
      { label: "Food customs", href: "/food-customs" },
    ],
  },
};
