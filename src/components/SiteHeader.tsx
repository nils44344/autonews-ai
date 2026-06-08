"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RoleBadge } from "./Personalization";
import { BrandMark } from "./BrandMark";

interface NavItem { href: string; label: string }

// Header — distinctive on purpose. Logo left · command search center · theme
// + role + bookmark right. All controls use bracketed mono sigils ([⌘K],
// [SAVE], [DARK]/[LIGHT]) instead of the standard sun/moon/bookmark Lucide
// icons every other site uses — keeps the terminal aesthetic consistent and
// avoids visual overlap with PaisaTools.

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
    <header className="sticky top-0 z-30 border-b border-canvas-rule bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-content items-center gap-3 px-5 sm:gap-5 sm:px-6">
        {/* Logo — wordmark with a bracketed sigil for distinction */}
        <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2.5">
          {/* Custom inline-SVG sigil — replaces the generic logo PNG. */}
          <BrandMark size={26} />
          <span className="hidden whitespace-nowrap font-display text-[18px] italic leading-none tracking-tight text-[color:rgb(var(--fg))] sm:inline">
            AutoNews
          </span>
          <span className="hidden font-mono text-[10px] font-bold uppercase tracking-bracket text-brand sm:inline">
            // INTEL
          </span>
        </Link>

        {/* Search prompt — bracketed mono signature instead of generic loupe icon */}
        <button
          type="button"
          onClick={openPalette}
          aria-label="Search (⌘K)"
          className="group flex h-9 flex-1 items-center gap-3 rounded-md border border-canvas-rule bg-canvas-raised px-3 text-left text-sm transition hover:border-brand/40 md:max-w-md"
        >
          <span className="font-mono text-[11px] font-bold uppercase tracking-bracket text-brand">[⌘K]</span>
          <span className="flex-1 truncate text-[color:var(--muted-fg)]">Search opportunities, tools, startups…</span>
          <span className="font-mono text-[10px] text-[color:var(--muted-fg)] opacity-60">SEARCH</span>
        </button>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1.5">
          <RoleBadge />
          {/* Watchlist — bracketed [★] instead of the standard bookmark glyph */}
          <Link
            href="/watchlist"
            aria-label="Watchlist"
            className="hidden h-9 items-center rounded-md border border-canvas-rule bg-canvas-raised px-2.5 font-mono text-[11px] font-bold uppercase tracking-bracket text-[color:var(--muted-fg)] transition hover:border-brand/40 hover:text-brand md:inline-flex"
          >
            [★] SAVED
          </Link>
          {/* Theme toggle — [DARK] / [LIGHT] text, no sun/moon icon */}
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="h-9 rounded-md border border-canvas-rule bg-canvas-raised px-2.5 font-mono text-[11px] font-bold uppercase tracking-bracket text-[color:var(--muted-fg)] transition hover:border-brand/40 hover:text-brand"
          >
            {dark ? "[DARK]" : "[LIGHT]"}
          </button>
          {/* Mobile menu */}
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="h-9 rounded-md border border-canvas-rule bg-canvas-raised px-2.5 font-mono text-[11px] font-bold uppercase tracking-bracket text-[color:var(--muted-fg)] hover:border-brand/40 hover:text-brand md:hidden"
          >
            {open ? "[X]" : "[≡]"}
          </button>
        </div>
      </div>

      {/* Desktop pillar nav — single row with bracketed numeric prefixes */}
      <nav className="mx-auto hidden h-10 max-w-content items-center gap-0.5 px-5 sm:px-6 md:flex">
        {nav.map((n, i) => {
          const active = pathname === n.href || pathname?.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={[
                "group relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition",
                active
                  ? "text-[color:var(--fg)]"
                  : "text-[color:var(--muted-fg)] hover:text-[color:var(--fg)]",
              ].join(" ")}
            >
              <span className="font-mono text-[10px] font-bold tabular-nums opacity-60">
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span className="font-medium">{n.label}</span>
              {active && <span className="absolute -bottom-2 left-3 right-3 h-[2px] rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      {/* Mobile sheet */}
      {open && (
        <nav className="border-t border-canvas-rule bg-canvas-raised px-5 py-3 md:hidden">
          {nav.map((n, i) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium text-[color:var(--fg)] transition hover:bg-canvas-elevated">
              <span className="font-mono text-[10px] font-bold tabular-nums text-[color:var(--muted-fg)]">
                [{String(i + 1).padStart(2, "0")}]
              </span>
              {n.label}
            </Link>
          ))}
          <Link href="/watchlist" onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium text-[color:var(--fg)] transition hover:bg-canvas-elevated">
            <span className="font-mono text-[10px] font-bold text-[color:var(--muted-fg)]">[★]</span>
            Saved
          </Link>
        </nav>
      )}
    </header>
  );
}
