import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Official Customs Wise icon set (Atlantic colourway, per brand guide: one colour set per project).
 * Served unoptimized: the source PNGs are tiny (3–14 KB, ~140px) flat-colour artwork, so the original file is sharper than a
 * lossy WebP re-encode, and at ~140px it stays crisp on 3x screens where the optimizer's 1x/2x srcset would be upscaled.
 */
export function BrandIcon({ src, className, size = 48 }: { src: string; className?: string; size?: number }) {
  return <Image src={src} alt="" width={size} height={size} unoptimized className={cn("object-contain", className)} aria-hidden />;
}
