"use client";

import { adminUrl } from "@/cms/lib/routes";

/** Shown when an admin screen fails, most often because the CMS database cannot be reached. No details are shown. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-[1.4rem]">This screen could not be loaded</h1>
        <p className="mt-2 text-[0.95rem] text-ink-soft">The CMS database may be unreachable for a moment. Nothing has been changed.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <a href={adminUrl.login} className="btn btn-secondary">
            Back to sign-in
          </a>
        </div>
      </div>
    </div>
  );
}
