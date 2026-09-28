import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/icons/brand-icon";
import { cn } from "@/lib/utils/cn";
import type { ImageAsset, NavLink } from "@/types";
import { imageQuality } from "@/lib/content/images";

type FeatureRowProps = {
  id: string;
  title: string;
  body: string[];
  image: ImageAsset;
  icon: string;
  links: NavLink[];
  reverse?: boolean;
};

/** Alternating image/text row used on the Services and Industries pages. */
export function FeatureRow({ id, title, body, image, icon, links, reverse }: FeatureRowProps) {
  return (
    <article data-reveal id={id} aria-labelledby={`${id}-title`} className="grid items-center gap-7 border-b border-line py-10 last:border-b-0 sm:py-16 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
      <div className={cn("relative aspect-[3/2] overflow-hidden rounded-brand bg-ship", reverse && "lg:order-2")}>
        <Image src={image.src} alt={image.alt} fill sizes="(min-width:1024px) 40vw, 100vw" quality={imageQuality} className="object-cover" />
      </div>
      <div>
        <BrandIcon src={icon} size={52} className="mb-3.5 size-13" />
        <h2 id={`${id}-title`} tabIndex={-1} className="text-[clamp(1.8rem,3vw,2.5rem)]">
          {title}
        </h2>
        {body.map((p) => (
          <p key={p} className="mt-3.5 text-ink-soft">
            {p}
          </p>
        ))}
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5 text-[0.95rem] font-semibold">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link href={l.href} className="text-atlantic underline underline-offset-3 hover:text-freight">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
