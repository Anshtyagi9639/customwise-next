import { inviteAccount, issueResetLink, listAccounts, setAccountStatus, signOutAccount, withdrawInvitation } from "@/cms/server/auth/accounts";
import { withAdmin } from "@/cms/server/auth/guard";
import { json, readJson } from "@/cms/server/http";
import { audit, mutateDb } from "@/cms/server/store";

/** Accounts, for administrators only. There is no other way to add a user from the website: no public sign-up. */
export async function GET(request: Request) {
  return withAdmin(request, { role: "admin" }, async () => json({ accounts: await listAccounts() }));
}

/**
 * { action: "invite", email, name, role, siteKeys }   creates an invited account and returns its one-time setup link
 * { action: "reset-link", userId }                    returns a new one-time link to choose a password
 * { action: "disable" | "enable", userId }
 * { action: "sign-out", userId }                      ends every session of the account
 * { action: "withdraw", userId }                      removes an invitation that was never used
 * Setup links are returned once, in this response only; the database keeps only their hash.
 */
export async function POST(request: Request) {
  return withAdmin(request, { role: "admin" }, async (me) => {
    const body = ((await readJson(request)) ?? {}) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const log = (action: string, targetId: string | null, summary: string) => mutateDb((db) => audit(db, { siteId: null, action, targetId, summary }));

    switch (body.action) {
      case "invite": {
        const r = await inviteAccount(me, body);
        if (!r.ok) return json({ error: "invalid", message: r.message, fieldErrors: r.fieldErrors ?? {} }, r.status);
        await log("auth.user_invite", r.value.id, r.value.email);
        return json({ email: r.value.email, token: r.value.token, expiresAt: r.value.expiresAt, purpose: "invite" }, 201);
      }
      case "reset-link": {
        const r = await issueResetLink(me, userId);
        if (!r.ok) return json({ error: "invalid", message: r.message }, r.status);
        await log(r.value.purpose === "invite" ? "auth.invite_link_renewed" : "auth.reset_link_issued", userId, r.value.email);
        return json({ email: r.value.email, token: r.value.token, expiresAt: r.value.expiresAt, purpose: r.value.purpose });
      }
      case "disable":
      case "enable": {
        const r = await setAccountStatus(me, userId, body.action === "disable" ? "disabled" : "active");
        if (!r.ok) return json({ error: "invalid", message: r.message }, r.status);
        await log(`auth.user_${body.action}`, userId, r.value.email);
        return json({ ok: true, signedOut: r.value.signedOut });
      }
      case "sign-out": {
        const r = await signOutAccount(me, userId);
        if (!r.ok) return json({ error: "invalid", message: r.message }, r.status);
        await log("auth.sign_out_everywhere", userId, `${r.value.email} (${r.value.signedOut} session(s))`);
        return json({ ok: true, signedOut: r.value.signedOut });
      }
      case "withdraw": {
        const r = await withdrawInvitation(me, userId);
        if (!r.ok) return json({ error: "invalid", message: r.message }, r.status);
        await log("auth.invite_withdrawn", userId, r.value.email);
        return json({ ok: true });
      }
      default:
        return json({ error: "invalid", message: "Unknown action." }, 400);
    }
  });
}
