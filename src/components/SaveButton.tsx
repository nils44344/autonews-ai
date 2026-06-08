"use client";

import { useEffect, useState } from "react";

// localStorage-backed Save / Watchlist (v1). Bracketed [+]/[★] mono sigil
// instead of the standard bookmark SVG — distinctive vs every other site.

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

  const dim = size === "sm" ? "h-7 px-1.5 text-[9px]" : "h-9 px-2.5 text-[11px]";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
      title={saved ? "Saved · click to remove" : "Save to watchlist"}
      className={[
        "inline-flex items-center gap-1 rounded-md border font-mono font-bold uppercase tracking-bracket transition",
        dim,
        saved
          ? "border-brand/50 bg-brand/10 text-brand"
          : "border-canvas-rule bg-canvas-raised text-[color:var(--muted-fg)] hover:border-brand/40 hover:text-brand",
      ].join(" ")}
    >
      {saved ? "[★] SAVED" : "[+] SAVE"}
    </button>
  );
}
