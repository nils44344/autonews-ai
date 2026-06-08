"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRole, type Role } from "./Personalization";
import { ROLE_MAP, rankByRole } from "@/lib/role-mapping";

// Personalised rail — shown at the top of the homepage. Reads the user's
// role from localStorage (set by the onboarding modal), then re-orders the
// opportunities/workflows so the role-relevant ones float to the top. This
// is the "real" personalisation the owner asked for; the previous version
// stored the role and did nothing with it.

interface OppLite {
  id: string; slug: string; title: string; kind: string;
  opportunityScore: number; summary: string;
}

export function PersonalRail({ opportunities }: { opportunities: OppLite[] }) {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    setRole(getRole());
    function onChange(e: Event) {
      const ce = e as CustomEvent<Role | null>;
      setRole(ce.detail);
    }
    window.addEventListener("role:change", onChange);
    return () => window.removeEventListener("role:change", onChange);
  }, []);

  // No role chosen → render nothing (the modal will prompt them).
  if (!role) return null;

  const meta = ROLE_MAP[role];
  // rankByRole already floats role-matching kinds to the top. Just take 3 —
  // don't filter (previous code dropped to 0 when seeds didn't perfectly
  // match the role's kinds, making the rail look broken).
  const relevant = rankByRole(opportunities, role).slice(0, 3);

  return (
    <section className="mx-auto -mt-6 max-w-content">
      <div className="card edge-glow relative overflow-hidden p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="text-2xl">{meta.emoji}</span>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">
              [ FOR · {meta.label.toUpperCase()} ]
            </div>
            <div className={`font-display text-[20px] italic leading-tight text-[color:rgb(var(--fg))]`}>
              {meta.tagline}
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("personalization:open"))}
            className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider text-[color:rgb(var(--muted-fg))] hover:text-brand"
          >
            [CHANGE]
          </button>
        </div>

        {relevant.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {relevant.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.slug}`}
                className="group block rounded-md border border-canvas-rule bg-canvas px-4 py-3 transition hover:border-brand/40">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
                    [{o.kind.slice(0, 3)}]
                  </span>
                  <span className="font-mono text-[14px] font-bold tabular-nums text-brand tnum">
                    {o.opportunityScore.toFixed(0)}
                  </span>
                </div>
                <div className="mt-2 font-display text-[15px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                  {o.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
