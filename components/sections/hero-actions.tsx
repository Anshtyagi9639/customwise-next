import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

/** Primary "Make an Enquiry" + secondary "Call Us" for page heroes. */
export function HeroActions({ href = "/contact#enquiry", label = "Make an Enquiry" }: { href?: string; label?: string }) {
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <Button asChild className="w-full sm:w-auto">
        <Link href={href}>
          {label} <ArrowRight aria-hidden />
        </Link>
      </Button>
      <Button asChild variant="ghost" className="w-full sm:w-auto">
        <a href={site.phone.href} aria-label={`Call us on ${site.phone.display}`}>
          <Phone aria-hidden /> Call Us
        </a>
      </Button>
    </div>
  );
}
