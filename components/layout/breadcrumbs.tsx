import Link from "next/link";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const all = [{ name: "Home", path: "/" }, ...trail];
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap gap-1.5 text-[0.86rem] text-starlight">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="opacity-50">/</span>}
              {last ? (
                <span aria-current="page">{c.name}</span>
              ) : (
                <Link href={c.path} className="transition-colors hover:text-cargo">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
