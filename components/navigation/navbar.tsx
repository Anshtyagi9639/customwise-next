"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { mainNav, primaryCta, site } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/types";
import { tr } from "zod/v4/locales";

function isActive(item: NavItem, pathname: string) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Client decision (off by default, per the approved spec of "no background on scroll"):
 * the header is transparent with white text, so when it reappears mid-page over light sections its text
 * has very low contrast. Set to true to give the header the brand's Overnight navy ONLY when it is shown
 * below the top of the page. The top-of-page appearance is unchanged either way.
 */
const SOLID_WHEN_REVEALED_MID_PAGE = true;

export function Navbar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

   useEffect(() => {
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    //   at the top      -> visible
    //   scrolling DOWN  -> hidden
    //   scrolling UP    -> visible
    const SCROLL_THRESHOLD = 5;   // ignore tiny movements (jitter)
    const HIDE_AFTER = 80;        // don't hide until we've scrolled past the header height

    // Works for window scrolling AND for a scrolling container (overflow: auto).
    const getScrollY = (target: EventTarget | null) => {
      if (!target || target === document || target === window) {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      return target instanceof HTMLElement ? target.scrollTop : 0;
    };

    let previousScrollY = getScrollY(null);

    const onScroll = (e: Event) => {
      // Ignore scrolling inside small elements (menus, carousels, etc.)
      const t = e.target;
      if (t instanceof HTMLElement && t.clientHeight < window.innerHeight * 0.6) return;

      const currentScrollY = getScrollY(t);
      const top = currentScrollY <= 0;
      setAtTop(top);

      if (top) {
        setHidden(false);
        previousScrollY = 0;
        return;
      }

      const delta = currentScrollY - previousScrollY;
      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      if (delta > 0 && currentScrollY > HIDE_AFTER) {
        setHidden(true);      // scrolling down -> hide
      } else if (delta < 0) {
        setHidden(false);     // scrolling up -> show
      }
      previousScrollY = currentScrollY;
    };

    // capture: true also catches scroll events from inner scroll containers
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  const isHidden = hidden && !mobileOpen;

  return (
     <header
      data-hidden={isHidden ? "true" : undefined}
      onFocus={(e) => {
        if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) setHidden(false);
      }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[transform,background-color] duration-200 ease-out motion-reduce:transition-none",
        "data-[hidden=true]:-translate-y-full",
        SOLID_WHEN_REVEALED_MID_PAGE && !atTop && "bg-overnight shadow-md",
      )}
    >
      <div className="container-site flex h-[var(--nav-h)] items-center gap-4 xl:gap-7">
        <Logo priority className="w-[104px] sm:w-[112px]" />

        <NavigationMenu.Root aria-label="Main" className="relative ml-auto hidden lg:block" delayDuration={80}>
          <NavigationMenu.List className="flex items-center gap-0.5">
            {mainNav.map((item) => {
              const active = isActive(item, pathname);
              const topClass = cn(
                "flex items-center gap-1.5 rounded px-3 py-2.5 text-[0.93rem] font-semibold text-salt transition-colors hover:text-cargo data-[state=open]:text-cargo",
                active && "text-cargo shadow-[inset_0_-2px_0_var(--color-cargo)]",
              );
              if (item.kind === "link") {
                return (
                  <NavigationMenu.Item key={item.href}>
                    <NavigationMenu.Link asChild active={active}>
                      <Link href={item.href} className={topClass} aria-current={active ? "page" : undefined}>
                        {item.label}
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                );
              }
              return (
                <NavigationMenu.Item key={item.href} className="relative">
                  <NavigationMenu.Trigger className={cn(topClass, "group")}>
                    {item.label}
                    <ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute top-full left-0 min-w-[17.5rem] rounded-b-brand border border-salt/8 border-t-2 border-t-cargo bg-overnight p-2 data-[state=open]:animate-menu-in">
                    <ul>
                      {item.items.map((l) => (
                        <li key={l.href}>
                          <NavigationMenu.Link asChild>
                            <Link href={l.href} className="block rounded px-3 py-2.5 text-[0.92rem] text-[#dce6ea] transition-colors hover:bg-salt/6 hover:text-cargo focus-visible:bg-salt/6 focus-visible:text-cargo">
                              {l.label}
                            </Link>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                      <li className="mt-1.5 border-t border-salt/10 pt-1.5">
                        <NavigationMenu.Link asChild>
                          <Link href={item.href} className="block rounded px-3 py-2.5 text-[0.92rem] font-semibold text-cargo hover:bg-salt/6">
                            {item.allLabel}
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                    </ul>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              );
            })}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <a
          href={site.phone.href}
          aria-label={`Call us on ${site.phone.display}`}
          className="hidden min-h-12 shrink-0 items-center justify-center gap-2 rounded-brand border-2 border-salt/55 px-3 text-[0.95rem] font-bold text-salt transition-colors hover:border-cargo hover:text-cargo lg:inline-flex xl:px-4"
        >
          <Phone aria-hidden className="size-[18px]" />
          <span className="hidden xl:inline">Call Us</span>
        </a>
        <Button asChild className="hidden shrink-0 lg:inline-flex">
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>

        <a
          href={site.phone.href}
          aria-label={`Call us on ${site.phone.display}`}
          className="ml-auto grid size-12 place-items-center rounded-full text-cargo transition-colors hover:bg-salt/10 lg:hidden"
        >
          <Phone aria-hidden className="size-5.5" />
        </a>

        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen} modal>
          <Dialog.Trigger asChild>
            <button type="button" className="grid size-12 place-items-center rounded text-salt lg:hidden" aria-label="Open menu">
              <Menu aria-hidden className="size-6.5" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content
              aria-describedby={undefined}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="fixed inset-0 z-[60] overflow-y-auto bg-overnight pb-[calc(1.75rem+env(safe-area-inset-bottom))] data-[state=open]:animate-menu-in lg:hidden"
            >
              <Dialog.Title className="sr-only">Site menu</Dialog.Title>
              <div className="sticky top-0 z-10 bg-overnight">
                <div className="container-site flex h-[var(--nav-h)] items-center">
                  <div onClickCapture={() => setMobileOpen(false)}>
                    <Logo className="w-[104px] sm:w-[112px]" />
                  </div>
                  <Dialog.Close asChild>
                    <button type="button" className="ml-auto grid size-12 place-items-center rounded text-salt" aria-label="Close menu">
                      <X aria-hidden className="size-6.5" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              <div className="container-site pt-1">
              <nav aria-label="Mobile">
                <ul>
                  {mainNav.map((item) => (
                    <li key={item.href}>
                      <MobileLink href={item.href} active={isActive(item, pathname)} onNavigate={() => setMobileOpen(false)}>
                        {item.label}
                      </MobileLink>
                      {item.kind === "menu" && (
                        <ul aria-label={`${item.label} pages`} className="pb-2">
                          {item.items.map((l) => (
                            <li key={l.href}>
                              <MobileLink href={l.href} active={false} sub onNavigate={() => setMobileOpen(false)}>
                                {l.label}
                              </MobileLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-6 grid gap-3">
                <Button asChild variant="ghost" className="w-full">
                  <a href={site.phone.href}>
                    <Phone aria-hidden /> Call Us <span className="font-normal opacity-80">{site.phone.display}</span>
                  </a>
                </Button>
                <Button asChild className="w-full">
                  <Link href={primaryCta.href} onClick={() => setMobileOpen(false)}>
                    {primaryCta.label}
                  </Link>
                </Button>
              </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}

function MobileLink({
  href,
  active,
  sub,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  sub?: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block",
        sub
          ? "py-2 pl-4 text-[0.95rem] font-normal text-[#c9d6dc] hover:text-cargo"
          : "mt-1 border-t border-salt/8 pt-3.5 pb-2 font-display text-[1.35rem] tracking-[0.01em] text-salt hover:text-cargo",
        active && "text-cargo",
      )}
    >
      {children}
    </Link>
  );
}
