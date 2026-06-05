"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWatchlist } from "@/components/SaveButton";

type Kind = "opportunity" | "tool" | "workflow" | "startup" | "signal";
interface Item { kind: Kind; slug: string; title: string; href: string; savedAt: number }

const KIND_LABEL: Record<Kind, string> = {
  opportunity: "Opportunity", signal: "Signal", tool: "Tool",
  workflow: "Workflow", startup: "Startup",
};
const KIND_ACCENT: Record<Kind, string> = {
  opportunity: "text-opportunity bg-opportunity/10",
  signal:      "text-signal bg-signal/10",
  tool:        "text-tool bg-tool/10",
  workflow:    "text-workflow bg-workflow/10",
  startup:     "text-startup bg-startup/10",
};

export function WatchlistClient() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    setItems(getWatchlist());
    function onChange(e: Event) {
      const ce = e as CustomEvent<Item[]>;
      setItems(ce.detail ?? []);
    }
    window.addEventListener("watchlist:change", onChange);
    return () => window.removeEventListener("watchlist:change", onChange);
  }, []);

  if (items === null) {
    return <Skeleton />;
  }
  if (items.length === 0) {
    return <Empty />;
  }

  // Group by kind so the page reads as an organised intelligence list.
  const grouped: Record<Kind, Item[]> = {
    opportunity: [], signal: [], tool: [], workflow: [], startup: [],
  };
  for (const it of items) grouped[it.kind].push(it);
  const order: Kind[] = ["opportunity", "signal", "tool", "workflow", "startup"];

  return (
    <div className="space-y-10">
      {order.map((k) =>
        grouped[k].length ? (
          <section key={k}>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {KIND_LABEL[k]} · {grouped[k].length}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {grouped[k].map((it) => (
                <li key={it.href} className="card card-hover">
                  <Link href={it.href} className="block p-5">
                    <span className={`mb-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_ACCENT[k]}`}>
                      {KIND_LABEL[k]}
                    </span>
                    <div className="font-display text-[15px] font-bold text-white">{it.title}</div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Saved {new Date(it.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="card p-10 text-center">
      <h2 className="font-display text-xl font-bold text-white">Nothing saved yet.</h2>
      <p className="mt-2 text-sm text-slate-400">
        Tap the bookmark on any opportunity, tool, or startup to add it here.
      </p>
      <div className="mt-6 flex justify-center gap-3 text-[13px]">
        <Link href="/opportunities" className="rounded-lg bg-opportunity/15 px-3 py-1.5 text-opportunity hover:bg-opportunity/25">Opportunities</Link>
        <Link href="/tools" className="rounded-lg bg-tool/15 px-3 py-1.5 text-tool hover:bg-tool/25">Tools</Link>
        <Link href="/startups" className="rounded-lg bg-startup/15 px-3 py-1.5 text-startup hover:bg-startup/25">Startups</Link>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card relative overflow-hidden p-5">
          <div className="h-4 w-24 rounded bg-canvas-elevated" />
          <div className="mt-3 h-5 w-5/6 rounded bg-canvas-elevated" />
          <div className="mt-2 h-4 w-3/6 rounded bg-canvas-elevated" />
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      ))}
    </div>
  );
}
