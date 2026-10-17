"use client";

import { useEffect } from "react";
import { NEXT_STEP, parseCmsDiagnostic } from "@/cms/lib/diagnostics";
import { SignOutButton } from "@/cms/components/auth/sign-out-button";

/**
 * Shown when an admin screen fails, most often because the CMS database cannot be reached. No details are shown.
 * Articles, images, users and the activity log all live in the database, so they cannot be shown until it is back,
 * even for an administrator who could sign in without it (the one from the server settings).
 *
 * Below the message: safe diagnostic details from the error's digest (see cms/lib/diagnostics.ts). The reference is
 * the request id of the matching [CMS_DATA] dashboard_load_failed line in the server log. For any other error, Next.js's
 * own digest is the reference. "Try again" uses retry(), which loads the screen's data from the server again (reset()
 * would only re-render what already failed).
 */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const diag = parseCmsDiagnostic(error.digest);
  const reference = diag?.reference ?? error.digest ?? "none";

  useEffect(() => {
    // Browser console: the reference and category only, to match with the server log.
    const d = parseCmsDiagnostic(error.digest);
    console.warn(`[CMS] admin screen could not be loaded: reference ${d?.reference ?? error.digest ?? "none"}${d ? `, ${d.operation}, HTTP ${d.status}, ${d.category} (${d.kind})` : ""}`);
  }, [error.digest]);

  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="card max-w-md text-center" data-testid="admin-error">
        <h1 className="text-[1.4rem]">This screen could not be loaded</h1>
        <p className="mt-2 text-[0.95rem] text-ink-soft">
          The CMS database may be unreachable at the moment, so articles cannot be shown or changed. Nothing has been changed. If you are signed in, you stay
          signed in.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => retry()} data-testid="admin-error-retry">
            Try again
          </button>
          <SignOutButton />
        </div>
        <section className="mt-6 rounded-brand border border-line bg-mist px-4 py-3 text-left text-[0.82rem] text-ink-soft" aria-label="CMS diagnostic details" data-testid="admin-error-diagnostics">
          <h2 className="text-[0.85rem] font-bold text-overnight">CMS diagnostic details</h2>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            <dt>Reference</dt>
            <dd className="font-mono break-all" data-testid="diag-reference">
              {reference}
            </dd>
            <dt>Operation</dt>
            <dd className="font-mono" data-testid="diag-operation">
              {diag?.operation ?? "admin-screen"}
            </dd>
            <dt>Status</dt>
            <dd className="font-mono" data-testid="diag-status">
              {diag?.status ?? "500"}
            </dd>
            <dt>Category</dt>
            <dd className="font-mono" data-testid="diag-category">
              {diag ? `${diag.category} (${diag.kind})` : "unknown"}
            </dd>
          </dl>
          <p className="mt-2">{NEXT_STEP[diag?.category ?? "unknown"] ?? NEXT_STEP.unknown}</p>
        </section>
      </div>
    </div>
  );
}
