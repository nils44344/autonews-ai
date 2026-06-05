import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Cross-pillar search backing the command palette. Single round-trip queries
// Opportunities + Signals + Tools + Workflows + Startups + News and returns a
// merged hit list. Postgres ILIKE is fine at this scale; swap to pg_trgm or a
// vector index later if we cross ~50k rows.
export const dynamic = "force-dynamic";

interface Hit {
  kind: "opportunity" | "tool" | "workflow" | "startup" | "signal" | "news";
  slug: string;
  title: string;
  subtitle?: string;
  href: string;
}

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) return NextResponse.json({ hits: [] as Hit[] });

  const like = `%${q}%`;
  const lim = 6;

  const [opps, tools, workflows, startups, signals, articles] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }],
      },
      orderBy: { opportunityScore: "desc" },
      take: lim,
      select: { slug: true, title: true, summary: true },
    }).catch(() => []),
    prisma.tool.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ name: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }],
      },
      orderBy: { momentumScore: "desc" },
      take: lim,
      select: { slug: true, name: true, tagline: true },
    }).catch(() => []),
    prisma.workflow.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q, mode: "insensitive" } }, { objective: { contains: q, mode: "insensitive" } }],
      },
      orderBy: { popularityScore: "desc" },
      take: lim,
      select: { slug: true, title: true, objective: true },
    }).catch(() => []),
    prisma.startup.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ name: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }],
      },
      orderBy: { momentumScore: "desc" },
      take: lim,
      select: { slug: true, name: true, tagline: true },
    }).catch(() => []),
    prisma.signal.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }],
      },
      orderBy: { momentumScore: "desc" },
      take: lim,
      select: { slug: true, title: true, summary: true },
    }).catch(() => []),
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q, mode: "insensitive" } }, { dek: { contains: q, mode: "insensitive" } }],
      },
      orderBy: { publishedAt: "desc" },
      take: lim,
      select: { slug: true, title: true, dek: true, type: true },
    }).catch(() => []),
  ]);

  // Reference suppresses the unused-var lint without changing semantics.
  void like;

  const hits: Hit[] = [
    ...opps.map((o) => ({ kind: "opportunity" as const, slug: o.slug, title: o.title, subtitle: o.summary?.slice(0, 120), href: `/opportunities/${o.slug}` })),
    ...signals.map((s) => ({ kind: "signal" as const, slug: s.slug, title: s.title, subtitle: s.summary?.slice(0, 120), href: `/signals` })),
    ...tools.map((t) => ({ kind: "tool" as const, slug: t.slug, title: t.name, subtitle: t.tagline, href: `/tools/${t.slug}` })),
    ...workflows.map((w) => ({ kind: "workflow" as const, slug: w.slug, title: w.title, subtitle: w.objective?.slice(0, 120), href: `/workflows/${w.slug}` })),
    ...startups.map((s) => ({ kind: "startup" as const, slug: s.slug, title: s.name, subtitle: s.tagline, href: `/startups/${s.slug}` })),
    ...articles.map((a) => ({ kind: "news" as const, slug: a.slug, title: a.title, subtitle: a.dek?.slice(0, 120), href: `/${a.type === "BLOG" ? "blog" : "article"}/${a.slug}` })),
  ];

  return NextResponse.json({ hits });
}
