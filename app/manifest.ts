import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Customs Wise",
    short_name: "Customs Wise",
    description: "Independent customs experts in the UK and Ireland.",
    start_url: "/",
    display: "browser",
    background_color: "#0a3542",
    theme_color: "#0a3542",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
