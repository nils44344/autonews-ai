"use client";

import Link from "next/link";

// Live signal ticker — runs under the header. Bloomberg-style horizontal
// momentum strip. Pure CSS animation; duplicated content makes it loop
// seamlessly. Items are passed in from the server (already filtered to
// today's hottest signals) so it's SEO-readable.

interface TickerItem {
  label: string;          // e.g., "VAPI"
  title: string;          // e.g., "raises $20M Series A"
  href?: string;
  kind: "signal" | "opportunity" | "tool" | "startup";
  delta?: string;         // optional momentum delta, e.g. "+96"
}

const dot: Record<TickerItem["kind"], string> = {
  signal:      "bg-signal",
  opportunity: "bg-opportunity",
  tool:        "bg-tool",
  startup:     "bg-startup",
};

export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  // Duplicate so the loop is seamless.
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-canvas-rule bg-canvas-raised/60 backdrop-blur">
      {/* Fade edges so items don't clip harshly. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />
      {/* "LIVE" indicator pinned to the left. */}
      <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-full items-center gap-1.5 bg-canvas/80 px-3 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">LIVE</span>
      </div>

      <div className="flex h-9 w-max items-center gap-10 pl-24 pr-10 animate-ticker">
        {loop.map((it, i) => {
          const inner = (
            <span className="flex items-center gap-2 whitespace-nowrap text-[12px]">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[it.kind]}`} />
              <span className="font-mono font-bold uppercase tracking-wider text-slate-300">{it.label}</span>
              <span className="text-slate-500">{it.title}</span>
              {it.delta && (
                <span className="font-mono font-semibold tabular-nums text-brand">{it.delta}</span>
              )}
            </span>
          );
          return it.href ? (
            <Link key={i} href={it.href} className="hover:text-white">{inner}</Link>
          ) : (
            <span key={i}>{inner}</span>
          );
        })}
      </div>
    </div>
  );
}
