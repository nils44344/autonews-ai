"use client";

import { useEffect, useState } from "react";

// localStorage-backed Save / Watchlist (v1). No auth required so the friction
// to "save" is near zero — bumps engagement immediately. v2 will sync to a
// backend keyed on a session cookie.

type Kind = "opportunity" | "tool" | "workflow" | "startup" | "signal";

interface Item { kind: Kind; slug: string; title: string; href: string; savedAt: number }

const KEY = "anai_watchlist";

function read(): Item[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Item[]) : [];
  } catch { return []; }
}
function write(items: Item[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new CustomEvent("watchlist:change", { detail: items }));
}

export function getWatchlist(): Item[] {
  if (typeof window === "undefined") return [];
  return read();
}

export function SaveButton({ kind, slug, title, href, size = "md" }: {
  kind: Kind; slug: string; title: string; href: string; size?: "sm" | "md";
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(read().some((i) => i.kind === kind && i.slug === slug));
    function onChange(e: Event) {
      const ce = e as CustomEvent<Item[]>;
      setSaved((ce.detail ?? []).some((i) => i.kind === kind && i.slug === slug));
    }
    window.addEventListener("watchlist:change", onChange);
    return () => window.removeEventListener("watchlist:change", onChange);
  }, [kind, slug]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const items = read();
    if (saved) {
      write(items.filter((i) => !(i.kind === kind && i.slug === slug)));
    } else {
      write([{ kind, slug, title, href, savedAt: Date.now() }, ...items].slice(0, 200));
    }
  }

  const s = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
      title={saved ? "Saved · click to remove" : "Save to watchlist"}
      className={[
        "grid shrink-0 place-items-center rounded-lg border transition",
        s,
        saved
          ? "border-opportunity/50 bg-opportunity/10 text-opportunity"
          : "border-slate-800 bg-canvas-raised text-slate-500 hover:border-slate-700 hover:text-slate-300",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]"
        fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    </button>
  );
}
