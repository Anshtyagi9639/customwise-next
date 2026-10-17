import type { Metadata } from "next";
import { UsersManager } from "@/cms/components/auth/users-manager";
import { listAccounts } from "@/cms/server/auth/accounts";
import { requireAdminPage } from "@/cms/server/auth/guard";
import { readDbForScreen } from "@/cms/server/admin-data";
import { enabledSites } from "@/cms/server/sites";

export const metadata: Metadata = { title: "Users" };

/** Administrators only: everyone else gets a 404. */
export default async function UsersPage() {
  const me = await requireAdminPage({ role: "admin" });
  const [accounts, db] = await Promise.all([listAccounts(), readDbForScreen("users")]);
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <div>
        <h1 className="page-title">Users</h1>
        <p className="text-[0.95rem] text-ink-soft">
          People who can sign in to the blog admin. There is no public sign-up: only an administrator can add someone, here.
        </p>
      </div>
      <UsersManager accounts={accounts} sites={enabledSites(db).map((s) => ({ key: s.key, name: s.name }))} meId={me.id} />
    </div>
  );
}
