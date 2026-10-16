"use client";

import { SignOutButton } from "@/cms/components/auth/sign-out-button";

/**
 * Shown when an admin screen fails, most often because the CMS database cannot be reached. No details are shown.
 * Articles, images, users and the activity log all live in the database, so they cannot be shown until it is back,
 * even for an administrator who could sign in without it (the one from the server settings).
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="card max-w-md text-center" data-testid="admin-error">
        <h1 className="text-[1.4rem]">This screen could not be loaded</h1>
        <p className="mt-2 text-[0.95rem] text-ink-soft">
          The CMS database may be unreachable at the moment, so articles cannot be shown or changed. Nothing has been changed. If you are signed in, you stay
          signed in.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
