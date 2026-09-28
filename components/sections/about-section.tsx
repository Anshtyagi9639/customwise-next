import Image from "next/image";
import Link from "next/link";
import { images, imageQuality } from "@/lib/content/images";

const points = [
  "Accurate declarations and timely processing",
  "Proactive communication that keeps your supply chain moving",
  "Offices In Ireland, UK, India and Morocco",
  "Access to trusted brokers across over 50 countries",
  "Food specialists with dedicated teams for POAO and Fresh produce",
  "Experience across a wide range Industries",
];

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="py-16 sm:py-24 lg:py-28">
      <div data-reveal className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">About Customs Wise</p>
          <h2 id="about-title" className="text-[clamp(2rem,3.6vw,3rem)]">Independent customs experts in the UK and Ireland</h2>
          <p className="mt-5 text-[1.12rem] text-ink-soft">
            We provide efficient customs solutions that save you time and money, with access to a global network of customs brokers for support
            worldwide.
          </p>
          <p className="mt-4 text-ink-soft">
            Backed by 30 years&apos; experience in customs compliance, our staff understand the intricacies of even the most complex requirements
            and work to get your shipments through customs without delay.
          </p>
          <ul className="mt-6 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="relative pl-8 text-overnight">
                <span aria-hidden className="absolute top-[0.3em] left-0 grid size-[18px] place-items-center rounded-[3px] border-2 border-freight">
                  <svg viewBox="0 0 24 24" className="size-3 text-freight" fill="none">
                    <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link href="/about" className="mt-7 inline-block font-semibold text-atlantic underline underline-offset-3 hover:text-freight">
            More about Customs Wise
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-brand">
          <Image src={images.pallets.src} alt={images.pallets.alt} fill sizes="(min-width:1024px) 50vw, 100vw" quality={imageQuality} className="object-cover" />
        </div>
      </div>
    </section>
  );
}
