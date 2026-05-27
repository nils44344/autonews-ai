import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "About",
  description: `About ${env.SITE_NAME} — an AI-assisted Indian newsroom covering tech, startups, business, markets, cricket and entertainment.`,
  alternates: { canonical: `${env.SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800 md:p-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink dark:text-white">About {env.SITE_NAME}</h1>
      <div className="prose mt-6">
        <p>
          {env.SITE_NAME} is an India-first newsroom covering technology, startups, business,
          markets, AI, cricket and entertainment — plus neutral, sourced analysis of the
          controversies people are actually arguing about.
        </p>
        <p>
          Our goal is simple: explain what happened, why it matters, and what comes next — clearly,
          quickly, and without hype. We focus on depth and context rather than just being first.
        </p>
        <h2>How we work</h2>
        <p>
          We use AI to monitor public news feeds and trends, draft coverage, and summarise complex
          stories. Every piece is generated under an editorial framework that requires sources,
          neutrality on disputed topics, and a clear separation between reporting and analysis. We
          are transparent that our articles are AI-assisted — see our{" "}
          <a href="/editorial-policy">Editorial &amp; AI Policy</a> for exactly how content is
          produced and corrected.
        </p>
        <h2>Our coverage</h2>
        <ul>
          <li>Indian startups &amp; funding</li>
          <li>Technology &amp; AI in India</li>
          <li>Business, markets &amp; the economy</li>
          <li>Cricket &amp; IPL</li>
          <li>Entertainment</li>
          <li>Fact Check — neutral analysis of trending controversies</li>
        </ul>
        <p>
          Have feedback or a correction? <a href="/contact">Get in touch</a> — we take accuracy
          seriously and fix errors promptly.
        </p>
      </div>
    </article>
  );
}
