import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/cms/components/auth/login-form";
import { adminUrl } from "@/cms/lib/routes";
import { getCurrentAdmin } from "@/cms/server/auth/guard";
import { StoreUnavailableError } from "@/cms/server/store-errors";

export const metadata: Metadata = { title: "Sign in" };

/** /admin-blog: the sign-in page. Someone already signed in goes straight to the dashboard. */
export default async function SignInPage() {
  let signedIn = false;
  let unavailable = false;
  try {
    signedIn = Boolean(await getCurrentAdmin());
  } catch (err) {
    if (!(err instanceof StoreUnavailableError)) throw err;
    unavailable = true;
  }
  if (signedIn) redirect(adminUrl.dashboard);

  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="mb-6 text-center">
          <p className="text-[0.8rem] font-bold tracking-[0.14em] text-pebble uppercase">Customs Wise</p>
          <h1 className="mt-1 text-[1.7rem]">Blog admin</h1>
        </div>
        <div className="card shadow-card">
          {unavailable && (
            <p role="alert" className="mb-4 rounded-brand border-l-4 border-error bg-mist px-3 py-2 text-[0.9rem] font-semibold text-error">
              Sign-in is not available at the moment because the CMS database cannot be reached. Try again shortly.
            </p>
          )}
          <LoginForm />
        </div>
        <details className="mt-5 text-[0.88rem] text-ink-soft">
          <summary className="cursor-pointer font-semibold text-atlantic">Forgotten your password?</summary>
          <p className="mt-2">
            Passwords cannot be reset from this page. Ask the person who manages the website to reset yours: they can set a new password for your account with the
            CMS account tool, which also signs you out everywhere. Then sign in and change it under <strong>Account</strong>.
          </p>
        </details>
        <p className="mt-6 text-center text-[0.85rem]">
          <Link href="/" className="text-atlantic underline underline-offset-3">
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
