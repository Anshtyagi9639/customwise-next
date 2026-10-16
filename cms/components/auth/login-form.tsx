"use client";

import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { adminApi } from "@/cms/lib/routes";

type Errors = { email?: string; password?: string; form?: string };

const noSubscription = () => () => {};

/**
 * The sign-in form. The browser only checks that both fields are filled in; the server decides everything else and
 * answers with the same message for an unknown email address and a wrong password.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  // False in the server's HTML, true once this script runs. Until then the Sign in button is disabled, so the browser
  // cannot submit the form natively (which would put the email address and password in the address bar).
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!email.trim()) found.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+$/.test(email.trim())) found.email = "Enter an email address like name@example.com.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();
    // In a production build the session cookie is Secure (__Secure- prefix), so browsers keep it only over HTTPS or on
    // localhost. On any other http:// address the sign-in would succeed and then fall straight back to this page, so
    // say so instead, before the password is sent over an unencrypted connection. (next dev uses a plain cookie.)
    if (!window.isSecureContext && process.env.NODE_ENV !== "development") {
      const local = `http://localhost${window.location.port ? `:${window.location.port}` : ""}${window.location.pathname}`;
      setErrors({ form: `Signing in needs a secure address: HTTPS, or localhost on this computer. At this address the browser would refuse the sign-in cookie. Open ${local} instead.` });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(adminApi.login, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password }), credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { redirect?: string; message?: string };
      if (res.ok && data.redirect) {
        // A full page load, so the new session cookie is used for everything that follows.
        window.location.assign(data.redirect);
        return;
      }
      setErrors({ form: data.message ?? "Sign-in failed. Try again." });
      setPassword("");
      passwordRef.current?.focus();
    } catch {
      setErrors({ form: "The website could not be reached. Check your connection and try again." });
    }
    setBusy(false);
  }

  return (
    <form method="post" onSubmit={submit} noValidate aria-describedby={errors.form ? "login-error" : undefined} className="grid gap-4">
      {errors.form && (
        <p id="login-error" role="alert" className="rounded-brand border-l-4 border-error bg-mist px-3 py-2 text-[0.9rem] font-semibold text-error">
          {errors.form}
        </p>
      )}
      <div>
        <label className="label" htmlFor="login-email">
          Email address
        </label>
        <input
          ref={emailRef}
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          className="input"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
          }}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          disabled={busy}
          required
        />
        {errors.email && (
          <p id="login-email-error" className="field-error">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label className="label" htmlFor="login-password">
          Password
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="login-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            className="input pr-12"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
            }}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            disabled={busy}
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            aria-controls="login-password"
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-brand text-pebble hover:text-atlantic"
            data-testid="toggle-password"
          >
            {show ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" className="field-error">
            {errors.password}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary min-h-11 w-full" disabled={busy || !ready} aria-busy={busy}>
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <LogIn aria-hidden className="size-4" />}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
