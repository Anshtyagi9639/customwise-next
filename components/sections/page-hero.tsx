import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/layout/breadcrumbs";
import { RouteLines } from "@/components/layout/route-lines";
import type { ImageAsset } from "@/types";

type PageHeroProps = { title: string; intro: ReactNode; trail: Crumb[]; image?: ImageAsset; children?: ReactNode };

/** Inner-page header on the CLEARANCE gradient, with an optional image faded in on the right. */
export function PageHero({ title, intro, trail, image, children }: PageHeroProps) {
  return (
    <section className="bg-clearance relative overflow-hidden pt-[calc(var(--nav-h)+3.5rem)] pb-16 text-salt">
      {image && (
        <div className="absolute inset-0 opacity-20 lg:left-1/2 lg:opacity-45 lg:[mask-image:linear-gradient(90deg,transparent,#000_60%)]">
          <Image src={image.src} alt="" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
      )}
      <RouteLines />
      <div className="container-site relative">
        <Breadcrumbs trail={trail} />
        <h1 className="max-w-[20ch] text-[clamp(2.2rem,5vw,4rem)] uppercase text-salt">{title}</h1>
        <div className="mt-4 max-w-[62ch] text-[1.1rem] text-[#d2dfe5]">{intro}</div>
        {children}
      </div>
    </section>
  );
}
