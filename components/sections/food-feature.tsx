import Image from "next/image";
import Link from "next/link";
import { images, imageQuality } from "@/lib/content/images";

const links = [
  { href: "/food-customs/products-of-animal-origin", title: "POAO", text: "Meat, dairy, eggs, fish, honey and composite products" },
  { href: "/food-customs/catch-certificates", title: "CATCH certificates", text: "IUU catch certificates for wild-caught fish" },
  { href: "/food-customs/fresh-produce", title: "Fresh produce", text: "Phytosanitary certificates and plant-health checks" },
  { href: "/services#traces-ipaffs-entries", title: "TRACES & IPAFFS", text: "Pre-notifications for the EU and Great Britain" },
];
const topics = ["CHED-P", "CHED-PP", "CHED-D", "Border Control Posts", "Port Health", "HSE", "IUU"];

export function FoodFeature() {
  return (
    <section aria-labelledby="food-title" className="bg-clearance py-16 text-[#e3ecf0] sm:py-24 lg:py-28">
      <div data-reveal className="container-site grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-18">
        <div>
          <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Food customs specialists</p>
          <h2 id="food-title" className="text-[clamp(2rem,3.6vw,3rem)] text-salt">Food is our core business</h2>
          <p className="mt-5 text-[1.12rem] text-[#c9d8de]">
            We have a strong focus on supporting the food industry, with over half our business being POAO and food related clearances. Moving
            food through customs is often more complex than standard goods, due to additional documentation requirements, TRACES/IPAFFS entries
            and a higher likelihood of inspections.
          </p>
          <p className="mt-4">Our dedicated food team has in-depth technical knowledge across a wide range of products and agricultural commodities.</p>
          <ul className="mt-7 grid gap-px overflow-hidden rounded-brand border border-salt/12 bg-salt/12 sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.href} className="bg-overnight/55">
                <Link href={l.href} className="block h-full p-5 transition-colors hover:bg-atlantic/45 focus-visible:bg-atlantic/45">
                  <strong className="block font-display text-[1.25rem] font-normal text-cargo">{l.title}</strong>
                  <span className="mt-1 block text-[0.9rem] leading-snug text-[#c9d8de]">{l.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-brand lg:aspect-square">
            <Image src={images.food.src} alt={images.food.alt} fill sizes="(min-width:1024px) 45vw, 100vw" quality={imageQuality} className="object-cover" />
          </div>
          <ul aria-label="Food customs topics we handle" className="mt-4.5 flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t} className="rounded-full border border-salt/28 px-3 py-1 text-[0.82rem] font-semibold">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
