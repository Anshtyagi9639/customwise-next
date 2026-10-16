import type { Metadata } from "next";
import { SetupForm } from "@/cms/components/auth/setup-form";

export const metadata: Metadata = { title: "Set your password" };

/** /admin-blog/setup#<token>: choosing a password from an invitation or password-reset link sent by an administrator. */
export default function SetupPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="mb-6 text-center">
          <p className="text-[0.8rem] font-bold tracking-[0.14em] text-pebble uppercase">Customs Wise</p>
          <h1 className="mt-1 text-[1.7rem]">Set your password</h1>
        </div>
        <div className="card shadow-card">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
