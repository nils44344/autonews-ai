import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";
import { env } from "@/lib/env";

// Display serif — Instrument Serif. Distinctive editorial face used by Linear,
// Vercel design teams. Paired with Geist sans/mono gives the platform a
// magazine-meets-terminal feel no AI dashboard ships with.
const displaySerif = Instrument_Serif({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});
import { organizationJsonLd, ldScript } from "@/lib/seo/schema";
import { SiteHeader } from "@/components/SiteHeader";
import { CommandPalette } from "@/components/CommandPalette";
import { BottomNav } from "@/components/BottomNav";
import { PersonalizationOnboarding } from "@/components/Personalization";
import "./globals.css";

// AdSense publisher ID — loads auto-ads + serves as the verification snippet.
const ADSENSE_CLIENT = "ca-pub-3249967523154711";

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${env.SITE_NAME} — AI Intelligence Platform`,
    template: `%s | ${env.SITE_NAME}`,
  },
  description:
    "Discover AI opportunities before everyone else. Track AI trends, tools, workflows, startups, and market signals in one place.",
  // Default OG image: the Next.js opengraph-image route auto-resolves at
  // /opengraph-image so social shares always get a branded card even on pages
  // that don't override it (the audit flagged 6 pages missing og:image).
  openGraph: {
    type: "website",
    siteName: env.SITE_NAME,
    url: env.SITE_URL,
    images: [{ url: `${env.SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${env.SITE_URL}/opengraph-image`],
  },
  // Default canonical = the homepage; child pages override via their own
  // generateMetadata when they have a slug-specific URL.
  alternates: { canonical: env.SITE_URL },
  robots: { index: true, follow: true },
};

// Single nav row — the six pillars + Home. Section/category nav collapses into
// /news so the top bar stays minimal and search-first per the design brief.
const nav = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/signals", label: "Signals" },
  { href: "/tools", label: "Tools" },
  { href: "/workflows", label: "Workflows" },
  { href: "/startups", label: "Startups" },
  { href: "/news", label: "News" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${displaySerif.variable} dark`}>
      <head>
        <script async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous" />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-slate-100 antialiased">
        {/* Dark by default; theme toggle in header can flip it. We add the class
            synchronously to avoid FOUC. */}
        <script dangerouslySetInnerHTML={{
          __html: "(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})();",
        }} />
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldScript(organizationJsonLd()) }} />

        <SiteHeader siteName={env.SITE_NAME} nav={nav} />
        <CommandPalette />
        <PersonalizationOnboarding />

        <main className="mx-auto w-full max-w-content flex-1 px-5 pb-24 pt-10 sm:px-6 md:pb-14 md:pt-14">
          {children}
        </main>

        <BottomNav />

        <footer className="border-t border-slate-900 bg-canvas-raised text-slate-400">
          <div className="mx-auto max-w-content px-5 py-12 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-sm">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt={env.SITE_NAME} className="h-8 w-8" />
                  <span className="font-display text-base font-bold tracking-tight text-white">{env.SITE_NAME}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">
                  An AI Intelligence Platform — opportunities, signals, tools, workflows, startups, and the news that shapes them.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-12 gap-y-6">
                <nav className="flex flex-col gap-2 text-sm">
                  <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pillars</span>
                  {nav.map((n) => (
                    <Link key={n.href} href={n.href} className="hover:text-white">{n.label}</Link>
                  ))}
                </nav>
                <nav className="flex flex-col gap-2 text-sm">
                  <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Company</span>
                  <Link href="/about" className="hover:text-white">About</Link>
                  <Link href="/editorial-policy" className="hover:text-white">Editorial &amp; AI Policy</Link>
                  <Link href="/privacy" className="hover:text-white">Privacy</Link>
                  <Link href="/contact" className="hover:text-white">Contact</Link>
                  <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
                </nav>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-900 pt-6 text-xs">
              <span>© {new Date().getFullYear()} {env.SITE_NAME}. Built for builders.</span>
              <Link href="/admin" className="hover:text-white">Admin</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
