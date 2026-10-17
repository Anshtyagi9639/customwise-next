import type { Metadata } from "next";
import { headers } from "next/headers";
import { LinkVerify } from "@/cms/components/auth/link-verify";
import { logEvent, requestIdOf } from "@/cms/server/log";

export const metadata: Metadata = { title: "Signing in" };

/** /admin-blog/auth#<token>: the page an emailed sign-in link opens. */
export default async function EmailLinkPage() {
  // The token is after "#", so it never reaches the server: this only records that the link's page was opened. The
  // check itself is the POST that follows ([CMS_AUTH] verification_started).
  logEvent("CMS_AUTH", "link_page_opened", { rid: requestIdOf(await headers()), route: "/admin-blog/auth", token_in_request: false });
  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="mb-6 text-center">
          <p className="text-[0.8rem] font-bold tracking-[0.14em] text-pebble uppercase">Customs Wise</p>
          <h1 className="mt-1 text-[1.7rem]">Blog admin</h1>
        </div>
        <div className="card shadow-card">
          <LinkVerify />
        </div>
      </div>
    </div>
  );
}
