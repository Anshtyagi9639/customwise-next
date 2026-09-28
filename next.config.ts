import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // WebP only: AVIF encoding of large transparent PNGs is very slow on first request.
    formats: ["image/webp"],
    // 75 is the default. 90 is used for the client photography and logo artwork: those sources are already small, compressed
    // files, and re-encoding them at 75 visibly softens detail and fringes the logo edges (see imageQuality in lib/content/images.ts).
    qualities: [75, 90],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/:dir(images|logos|icons)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
