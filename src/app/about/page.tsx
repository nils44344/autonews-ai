import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "About · Predictive Automotive Market Intelligence",
  description: "AutoNews AI delivers AI-driven brand sentiment, 30-day price forecasts, and category trends for the global automotive industry.",
  alternates: { canonical: `${env.SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <article>
      <div className="label label-brand">About</div>
      <h1 className="mt-4 max-w-3xl text-white">A premium intelligence terminal for the automotive market.</h1>
      <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-slate-400">
        AutoNews AI synthesises real public signal — Reddit conversations, Hacker News discussions, news headlines — into brand sentiment scores and 30-day price predictions for the 50 most-watched global car brands.
      </p>

      <section className="mt-20">
        <div className="label label-brand">Method</div>
        <h2 className="mt-3">How the score is built.</h2>
        <ol className="mt-8 space-y-6 text-[15px] leading-relaxed text-slate-300">
          <li className="border-l border-canvas-rule pl-6">
            <span className="label">Step 01</span>
            <p className="mt-2">Live mention volume is pulled across Reddit and Hacker News for every brand, every cycle.</p>
          </li>
          <li className="border-l border-canvas-rule pl-6">
            <span className="label">Step 02</span>
            <p className="mt-2">Titles are scored against a domain-tuned positive/negative dictionary, weighted by upvote and comment counts.</p>
          </li>
          <li className="border-l border-canvas-rule pl-6">
            <span className="label">Step 03</span>
            <p className="mt-2">A 30-day price prediction is generated for each tracked model, anchored to current MSRP with sentiment-driven drift and a confidence interval.</p>
          </li>
          <li className="border-l border-canvas-rule pl-6">
            <span className="label">Step 04</span>
            <p className="mt-2">Everything is recomputed every 4 hours and exposed at <Link href="/" className="text-brand underline">autonews-ai.live</Link> + via crawlable JSON-LD for AI agents.</p>
          </li>
        </ol>
      </section>

      <section className="mt-20">
        <div className="label label-brand">Coverage</div>
        <h2 className="mt-3">50 brands. 8 categories. One live terminal.</h2>
        <p className="mt-5 max-w-2xl text-[15px] text-slate-400">
          From Tesla and Toyota to BYD, Tata, and Rivian — coverage spans every major OEM, every region, every powertrain.
        </p>
      </section>

      <section className="mt-20">
        <div className="label label-brand">Get started</div>
        <h2 className="mt-3">Explore the dashboard.</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-[13px] font-semibold text-black">Dashboard →</Link>
          <Link href="/trends/tesla" className="inline-flex h-11 items-center rounded-lg border border-canvas-rule px-5 text-[13px] font-semibold">Tesla</Link>
          <Link href="/predictions/ev" className="inline-flex h-11 items-center rounded-lg border border-canvas-rule px-5 text-[13px] font-semibold">EV Forecast</Link>
        </div>
      </section>
    </article>
  );
}
