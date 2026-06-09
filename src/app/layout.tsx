import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${env.SITE_NAME} — Predictive Automotive Market Dashboard`,
    template: `%s | ${env.SITE_NAME}`,
  },
  description:
    "AI-powered automotive market intelligence: brand sentiment, 30-day price predictions, EV adoption signals, and category trend forecasts for every major car brand.",
  keywords: [
    "automotive market", "car price prediction", "EV sentiment", "Tesla forecast",
    "Ford market trend", "automotive AI", "vehicle price forecast", "car brand sentiment",
  ],
  openGraph: {
    type: "website",
    siteName: env.SITE_NAME,
    url: env.SITE_URL,
    title: `${env.SITE_NAME} — Predictive Automotive Market Dashboard`,
    description: "AI-powered automotive market intelligence.",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: env.SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-slate-100 antialiased">
        <header className="sticky top-0 z-30 border-b border-canvas-rule bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-content items-center gap-6 px-4 sm:px-6 md:px-8">
            <Link href="/" className="flex items-center gap-2">
              <BrandSigil />
              <span className="text-[15px] font-bold tracking-tight">AutoNews</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">// AI</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-[13px]">
              <Link href="/trends/tesla"   className="rounded px-3 py-1.5 text-slate-400 hover:text-white">Trends</Link>
              <Link href="/predictions/ev" className="rounded px-3 py-1.5 text-slate-400 hover:text-white">Predictions</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-content" style={{
          paddingInline: "clamp(1rem, 0.4rem + 2.4vw, 4rem)",
          paddingTop:    "clamp(1.5rem, 0.8rem + 1.8vw, 3rem)",
          paddingBottom: "clamp(2.5rem, 1.5rem + 1vw, 4rem)",
        }}>
          {children}
        </main>

        <footer className="border-t border-canvas-rule bg-canvas-raised">
          <div className="mx-auto max-w-content px-4 py-8 sm:px-6 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] text-slate-500">
              <span>© {new Date().getFullYear()} {env.SITE_NAME}. AI-driven automotive intelligence.</span>
              <div className="flex gap-4">
                <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
                <Link href="/predictions/ev" className="hover:text-white">EV Forecast</Link>
                <Link href="/trends/tesla" className="hover:text-white">Tesla</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function BrandSigil() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden className="text-brand">
      <path d="M5 4 L5 28 M5 4 L9 4 M5 28 L9 28 M27 4 L27 28 M23 4 L27 4 M23 28 L27 28"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M11 24 L16 8 L21 24 M13.2 19 L18.8 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="29" r="1.5" fill="rgb(var(--accent))" />
    </svg>
  );
}
