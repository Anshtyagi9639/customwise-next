import type { Metadata } from "next";
import { ChangePasswordForm } from "@/cms/components/auth/change-password-form";
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
        <ChangePasswordForm />
      </section>
    </div>
  );
}
