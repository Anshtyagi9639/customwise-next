import type { Metadata } from "next";
import { ChangePasswordForm } from "@/cms/components/auth/change-password-form";
import { DEV_ADMIN_ID } from "@/cms/server/auth/dev-access";
import { isEnvAdminEmail } from "@/cms/server/auth/env-admin";
import { requireAdminPage } from "@/cms/server/auth/guard";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireAdminPage();
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <div>
        <h1 className="page-title">Account</h1>
        <p className="text-[0.95rem] text-ink-soft">{user.email}</p>
      </div>
      <section className="card grid gap-2" aria-labelledby="h-access">
        <h2 id="h-access" className="section-title">
          Access
        </h2>
        <p className="text-[0.92rem] text-ink-soft">
          {user.role === "admin" ? "Administrator: every website, its authors and its settings." : `Editor: articles and categories of ${user.siteKeys.join(", ") || "no websites yet"}.`}
        </p>
      </section>
      <section className="card grid gap-4" aria-labelledby="h-password">
        <h2 id="h-password" className="section-title">
          Change password
        </h2>
        {user.id === DEV_ADMIN_ID ? (
          <p className="text-[0.92rem] text-ink-soft">Local development access has no account or password. Sign in normally to change a password.</p>
        ) : isEnvAdminEmail(user.email) ? (
          <p className="text-[0.92rem] text-ink-soft" data-testid="password-from-settings">
            Your password is set in the server settings (<code>ADMIN_PASSWORD_HASH</code>), not here. To change it, run <code>npm run cms:admin-env</code> and update the
            setting where the website runs.
          </p>
        ) : (
          <ChangePasswordForm />
        )}
      </section>
    </div>
  );
}
