import { PrismaClient, type SourceType } from "@prisma/client";

const prisma = new PrismaClient();

// All sources below are free and key-free (RSS / Reddit / HN / Google Trends).
// NewsAPI / YouTube / X sources activate automatically once you add their keys.
const sources: { type: SourceType; name: string; url?: string; category: string; weight: number }[] = [
  // ── Google Trends (daily trending searches by geo) ──
  { type: "GOOGLE_TRENDS", name: "Google Trends US", url: "US", category: "general", weight: 1.4 },

  // ── Google News RSS queries ──
  { type: "GOOGLE_NEWS", name: "Google News — Technology", url: "https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en", category: "tech", weight: 1.2 },
  { type: "GOOGLE_NEWS", name: "Google News — AI", url: "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en", category: "ai", weight: 1.3 },
  { type: "GOOGLE_NEWS", name: "Google News — Business", url: "https://news.google.com/rss/search?q=business&hl=en-US&gl=US&ceid=US:en", category: "business", weight: 1.1 },

  // ── Tech / AI blogs (RSS) ──
  { type: "RSS", name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech", weight: 1.2 },
  { type: "RSS", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech", weight: 1.2 },
  { type: "RSS", name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", category: "tech", weight: 1.1 },
  { type: "RSS", name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "ai", weight: 1.2 },
  { type: "RSS", name: "MIT Tech Review", url: "https://www.technologyreview.com/feed/", category: "ai", weight: 1.2 },

  // ── Business / finance ──
  { type: "RSS", name: "CNBC Business", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147", category: "business", weight: 1.0 },

  // ── Crypto ──
  { type: "RSS", name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto", weight: 1.1 },
  { type: "RSS", name: "Cointelegraph", url: "https://cointelegraph.com/rss", category: "crypto", weight: 1.0 },

  // ── Sports ──
  { type: "RSS", name: "ESPN Top", url: "https://www.espn.com/espn/rss/news", category: "sports", weight: 1.0 },

  // ── Entertainment ──
  { type: "RSS", name: "Variety", url: "https://variety.com/feed/", category: "entertainment", weight: 0.9 },

  // ── Hacker News ──
  { type: "HACKERNEWS", name: "Hacker News Top", url: "topstories", category: "tech", weight: 1.1 },

  // ── Reddit (public JSON, no key) ──
  { type: "REDDIT", name: "r/technology", url: "technology", category: "tech", weight: 1.0 },
  { type: "REDDIT", name: "r/artificial", url: "artificial", category: "ai", weight: 1.1 },
  { type: "REDDIT", name: "r/CryptoCurrency", url: "CryptoCurrency", category: "crypto", weight: 0.9 },
  { type: "REDDIT", name: "r/worldnews", url: "worldnews", category: "general", weight: 1.0 },
  { type: "REDDIT", name: "r/sports", url: "sports", category: "sports", weight: 0.8 },
];

const categories = [
  { name: "Technology", slug: "tech", kind: "news" },
  { name: "Artificial Intelligence", slug: "ai", kind: "news" },
  { name: "Business", slug: "business", kind: "news" },
  { name: "Cryptocurrency", slug: "crypto", kind: "news" },
  { name: "Sports", slug: "sports", kind: "news" },
  { name: "Entertainment", slug: "entertainment", kind: "news" },
  { name: "General", slug: "general", kind: "news" },
  { name: "Blog", slug: "blog", kind: "blog" },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  for (const s of sources) {
    await prisma.source.upsert({
      where: { type_url: { type: s.type, url: s.url ?? "" } },
      update: { name: s.name, category: s.category, weight: s.weight, enabled: true },
      create: { ...s },
    });
  }
  console.log(`Seeded ${categories.length} categories and ${sources.length} sources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
