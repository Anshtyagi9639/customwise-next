import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { imageQuality, logos } from "@/lib/content/images";
import { HeroVideo } from "./hero-video";

/** Homepage hero: client-supplied Customs Wise video in the background, official logo centred over it. */
export function Hero() {
  return (
    <section
      aria-labelledby="home-title"
      className="relative flex min-h-[max(34rem,78svh)] items-center overflow-hidden bg-overnight pt-[var(--nav-h)] pb-14 text-salt sm:min-h-[max(38rem,86svh)]"
    >
      {/* Poster image: the LCP element and the fallback when the video can't play */}
      <Image src="/video/customs-wise-hero-poster.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <HeroVideo />
      {/* Brand CLEARANCE overlay so the logo stays clearly readable over any frame of the video */}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgb(0_3_21/0.82)_0%,rgb(10_53_66/0.72)_50%,rgb(74_104_118/0.62)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgb(0_3_21/0.45),transparent)]" />

      <div className="container-site relative flex flex-col items-center text-center">
        <h1 id="home-title" className="w-[min(82vw,34rem)]">
          <Image
            src={logos.mainDark.src}
            width={logos.mainDark.width}
            height={logos.mainDark.height}
            alt="Customs Wise, keeping customs simple"
            priority
            sizes="(min-width: 640px) 34rem, 82vw"
            quality={imageQuality}
            className="h-auto w-full drop-shadow-[0_2px_18px_rgb(0_3_21/0.45)]"
          />
          <span className="sr-only">: customs clearance and food customs specialists for the UK and Ireland</span>
        </h1>
        <div className="mt-9 flex w-full flex-wrap justify-center gap-3.5 sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/contact#enquiry">
              Make an enquiry <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <Link href="/food-customs">Explore food customs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
