import { RouteLines } from "@/components/layout/route-lines";
import { NewsletterForm } from "@/components/forms/newsletter-form";

export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-title" className="bg-clearance relative overflow-hidden py-14 text-[#e3ecf0] sm:py-18">
      <RouteLines className="opacity-70" />
      <div data-reveal className="container-site relative grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="mb-2.5 text-[0.95rem] font-semibold tracking-wide text-freight">Newsletter</p>
          <h2 id="newsletter-title" className="text-[clamp(1.9rem,3.2vw,2.6rem)] text-salt">
            Stay Ahead of Customs &amp; Trade Updates
          </h2>
          <p className="mt-3 max-w-[52ch] text-[#c9d8de]">
            Get practical customs and trade insights from our team, including changes to CBAM, EUDR, IPAFFS, TRACES and border controls
            that affect goods moving between the UK, Ireland and the EU.
          </p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  );
}
