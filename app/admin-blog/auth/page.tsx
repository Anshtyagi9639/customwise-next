import type { Metadata } from "next";
import { LinkVerify } from "@/cms/components/auth/link-verify";

export const metadata: Metadata = { title: "Signing in" };

/** /admin-blog/auth#<token>: the page an emailed sign-in link opens. */
export default function EmailLinkPage() {
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
