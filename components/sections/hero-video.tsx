"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Decorative background video (client-supplied Customs Wise footage).
 * The poster image underneath is the fallback: it stays visible if autoplay is blocked, the visitor prefers
 * reduced motion, or has Data Saver on. The video fades in only once it is actually playing.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduceMotion || saveData) {
      video.pause();
      video.removeAttribute("autoplay");
      video.preload = "none";
      return;
    }
    // The browser may start autoplay before React attaches event handlers (common with the small mobile file),
    // so check the current state as well as listening for playback to begin.
    const markPlaying = () => {
      if (!video.paused && video.currentTime > 0) setPlaying(true);
    };
    markPlaying();
    video.addEventListener("playing", markPlaying);
    video.addEventListener("timeupdate", markPlaying);
    const attempt = video.play();
    // Autoplay blocked: keep showing the poster image.
    if (attempt) attempt.catch(() => setPlaying(false));
    return () => {
      video.removeEventListener("playing", markPlaying);
      video.removeEventListener("timeupdate", markPlaying);
    };
  }, []);

  return (
    <video
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      poster="/video/customs-wise-hero-poster.jpg"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
        playing ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Phones get the lighter 720p file. WebM (VP9) first, H.264 MP4 as the universal fallback. */}
      <source src="/video/customs-wise-hero-720.webm" type="video/webm" media="(max-width: 767px)" />
      <source src="/video/customs-wise-hero-720.mp4" type="video/mp4" media="(max-width: 767px)" />
      <source src="/video/customs-wise-hero-1080.webm" type="video/webm" />
      <source src="/video/customs-wise-hero-1080.mp4" type="video/mp4" />
    </video>
  );
}
