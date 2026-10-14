import { SignOutButton } from "@/cms/components/auth/sign-out-button";
import { adminUrl } from "@/cms/lib/routes";
import { requireAdminPage } from "@/cms/server/auth/guard";

/** Every signed-in screen: a top bar with the account, then the screen. Each page checks access again itself. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="cms-shell min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-salt px-4 py-2.5 sm:px-6">
        <a href={adminUrl.dashboard} className="font-bold text-overnight">
          Customs Wise <span className="font-normal text-pebble">· Blog admin</span>
        </a>
        <nav aria-label="Account" className="ml-auto flex flex-wrap items-center gap-2 text-[0.88rem]">
          <a href={adminUrl.dashboard} className="btn btn-secondary btn-sm">
            Dashboard
          </a>
          <a href={adminUrl.account} className="btn btn-secondary btn-sm" title={user.email}>
            Account
          </a>
          <span className="hidden text-pebble md:inline" data-testid="signed-in-as">
            {user.email}
          </span>
          <SignOutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
