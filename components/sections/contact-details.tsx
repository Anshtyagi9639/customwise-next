import { Clock, Mail, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

/** Phone, email and opening hours. Used in the enquiry section and on the contact page. */
export function ContactDetails({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const row = cn("flex gap-3.5 border-t py-3.5", dark ? "border-salt/12" : "border-line");
  const link = cn("font-semibold transition-colors", dark ? "text-salt hover:text-cargo" : "text-atlantic hover:text-freight");
  const icon = cn("mt-1 size-5 shrink-0", dark ? "text-cargo" : "text-freight");
  return (
    <ul className="mt-6">
      <li className={row}>
        <Phone aria-hidden className={icon} />
        <a href={site.phone.href} className={link}>
          <span className="sr-only">Phone: </span>
          {site.phone.display}
        </a>
      </li>
      <li className={row}>
        <Mail aria-hidden className={icon} />
        <a href={`mailto:${site.email}`} className={link}>
          <span className="sr-only">Email: </span>
          {site.email}
        </a>
      </li>
      <li className={row}>
        <Clock aria-hidden className={icon} />
        <div>
          <p className="sr-only">Opening hours</p>
          <dl className="grid grid-cols-[auto_auto] gap-x-5 gap-y-0.5 text-[0.95rem]">
            {site.hours.map((h) => (
              <div key={h.days} className="contents">
                <dt className={dark ? "text-starlight" : "text-ink-soft"}>{h.days}</dt>
                <dd className={cn("font-semibold", dark ? "text-salt" : "text-overnight")}>{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </li>
    </ul>
  );
}
