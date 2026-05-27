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
    const prompt = newsArticlePrompt({
      title: post.title,
      keywords: post.keywords,
      category: "blog",
      context: `This blog post supports the news story "${pillar.title}". Thesis: ${post.angle}. Intent: ${post.intent}.`,
      // Capped so the body fits the completion-token budget below (a 3500-word
      // body overflowed, truncating the JSON and tripping Groq's validator).
      minWords: 1300,
      maxWords: 1800,
      type: "BLOG",
      angle: post.angle,
    });

    // Retry up to 3×, dropping temperature on retries for more reliable JSON.
    let parsed: ReturnType<typeof generatedArticleSchema.parse> | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let raw: unknown = await generateJSON(prompt, {
          system: HOUSE_STYLE,
          temperature: attempt === 1 ? 0.75 : 0.35,
          maxTokens: 4000, // keep prompt+max_tokens under Groq's 6000 TPM cap
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
    const image = await fetchArticleImage(
      "blog", // no fixed section query → uses the post's strongest keyword
      parsed.keywords.length ? parsed.keywords : post.keywords,
    );

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
