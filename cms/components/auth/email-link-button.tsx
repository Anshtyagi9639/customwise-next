"use client";

import { Loader2, Mail } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const API = "/admin-blog/api/auth/link";
const noSubscription = () => () => {};

/**
 * Asks the server to email a single-use sign-in link to the administrator's address (ADMIN_EMAIL). Nobody types an
 * address here; the server decides where the link goes, and its answer never shows the address.
 * After a request the button rests for as long as the server says (a minute by default): a second email would cancel
 * the link of the first one while it may still be on its way.
 */
export function EmailLinkButton({ label = "Email me a sign-in link" }: { label?: string }) {
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; ref?: string } | null>(null);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!waitUntil) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= waitUntil) {
        setWaitUntil(0);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [waitUntil]);

  async function send() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send" }), credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { message?: string; retryAfter?: number; requestId?: string };
      // The request id matches the [CMS_AUTH] lines of this request in the server log; shown when something went wrong.
      const ref = res.headers.get("X-Request-Id") ?? data.requestId;
      setResult({ ok: res.ok, text: data.message ?? (res.ok ? "The request was accepted. Delivery is not confirmed yet." : "No email was sent. Try again shortly."), ...(!res.ok && ref ? { ref } : {}) });
      if (typeof data.retryAfter === "number" && data.retryAfter > 0) {
        const t = Date.now();
        setNow(t);
        setWaitUntil(t + data.retryAfter * 1000);
      }
    } catch {
      setResult({ ok: false, text: "The website could not be reached, so no email was sent. Check your connection and try again." });
    }
    setBusy(false);
  }

  const secondsLeft = waitUntil ? Math.max(0, Math.ceil((waitUntil - now) / 1000)) : 0;
  return (
    <div className="grid gap-3">
      <button type="button" className="btn btn-primary min-h-11 w-full" onClick={send} disabled={busy || !ready || secondsLeft > 0} aria-busy={busy} data-testid="email-link-button">
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Mail aria-hidden className="size-4" />}
        {busy ? "Sending…" : secondsLeft > 0 ? `You can ask again in ${secondsLeft} s` : label}
      </button>
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`rounded-brand border-l-4 bg-mist px-3 py-2 text-[0.9rem] font-semibold ${result.ok ? "border-transit text-ship" : "border-error text-error"}`}
          data-testid="email-link-result"
        >
          {result.text}
          {result.ref && (
            <span className="mt-1 block text-[0.8rem] font-normal text-pebble" data-testid="email-link-ref">
              Reference: {result.ref}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
