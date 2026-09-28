"use client";

import { MessageSquareText, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { type Ref, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ChatbotButtonProps = { open: boolean; onToggle: () => void; controls: string; ref?: Ref<HTMLButtonElement> };

/**
 * Floating launcher, bottom-right. Never covers a button, link or form field: if something interactive sits under it,
 * it fades out of the way (and lets clicks pass through) until the page scrolls to clear space.
 */
export function ChatbotButton({ open, onToggle, controls, ref }: ChatbotButtonProps) {
  const [obscuring, setObscuring] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    const INTERACTIVE = "a, button, input, select, textarea, summary, label, [role=button]";
    const check = () => {
      frame = 0;
      const wrap = wrapRef.current;
      if (!wrap) return;
      // Keyboard users: a focused launcher is always shown.
      if (wrap.contains(document.activeElement)) {
        setObscuring(false);
        return;
      }
      const r = wrap.getBoundingClientRect();
      // Sample a 3x3 grid over the launcher plus a small margin, so partial overlaps are caught too.
      const pad = 6;
      const xs = [r.left - pad, r.left + r.width / 2, r.right + pad - 1];
      const ys = [r.top - pad, r.top + r.height / 2, r.bottom + pad - 1];
      const points: [number, number][] = xs.flatMap((x) => ys.map((y): [number, number] => [x, Math.min(y, window.innerHeight - 1)]));
      const hit = points.some(([x, y]) =>
        document
          .elementsFromPoint(Math.max(0, x), Math.max(0, y))
          .some((el) => !wrap.contains(el) && !el.closest("[data-chatbot]") && el.closest(INTERACTIVE)),
      );
      setObscuring(hit);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "open", "class"] });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const hidden = obscuring && !open;

  return (
    <motion.div
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 sm:right-6 sm:bottom-6"
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: reduce ? 0 : 1.2, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div
        ref={wrapRef}
        data-obscuring={hidden ? "true" : undefined}
        className="transition-[opacity,translate] duration-200 data-[obscuring=true]:pointer-events-none data-[obscuring=true]:translate-y-3 data-[obscuring=true]:opacity-0"
      >
        <button
          ref={ref}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={controls}
          aria-label={open ? "Close chat" : "Chat with us"}
          className={cn(
            "group flex h-14 min-w-14 items-center justify-center gap-2.5 rounded-full bg-ship text-cargo shadow-[0_10px_28px_-8px_rgb(0_3_21/0.55)] ring-2 ring-cargo/70",
            "transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-atlantic",
            open ? "bg-overnight" : "lg:pr-5.5 lg:pl-4.5",
          )}
        >
          {open ? (
            <X aria-hidden className="size-6" />
          ) : (
            <>
              <MessageSquareText aria-hidden className="size-6 transition-transform duration-300 group-hover:scale-110" />
              {/* Label on large screens only, so the launcher stays small on phones and tablets */}
              <span aria-hidden className="hidden text-[0.95rem] font-bold text-salt lg:inline">
                Chat with us
              </span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
