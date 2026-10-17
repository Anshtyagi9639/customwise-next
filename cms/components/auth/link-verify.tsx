"use client";

import { useEffect, useState } from "react";
import { EmailLinkButton } from "./email-link-button";

/**
 * /admin-blog/auth#<token>: uses an emailed sign-in link. The token is after "#", so it never reached the server with
 * the page request; it is removed from the address bar at once and sent once, by POST, to be checked.
 */
// A link being checked right now (React runs effects twice under next dev; the second run must not show an error).
let checking = false;

export function LinkVerify() {
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const token = window.location.hash.replace(/^#/, "");
      history.replaceState(null, "", window.location.pathname);
      if (!token) {
        if (!checking) setProblem((p) => p ?? "This page needs the sign-in link from your email. Open it again, or ask for a new one.");
        return;
      }
      setProblem(null);
      checking = true;
      const res = await fetch("/admin-blog/api/auth/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", token }), credentials: "same-origin" }).catch(() => null);
      const data = ((await res?.json().catch(() => ({}))) ?? {}) as { redirect?: string; message?: string; requestId?: string };
      // Browser console: the status, the reference and where it goes next (never the token or the link).
      (res?.ok ? console.info : console.warn)(`[CMS] sign-in link check: ${res ? `HTTP ${res.status}` : "network error"}${data.requestId ? `, reference ${data.requestId}` : ""}${data.redirect ? `, going to ${data.redirect}` : ""}`);
      if (res?.ok && data.redirect) {
        // A full page load, so the new session cookie is used for everything that follows.
        window.location.replace(data.redirect);
        return;
      }
      checking = false;
      setProblem(data.message ?? "The website could not be reached. Check your connection and try again.");
    }
    void check();
    // A newer link opened in this same tab only changes the part after "#", which does not reload the page.
    const onHash = () => void check();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!problem) return <p className="text-[0.95rem] text-pebble" data-testid="link-checking">Signing you in…</p>;
  return (
    <div className="grid gap-4">
      <p role="alert" className="rounded-brand border-l-4 border-error bg-mist px-3 py-2 text-[0.92rem] font-semibold text-error" data-testid="link-problem">
        {problem}
      </p>
      <EmailLinkButton label="Email me a new sign-in link" />
    </div>
  );
}
