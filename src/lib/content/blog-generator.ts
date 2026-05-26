import { generateJSON } from "../ai";
import { prisma } from "../db";
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
  const pillar = await prisma.article.findUniqueOrThrow({ where: { id: pillarArticleId } });

  const plan = blogClusterSchema.parse(
    await generateJSON(blogClusterPrompt(pillar.title, "blog"), {
      system: HOUSE_STYLE,
      temperature: 0.8,
    }),
  );

  const category = await ensureCategory("blog");
  const created = [];

  for (const post of plan.posts.slice(0, 4)) {
    const raw = await generateJSON(
      newsArticlePrompt({
        title: post.title,
        keywords: post.keywords,
        category: "blog",
        context: `This blog post supports the news story "${pillar.title}". Thesis: ${post.angle}. Intent: ${post.intent}.`,
        minWords: 2000,
        maxWords: 3500,
        type: "BLOG",
        angle: post.angle,
      }),
      { system: HOUSE_STYLE, temperature: 0.75, maxTokens: 4096 },
    );

    const parsed = generatedArticleSchema.parse(raw);
    const wc = wordCount(parsed.body);

    const blog = await prisma.article.create({
      data: {
        type: "BLOG",
        status: "DRAFT",
        title: parsed.title,
        slug: uniqueSlug(parsed.title),
        dek: parsed.dek,
        body: parsed.body,
        excerpt: parsed.excerpt,
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
