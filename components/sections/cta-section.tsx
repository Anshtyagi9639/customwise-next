import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

type CTASectionProps = { title?: string; text?: string; href?: string; showCall?: boolean };

/** Enquiry banner: primary "Get an Enquiry" plus a secondary "Call Us" (verified number). */
export function CTASection({
  title = "Moving goods into or out of the UK or Ireland?",
  text = "Tell us about the shipment and we'll set out what it needs.",
  href = "/contact#enquiry",
  showCall = true,
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden bg-ship py-12 text-salt sm:py-14" aria-label="Get an Enquiry">
      <div aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-cargo" />
      <div data-reveal className="container-site flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] text-salt">{title}</h2>
          <p className="mt-1.5 text-[#c9d8de]">{text}</p>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <Button asChild className="flex-1 sm:flex-none">
            <Link href={href}>
              Get an Enquiry <ArrowRight aria-hidden />
            </Link>
          </Button>
          {showCall && (
            <Button asChild variant="ghost" className="flex-1 sm:flex-none">
              <a href={site.phone.href} aria-label={`Call us on ${site.phone.display}`}>
                <Phone aria-hidden /> Call Us
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
