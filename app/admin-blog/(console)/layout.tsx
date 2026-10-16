import { SignOutButton } from "@/cms/components/auth/sign-out-button";
import { adminUrl } from "@/cms/lib/routes";
import { DEV_ADMIN_ID } from "@/cms/server/auth/dev-access";
import { landingPage, requireAdminPage } from "@/cms/server/auth/guard";

/** Every signed-in screen: a top bar with the account, then the screen. Each page checks access again itself. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  const localDev = user.id === DEV_ADMIN_ID;
  return (
    <div className="cms-shell min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-salt px-4 py-2.5 sm:px-6">
        <a href={landingPage(user)} className="font-bold text-overnight">
          Customs Wise <span className="font-normal text-pebble">· Blog admin</span>
        </a>
        <nav aria-label="Account" className="ml-auto flex flex-wrap items-center gap-2 text-[0.88rem]">
          <a href={adminUrl.dashboard} className="btn btn-secondary btn-sm">
            Dashboard
          </a>
          {user.role === "admin" && (
            <a href={adminUrl.users} className="btn btn-secondary btn-sm">
              Users
            </a>
          )}
          {localDev ? (
            <span className="badge badge-scheduled" data-testid="local-dev-access" title="npm run dev:admin: no sign-in, local test database, local images">
              Local development access
            </span>
          ) : (
            <>
              <a href={adminUrl.account} className="btn btn-secondary btn-sm" title={user.email}>
                Account
              </a>
              <span className="hidden text-pebble md:inline" data-testid="signed-in-as">
                {user.email}
              </span>
              <SignOutButton />
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
