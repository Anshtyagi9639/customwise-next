import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NoImagePanel } from "@/components/blog/no-image-panel";
import { insightCategories } from "@/lib/content";
import type { Guide } from "@/types";
import { imageQuality } from "@/lib/content/images";

/** Article cards: the whole card opens the article; the category label links to its category on /insights. */
export function GuideCards({ guides, headingLevel = "h3" }: { guides: Guide[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {guides.map((g) => {
        const cat = insightCategories.find((c) => c.slug === g.category);
        return (
          <li key={g.href}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-brand border border-line bg-salt transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-atlantic hover:shadow-card focus-within:border-atlantic">
              <div className="relative aspect-video overflow-hidden bg-ship">
                {g.image ? (
                  <Image src={g.image.src} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" quality={imageQuality} className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                ) : (
                  <NoImagePanel label={g.tag} />
                )}
              </div>
              <div className="flex flex-1 flex-col px-5.5 pt-5 pb-6">
                <p className="mb-1.5 flex flex-wrap items-center gap-x-2 text-[0.8rem] font-bold">
                  {cat && (
                    <Link href={`/insights#${cat.slug}`} className="relative z-10 text-freight underline-offset-3 hover:underline">
                      {cat.label}
                    </Link>
                  )}
                  <span aria-hidden className="text-line">
                    /
                  </span>
                  <span className="text-pebble">{g.tag}</span>
                </p>
                <Heading className="text-[1.4rem] group-hover:text-freight">{g.title}</Heading>
                <p className="mt-2 flex-1 text-[0.93rem] text-ink-soft">{g.summary}</p>
                <Link
                  href={g.href}
                  aria-label={`Read more: ${g.title}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[0.93rem] font-bold text-atlantic after:absolute after:inset-0 after:content-['']"
                >
                  Read more <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
