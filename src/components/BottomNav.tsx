"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile bottom nav — uses bracketed 3-letter mono sigils [OPP] [SIG] [TOL]
// [FLW] [STR] instead of generic Lucide/Material icons. Distinctive on
// purpose; matches the header's terminal aesthetic. Each sigil is colored
// in its pillar accent.

const items: { href: string; sigil: string; label: string; accent: string }[] = [
  { href: "/opportunities", sigil: "OPP", label: "Opps",   accent: "text-opportunity" },
  { href: "/signals",       sigil: "SIG", label: "Signals", accent: "text-signal" },
  { href: "/tools",         sigil: "TOL", label: "Tools",  accent: "text-tool" },
  { href: "/workflows",     sigil: "FLW", label: "Flows",  accent: "text-workflow" },
  { href: "/startups",      sigil: "STR", label: "Radar",  accent: "text-startup" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-canvas-rule bg-canvas/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-content grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={[
                  "relative flex h-14 flex-col items-center justify-center gap-1 transition",
                  active
                    ? `${it.accent}`
                    : "text-[color:var(--muted-fg)] hover:text-[color:var(--fg)]",
                ].join(" ")}
              >
                <span className="font-mono text-[12px] font-extrabold tracking-wider">
                  [{it.sigil}]
                </span>
                <span className="font-mono text-[9px] font-medium uppercase tracking-wider">
                  {it.label}
                </span>
                {active && <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-current" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
