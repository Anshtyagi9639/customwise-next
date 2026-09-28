import { offices } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export function OfficeList({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const dark = tone === "dark";
  return (
    <ul className={cn("grid gap-7 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {offices.map((o) => (
        <li key={o.city}>
          <h3 className={cn(dark ? "font-sans text-[0.95rem] font-semibold text-cargo" : "text-[1.3rem]")}>{o.city}</h3>
          {o.isHeadOffice && <p className={cn("mt-1 text-[0.8rem] font-bold", dark ? "text-starlight" : "text-freight")}>Head office</p>}
          <address className={cn("mt-1.5 not-italic leading-relaxed", dark ? "text-[#afc0c8]" : "text-ink-soft")}>
            {o.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </address>
        </li>
      ))}
    </ul>
  );
}
