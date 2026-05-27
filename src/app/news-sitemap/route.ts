import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { safe } from "@/lib/safe";

// Google News sitemap: only articles published in the LAST 48 HOURS (per Google's
// spec) with the news: namespace. Public URL is /news-sitemap.xml (rewritten in
// next.config to this non-dotted route, since Next doesn't reliably route folders
// containing a dot). Always dynamic so it's never a stale prerender.
export const dynamic = "force-dynamic";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const articles = await safe(
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: since } },
      select: { slug: true, type: true, title: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    }),
    [] as { slug: string; type: "NEWS" | "BLOG"; title: string; publishedAt: Date | null }[],
  );

  const urls = articles
    .map((a) => {
      const loc = `${env.SITE_URL}/${a.type === "BLOG" ? "blog" : "article"}/${a.slug}`;
      const date = (a.publishedAt ?? new Date()).toISOString();
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(env.SITE_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${date}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
