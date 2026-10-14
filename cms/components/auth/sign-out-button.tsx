"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { adminApi, adminUrl } from "@/cms/lib/routes";

/** Signs out on the server (the session is deleted), then returns to the sign-in page. */
export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(adminApi.logout, { method: "POST", credentials: "same-origin" }).catch(() => undefined);
        window.location.assign(adminUrl.login);
      }}
    >
      {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <LogOut aria-hidden className="size-4" />} Sign out
    </button>
  );
}
