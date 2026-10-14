"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/cms/lib/auth-shared";
import { adminApi } from "@/cms/lib/routes";

type Errors = { currentPassword?: string; newPassword?: string; confirm?: string };

/** Change your own password. The server checks the current password and signs out every other session. */
export function ChangePasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const found: Errors = {};
    if (!currentPassword) found.currentPassword = "Enter your current password.";
    if (newPassword.length < PASSWORD_MIN_LENGTH) found.newPassword = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (confirm !== newPassword) found.confirm = "The two new passwords are not the same.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const res = await fetch(adminApi.password, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }), credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { message?: string; fieldErrors?: Errors };
      if (res.ok) {
        setMessage({ kind: "ok", text: data.message ?? "Password changed." });
        setCurrent("");
        setNew("");
        setConfirm("");
      } else {
        setErrors(data.fieldErrors ?? {});
        setMessage({ kind: "error", text: data.message ?? "The password could not be changed." });
      }
    } catch {
      setMessage({ kind: "error", text: "The website could not be reached. Try again." });
    }
    setBusy(false);
  }

  const field = (id: keyof Errors, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div>
      <label className="label" htmlFor={`pw-${id}`}>
        {label}
      </label>
      <input
        id={`pw-${id}`}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        className="input"
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={errors[id] ? true : undefined}
        disabled={busy}
      />
      {errors[id] && <p className="field-error">{errors[id]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-brand border-l-4 bg-mist px-3 py-2 text-[0.9rem] font-semibold ${message.kind === "error" ? "border-error text-error" : "border-transit text-ship"}`}>
          {message.text}
        </p>
      )}
      {field("currentPassword", "Current password", currentPassword, setCurrent, "current-password")}
      {field("newPassword", "New password", newPassword, setNew, "new-password")}
      <p className="hint !-mt-2">At least {PASSWORD_MIN_LENGTH} characters. A long passphrase is easier to remember than a short complicated password.</p>
      {field("confirm", "New password again", confirm, setConfirm, "new-password")}
      <label className="flex items-center gap-2 text-[0.9rem]">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />} Show passwords
      </label>
      <button type="submit" className="btn btn-primary justify-self-start" disabled={busy}>
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {busy ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
