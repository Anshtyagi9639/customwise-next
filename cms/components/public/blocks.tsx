/* eslint-disable @next/next/no-img-element -- CMS editor and previews show uploaded images (local or hosted, any size) as they are; images are unoptimised site-wide, so next/image would add nothing. */
import { Fragment } from "react";
import { parseInline } from "@/cms/lib/content";
import { publicUrl } from "@/cms/lib/routes";
import type { Block, Site } from "@/cms/lib/types";

/**
 * Where a link inside a preview should go: a path on the website opens that page of the website (this app for the
 * Customs Wise website, the website's own address for any other); an external address opens as it is.
 */
export function resolveHref(site: Pick<Site, "key" | "baseUrl">, href: string): { href: string; external: boolean } {
  if (!href.startsWith("/")) return { href, external: /^https?:/i.test(href) };
  return publicUrl(site, href);
}

export function Inline({ text, site }: { text: string; site: Site }) {
  return parseInline(text).map((part, i) => {
    if (typeof part === "string") return <Fragment key={i}>{part}</Fragment>;
    if ("strong" in part) return <strong key={i}>{part.strong}</strong>;
    const link = resolveHref(site, part.href);
    return (
      <a key={i} href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {part.text}
      </a>
    );
  });
}

/** Renders the approved article blocks as elements. No HTML from the editor is ever inserted directly. */
export function Blocks({ blocks, site }: { blocks: Block[]; site: Site }) {
  return blocks.map((b, i) => {
    switch (b.type) {
      case "h2":
        return <h2 key={i}>{b.text}</h2>;
      case "h3":
        return <h3 key={i}>{b.text}</h3>;
      case "ul":
      case "ol": {
        const List = b.type;
        return (
          <List key={i}>
            {b.items.map((item, k) => (
              <li key={k}>
                <Inline text={item} site={site} />
              </li>
            ))}
          </List>
        );
      }
      case "quote":
        return (
          <blockquote key={i}>
            <p>
              <Inline text={b.text} site={site} />
            </p>
            {b.cite && <cite>{b.cite}</cite>}
          </blockquote>
        );
      case "callout":
        return (
          <div key={i} className="callout">
            <p className="break-words">
              <Inline text={b.text} site={site} />
            </p>
          </div>
        );
      case "image":
        return (
          <figure key={i}>
            <img src={b.image.url} alt={b.image.alt} width={b.image.width} height={b.image.height} loading="lazy" style={{ maxWidth: Math.min(b.image.width, 1200) }} />
            {b.image.caption && <figcaption>{b.image.caption}</figcaption>}
          </figure>
        );
      default:
        return (
          <p key={i} className={i === 0 ? "lede" : undefined}>
            <Inline text={b.text} site={site} />
          </p>
        );
    }
  });
}
