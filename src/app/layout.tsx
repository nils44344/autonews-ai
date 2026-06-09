import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${env.SITE_NAME} — Predictive Automotive Market Intelligence`,
    template: `%s · ${env.SITE_NAME}`,
  },
  description:
    "Premium AI-driven market intelligence for the global automotive industry. Brand sentiment, 30-day price predictions, and category trends for the 50 most-watched car brands.",
  openGraph: { type: "website", siteName: env.SITE_NAME, url: env.SITE_URL },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: env.SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-black font-sans text-slate-100 antialiased">
        <Header />
        <main className="mx-auto w-full max-w-content" style={{
          paddingInline: "clamp(1.25rem, 0.4rem + 2.6vw, 4rem)",
          paddingTop:    "clamp(2rem, 1rem + 2.4vw, 4rem)",
          paddingBottom: "clamp(4rem, 2rem + 2vw, 6rem)",
        }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-canvas-rule bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-content items-center gap-8 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[15px] font-bold tracking-tight">AutoNews</span>
          <span className="hidden text-[15px] text-brand sm:inline">AI</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-[13px]">
          <NavLink href="/trends/tesla">Brands</NavLink>
          <NavLink href="/predictions/ev">Categories</NavLink>
          <NavLink href="/about">About</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-1.5 text-slate-400 transition hover:text-white">
      {children}
    </Link>
  );
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" stroke="rgb(var(--brand))" strokeWidth="1.5" />
      <path d="M11 22 L16 10 L21 22 M12.5 18 L19.5 18" stroke="rgb(var(--brand))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="mt-32 border-t border-canvas-rule">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <Mark />
              <span className="font-bold">AutoNews AI</span>
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              Predictive automotive market intelligence, built for analysts who read the market early.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[13px] sm:grid-cols-3">
            <Link href="/" className="text-slate-500 hover:text-white">Dashboard</Link>
            <Link href="/trends/tesla" className="text-slate-500 hover:text-white">Tesla</Link>
            <Link href="/trends/byd" className="text-slate-500 hover:text-white">BYD</Link>
            <Link href="/trends/toyota" className="text-slate-500 hover:text-white">Toyota</Link>
            <Link href="/predictions/ev" className="text-slate-500 hover:text-white">EVs</Link>
            <Link href="/predictions/hybrid" className="text-slate-500 hover:text-white">Hybrids</Link>
            <Link href="/predictions/suv" className="text-slate-500 hover:text-white">SUVs</Link>
            <Link href="/predictions/luxury" className="text-slate-500 hover:text-white">Luxury</Link>
            <Link href="/sitemap.xml" className="text-slate-500 hover:text-white">Sitemap</Link>
          </div>
        </div>
        <div className="mt-10 border-t border-canvas-rule pt-6 text-[11px] text-slate-600">
          © {new Date().getFullYear()} AutoNews AI · Predictive automotive market intelligence
        </div>
      </div>
    </footer>
  );
}
