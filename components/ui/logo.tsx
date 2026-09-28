import Image from "next/image";
import Link from "next/link";
import { imageQuality, logos } from "@/lib/content/images";
import { cn } from "@/lib/utils/cn";

type LogoProps = { variant?: "alternative" | "main"; className?: string; priority?: boolean; linked?: boolean };

/** Official Customs Wise logo (supplied artwork). Never recreate it with text. */
export function Logo({ variant = "alternative", className, priority = false, linked = true }: LogoProps) {
  const asset = variant === "main" ? logos.mainDark : logos.alternativeDark;
  const img = (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={variant === "main" ? "Customs Wise, keeping customs simple" : "Customs Wise"}
      priority={priority}
      sizes={variant === "main" ? "240px" : "120px"}
      quality={imageQuality}
      className={cn("h-auto", className)}
    />
  );
  if (!linked) return img;
  return (
    <Link href="/" aria-label="Customs Wise home" className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
