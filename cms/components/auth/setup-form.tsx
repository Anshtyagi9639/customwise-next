"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/cms/lib/auth-shared";
import { adminUrl } from "@/cms/lib/routes";

const API = "/admin-blog/api/auth/setup";
type Link = { email: string; purpose: "invite" | "reset"; expiresAt: string };

/**
 * Choosing a password from a one-time link. The link's token is after "#" in the address, so it is never sent to the
 * server in the page request, never written to access logs and never passed on as a Referer.
 */
export function SetupForm() {
  const [token, setToken] = useState("");
  const [link, setLink] = useState<Link | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = window.location.hash.replace(/^#/, "");
    // Remove the token from the address bar and history straight away.
    history.replaceState(null, "", window.location.pathname);
    void (async () => {
      if (!t) {
        setProblem("This page needs the link an administrator sent you. Open that link again.");
        return;
      }
      setToken(t);
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", token: t }) }).catch(() => null);
      const data = ((await res?.json().catch(() => ({}))) ?? {}) as Partial<Link> & { message?: string };
      if (res?.ok && data.email) setLink(data as Link);
      else setProblem(data.message ?? "The website could not be reached. Try again.");
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (password.length < PASSWORD_MIN_LENGTH) found.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (confirm !== password) found.confirm = "The two passwords are not the same.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", token, password }) }).catch(() => null);
    const data = ((await res?.json().catch(() => ({}))) ?? {}) as { message?: string; fieldErrors?: typeof errors };
    setBusy(false);
    if (res?.ok) {
      setDone(true);
      setPassword("");
      setConfirm("");
      return;
    }
    if (data.fieldErrors && Object.keys(data.fieldErrors).length) setErrors(data.fieldErrors);
    else setProblem(data.message ?? "The password could not be set. Try again.");
  }

  if (done)
    return (
      <div role="status" className="grid gap-4">
        <p className="rounded-brand border-l-4 border-transit bg-mist px-3 py-2 text-[0.95rem] font-semibold text-ship">Your password is set. You can now sign in.</p>
        <a href={adminUrl.login} className="btn btn-primary justify-self-start">
          Go to sign-in
        </a>
      </div>
    );
  if (problem)
    return (
      <p role="alert" className="rounded-brand border-l-4 border-error bg-mist px-3 py-2 text-[0.92rem] font-semibold text-error" data-testid="setup-problem">
        {problem}
      </p>
    );
  if (!link) return <p className="text-[0.92rem] text-pebble">Checking your link…</p>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-4" data-testid="setup-form">
      <p className="text-[0.95rem]">
        {link.purpose === "invite" ? "Choose a password for your new account" : "Choose a new password for"} <strong data-testid="setup-email" className="[overflow-wrap:anywhere]">{link.email}</strong>.
      </p>
      {(["password", "confirm"] as const).map((key) => (
        <div key={key}>
          <label className="label" htmlFor={`setup-${key}`}>
            {key === "password" ? "New password" : "New password again"}
          </label>
          <input
            id={`setup-${key}`}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            className="input"
            value={key === "password" ? password : confirm}
            onChange={(e) => (key === "password" ? setPassword : setConfirm)(e.target.value)}
            aria-invalid={errors[key] ? true : undefined}
            disabled={busy}
          />
          {errors[key] && <p className="field-error">{errors[key]}</p>}
        </div>
      ))}
      <p className="hint !-mt-2">At least {PASSWORD_MIN_LENGTH} characters. A long passphrase is easier to remember than a short complicated password.</p>
      <label className="flex items-center gap-2 text-[0.9rem]">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />} Show passwords
      </label>
      <button type="submit" className="btn btn-primary min-h-11" disabled={busy}>
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {busy ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
