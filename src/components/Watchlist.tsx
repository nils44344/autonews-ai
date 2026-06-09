"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// "My Garage" — client-side watchlist backed by localStorage. Free users
// can save up to 3 models which forces them back to the site to re-check
// predictions, lifting recurring-visit metrics for ranking.

const KEY = "ang_watchlist";
const FREE_LIMIT = 3;

export interface WatchItem {
  brandSlug: string;
  brandName: string;
  modelName: string;
  addedAt: number;
}

interface WatchlistProps {
  brandSlug?: string;
  brandName?: string;
  modelName?: string;
}

function read(): WatchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as WatchItem[]) : [];
  } catch { return []; }
}
function write(items: WatchItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new CustomEvent("watchlist:change", { detail: items }));
}

export function Watchlist({ brandSlug, brandName, modelName }: WatchlistProps) {
  const [items, setItems] = useState<WatchItem[] | null>(null);

  useEffect(() => {
    setItems(read());
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<WatchItem[]>;
      setItems(ce.detail ?? []);
    };
    window.addEventListener("watchlist:change", onChange);
    return () => window.removeEventListener("watchlist:change", onChange);
  }, []);

  const isSaved = useCallback(
    (slug: string, model: string) =>
      (items ?? []).some((i) => i.brandSlug === slug && i.modelName === model),
    [items],
  );

  function toggle() {
    if (!brandSlug || !brandName || !modelName) return;
    const current = read();
    const exists = current.some((i) => i.brandSlug === brandSlug && i.modelName === modelName);
    if (exists) {
      write(current.filter((i) => !(i.brandSlug === brandSlug && i.modelName === modelName)));
      return;
    }
    if (current.length >= FREE_LIMIT) {
      alert(`Free tier limit (${FREE_LIMIT}) reached. Remove a vehicle to save another.`);
      return;
    }
    write([{ brandSlug, brandName, modelName, addedAt: Date.now() }, ...current]);
  }

  if (items === null) {
    return <div className="skeleton h-10 w-40" aria-label="Loading watchlist" />;
  }

  return (
    <section aria-labelledby="watchlist-h" className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="watchlist-h" className="bracket text-brand">[ MY GARAGE · {items.length}/{FREE_LIMIT} ]</h3>
        {brandSlug && brandName && modelName && (
          <button
            type="button"
            onClick={toggle}
            className={[
              "rounded-md border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-bracket transition",
              isSaved(brandSlug, modelName)
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-canvas-rule bg-canvas hover:border-brand/40 hover:text-brand",
            ].join(" ")}
          >
            {isSaved(brandSlug, modelName) ? "[★] SAVED" : "[+] TRACK"}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-slate-400">No vehicles tracked yet. Save up to {FREE_LIMIT} to monitor 30-day price predictions.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={`${it.brandSlug}-${it.modelName}`} className="flex items-center justify-between rounded border border-canvas-rule px-3 py-2">
              <Link href={`/trends/${it.brandSlug}`} className="text-[13px] font-medium hover:text-brand">
                {it.brandName} <span className="text-slate-500">·</span> {it.modelName}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${it.brandName} ${it.modelName} from watchlist`}
                onClick={() => write(read().filter((x) => !(x.brandSlug === it.brandSlug && x.modelName === it.modelName)))}
                className="font-mono text-[10px] text-slate-500 hover:text-down"
              >
                [×]
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
