import Link from "next/link";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/content";
import { ImageCard } from "./image-card";
import { SectionHeading } from "./section-heading";

export function ServiceGrid() {
  return (
    <section aria-labelledby="services-title" className="bg-mist py-16 sm:py-24 lg:py-28">
      <div data-reveal className="container-site">
        <SectionHeading
          kicker="What we do"
          title="Customs services"
          id="services-title"
          action={
            <Button asChild variant="outline">
              <Link href="/services">View all services</Link>
            </Button>
          }
        />
        <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug}>
              <ImageCard href={`/services#${s.slug}`} title={s.shortTitle} summary={s.summary} image={s.image} icon={s.icon} wide />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
