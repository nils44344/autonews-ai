"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile bottom navigation per the design brief: "Mobile is not secondary.
// Mobile is primary." 5 thumb-friendly targets. Hidden on md+ where the
// header nav takes over. Active pill uses the pillar accent.

const items: { href: string; label: string; accent: string; icon: React.ReactNode }[] = [
  {
    href: "/opportunities", label: "Opps", accent: "text-opportunity",
    icon: <path d="M12 2 4 7v6c0 4.5 3.5 8.5 8 9 4.5-.5 8-4.5 8-9V7l-8-5Z" />,
  },
  {
    href: "/signals", label: "Signals", accent: "text-signal",
    icon: <path d="M3 17c3-4 6-4 9 0 3 4 6 4 9 0" />,
  },
  {
    href: "/tools", label: "Tools", accent: "text-tool",
    icon: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-7 7 2 2 7-7a4 4 0 0 0 5.4-5.4l-2 2-2-2 2-2Z" />,
  },
  {
    href: "/workflows", label: "Flows", accent: "text-workflow",
    icon: <path d="M4 6h6m4 0h6M4 12h6m4 0h6M4 18h6m4 0h6" />,
  },
  {
    href: "/startups", label: "Radar", accent: "text-startup",
    icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-900 bg-canvas/95 backdrop-blur md:hidden"
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
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition",
                  active ? it.accent : "text-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
                  {it.icon}
                </svg>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
