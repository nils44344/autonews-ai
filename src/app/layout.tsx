import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import { env } from "@/lib/env";
import { organizationJsonLd, ldScript } from "@/lib/seo/schema";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// Google AdSense publisher ID — loads auto-ads site-wide and serves as the
// AdSense site-verification snippet.
const ADSENSE_CLIENT = "ca-pub-3249967523154711";

// Self-hosted by Next.js at build time. Space Grotesk = techy display headlines.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${env.SITE_NAME} — India's tech, startup & business news`,
    template: `%s | ${env.SITE_NAME}`,
  },
  description:
    "India's AI-powered newsroom: the latest in Indian tech, startups, AI, markets and business — fast, clear, and free.",
  openGraph: { type: "website", siteName: env.SITE_NAME, url: env.SITE_URL },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

// Full 6-pillar nav. Order = priority per the product vision: Opportunities
// (the moat) first, Signals (live intelligence), Tools (SEO engine), Workflows
// (retention), Startups (radar), News (supporting). Blog and category pages
// continue to work — they are reached via /news and category links.
const nav = [
  { href: "/", label: "Home" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/signals", label: "Signals" },
  { href: "/tools", label: "Tools" },
  { href: "/workflows", label: "Workflows" },
  { href: "/startups", label: "Startups" },
  { href: "/news", label: "News" },
];

// Section nav — the category portal bar. Order = editorial priority for an
// India-first tech/business portal, with Cricket given its own prominent slot.
const sections = [
  { href: "/category/tech", label: "Tech" },
  { href: "/category/startups", label: "Startups" },
  { href: "/category/business", label: "Business" },
  { href: "/category/markets", label: "Markets" },
  { href: "/category/ai", label: "AI" },
  { href: "/category/cricket", label: "Cricket" },
  { href: "/category/entertainment", label: "Entertainment" },
  { href: "/category/fact-check", label: "Fact Check" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        {/* Literal AdSense script in <head> so Google's verifier (which scans
            static HTML) and the code-snippet method both find it. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
      </head>
      <body className="flex min-h-screen flex-col bg-slate-50 font-sans text-ink antialiased dark:bg-slate-950 dark:text-slate-100">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldScript(organizationJsonLd()) }}
        />

        <SiteHeader siteName={env.SITE_NAME} nav={nav} sections={sections} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

        <footer className="mt-16 bg-ink text-slate-400">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-sm">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt={env.SITE_NAME} className="h-9 w-9" />
                  <span className="font-serif text-lg font-bold text-white">{env.SITE_NAME}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">
                  India&apos;s AI-powered newsroom — tech, startups, AI, markets and business,
                  refreshed around the clock.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-12 gap-y-6">
                <nav className="flex flex-col gap-2 text-sm">
                  <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Explore
                  </span>
                  {nav.map((n) => (
                    <Link key={n.href} href={n.href} className="hover:text-white">
                      {n.label}
                    </Link>
                  ))}
                  <Link href="/sitemap.xml" className="hover:text-white">
                    Sitemap
                  </Link>
                </nav>
                <nav className="flex flex-col gap-2 text-sm">
                  <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sections
                  </span>
                  {sections.map((s) => (
                    <Link key={s.href} href={s.href} className="hover:text-white">
                      {s.label}
                    </Link>
                  ))}
                </nav>
                <nav className="flex flex-col gap-2 text-sm">
                  <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Company
                  </span>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                  <Link href="/editorial-policy" className="hover:text-white">
                    Editorial &amp; AI Policy
                  </Link>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy
                  </Link>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </nav>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs">
              <span>
                © {new Date().getFullYear()} {env.SITE_NAME}. Automated journalism.
              </span>
              <Link href="/admin" className="hover:text-white">
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
