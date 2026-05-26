import { PrismaClient, type SourceType } from "@prisma/client";

const prisma = new PrismaClient();

// India-first, tech/startup/business-led sources. All free + key-free
// (RSS / Reddit / Google News / Google Trends). Google News India queries are
// the most reliable feeds; Indian outlets add depth; a few global tech feeds at
// low weight catch India-relevant global stories. Dead feeds are skipped
// gracefully (9s per-source timeout in the trend engine).
const gnews = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;

const sources: { type: SourceType; name: string; url?: string; category: string; weight: number }[] = [
  // ── Google Trends (India) ──
  { type: "GOOGLE_TRENDS", name: "Google Trends India", url: "IN", category: "india", weight: 1.2 },

  // ── Google News India — the core, reliable feeds (tech/startup/business) ──
  { type: "GOOGLE_NEWS", name: "GNews — Indian Startups", url: gnews("Indian startup funding"), category: "startups", weight: 1.5 },
  { type: "GOOGLE_NEWS", name: "GNews — India Tech", url: gnews("India technology"), category: "tech", weight: 1.4 },
  { type: "GOOGLE_NEWS", name: "GNews — AI India", url: gnews("artificial intelligence India"), category: "ai", weight: 1.4 },
  { type: "GOOGLE_NEWS", name: "GNews — Indian Markets", url: gnews("Sensex Nifty Indian stock market"), category: "markets", weight: 1.3 },
  { type: "GOOGLE_NEWS", name: "GNews — India Business", url: gnews("India business economy"), category: "business", weight: 1.3 },
  { type: "GOOGLE_NEWS", name: "GNews — Fintech India", url: gnews("fintech India UPI"), category: "business", weight: 1.2 },
  { type: "GOOGLE_NEWS", name: "GNews — Indian IT", url: gnews("India IT companies Infosys TCS"), category: "tech", weight: 1.1 },
  { type: "GOOGLE_NEWS", name: "GNews — India Top", url: gnews("India top news"), category: "india", weight: 1.0 },

  // ── Indian startup / tech outlets (RSS) ──
  { type: "RSS", name: "YourStory", url: "https://yourstory.com/feed", category: "startups", weight: 1.4 },
  { type: "RSS", name: "Inc42", url: "https://inc42.com/feed/", category: "startups", weight: 1.4 },
  { type: "RSS", name: "Moneycontrol — Tech", url: "https://www.moneycontrol.com/rss/technology.xml", category: "tech", weight: 1.2 },
  { type: "RSS", name: "Moneycontrol — Business", url: "https://www.moneycontrol.com/rss/business.xml", category: "business", weight: 1.2 },
  { type: "RSS", name: "Livemint — Technology", url: "https://www.livemint.com/rss/technology", category: "tech", weight: 1.2 },
  { type: "RSS", name: "Livemint — Companies", url: "https://www.livemint.com/rss/companies", category: "business", weight: 1.1 },
  { type: "RSS", name: "ET — Tech", url: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms", category: "tech", weight: 1.2 },
  { type: "RSS", name: "Business Standard", url: "https://www.business-standard.com/rss/home_page_top_stories.rss", category: "business", weight: 1.0 },
  { type: "RSS", name: "Indian Express — Tech", url: "https://indianexpress.com/section/technology/feed/", category: "tech", weight: 1.1 },
  { type: "RSS", name: "Gadgets 360", url: "https://feeds.feedburner.com/gadgets360-latest", category: "tech", weight: 1.0 },
  { type: "RSS", name: "NDTV — Top Stories", url: "https://feeds.feedburner.com/ndtvnews-top-stories", category: "india", weight: 0.9 },

  // ── Reddit India (public JSON, no key) ──
  { type: "REDDIT", name: "r/india", url: "india", category: "india", weight: 1.0 },
  { type: "REDDIT", name: "r/IndianStreetBets", url: "IndianStreetBets", category: "markets", weight: 1.1 },
  { type: "REDDIT", name: "r/developersIndia", url: "developersIndia", category: "tech", weight: 1.0 },
  { type: "REDDIT", name: "r/StartUpIndia", url: "StartUpIndia", category: "startups", weight: 1.1 },

  // ── Global tech (India-relevant), low weight so India stays the majority ──
  { type: "RSS", name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech", weight: 0.7 },
  { type: "HACKERNEWS", name: "Hacker News Top", url: "topstories", category: "tech", weight: 0.7 },
];

const categories = [
  { name: "Technology", slug: "tech", kind: "news" },
  { name: "Startups", slug: "startups", kind: "news" },
  { name: "AI", slug: "ai", kind: "news" },
  { name: "Business", slug: "business", kind: "news" },
  { name: "Markets", slug: "markets", kind: "news" },
  { name: "India", slug: "india", kind: "news" },
  { name: "Blog", slug: "blog", kind: "blog" },
];

async function main() {
  // Disable any previously-seeded (non-Indian) sources so they stop being fetched.
  await prisma.source.updateMany({ data: { enabled: false } });

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
  }
  for (const s of sources) {
    await prisma.source.upsert({
      where: { type_url: { type: s.type, url: s.url ?? "" } },
      update: { name: s.name, category: s.category, weight: s.weight, enabled: true },
      create: { ...s },
    });
  }
  console.log(`Seeded ${categories.length} categories and ${sources.length} India-first sources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
