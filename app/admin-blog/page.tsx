import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailLinkButton } from "@/cms/components/auth/email-link-button";
import { LoginForm } from "@/cms/components/auth/login-form";
import { envAdmin } from "@/cms/server/auth/env-admin";
import { getCurrentAdmin, landingPage } from "@/cms/server/auth/guard";
import { logEvent, requestIdOf } from "@/cms/server/log";
import { StoreUnavailableError } from "@/cms/server/store-errors";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Sign in" };

/** /admin-blog: the sign-in page. Someone already signed in goes straight to Manage Customs Wise (see landingPage). */
export default async function SignInPage() {
  let user: Awaited<ReturnType<typeof getCurrentAdmin>> = null;
  let unavailable = false;
  try {
    user = await getCurrentAdmin();
  } catch (err) {
    if (!(err instanceof StoreUnavailableError)) throw err;
    unavailable = true;
  }
  // With an administrator in the server settings, the email link is the way in; the password form stays available.
  const emailSignIn = envAdmin().state === "ok";
  logEvent("CMS_AUTH", "login_page_loaded", {
    rid: requestIdOf(await headers()),
    route: "/admin-blog",
    outcome: unavailable ? "failure" : "info",
    code: user ? "already_signed_in" : unavailable ? "database_unavailable" : "shown",
    email_sign_in: emailSignIn,
    // Public configuration, as set or not (never the values).
    site_address_set: !!process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    cms_address_set: !!process.env.CMS_PUBLIC_URL?.trim(),
  });
  if (user) redirect(landingPage(user));

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
          {emailSignIn ? (
            <div className="grid gap-4">
              <p className="text-[0.95rem]">We will email a secure sign-in link to the administrator&apos;s inbox. It works once, within 15 minutes.</p>
              <EmailLinkButton />
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
        {emailSignIn && (
          <details className="mt-5 text-[0.88rem] text-ink-soft" data-testid="password-sign-in">
            <summary className="cursor-pointer font-semibold text-atlantic">Sign in with a password instead</summary>
            <div className="card mt-3">
              <LoginForm />
            </div>
          </details>
        )}
        <details className="mt-3 text-[0.88rem] text-ink-soft">
          <summary className="cursor-pointer font-semibold text-atlantic">Forgotten your password?</summary>
          <p className="mt-2">
            For security, passwords cannot be reset from this page. Ask an administrator to send you a password-reset link from <strong>Users</strong>. The link
            works once, within 24 hours, and signs you out everywhere. If you are the only administrator, reset your password on the server with{" "}
            <code>node scripts/cms/admin-users.mjs set-password</code>.
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
