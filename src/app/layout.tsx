import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Lora } from "next/font/google";
import { env } from "@/lib/env";
import { organizationJsonLd, ldScript } from "@/lib/seo/schema";
import "./globals.css";

// Self-hosted by Next.js at build time (no runtime Google request) — fast + privacy-friendly.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Lora({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: `${env.SITE_NAME} — AI-powered breaking news & analysis`,
    template: `%s | ${env.SITE_NAME}`,
  },
  description:
    "Automated, SEO-optimized coverage of trending news across tech, AI, business, crypto, sports and entertainment.",
  openGraph: { type: "website", siteName: env.SITE_NAME, url: env.SITE_URL },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/memes", label: "Memes" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen flex flex-col bg-slate-50 font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldScript(organizationJsonLd()) }}
        />

        <header className="sticky top-0 z-30">
          <div className="h-1 w-full bg-gradient-to-r from-brand via-indigo-500 to-fuchsia-500" />
          <div className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="flex shrink-0 items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-serif text-base font-black text-white sm:h-9 sm:w-9 sm:text-lg">
                  A
                </span>
                <span className="whitespace-nowrap font-serif text-lg font-bold tracking-tight text-ink sm:text-xl">
                  {env.SITE_NAME}
                </span>
              </Link>

              <nav className="flex shrink-0 items-center gap-0.5 text-sm font-medium sm:gap-1">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-ink sm:px-3"
                  >
                    {n.label}
                  </Link>
                ))}
                <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 sm:flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  LIVE
                </span>
              </nav>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

        <footer className="mt-16 bg-ink text-slate-400">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-sm">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white font-serif font-black text-ink">
                    A
                  </span>
                  <span className="font-serif text-lg font-bold text-white">{env.SITE_NAME}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">
                  Breaking news and analysis across tech, AI, business and culture — written by
                  AI, refreshed around the clock.
                </p>
              </div>
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
