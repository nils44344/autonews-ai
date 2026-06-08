// Bracketed numeric section marker — [01] OPPORTUNITIES style. Distinctive
// signature element across the site. Mono font, oversized, brand-tinted.

export function SectionMark({
  index, label, kicker, accent = "brand", trailing,
}: {
  index: string | number;
  label: string;
  kicker?: string;
  accent?: "brand" | "signal" | "tool" | "workflow" | "startup" | "accent" | "slate";
  trailing?: React.ReactNode;
}) {
  const text = {
    brand: "text-brand", signal: "text-signal", tool: "text-tool",
    workflow: "text-workflow", startup: "text-startup", accent: "text-accent",
    slate: "text-slate-400",
  }[accent];
  const idx = typeof index === "number" ? String(index).padStart(2, "0") : index;

  return (
    <div className="mb-6 flex items-end justify-between gap-6 border-b border-canvas-rule pb-3">
      <div className="flex items-baseline gap-3">
        <span className={`font-mono text-[13px] font-bold tabular-nums ${text}`}>[{idx}]</span>
        <h2 className={`font-display text-[15px] font-bold uppercase tracking-bracket ${text}`}>
          {label}
        </h2>
        {kicker && (
          <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
            // {kicker}
          </span>
        )}
      </div>
      {trailing}
    </div>
  );
}
