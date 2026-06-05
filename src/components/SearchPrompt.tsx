"use client";

// Inline hero search prompt. Click → opens the CommandPalette via the same
// 'cmdk:open' custom event the header uses. Lives in its own file because the
// homepage is a Server Component; passing onClick from there would break SSR.
export function SearchPrompt() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("cmdk:open"))}
      className="mt-8 flex h-12 w-full max-w-xl items-center gap-3 rounded-xl border border-slate-800 bg-canvas-raised/80 px-4 text-left text-slate-400 backdrop-blur transition hover:border-slate-700 hover:bg-canvas-elevated"
    >
      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="flex-1 text-[14px]">Search opportunities, tools, signals, workflows…</span>
      <kbd className="ml-auto hidden h-6 select-none items-center gap-0.5 rounded border border-slate-700 bg-canvas px-2 font-mono text-[11px] text-slate-400 sm:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}
