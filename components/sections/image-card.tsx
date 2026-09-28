import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/icons/brand-icon";
import { imageQuality } from "@/lib/content/images";
import { cn } from "@/lib/utils/cn";
import type { ImageAsset } from "@/types";

type ImageCardProps = {
  href: string;
  title: string;
  summary: string;
  image: ImageAsset;
  icon?: string;
  cta?: string;
  wide?: boolean;
  headingLevel?: "h2" | "h3";
};

/**
 * Photo card with text over the image. On devices with hover, the summary reveals on hover/focus;
 * on touch devices and small screens it is always visible.
 */
export function ImageCard({ href, title, summary, image, icon, cta = "Read more", wide = false, headingLevel = "h3" }: ImageCardProps) {
  const Heading = headingLevel;
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate block min-h-[18.75rem] overflow-hidden rounded-brand bg-ship text-salt",
        wide ? "sm:aspect-[16/10] sm:min-h-0" : "sm:aspect-[4/5] sm:min-h-0",
      )}
    >
      <Image
        src={image.src}
        alt=""
        fill
        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        quality={imageQuality}
        className="object-cover transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-105 group-focus-visible:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_3_21/0.1)_15%,rgb(0_3_21/0.9)_70%)] transition-colors duration-300 hoverable:bg-[linear-gradient(180deg,rgb(0_3_21/0.05)_25%,rgb(0_3_21/0.88)_78%)] group-hover:bg-[linear-gradient(180deg,rgb(0_3_21/0.25)_0%,rgb(10_53_66/0.94)_62%)]"
      />
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
        {icon && (
          <span className="mb-3.5 grid size-12 place-items-center rounded-brand bg-salt/95">
            <BrandIcon src={icon} size={32} className="size-8" />
          </span>
        )}
        <Heading className="text-[1.55rem] text-salt">{title}</Heading>
        <p
          className={cn(
            "mt-2 text-[0.93rem] leading-normal text-[#e3ecf0]",
            "hoverable:mt-0 hoverable:max-h-0 hoverable:overflow-hidden hoverable:opacity-0",
            "transition-[max-height,opacity,margin] duration-300",
            "hoverable:group-hover:mt-2.5 hoverable:group-hover:max-h-40 hoverable:group-hover:opacity-100",
            "hoverable:group-focus-visible:mt-2.5 hoverable:group-focus-visible:max-h-40 hoverable:group-focus-visible:opacity-100",
          )}
        >
          {summary}
        </p>
        <span className="mt-2.5 inline-flex text-[0.9rem] font-bold text-cargo transition-opacity hoverable:opacity-0 hoverable:group-hover:opacity-100 hoverable:group-focus-visible:opacity-100">
          {cta}
        </span>
      </div>
    </Link>
  );
}
