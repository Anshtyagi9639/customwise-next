import Link from "next/link";
import { Fragment } from "react";
import type { BlogBlock, RichText } from "@/lib/content/blog";

function Rich({ text }: { text: RichText }) {
  if (typeof text === "string") return text;
  return text.map((part, i) => {
    if (typeof part === "string") return <Fragment key={i}>{part}</Fragment>;
    if ("strong" in part) return <strong key={i}>{part.strong}</strong>;
    return part.href.startsWith("/") ? (
      <Link key={i} href={part.href}>
        {part.text}
      </Link>
    ) : (
      <a key={i} href={part.href}>
        {part.text}
      </a>
    );
  });
}

/** Renders an article's structured content inside .prose-cw (headings, paragraphs, lists, callouts). */
export function BlogBody({ blocks }: { blocks: BlogBlock[] }) {
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
                <Rich text={item} />
              </li>
            ))}
          </List>
        );
      }
      case "callout":
        return (
          <div key={i} className="callout">
            <p className="break-words">{b.text}</p>
          </div>
        );
      default:
        return (
          <p key={i} className={i === 0 ? "lede" : undefined}>
            <Rich text={b.text} />
          </p>
        );
    }
  });
}
