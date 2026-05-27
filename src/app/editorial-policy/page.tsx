import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Editorial & AI Policy",
  description: `How ${env.SITE_NAME} produces, sources, fact-checks and corrects its AI-assisted journalism.`,
  alternates: { canonical: `${env.SITE_URL}/editorial-policy` },
};

export default function EditorialPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800 md:p-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink dark:text-white">
        Editorial &amp; AI Policy
      </h1>
      <div className="prose mt-6">
        <p>
          {env.SITE_NAME} publishes AI-assisted journalism. We believe in being completely
          transparent about how our content is made, where our facts come from, and how we correct
          mistakes.
        </p>

        <h2>How our articles are produced</h2>
        <ul>
          <li>
            We continuously monitor public, reputable news feeds, RSS sources and trends to detect
            stories that matter to an Indian audience.
          </li>
          <li>
            Large language models draft each article <em>using only the source material gathered for
            that story</em>. Our system instructs the model not to invent facts, statistics, quotes
            or events beyond its sources.
          </li>
          <li>
            Every draft passes an automated quality and accuracy review before publishing. Pieces
            that fall below our quality threshold are not published.
          </li>
        </ul>

        <h2>Neutrality and fact-checks</h2>
        <p>
          For controversies and disputed claims, our Fact Check pieces take no side. We present
          what each side claims, weigh it against the available evidence, and assign an honest
          rating — including <strong>&ldquo;Disputed&rdquo;</strong> or{" "}
          <strong>&ldquo;Unproven&rdquo;</strong> when the evidence does not settle the matter. We
          never present a contested claim as settled fact.
        </p>

        <h2>Sources &amp; attribution</h2>
        <p>
          Articles cite the public sources used. We summarise and synthesise in our own words and
          link out to original reporting where relevant. We do not copy content.
        </p>

        <h2>Corrections</h2>
        <p>
          We are not infallible. If you spot an error, email us via our{" "}
          <a href="/contact">contact page</a> and we will review and correct it promptly. Material
          corrections are reflected in the article and its last-updated date.
        </p>

        <h2>Independence</h2>
        <p>
          Editorial decisions are independent of any advertising or affiliate relationships. Some
          links may be affiliate links that earn us a commission at no extra cost to you; these
          never influence our coverage or fact-check ratings.
        </p>
      </div>
    </article>
  );
}
