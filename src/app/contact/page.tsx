import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${env.SITE_NAME} — feedback, corrections, and press.`,
  alternates: { canonical: `${env.SITE_URL}/contact` },
};

const EMAIL = "editor@autonews-ai.live";

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800 md:p-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink dark:text-white">Contact us</h1>
      <div className="prose mt-6">
        <p>
          We&rsquo;d love to hear from you — whether it&rsquo;s feedback, a correction, a story tip,
          or a partnership enquiry.
        </p>
        <p>
          Email:{" "}
          <a href={`mailto:${EMAIL}`} className="font-semibold">
            {EMAIL}
          </a>
        </p>
        <h2>Corrections</h2>
        <p>
          Accuracy matters to us. If something in an article is wrong, email us with the link and the
          detail, and we&rsquo;ll review and fix it promptly — see our{" "}
          <a href="/editorial-policy">Editorial &amp; AI Policy</a>.
        </p>
        <h2>Newsletter</h2>
        <p>
          Want the day&rsquo;s top stories in your inbox? Subscribe from the box on our{" "}
          <a href="/">homepage</a>.
        </p>
      </div>
    </article>
  );
}
