import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  kicker?: string;
  title: string;
  id?: string;
  intro?: ReactNode;
  tone?: "light" | "dark";
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({ kicker, title, id, intro, tone = "light", action, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-10 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-3xl">
        {kicker && <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">{kicker}</p>}
        <h2 id={id} className={cn("text-[clamp(2rem,3.6vw,3rem)]", tone === "dark" && "text-salt")}>
          {title}
        </h2>
        {intro && <div className={cn("mt-4 text-[1.1rem]", tone === "dark" ? "text-[#c9d8de]" : "text-ink-soft")}>{intro}</div>}
      </div>
      {action}
    </div>
  );
}
