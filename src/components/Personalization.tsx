"use client";

import { useEffect, useState } from "react";

// Lightweight personalization (v1): a localStorage-backed role profile + an
// onboarding modal that appears once per visitor. v2 will re-rank content based
// on this; v1 just sets the foundation (per the brief: "Users should feel:
// 'This platform understands me.'").

export type Role = "founder" | "creator" | "developer" | "marketer" | "trader" | "student";

const KEY = "anai_role";

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const r = localStorage.getItem(KEY);
    return r && ROLES.some((x) => x.id === r) ? (r as Role) : null;
  } catch {
    return null;
  }
}

export function setRole(r: Role | null) {
  try {
    if (r === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, r);
  } catch { /* ignore */ }
  applyRoleTheme(r);
  window.dispatchEvent(new CustomEvent("role:change", { detail: r }));
}

// Swap the --brand / --accent CSS variables on <html> so every component that
// uses them (cards, headlines, ticker dots, sparklines) instantly reflects the
// chosen personality. Also sets data-role for any layout-level overrides.
export function applyRoleTheme(r: Role | null) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (!r) {
    html.removeAttribute("data-role");
    html.style.removeProperty("--brand-rgb");
    html.style.removeProperty("--accent-rgb");
    return;
  }
  // Lazy require to avoid a top-level cycle.
  import("@/lib/role-mapping").then(({ ROLE_MAP }) => {
    const t = ROLE_MAP[r];
    if (!t) return;
    html.setAttribute("data-role", r);
    html.style.setProperty("--brand-rgb", t.brandRgb);
    html.style.setProperty("--accent-rgb", t.accentRgb);
  });
}

const ROLES: { id: Role; label: string; blurb: string; emoji: string }[] = [
  { id: "founder",   label: "Founder",    blurb: "Building or about to build a startup.",      emoji: "🚀" },
  { id: "creator",   label: "Creator",    blurb: "Content, YouTube, newsletters, audience.",   emoji: "🎨" },
  { id: "developer", label: "Developer",  blurb: "Shipping code, dev tools, automations.",     emoji: "💻" },
  { id: "marketer",  label: "Marketer",   blurb: "Growth, SEO, ads, outreach, GTM.",           emoji: "📈" },
  { id: "trader",    label: "Trader",     blurb: "Markets, signals, AI investing.",            emoji: "📊" },
  { id: "student",   label: "Student",    blurb: "Learning AI, exploring opportunities.",      emoji: "🎓" },
];

export function PersonalizationOnboarding() {
  const [open, setOpen] = useState(false);
  const [role, setLocalRole] = useState<Role | null>(null);

  useEffect(() => {
    const existing = getRole();
    setLocalRole(existing);
    // Re-apply theme on load so a returning visitor sees their personality.
    applyRoleTheme(existing);
    // First-time visitor → ask after 1s so the page can paint first.
    if (!existing) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener("personalization:open", onOpen);
    return () => window.removeEventListener("personalization:open", onOpen);
  }, []);

  function pick(id: Role) {
    setRole(id);
    setLocalRole(id);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up">
      <div role="dialog" aria-label="Pick your profile"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-canvas-raised shadow-2xl">
        <div className="border-b border-slate-800 px-6 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-opportunity">Welcome</div>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">Who are you building as?</h2>
          <p className="mt-1 text-[13px] text-slate-400">
            Pick one to personalize opportunities, signals, and tools for your context. You can change it later.
          </p>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => pick(r.id)}
              className={[
                "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                role === r.id
                  ? "border-opportunity/60 bg-opportunity/10"
                  : "border-slate-800 bg-canvas hover:border-slate-700 hover:bg-canvas-elevated",
              ].join(" ")}
            >
              <span className="text-2xl" aria-hidden>{r.emoji}</span>
              <div>
                <div className="font-display text-[15px] font-semibold text-white">{r.label}</div>
                <div className="mt-0.5 text-[12px] text-slate-400">{r.blurb}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 text-[11px] text-slate-500">
          <button onClick={() => setOpen(false)} className="hover:text-slate-300">Skip for now</button>
          <span>Stored locally on this device</span>
        </div>
      </div>
    </div>
  );
}

// Badge in the header showing current role; clicking re-opens the modal.
export function RoleBadge() {
  const [role, setLocalRole] = useState<Role | null>(null);

  useEffect(() => {
    setLocalRole(getRole());
    function onChange(e: Event) {
      const ce = e as CustomEvent<Role | null>;
      setLocalRole(ce.detail);
    }
    window.addEventListener("role:change", onChange);
    return () => window.removeEventListener("role:change", onChange);
  }, []);

  const meta = role ? ROLES.find((r) => r.id === role) : null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("personalization:open"))}
      className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-canvas-raised px-2.5 text-[12px] font-medium text-slate-300 transition hover:border-slate-700 hover:text-white md:inline-flex"
      title="Change your profile"
    >
      {meta ? (
        <>
          <span aria-hidden>{meta.emoji}</span>
          <span>{meta.label}</span>
        </>
      ) : (
        <>
          <span aria-hidden>👤</span>
          <span>Set profile</span>
        </>
      )}
    </button>
  );
}
