"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shown when an article cannot be loaded right now (for example while the blog CMS cannot be reached), so a temporary
 * problem is never presented as "this page does not exist". No details are shown to visitors.
 */
export default function ArticleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="bg-clearance flex min-h-[80vh] items-center pt-[var(--nav-h)] text-salt" data-testid="article-unavailable">
      <div className="container-site py-20">
        <p className="font-semibold text-freight">Temporarily unavailable</p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(2.4rem,5vw,4rem)] text-salt uppercase">This article is held at customs for a moment</h1>
        <p className="mt-4 max-w-[55ch] text-[1.1rem] text-[#d2dfe5]">It could not be loaded just now. Please try again in a few minutes.</p>
        <div className="mt-8 flex flex-wrap gap-3.5">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="ghost">
            <Link href="/blog">All articles</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
