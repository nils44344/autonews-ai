"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const KEY = "ang_watchlist";
const FREE_LIMIT = 3;

export interface WatchItem {
  brandSlug: string;
  brandName: string;
  modelName: string;
  addedAt: number;
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

export function Watchlist({ brandSlug, brandName, modelName }: { brandSlug?: string; brandName?: string; modelName?: string }) {
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
    (slug: string, model: string) => (items ?? []).some((i) => i.brandSlug === slug && i.modelName === model),
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
      alert(`Free tier: maximum ${FREE_LIMIT} vehicles. Remove one to save another.`);
      return;
    }
    write([{ brandSlug, brandName, modelName, addedAt: Date.now() }, ...current]);
  }

  if (items === null) return <div className="skel h-44 w-72" aria-label="Loading" />;

  return (
    <aside className="w-full max-w-xs surface p-5 lg:w-72">
      <div className="flex items-center justify-between">
        <div className="label label-brand">My Garage · {items.length}/{FREE_LIMIT}</div>
      </div>

      {brandSlug && brandName && modelName && (
        <button
          type="button"
          onClick={toggle}
          className={[
            "mt-5 w-full rounded-lg px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition",
            isSaved(brandSlug, modelName)
              ? "border border-brand bg-brand/10 text-brand"
              : "bg-brand text-black hover:brightness-105",
          ].join(" ")}
        >
          {isSaved(brandSlug, modelName) ? "Saved" : "Add to garage"}
        </button>
      )}

      {items.length === 0 ? (
        <p className="mt-5 text-[12px] text-slate-500">No vehicles tracked. Save up to {FREE_LIMIT} to monitor 30-day price predictions.</p>
      ) : (
        <ul className="mt-5 space-y-1">
          {items.map((it) => (
            <li key={`${it.brandSlug}-${it.modelName}`} className="flex items-center justify-between rounded border border-canvas-rule px-3 py-2">
              <Link href={`/trends/${it.brandSlug}`} className="text-[13px] hover:text-brand">
                <span className="font-medium">{it.brandName}</span> · {it.modelName}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${it.modelName}`}
                onClick={() => write(read().filter((x) => !(x.brandSlug === it.brandSlug && x.modelName === it.modelName)))}
                className="text-[12px] text-slate-600 hover:text-down"
              >×</button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
