// Shared hero used by every pillar index page. Centralizes the look so the
// 6 pillars feel consistent without copy-pasting markup.

type Accent = "opportunity" | "signal" | "tool" | "workflow" | "startup" | "slate";

export function PillarHero({
  kicker, title, subtitle, accent,
}: {
  kicker: string; title: string; subtitle: string; accent: Accent;
}) {
  const ring = {
    opportunity: "border-opportunity/30 bg-opportunity/10 text-opportunity",
    signal:      "border-signal/30 bg-signal/10 text-signal",
    tool:        "border-tool/30 bg-tool/10 text-tool",
    workflow:    "border-workflow/30 bg-workflow/10 text-workflow",
    startup:     "border-startup/30 bg-startup/10 text-startup",
    slate:       "border-slate-700 bg-slate-800/40 text-slate-300",
  }[accent];
  const dot = {
    opportunity: "bg-opportunity", signal: "bg-signal", tool: "bg-tool",
    workflow: "bg-workflow", startup: "bg-startup", slate: "bg-slate-400",
  }[accent];
  return (
    <section className="relative -mx-5 -mt-10 overflow-hidden border-b border-slate-900/60 px-5 pb-10 pt-12 sm:-mx-6 sm:px-6 md:-mt-14 md:pb-14 md:pt-16">
      <div className="absolute inset-0 -z-10 grid-bg opacity-80" />
      <div className="mx-auto max-w-content">
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${ring}`}>
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${dot}`} />
          {kicker}
        </div>
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-400 md:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}
