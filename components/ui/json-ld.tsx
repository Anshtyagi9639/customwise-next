type JsonLdProps = { data: Record<string, unknown> | Record<string, unknown>[] };

/** Renders schema.org JSON-LD. Content is static and built from verified site data. */
export function JsonLd({ data }: JsonLdProps) {
  const graph = Array.isArray(data) ? data : [data];
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
