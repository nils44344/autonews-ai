"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Raycast / Perplexity-style command palette. ⌘K opens; arrows navigate; enter
// follows. Queries /api/search which hits every pillar in one round-trip.

type Kind = "opportunity" | "tool" | "workflow" | "startup" | "signal" | "news";

interface Hit {
  kind: Kind;
  slug: string;
  title: string;
  subtitle?: string;
  href: string;
  score?: number;
}

const KIND_LABEL: Record<Kind, string> = {
  opportunity: "Opportunity",
  tool: "Tool",
  workflow: "Workflow",
  startup: "Startup",
  signal: "Signal",
  news: "News",
};
const KIND_DOT: Record<Kind, string> = {
  opportunity: "bg-opportunity",
  tool: "bg-tool",
  workflow: "bg-workflow",
  startup: "bg-startup",
  signal: "bg-signal",
  news: "bg-slate-500",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reqIdRef = useRef(0);

  // Global ⌘K / Ctrl+K + Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    function onOpen() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen as EventListener);
    };
  }, [open]);

  // Focus input when opening, reset state when closing.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQ("");
      setHits([]);
      setCursor(0);
    }
  }, [open]);

  // Debounced search. Aborts stale requests by ignoring out-of-order responses.
  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    const id = ++reqIdRef.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const data = (await res.json()) as { hits: Hit[] };
        if (id !== reqIdRef.current) return;
        setHits(data.hits ?? []);
        setCursor(0);
      } catch {
        if (id === reqIdRef.current) setHits([]);
      } finally {
        if (id === reqIdRef.current) setLoading(false);
      }
    }, 130);
    return () => clearTimeout(t);
  }, [q, open]);

  const grouped = useMemo(() => {
    const g: Record<Kind, Hit[]> = {
      opportunity: [], signal: [], tool: [], workflow: [], startup: [], news: [],
    };
    for (const h of hits) g[h.kind].push(h);
    return g;
  }, [hits]);

  const flat = useMemo(() => {
    // Preserve visual order: Signals → Opportunities → Tools → Workflows → Startups → News.
    const order: Kind[] = ["signal", "opportunity", "tool", "workflow", "startup", "news"];
    return order.flatMap((k) => grouped[k]);
  }, [grouped]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const h = flat[cursor];
      if (h) {
        router.push(h.href);
        setOpen(false);
      }
    }
  }, [cursor, flat, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm animate-fade-up"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Search"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-canvas-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4">
          <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search opportunities, tools, workflows, startups, signals…"
            className="h-12 flex-1 bg-transparent text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          <kbd className="hidden h-5 select-none items-center rounded border border-slate-700 bg-canvas px-1.5 font-mono text-[10px] text-slate-400 sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {!q.trim() ? (
            <Quickstart />
          ) : loading && flat.length === 0 ? (
            <Skeleton />
          ) : flat.length === 0 ? (
            <Empty q={q} />
          ) : (
            (["signal", "opportunity", "tool", "workflow", "startup", "news"] as Kind[]).map((k) =>
              grouped[k].length ? <Group key={k} kind={k} hits={grouped[k]} flat={flat} cursor={cursor} onPick={(h) => { router.push(h.href); setOpen(false); }} /> : null
            )
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
          <div className="flex gap-3">
            <span><kbd className="mr-1 rounded border border-slate-700 px-1 font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="mr-1 rounded border border-slate-700 px-1 font-mono">↵</kbd> open</span>
          </div>
          <span>Search powered by AutoNews AI</span>
        </div>
      </div>
    </div>
  );
}

function Group({ kind, hits, flat, cursor, onPick }: {
  kind: Kind; hits: Hit[]; flat: Hit[]; cursor: number; onPick: (h: Hit) => void;
}) {
  return (
    <div className="px-2 py-1">
      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {KIND_LABEL[kind]}
      </div>
      {hits.map((h) => {
        const isActive = flat[cursor]?.href === h.href;
        return (
          <button
            key={h.href}
            type="button"
            onClick={() => onPick(h)}
            className={[
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition",
              isActive ? "bg-slate-800/70" : "hover:bg-slate-800/40",
            ].join(" ")}
          >
            <span className={["h-1.5 w-1.5 shrink-0 rounded-full", KIND_DOT[kind]].join(" ")} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-slate-100">{h.title}</div>
              {h.subtitle && (
                <div className="truncate text-[12px] text-slate-500">{h.subtitle}</div>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-600">{KIND_LABEL[kind]}</span>
          </button>
        );
      })}
    </div>
  );
}

function Quickstart() {
  const quick: { label: string; href: string }[] = [
    { label: "Top Opportunities", href: "/opportunities" },
    { label: "Live Signals", href: "/signals" },
    { label: "Fastest growing tools", href: "/tools" },
    { label: "Workflows", href: "/workflows" },
    { label: "Startup Radar", href: "/startups" },
  ];
  return (
    <div className="px-2 py-1">
      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Quick jump</div>
      {quick.map((q) => (
        <Link key={q.href} href={q.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] text-slate-200 hover:bg-slate-800/40">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
          {q.label}
        </Link>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-1 px-3 py-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-9 rounded-md bg-slate-800/40" />
      ))}
    </div>
  );
}

function Empty({ q }: { q: string }) {
  return (
    <div className="px-6 py-10 text-center text-sm text-slate-500">
      No results for <span className="text-slate-300">&ldquo;{q}&rdquo;</span>.
    </div>
  );
}
