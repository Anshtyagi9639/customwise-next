import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-clearance flex min-h-[80vh] items-center pt-[var(--nav-h)] text-salt">
      <div className="container-site py-20">
        <p className="font-semibold text-freight">Page not found</p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(2.4rem,5vw,4rem)] text-salt uppercase">This page isn&apos;t on the manifest</h1>
        <p className="mt-4 max-w-[55ch] text-[1.1rem] text-[#d2dfe5]">The page may have moved. Head to the homepage or browse our customs services.</p>
        <div className="mt-8 flex flex-wrap gap-3.5">
          <Button asChild>
            <Link href="/">Go to the homepage</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/services">View services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
