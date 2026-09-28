import { cn } from "@/lib/utils/cn";

/** Checklist in the brand's logo motif (ticked boxes). */
export function CheckList({ items, tone = "light", className }: { items: readonly string[]; tone?: "light" | "dark"; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className={cn("relative pl-8", tone === "dark" ? "text-[#e3ecf0]" : "text-overnight")}>
          <span aria-hidden className="absolute top-[0.28em] left-0 grid size-[18px] place-items-center rounded-[3px] border-2 border-freight">
            <svg viewBox="0 0 24 24" className="size-3 text-freight" fill="none">
              <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
