"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RoleBadge } from "./Personalization";

interface NavItem { href: string; label: string }

const I = "h-[18px] w-[18px]";
const Sun = (
  <svg className={I} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const Moon = (
  <svg className={I} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);
const Menu = (
  <svg className={I} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
const Close = (
  <svg className={I} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const Search = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

// Header — logo left · search-as-product center · theme right. One nav row
// below on desktop; collapses to a sheet on mobile. The search button opens
// the command palette; ⌘K shortcut is registered inside CommandPalette.
export function SiteHeader({ siteName, nav }: { siteName: string; nav: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch {}
    setDark(isDark);
  }

  function openPalette() {
    window.dispatchEvent(new CustomEvent("cmdk:open"));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-900 dark:bg-canvas/75">
      <div className="mx-auto flex h-14 max-w-content items-center gap-3 px-5 sm:gap-5 sm:px-6">
        {/* Logo */}
        <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={siteName} className="h-7 w-7" />
          <span className="hidden whitespace-nowrap font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white sm:inline">
            {siteName}
          </span>
        </Link>

        {/* Search — the most important top-bar element per the brief.
            Center-grow so it dominates while leaving room for nav/right. */}
        <button
          type="button"
          onClick={openPalette}
          aria-label="Search (⌘K)"
          className="group flex h-9 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-canvas-raised dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-canvas-elevated md:max-w-md"
        >
          <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">{Search}</span>
          <span className="flex-1 truncate">Search opportunities, tools, startups…</span>
          <kbd className="hidden h-5 select-none items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-canvas dark:text-slate-400 sm:inline-flex">
            ⌘K
          </kbd>
        </button>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1.5">
          <RoleBadge />
          <Link
            href="/watchlist"
            aria-label="Watchlist"
            className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-canvas-elevated dark:hover:text-white md:grid"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </Link>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-canvas-elevated dark:hover:text-white"
          >
            {dark ? Sun : Moon}
          </button>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-canvas-elevated dark:hover:text-white md:hidden"
          >
            {open ? Close : Menu}
          </button>
        </div>
      </div>

      {/* Desktop pillar nav — single row below the search bar.
          Active state uses the pillar accent for an immediate sense of place. */}
      <nav className="mx-auto hidden h-11 max-w-content items-center gap-0.5 px-5 text-[13px] font-medium sm:px-6 md:flex">
        {nav.map((n) => {
          const active = pathname === n.href || pathname?.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={[
                "relative rounded-md px-3 py-1.5 transition",
                active
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              ].join(" ")}
            >
              {n.label}
              {active && (
                <span className="absolute -bottom-2 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-signal via-opportunity to-tool" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile sheet */}
      {open && (
        <nav className="border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-900 dark:bg-canvas md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-canvas-elevated">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
