import { generateJSON } from "../ai";
import { prisma } from "../db";
import { fetchArticleImage } from "../images";
import { readingMinutes, uniqueSlug, wordCount } from "../utils";
import { blogClusterPrompt, HOUSE_STYLE, newsArticlePrompt } from "./prompts";
import { blogClusterSchema, generatedArticleSchema } from "./schemas";

async function ensureCategory(name: string) {
  const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return prisma.category.upsert({
    where: { slug: slugified },
    update: {},
    create: { name, slug: slugified, kind: "blog" },
  });
}

/**
 * Given a published/generated NEWS article, plan a topic cluster and generate
 * the supporting blog posts. Links each post back to the pillar (news) article.
 */
export async function generateBlogCluster(pillarArticleId: string) {
  const pillar = await prisma.article.findUniqueOrThrow({
    where: { id: pillarArticleId },
    include: { category: { select: { name: true } } },
  });
  // Images: use the pillar's topic for relevance, and exclude already-used images
  // so no two posts repeat one. Grows as each cluster post is created.
  const imgCategory = pillar.category?.name ?? "blog";
  const recentImgs = await prisma.article.findMany({
    where: { status: "PUBLISHED", ogImage: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 300,
    select: { ogImage: true },
  });
  const usedImages = new Set(recentImgs.map((r) => r.ogImage).filter((u): u is string => !!u));

  const plan = blogClusterSchema.parse(
    await generateJSON(blogClusterPrompt(pillar.title, "blog"), {
      system: HOUSE_STYLE,
      temperature: 0.8,
      // Planning is a small structured task — use the cheap model, save the
      // premium content model's daily budget for the article bodies.
      model: "llama-3.1-8b-instant",
    }),
  );

  const category = await ensureCategory("blog");
  const created = [];

  // 2 supporting posts/pillar (was 4): keeps daily blog volume within free-tier
  // token limits so generation doesn't hit 429s.
  const posts = plan.posts.slice(0, 2);
  for (let idx = 0; idx < posts.length; idx++) {
    const post = posts[idx];
    const prompt = newsArticlePrompt({
      title: post.title,
      keywords: post.keywords,
      category: "blog",
      context: `This blog post supports the news story "${pillar.title}". Thesis: ${post.angle}. Intent: ${post.intent}.`,
      // Shorter target so smaller models close the JSON within budget.
      minWords: 700,
      maxWords: 1000,
      type: "BLOG",
      angle: post.angle,
    });

    // Spread blog bodies across TWO buckets (gpt-oss-20b + llama-3.1-8b) so
    // neither hits its daily token cap — alternating per post. (News pillars
    // stay on gpt-oss-120b; QA/planning on 8b.) Each has its own max_tokens to
    // respect that model's per-request TPM cap.
    // Blog bodies on gpt-oss-20b (its own daily bucket, separate from the 120b
    // news bucket). On retry, fall back to 8b so a 20b 429/truncation still
    // yields a blog. Volume is kept low (2/pillar) so 20b stays under its cap.
    void idx;
    let parsed: ReturnType<typeof generatedArticleSchema.parse> | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const model = attempt === 1 ? "openai/gpt-oss-20b" : "llama-3.1-8b-instant";
      const maxTokens = model.includes("8b") ? 4000 : 6500;
      try {
        let raw: unknown = await generateJSON(prompt, {
          system: HOUSE_STYLE,
          temperature: attempt === 1 ? 0.75 : 0.35,
          maxTokens,
          model,
        });
        if (Array.isArray(raw)) raw = raw[0];
        parsed = generatedArticleSchema.parse(raw);
        break;
      } catch {
        /* try again */
      }
    }
    // One failed post shouldn't sink the whole cluster — skip it and continue.
    if (!parsed) continue;

    const wc = wordCount(parsed.body);
    const image = await fetchArticleImage(imgCategory, post.title, usedImages);
    if (image) usedImages.add(image.url); // keep cluster posts unique from each other

    const blog = await prisma.article.create({
      data: {
        type: "BLOG",
        status: "DRAFT",
        title: parsed.title,
        slug: uniqueSlug(parsed.title),
        dek: parsed.dek,
        body: parsed.body,
        excerpt: parsed.excerpt,
        ogImage: image?.url,
        imageCredit: image?.credit ?? null,
        seoTitle: parsed.seoTitle || parsed.title,
        seoDescription: parsed.seoDescription || parsed.excerpt,
        keywords: parsed.keywords,
        faq: parsed.faq,
        sources: parsed.sources,
        wordCount: wc,
        readingMin: readingMinutes(parsed.body),
        categoryId: category.id,
        topicId: pillar.topicId,
        clusterId: pillar.clusterId ?? pillar.id,
        isPillar: false,
      },
    });

    // Two-way internal link between pillar and supporting post.
    await prisma.articleLink.createMany({
      data: [
        { fromId: pillar.id, toId: blog.id, anchor: blog.title },
        { fromId: blog.id, toId: pillar.id, anchor: pillar.title },
      ],
      skipDuplicates: true,
    });

    created.push(blog);
  }

  return created;
}
