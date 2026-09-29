import { Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { SocialIcon } from "@/components/icons/social-icons";
import { OfficeList } from "@/components/sections/office-list";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { services } from "@/lib/content";
import { primaryCta, site } from "@/lib/site";

const quickLinks = [
  { label: "About", href: "/about" },
  { label: "Food customs", href: "/food-customs" },
  { label: "Industries", href: "/industries" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
];

const heading = "mb-4 font-sans text-[0.8rem] font-bold tracking-[0.12em] text-cargo uppercase";
const link = "text-[#afc0c8] transition-colors hover:text-salt";

export function Footer() {
  return (
    <footer className="relative bg-overnight pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-[0.93rem] text-[#afc0c8]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-cargo),var(--color-freight)_40%,var(--color-atlantic))]" />
      <div className="container-site">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.35fr_1fr_0.75fr_1.1fr] lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Logo variant="main" className="w-[210px]" />
            <p className="mt-5 max-w-[36ch] leading-relaxed">{site.description}</p>
            <ul aria-label="Customs Wise on social media" className="mt-6 flex gap-2.5">
              {site.social.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Customs Wise on ${s.label} (opens in a new tab)`}
                    title={s.label}
                    className="grid size-11 place-items-center rounded-full border border-salt/15 text-starlight transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cargo hover:bg-cargo hover:text-overnight"
                  >
                    <SocialIcon network={s.network} className="size-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Services">
            <h2 className={heading}>Services</h2>
            <ul className="space-y-2.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services#${s.slug}`} className={link}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Quick links">
            <h2 className={heading}>Quick links</h2>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 lg:col-span-1">
            <h2 className={heading}>Get in touch</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Phone aria-hidden className="mt-0.5 size-4.5 shrink-0 text-cargo" />
                <a href={site.phone.href} className={`${link} font-semibold text-salt`}>
                  {site.phone.display}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail aria-hidden className="mt-0.5 size-4.5 shrink-0 text-cargo" />
                <a href={`mailto:${site.email}`} className={`${link} font-semibold text-salt`}>
                  {site.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock aria-hidden className="mt-0.5 size-4.5 shrink-0 text-cargo" />
                <span>
                  {site.hours.map((h) => (
                    <span key={h.short} className="block">
                      {h.short} {h.time.replace(/ /g, "")}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
            <Button asChild className="mt-6">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 border-t border-salt/8 pt-8">
          <h2 className={heading}>Our offices</h2>
          <OfficeList tone="dark" className="grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4" />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-salt/8 pt-5.5 text-[0.85rem] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.tagline}.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/faqs" className={link}>
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/contact" className={link}>
                Contact
              </Link>
            </li>
            <li>
              <a href={site.privacyPolicy} target="_blank" rel="noopener noreferrer" className={link}>
                Privacy policy<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
