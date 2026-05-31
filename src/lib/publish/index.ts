import { env } from "../env";
import { prisma } from "../db";
import { buildInternalLinks, injectAffiliateLinks } from "../seo/internal-links";
import { pingIndexNow } from "../seo/indexnow";
import { postToTelegram } from "../social/telegram";
import { postToX } from "../social/x";

/**
 * Finalise an article for publication:
 *  - inject affiliate links + build internal links
 *  - respect PUBLISH_MODE (manual => REVIEW, auto => check quality gate)
 *  - set canonical URL + publishedAt
 */
export async function publishArticle(articleId: string) {
  const article = await prisma.article.findUniqueOrThrow({ where: { id: articleId } });

  // Quality gate.
  if (article.qualityScore < env.MIN_QUALITY_SCORE) {
    await prisma.article.update({ where: { id: articleId }, data: { status: "REJECTED" } });
    await prisma.jobLog.create({
      data: {
        job: "publish",
        status: "ok",
        message: `rejected: quality ${article.qualityScore} < ${env.MIN_QUALITY_SCORE}`,
        meta: { articleId },
      },
    });
    return { published: false, reason: "below-quality-threshold" as const };
  }

  // Manual mode: park in REVIEW for an editor to approve via the dashboard.
  if (env.PUBLISH_MODE === "manual") {
    await prisma.article.update({ where: { id: articleId }, data: { status: "REVIEW" } });
    return { published: false, reason: "awaiting-approval" as const };
  }

  return approveAndPublish(articleId);
}

/** Called by the publish gate (auto mode) or by an editor clicking "Approve". */
export async function approveAndPublish(articleId: string) {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: articleId },
    include: { category: { select: { slug: true } } },
  });

  const bodyWithAffiliates = await injectAffiliateLinks(article.body);
  const path = article.type === "BLOG" ? "blog" : "article";
  const canonical = `${env.SITE_URL}/${path}/${article.slug}`;

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      body: bodyWithAffiliates,
      canonicalUrl: canonical,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await buildInternalLinks(articleId);
  if (article.topicId) {
    await prisma.trendTopic.update({ where: { id: article.topicId }, data: { status: "PUBLISHED" } });
  }

  await prisma.jobLog.create({
    data: { job: "publish", status: "ok", message: "published", meta: { articleId } },
  });

  // Instant search-engine push (IndexNow). Also nudge the hub pages this story
  // now appears on (homepage + its category) so they get re-crawled promptly.
  // Fire-and-forget — never blocks publish.
  const urls = [canonical, env.SITE_URL];
  if (article.category?.slug) urls.push(`${env.SITE_URL}/category/${article.category.slug}`);
  void pingIndexNow(urls);

  // Auto-post to the Telegram channel (fire-and-forget — never blocks publish).
  void postToTelegram({
    title: updated.title,
    url: canonical,
    excerpt: updated.excerpt,
    imageUrl: updated.ogImage,
    categorySlug: article.category?.slug ?? null,
  });

  // Auto-post NEWS to X (skips blogs to stay under the 500/month free-tier cap).
  if (article.type === "NEWS") {
    void postToX({ title: updated.title, url: canonical });
  }

  return { published: true, article: updated };
}
