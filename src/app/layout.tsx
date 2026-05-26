import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Lora } from "next/font/google";
import { env } from "@/lib/env";
import { organizationJsonLd, ldScript } from "@/lib/seo/schema";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// Self-hosted by Next.js at build time (no runtime Google request) — fast + privacy-friendly.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Lora({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

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

const nav = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
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

        <SiteHeader siteName={env.SITE_NAME} nav={nav} />

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
                  India&apos;s AI-powered newsroom — tech, startups, AI, markets and business,
                  refreshed around the clock.
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
