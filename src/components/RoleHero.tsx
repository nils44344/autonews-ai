"use client";

import { useEffect, useState } from "react";
import { getRole, type Role } from "./Personalization";
import { ROLE_MAP } from "@/lib/role-mapping";

// Personalised hero copy. Renders different headline + sub depending on role
// stored in localStorage. If no role yet, falls back to a neutral default
// (returned via children prop from the server-rendered homepage).

export function RoleHero({ children }: { children: React.ReactNode }) {
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

  // No role yet — render the server-rendered default block (SEO-safe).
  if (!role) return <>{children}</>;

  const t = ROLE_MAP[role];
  return (
    <div>
      <div className="mb-4 inline-flex w-max items-center gap-2 rounded border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">
        <span className="h-1 w-1 animate-pulse rounded-full bg-brand" />
        <span>FOR · {t.label.toUpperCase()} · {t.tagline}</span>
      </div>
      <h1 className="font-display text-[2.6rem] font-normal leading-[0.98] tracking-tight text-[color:rgb(var(--fg))] sm:text-[3.4rem] md:text-[4.2rem]">
        {t.heroHeadline} <br />
        <span className="italic text-brand">{t.heroItalic}</span>
      </h1>
      <p className="mt-6 max-w-md text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
        {t.heroSub}
      </p>
    </div>
  );
}
