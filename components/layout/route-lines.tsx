import { cn } from "@/lib/utils/cn";

/**
 * Subtle animated "trade route" background: slow dashed shipping lanes and softly pulsing port markers.
 * Pure SVG + CSS (no JavaScript). Static when the user prefers reduced motion.
 */
export function RouteLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      className={cn("route-lines pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" strokeLinecap="round">
        <path className="route route-a" d="M-40 470 C 260 380, 420 520, 700 410 S 1180 250, 1480 330" />
        <path className="route route-b" d="M-40 250 C 220 300, 480 170, 760 240 S 1160 420, 1480 300" />
        <path className="route route-c" d="M180 690 C 360 520, 640 560, 880 460 S 1260 180, 1500 150" />
      </g>
      <g className="ports">
        <circle cx="700" cy="410" r="3.5" />
        <circle cx="760" cy="240" r="3.5" />
        <circle cx="1180" cy="250" r="3.5" />
        <circle cx="880" cy="460" r="3.5" />
        <circle cx="420" cy="205" r="3.5" />
      </g>
    </svg>
  );
}
