// Editor-in-chief pass — a daily, SAFE, additive SEO enhancement of recent
// articles. It NEVER rewrites the article body. For each recent published piece
// with gaps it:
//   • adds 4-5 People-Also-Ask-style FAQs (→ FAQ schema, snippet/PAA wins)
//   • (re)builds internal links (crawl depth + link equity)
//   • re-pings IndexNow so the refreshed page is recrawled
// Uses the cheap 8B model, so token cost is negligible. Run daily via GitHub
// Actions. Idempotent: it only touches articles that still have gaps.
import { z } from "zod";
import { prisma } from "../src/lib/db";
import { generateJSON } from "../src/lib/ai";
import { buildInternalLinks } from "../src/lib/seo/internal-links";
import { pingIndexNow } from "../src/lib/seo/indexnow";
import { env } from "../src/lib/env";

const faqSchema = z.object({
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

const MAX_PER_RUN = 10;

function faqPrompt(title: string, context: string): string {
  return `For the article titled "${title}", write 4-5 questions a reader would actually
type into Google (People Also Ask style), each with a concise, factual 2-3 sentence answer.
Base every answer ONLY on the content below — do not invent facts, numbers, or quotes:
"""
${context.slice(0, 3500)}
"""
Return ONLY JSON: {"faq":[{"question":"...","answer":"..."}]}`;
}

async function main() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      body: true,
      slug: true,
      type: true,
      faq: true,
      _count: { select: { linksOut: true } },
    },
  });

  // Prioritise the biggest gaps: too few FAQs, or no internal links.
  const needsWork = articles.filter((a) => {
    const faqLen = Array.isArray(a.faq) ? (a.faq as unknown[]).length : 0;
    return faqLen < 3 || a._count.linksOut === 0;
  });

  console.log(`→ editor pass: ${needsWork.length}/${articles.length} recent articles need work`);
  let improved = 0;

  for (const a of needsWork.slice(0, MAX_PER_RUN)) {
    try {
      const faqLen = Array.isArray(a.faq) ? (a.faq as unknown[]).length : 0;
      let added = "";

      if (faqLen < 3) {
        const parsed = faqSchema.parse(
          await generateJSON(faqPrompt(a.title, a.body), {
            temperature: 0.5,
            maxTokens: 1200,
            model: "llama-3.1-8b-instant", // cheap model — keep premium budget for writing
          }),
        );
        if (parsed.faq.length >= 3) {
          await prisma.article.update({ where: { id: a.id }, data: { faq: parsed.faq } });
          added += `+${parsed.faq.length} FAQ `;
        }
      }

      const links = await buildInternalLinks(a.id);
      if (links.length) added += `+${links.length} links `;

      if (added) {
        const url = `${env.SITE_URL}/${a.type === "BLOG" ? "blog" : "article"}/${a.slug}`;
        void pingIndexNow([url]);
        improved++;
        console.log(`  ✓ ${a.title.slice(0, 48)} — ${added.trim()}`);
      }
    } catch (e) {
      console.error(`  ✗ ${a.title.slice(0, 48)}:`, (e as Error).message.slice(0, 80));
    }
  }

  await prisma.jobLog.create({
    data: { job: "editor-pass", status: "ok", message: `improved ${improved}` },
  });
  console.log(`done. improved ${improved} article(s).`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
