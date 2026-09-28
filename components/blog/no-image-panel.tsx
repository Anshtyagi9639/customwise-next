import { BrandIcon } from "@/components/icons/brand-icon";
import { cn } from "@/lib/utils/cn";

/**
 * Stands in for an article image when the source article has none (no stock photo is substituted).
 * Brand CLEARANCE gradient with an official Customs Wise icon; decorative only.
 */
export function NoImagePanel({ label, className }: { label?: string; className?: string }) {
  return (
    <div aria-hidden className={cn("bg-clearance absolute inset-0 grid place-items-center", className)}>
      <div className="flex flex-col items-center gap-3">
        <span className="grid size-16 place-items-center rounded-brand bg-salt/95">
          <BrandIcon src="/icons/docs.png" size={40} className="size-10" />
        </span>
        {label && <span className="font-display text-[1.05rem] tracking-[0.14em] text-starlight uppercase">{label}</span>}
      </div>
    </div>
  );
}
