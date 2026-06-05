import type { Metadata } from "next";
import { WatchlistClient } from "./WatchlistClient";

// Personal watchlist — reads from localStorage on the client. Server can't
// pre-render the list (no auth/session), so the page itself is a thin shell.

export const metadata: Metadata = {
  title: "Your watchlist — saved opportunities, tools, startups",
  description: "Items you've saved across opportunities, signals, tools, workflows, and startups.",
  robots: { index: false }, // private content; don't index the empty shell
};

export default function WatchlistPage() {
  return (
    <div className="space-y-10">
      <section className="relative -mx-5 -mt-10 overflow-hidden border-b border-slate-900/60 px-5 pb-10 pt-12 sm:-mx-6 sm:px-6 md:-mt-14 md:pb-14 md:pt-16">
        <div className="absolute inset-0 -z-10 grid-bg opacity-80" />
        <div className="mx-auto max-w-content">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-opportunity/30 bg-opportunity/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-opportunity">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-opportunity" /> Watchlist
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Your saved intelligence.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-400 md:text-lg">
            Opportunities, tools, and startups you&apos;re tracking. Stored locally on this device.
          </p>
        </div>
      </section>
      <WatchlistClient />
    </div>
  );
}
