"use client";

import { usePathname } from "next/navigation";

/**
 * Shows its children on the public website only. The blog admin (/admin-blog) has its own screens, so the website's
 * navigation, footer, chat and site-wide structured data are left out there.
 */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin-blog") ? null : children;
}
