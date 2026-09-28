"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = "[data-reveal]";

/**
 * Adds a subtle fade-up to sections as they scroll into view. Content is fully visible without JavaScript
 * (the hidden state is only applied under html.js-reveal), and reduced-motion users see no movement.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    root.classList.add("js-reveal");
    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => !el.classList.contains("is-revealed"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const pending = new Set<HTMLElement>();
    for (const el of els) {
      // Anything already on screen shows immediately, so there is never a flash of hidden content above the fold.
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-revealed");
      else {
        pending.add(el);
        io.observe(el);
      }
    }
    // Safety net: fast scrolling (or jumping to an anchor) can carry a section past the viewport between frames,
    // so reveal anything whose top is already above the bottom of the screen. Content can never stay hidden.
    let frame = 0;
    const sweep = () => {
      frame = 0;
      for (const el of pending) {
        if (el.classList.contains("is-revealed")) pending.delete(el);
        else if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-revealed");
          io.unobserve(el);
          pending.delete(el);
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sweep);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
