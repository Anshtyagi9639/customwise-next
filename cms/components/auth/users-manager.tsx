"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/cms/lib/client-api";
import { adminApi, adminUrl } from "@/cms/lib/routes";
import type { AccountSummary } from "@/cms/server/auth/accounts";

type LinkResult = { email: string; token: string; expiresAt: string; purpose: "invite" | "reset" };

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" }) : "Never");

/**
 * The Users screen: invite people, send password-reset links, disable accounts and sign people out. Passwords are never
 * seen by administrators: each person chooses their own from a one-time link, which is shown here once.
 */
export function UsersManager({ accounts, sites, meId }: { accounts: AccountSummary[]; sites: { key: string; name: string }[]; meId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const [link, setLink] = useState<LinkResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "editor", siteKeys: [] as string[] });

  async function act(body: Record<string, unknown>, success: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return false;
    setBusy(true);
    setError(null);
    setDone(null);
    setFieldErrors({});
    setLink(null);
    setCopied(false);
    const r = await api<Partial<LinkResult>>(adminApi.users, "POST", body);
    setBusy(false);
    if (!r.ok) {
      setError(r.data.message ?? "That could not be done.");
      setFieldErrors(r.data.fieldErrors ?? {});
      return false;
    }
    if (r.data.token) setLink(r.data as LinkResult);
    setDone(success);
    router.refresh();
    return true;
  }

  const url = link ? adminUrl.setup(window.location.origin, link.token) : "";

  return (
    <div className="grid gap-5">
      {error && (
        <div role="alert" className="rounded-brand border-l-4 border-error bg-salt px-4 py-2.5 text-[0.9rem] font-semibold text-error">
          {error}
          {Object.values(fieldErrors).length > 0 && (
            <ul className="mt-1 list-disc pl-5 font-normal">
              {Object.values(fieldErrors).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {done && !link && (
        <p role="status" className="rounded-brand border-l-4 border-transit bg-salt px-4 py-2.5 text-[0.9rem] font-semibold text-ship">
          {done}
        </p>
      )}
      {link && (
        <div role="status" className="card grid gap-3 border-l-4 border-transit" data-testid="setup-link">
          <p className="font-semibold text-ship">{done}</p>
          <p className="text-[0.92rem]">
            Send this link to <strong>{link.email}</strong> privately (for example by direct message, not in a shared channel). It works once and expires on{" "}
            {when(link.expiresAt)}. <strong>It is shown only now</strong>: if it is lost, create a new one.
          </p>
          <div className="flex flex-wrap gap-2">
            <input readOnly className="input min-w-0 flex-1 font-mono text-[0.82rem]" value={url} aria-label="Setup link" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(url).then(() => setCopied(true), () => setCopied(false));
              }}
            >
              <Copy aria-hidden className="size-4" /> {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      <section className="card overflow-x-auto" aria-labelledby="h-accounts">
        <h2 id="h-accounts" className="section-title mb-3">
          Accounts
        </h2>
        <table className="table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Access</th>
              <th>Status</th>
              <th>Last sign-in</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} data-testid={`account-${a.email}`}>
                <td>
                  <strong>{a.name || a.email}</strong>
                  {a.name && <div className="text-[0.85rem] text-pebble">{a.email}</div>}
                </td>
                <td>{a.role === "admin" ? "Administrator" : `Editor: ${a.siteKeys.join(", ")}`}</td>
                <td>
                  <span className={`badge ${a.status === "active" ? "badge-published" : a.status === "invited" ? "badge-scheduled" : "badge-draft"}`}>
                    {a.status === "active" ? "Active" : a.status === "invited" ? "Invited" : "Disabled"}
                  </span>
                  {a.pendingLink && <div className="mt-1 text-[0.8rem] text-pebble">{a.pendingLink.purpose === "invite" ? "Invitation" : "Reset link"} open until {when(a.pendingLink.expiresAt)}</div>}
                </td>
                <td className="text-[0.88rem]">{when(a.lastLoginAt)}</td>
                <td>
                  {a.id === meId ? (
                    <span className="text-[0.85rem] text-pebble">You</span>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {a.status !== "disabled" && (
                        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act({ action: "reset-link", userId: a.id }, a.status === "invited" ? "New invitation link created." : "Password-reset link created.")}>
                          {a.status === "invited" ? "New invitation link" : "Reset password"}
                        </button>
                      )}
                      {a.status === "active" && (
                        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act({ action: "sign-out", userId: a.id }, `${a.email} has been signed out everywhere.`)}>
                          Sign out
                        </button>
                      )}
                      {a.status === "active" && (
                        <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => act({ action: "disable", userId: a.id }, `${a.email} is disabled and signed out.`, `Disable ${a.email}? They will be signed out and cannot sign in until enabled again.`)}>
                          Disable
                        </button>
                      )}
                      {a.status === "disabled" && (
                        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act({ action: "enable", userId: a.id }, `${a.email} can sign in again.`)}>
                          Enable
                        </button>
                      )}
                      {a.status === "invited" && (
                        <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => act({ action: "withdraw", userId: a.id }, `The invitation for ${a.email} is withdrawn.`, `Withdraw the invitation for ${a.email}?`)}>
                          Withdraw
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <form
        className="card grid gap-4"
        aria-labelledby="h-invite"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ action: "invite", ...form }, `Invitation created for ${form.email.trim()}.`)) setForm({ email: "", name: "", role: "editor", siteKeys: [] });
        }}
      >
        <div>
          <h2 id="h-invite" className="section-title">
            Invite someone
          </h2>
          <p className="text-[0.9rem] text-ink-soft">You will get a one-time link to send them. They choose their own password; you never see it.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="invite-email">
              Email address
            </label>
            <input id="invite-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={fieldErrors.email ? true : undefined} autoComplete="off" />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="invite-name">
              Name
            </label>
            <input id="invite-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} autoComplete="off" />
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="label">Role</legend>
          <label className="flex items-center gap-2 text-[0.92rem]">
            <input type="radio" name="invite-role" checked={form.role === "editor"} onChange={() => setForm({ ...form, role: "editor" })} />
            <span>
              <strong>Editor</strong>: writes and publishes articles, manages categories, on the websites ticked below
            </span>
          </label>
          <label className="flex items-center gap-2 text-[0.92rem]">
            <input type="radio" name="invite-role" checked={form.role === "admin"} onChange={() => setForm({ ...form, role: "admin", siteKeys: [] })} />
            <span>
              <strong>Administrator</strong>: everything, including authors, website settings and these accounts
            </span>
          </label>
        </fieldset>
        {form.role === "editor" && (
          <fieldset className="grid gap-2">
            <legend className="label">Websites</legend>
            {sites.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-[0.92rem]">
                <input
                  type="checkbox"
                  checked={form.siteKeys.includes(s.key)}
                  onChange={(e) => setForm({ ...form, siteKeys: e.target.checked ? [...form.siteKeys, s.key] : form.siteKeys.filter((k) => k !== s.key) })}
                />
                {s.name}
              </label>
            ))}
            {fieldErrors.siteKeys && <p className="field-error">{fieldErrors.siteKeys}</p>}
          </fieldset>
        )}
        <button type="submit" className="btn btn-primary justify-self-start" disabled={busy}>
          {busy ? "Working…" : "Create invitation link"}
        </button>
      </form>
    </div>
  );
}
