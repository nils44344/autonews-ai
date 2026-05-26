import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { organizationJsonLd, ldScript } from "@/lib/seo/schema";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldScript(organizationJsonLd()) }}
        />
        <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-20">
          <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-lg tracking-tight">
              {env.SITE_NAME}
            </Link>
            <nav className="flex gap-5 text-sm font-medium">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-slate-600 hover:text-brand">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">{children}</main>

        <footer className="border-t border-slate-200 mt-12">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500 flex flex-wrap gap-4 justify-between">
            <span>
              © {new Date().getFullYear()} {env.SITE_NAME}. Automated journalism, human-reviewed.
            </span>
            <span className="flex gap-4">
              <Link href="/sitemap.xml" className="hover:text-brand">Sitemap</Link>
              <Link href="/admin" className="hover:text-brand">Admin</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
