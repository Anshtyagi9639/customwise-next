import type { Metadata } from "next";
import { site } from "@/lib/site";

type PageMetaInput = {
  /** Full <title>. Page titles are written individually for search intent, so no template is applied. */
  title: string;
  description: string;
  path: `/${string}`;
  type?: "website" | "article";
};

export function buildMetadata({ title, description, path, type = "website" }: PageMetaInput): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      title,
      description,
      siteName: site.name,
      locale: "en_GB",
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Customs Wise, keeping customs simple" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image.png"] },
  };
}
