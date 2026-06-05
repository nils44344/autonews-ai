// Seed Startup Radar — 12 AI startups worth watching. Curated for India
// relevance + Western breakouts that affect Indian builders.
import { prisma } from "../src/lib/db";

type Stage = "PRESEED" | "SEED" | "SERIES_A" | "SERIES_B" | "SERIES_C_PLUS" | "PUBLIC" | "ACQUIRED" | "BOOTSTRAPPED";

const seeds: {
  slug: string;
  name: string;
  url: string;
  tagline: string;
  description: string;
  whyItMatters: string;
  category: string;
  hq: string;
  founded: number;
  stage: Stage;
  totalRaisedUsd: number;
  lastRoundUsd?: number;
  investors: string[];
  signals: { label: string; value: string; direction: "up" | "down" | "flat" }[];
  momentumScore: number;
  isBreakout: boolean;
  keywords: string[];
}[] = [
  { slug: "anthropic", name: "Anthropic", url: "https://anthropic.com",
    tagline: "Maker of Claude — the model leading on coding and long-form reasoning.",
    description: "Founded by former OpenAI researchers. Claude family powers Cursor, Lovable, and most serious AI dev workflows.",
    whyItMatters: "If you build with AI, Anthropic's product roadmap shapes yours. Claude's coding lead has pulled developers from GPT in 2025-26.",
    category: "foundation-model", hq: "San Francisco, USA", founded: 2021, stage: "SERIES_C_PLUS",
    totalRaisedUsd: 18000, lastRoundUsd: 4000,
    investors: ["Google", "Amazon", "Spark Capital", "Lightspeed"],
    signals: [{ label: "API revenue YoY", value: "+340%", direction: "up" }, { label: "Coding benchmark rank", value: "#1", direction: "up" }],
    momentumScore: 96, isBreakout: false,
    keywords: ["anthropic", "claude"] },

  { slug: "openai", name: "OpenAI", url: "https://openai.com",
    tagline: "GPT-5 family + ChatGPT — the default AI for billions.",
    description: "The single most distributed AI brand. ChatGPT has 800M+ weekly users.",
    whyItMatters: "OpenAI's app store + custom GPTs remain the largest AI distribution channel. Any product that runs there gets reach competitors can't match.",
    category: "foundation-model", hq: "San Francisco, USA", founded: 2015, stage: "SERIES_C_PLUS",
    totalRaisedUsd: 60000,
    investors: ["Microsoft", "Sequoia", "Khosla", "Thrive"],
    signals: [{ label: "Weekly users", value: "800M+", direction: "up" }],
    momentumScore: 94, isBreakout: false,
    keywords: ["openai", "chatgpt", "gpt-5"] },

  { slug: "anysphere", name: "Anysphere (Cursor)", url: "https://cursor.com",
    tagline: "Cursor — the AI-native code editor that overtook VS Code among AI builders.",
    description: "VS Code fork rebuilt around AI. Composer + Agent mode are the de-facto standard for AI-assisted dev.",
    whyItMatters: "Captured the editor market in 18 months. Every JD that mentions 'AI dev tools' lists Cursor first.",
    category: "dev-tools", hq: "San Francisco, USA", founded: 2022, stage: "SERIES_B",
    totalRaisedUsd: 175, lastRoundUsd: 100,
    investors: ["Andreessen Horowitz", "Thrive", "Benchmark"],
    signals: [{ label: "ARR", value: "$200M+", direction: "up" }, { label: "Paid users YoY", value: "+500%", direction: "up" }],
    momentumScore: 95, isBreakout: true,
    keywords: ["cursor", "anysphere"] },

  { slug: "vapi", name: "Vapi", url: "https://vapi.ai",
    tagline: "Voice agent infrastructure — the Twilio for AI calls.",
    description: "Lets developers spin up voice agents in minutes. Handles ASR, TTS, LLM, telephony.",
    whyItMatters: "Powers most voice-AI startups launched in 2025-26, including Indian SaaS targeting clinics and coaching centers.",
    category: "voice-ai", hq: "San Francisco, USA", founded: 2022, stage: "SERIES_A",
    totalRaisedUsd: 25, lastRoundUsd: 20,
    investors: ["Bessemer", "Y Combinator"],
    signals: [{ label: "ARR YoY", value: "+1100%", direction: "up" }],
    momentumScore: 93, isBreakout: true,
    keywords: ["vapi", "voice agent"] },

  { slug: "sarvam-ai", name: "Sarvam AI", url: "https://www.sarvam.ai",
    tagline: "India-native LLM and voice — Hindi + regional language leader.",
    description: "Founded by former IIT/Microsoft researchers. Models tuned for Indian-language understanding + voice. Backed by Lightspeed + Khosla + Peak XV.",
    whyItMatters: "If India is your market, English-only models miss 90% of users. Sarvam is the most production-ready Indic option in 2026.",
    category: "india-ai", hq: "Bangalore, India", founded: 2023, stage: "SERIES_A",
    totalRaisedUsd: 41, lastRoundUsd: 41,
    investors: ["Lightspeed", "Peak XV", "Khosla Ventures"],
    signals: [{ label: "Government deployments", value: "3+", direction: "up" }, { label: "Open-weight downloads", value: "rising", direction: "up" }],
    momentumScore: 86, isBreakout: true,
    keywords: ["sarvam", "indic ai"] },

  { slug: "perplexity", name: "Perplexity", url: "https://perplexity.ai",
    tagline: "AI search engine with inline citations — Google's biggest threat.",
    description: "Combines GPT/Claude/Gemini with real-time web search. Spaces and Comet (browser) extending the product into deeper workflows.",
    whyItMatters: "Search is the most valuable real-estate on the web. Perplexity's brand has crossed the threshold where people say 'perplex it' instead of 'google it'.",
    category: "search", hq: "San Francisco, USA", founded: 2022, stage: "SERIES_C_PLUS",
    totalRaisedUsd: 900, lastRoundUsd: 500,
    investors: ["Nvidia", "Jeff Bezos", "IVP", "NEA"],
    signals: [{ label: "Monthly queries", value: "300M+", direction: "up" }],
    momentumScore: 88, isBreakout: false,
    keywords: ["perplexity", "ai search"] },

  { slug: "elevenlabs", name: "ElevenLabs", url: "https://elevenlabs.io",
    tagline: "Most natural AI voice — the standard for production audio.",
    description: "Voice cloning + multilingual TTS. Used by Spotify, Audible, and every faceless YouTuber.",
    whyItMatters: "Voice is the next interface. ElevenLabs is the picks-and-shovels play for that shift.",
    category: "voice-ai", hq: "London, UK", founded: 2022, stage: "SERIES_C_PLUS",
    totalRaisedUsd: 280, lastRoundUsd: 180,
    investors: ["Andreessen Horowitz", "ICONIQ", "Sequoia"],
    signals: [{ label: "Languages supported", value: "32+", direction: "up" }],
    momentumScore: 89, isBreakout: false,
    keywords: ["elevenlabs"] },

  { slug: "lovable", name: "Lovable", url: "https://lovable.dev",
    tagline: "Prompt-to-app generator going viral with indie founders.",
    description: "Turns prompts into deployable React+Tailwind+Supabase apps. Hit $20M ARR faster than any AI tool on record.",
    whyItMatters: "Lowest barrier between idea and shipped product in 2026. Pushed the meta from 'AI helps me code' to 'AI ships the app'.",
    category: "no-code-ai", hq: "Stockholm, Sweden", founded: 2023, stage: "SERIES_A",
    totalRaisedUsd: 22, lastRoundUsd: 15,
    investors: ["Creandum", "byFounders"],
    signals: [{ label: "ARR growth", value: "0 to $20M in 8 months", direction: "up" }],
    momentumScore: 95, isBreakout: true,
    keywords: ["lovable"] },

  { slug: "krutrim", name: "Krutrim", url: "https://www.olakrutrim.com",
    tagline: "India's homegrown LLM bid backed by Ola.",
    description: "Multi-language Indian LLM and infra play. Built consumer chat + API. India's first AI unicorn (paper valuation).",
    whyItMatters: "Has the distribution muscle (Ola ecosystem) that Sarvam lacks. Execution is the question; the bet is huge.",
    category: "india-ai", hq: "Bangalore, India", founded: 2023, stage: "SERIES_A",
    totalRaisedUsd: 50, lastRoundUsd: 50,
    investors: ["Matrix Partners", "Bhavish Aggarwal"],
    signals: [{ label: "Indian language coverage", value: "10+", direction: "up" }],
    momentumScore: 70, isBreakout: false,
    keywords: ["krutrim", "ola ai"] },

  { slug: "groq", name: "Groq", url: "https://groq.com",
    tagline: "Custom inference chips delivering the fastest LLM tokens/sec.",
    description: "LPU silicon + free-tier API has made Groq the home of fast inference. Used by countless AI builders for low-latency apps.",
    whyItMatters: "Latency is the next AI battleground after intelligence. Groq + Cerebras force the entire inference market to get cheaper.",
    category: "infra", hq: "Mountain View, USA", founded: 2016, stage: "SERIES_C_PLUS",
    totalRaisedUsd: 1000, lastRoundUsd: 640,
    investors: ["BlackRock", "Cisco", "Samsung Catalyst"],
    signals: [{ label: "Free-tier dev signups", value: "1M+", direction: "up" }],
    momentumScore: 88, isBreakout: false,
    keywords: ["groq", "lpu"] },

  { slug: "anthropic-cline", name: "Cline (autonomous-coding)", url: "https://github.com/cline/cline",
    tagline: "Open-source coding agent — VS Code extension competing with Cursor's Composer.",
    description: "Free + open-source coding agent. Runs in any LLM you provide credentials for. Fast follower to Cursor's agent flow.",
    whyItMatters: "Open-source AI dev tools are catching up with paid SaaS. Cline's growth signals where the dev market settles long-term.",
    category: "dev-tools", hq: "Distributed", founded: 2024, stage: "BOOTSTRAPPED",
    totalRaisedUsd: 0,
    investors: [],
    signals: [{ label: "GitHub stars", value: "30k+", direction: "up" }],
    momentumScore: 80, isBreakout: true,
    keywords: ["cline", "open source coding agent"] },

  { slug: "yral", name: "Yral", url: "https://yral.com",
    tagline: "India's AI-powered short-video platform betting on creator monetization.",
    description: "AI-driven discovery + creator economy short-video. Built by Dfinity team in India.",
    whyItMatters: "If India produces an Instagram-Reels alternative this cycle, it'll have AI baked into discovery from day one. Yral is the leading attempt.",
    category: "consumer-ai", hq: "Bangalore, India", founded: 2022, stage: "SEED",
    totalRaisedUsd: 6, lastRoundUsd: 5,
    investors: ["Founder collective"],
    signals: [{ label: "MAU YoY", value: "+200%", direction: "up" }],
    momentumScore: 68, isBreakout: false,
    keywords: ["yral", "india short video"] },
];

async function main() {
  console.log(`Seeding ${seeds.length} startups…`);
  for (const s of seeds) {
    const row = await prisma.startup.upsert({
      where: { slug: s.slug },
      create: { ...s, status: "PUBLISHED", publishedAt: new Date(),
        seoTitle: `${s.name} — ${s.tagline}`, seoDescription: s.tagline },
      update: { ...s, status: "PUBLISHED" },
    });
    console.log(`  ✓ ${row.slug}`);
  }
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
