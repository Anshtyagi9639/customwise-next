import { Info } from "lucide-react";

/**
 * Shown in the admin while the public blog still shows its built-in articles (BLOG_SOURCE is not "cms"): publishing
 * here then does not put an article on the website, and its "View on website" address is a 404.
 */
export function BlogSourceNote({ className = "" }: { className?: string }) {
  return (
    <p role="note" className={`flex gap-2 rounded-brand border-l-4 border-freight bg-salt px-4 py-3 text-[0.92rem] ${className}`} data-testid="blog-source-note">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-freight" />
      <span>
        <strong>Published articles are not on the public website yet.</strong> The website is showing its built-in articles, so an article published here
        is saved but its address on the website shows &ldquo;page not found&rdquo;. It appears once the server setting <code>BLOG_SOURCE=cms</code> is added and the
        website is restarted.
      </span>
    </p>
  );
}

/** Whether the public blog is showing the CMS's articles (lib/content/blog-source.ts). */
export const blogShowsCms = () => process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms";
