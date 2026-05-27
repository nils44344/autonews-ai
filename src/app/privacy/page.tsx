import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${env.SITE_NAME} — what data we collect, cookies, advertising and your choices.`,
  alternates: { canonical: `${env.SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800 md:p-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink dark:text-white">Privacy Policy</h1>
      <div className="prose mt-6">
        <p>
          This Privacy Policy explains how {env.SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
          handles information when you visit {env.SITE_URL}.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Analytics data:</strong> standard, aggregated usage data such as pages visited,
            approximate location, device and browser type, collected to understand and improve our
            content.
          </li>
          <li>
            <strong>Newsletter:</strong> if you subscribe, we store the email address you provide
            solely to send you our briefing. You can unsubscribe at any time via the link in any
            email.
          </li>
        </ul>

        <h2>Cookies &amp; advertising</h2>
        <p>
          We may use cookies and similar technologies for analytics and advertising. Third-party
          vendors, including Google, may use cookies to serve ads based on your prior visits to this
          or other websites. Google&rsquo;s use of advertising cookies enables it and its partners
          to serve ads to you based on your visits. You can opt out of personalised advertising by
          visiting{" "}
          <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">
            Google Ads Settings
          </a>
          .
        </p>

        <h2>Third-party services</h2>
        <p>
          We rely on third-party providers for hosting, content delivery, email delivery and images.
          These providers process data only as needed to deliver their service.
        </p>

        <h2>Your choices</h2>
        <p>
          You can browse without subscribing, decline cookies via your browser settings, and
          unsubscribe from emails at any time. To request deletion of any data you&rsquo;ve given us,
          contact us via our <a href="/contact">contact page</a>.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy as our services evolve. Continued use of the site after changes
          constitutes acceptance of the updated policy.
        </p>
      </div>
    </article>
  );
}
