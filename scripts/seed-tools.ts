// Seed the AI Tools pillar — 20 curated tools with editorial context. Every
// entry has whyItMatters + a use case, so this is never "just a directory".
import { prisma } from "../src/lib/db";

type Pricing = "FREE" | "FREEMIUM" | "PAID" | "SUBSCRIPTION" | "USAGE" | "ENTERPRISE";

const seeds: {
  slug: string;
  name: string;
  vendor?: string;
  url: string;
  tagline: string;
  overview: string;
  whyItMatters: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  pricing: Pricing;
  pricingNotes?: string;
  categories: string[];
  alternatives: string[];
  popularityScore: number;
  momentumScore: number;
  trendingScore: number;
  ranking: number;
  keywords: string[];
}[] = [
  { slug: "chatgpt", name: "ChatGPT", vendor: "OpenAI", url: "https://chat.openai.com",
    tagline: "The default chatbot — fastest model + biggest ecosystem.",
    overview: "OpenAI's flagship consumer product. GPT-5 family + image, voice, code, and custom GPTs. Best general-purpose assistant; weakest at long-form coding vs Claude.",
    whyItMatters: "Still the default channel of distribution for AI in 2026. Anything that runs on ChatGPT's custom-GPT marketplace gets reach no other tool matches.",
    useCases: ["Drafting + research", "Custom GPTs for niche workflows", "Voice mode for hands-free Q&A"],
    pros: ["Largest plugin/GPT ecosystem", "Strong multimodal", "Fast iteration cycle"],
    cons: ["Coding behind Claude", "Free tier rate-limited", "Memory still uneven"],
    pricing: "FREEMIUM", pricingNotes: "Free; Plus $20/mo; Pro $200/mo",
    categories: ["chat", "writing", "research", "code"],
    alternatives: ["claude", "gemini", "perplexity"],
    popularityScore: 98, momentumScore: 82, trendingScore: 80, ranking: 1,
    keywords: ["chatgpt", "openai", "gpt-5"] },

  { slug: "claude", name: "Claude", vendor: "Anthropic", url: "https://claude.ai",
    tagline: "The best chatbot for serious thinking, writing, and code.",
    overview: "Anthropic's flagship. Claude 4.7 family leads coding benchmarks and long-form reasoning. Artifacts + Projects make it the favorite for builders.",
    whyItMatters: "Default AI for software engineers and serious writers in 2026. If you ship code or long docs, you live in Claude.",
    useCases: ["Writing complex software", "Long-form editorial", "Document analysis"],
    pros: ["Best coding model", "Honest about uncertainty", "Artifacts + Projects"],
    cons: ["Smaller plugin ecosystem than GPT", "Stricter content filtering", "No native image gen"],
    pricing: "FREEMIUM", pricingNotes: "Free; Pro $20/mo; Max $100-200/mo",
    categories: ["chat", "code", "writing", "research"],
    alternatives: ["chatgpt", "gemini", "cursor"],
    popularityScore: 92, momentumScore: 95, trendingScore: 92, ranking: 2,
    keywords: ["claude", "anthropic", "claude 4.7"] },

  { slug: "cursor", name: "Cursor", vendor: "Anysphere", url: "https://cursor.com",
    tagline: "The AI-native code editor that ate VS Code.",
    overview: "VS Code fork rebuilt around AI. Composer, agent mode, and tight tab-complete. Default IDE for AI-assisted dev in 2026.",
    whyItMatters: "If you build software, this is now the editor. Productivity gain over plain VS Code + GPT/Claude is 2-3x for typical product work.",
    useCases: ["Full-app generation", "Refactoring legacy code", "Pair programming"],
    pros: ["Fastest AI editor", "Composer agent mode", "Model-agnostic"],
    cons: ["Privacy concerns for closed source", "Subscription stacks (Cursor + Claude)", "Bugs creep in fast"],
    pricing: "FREEMIUM", pricingNotes: "Free tier; Pro $20/mo",
    categories: ["code", "ide", "dev"],
    alternatives: ["windsurf", "github-copilot", "claude"],
    popularityScore: 88, momentumScore: 92, trendingScore: 90, ranking: 3,
    keywords: ["cursor", "ai code editor", "anysphere"] },

  { slug: "perplexity", name: "Perplexity", vendor: "Perplexity AI", url: "https://www.perplexity.ai",
    tagline: "Cited answers from the live web — Google killer for research.",
    overview: "AI search engine that cites sources inline. Pro models swap between GPT-4o, Claude, Gemini. Spaces let you scope research.",
    whyItMatters: "Captures the 'I need a fast answer with sources' workflow. The closest thing to a Google replacement that doesn't suck.",
    useCases: ["Research with citations", "Competitive analysis", "Live financial / news queries"],
    pros: ["Real-time + cited", "Model choice in Pro", "Spaces for context"],
    cons: ["Hallucinates less but still hallucinates", "Long-form generation behind ChatGPT/Claude", "Mobile app lacks polish"],
    pricing: "FREEMIUM", pricingNotes: "Free; Pro $20/mo",
    categories: ["search", "research", "chat"],
    alternatives: ["chatgpt", "you-com", "claude"],
    popularityScore: 84, momentumScore: 78, trendingScore: 76, ranking: 5,
    keywords: ["perplexity", "ai search"] },

  { slug: "gemini", name: "Gemini", vendor: "Google", url: "https://gemini.google.com",
    tagline: "Google's flagship — 2M token context + native multimodal.",
    overview: "Gemini 2.x family with the biggest context window in production. Tight integration with Workspace + Android. Strong vision and code.",
    whyItMatters: "If you live in Gmail/Docs/Sheets/Drive, Gemini's integration is unmatched. Long context unlocks workflows others can't do.",
    useCases: ["Long-doc analysis", "Workspace automation", "Multimodal data tasks"],
    pros: ["2M+ context", "Workspace integration", "Native video understanding"],
    cons: ["Personality is dry", "Less plugin ecosystem", "Quality variance"],
    pricing: "FREEMIUM", pricingNotes: "Free; AI Pro $19.99/mo",
    categories: ["chat", "research", "workspace"],
    alternatives: ["chatgpt", "claude"],
    popularityScore: 85, momentumScore: 70, trendingScore: 65, ranking: 4,
    keywords: ["gemini", "google ai"] },

  { slug: "elevenlabs", name: "ElevenLabs", url: "https://elevenlabs.io",
    tagline: "Most natural AI voice — the standard for production audio.",
    overview: "Voice cloning + multilingual TTS used by every faceless YouTuber, podcast generator, and AI voice agent platform.",
    whyItMatters: "Voice is the next interface. ElevenLabs sits under every serious voice-AI product. India multilingual support keeps improving.",
    useCases: ["Faceless YouTube narration", "AI voice agents", "Audiobook production"],
    pros: ["Best voice quality", "Strong multilingual (incl. Hindi)", "Voice cloning"],
    cons: ["Expensive at scale", "API rate limits", "Ethical concerns on cloning"],
    pricing: "SUBSCRIPTION", pricingNotes: "$5 starter; $22 Creator; $99 Pro",
    categories: ["voice", "audio", "creator"],
    alternatives: ["openai-tts", "playht", "sarvam"],
    popularityScore: 88, momentumScore: 80, trendingScore: 76, ranking: 6,
    keywords: ["elevenlabs", "ai voice", "tts"] },

  { slug: "midjourney", name: "Midjourney", url: "https://www.midjourney.com",
    tagline: "Best aesthetic image model — still the look you can't fake.",
    overview: "v7 family + new web UI. Style references and Sref codes give a consistent brand look that competitors struggle to match.",
    whyItMatters: "For creators and agencies, Midjourney aesthetic is currency. v7 closed the photorealism gap with Flux while keeping its signature look.",
    useCases: ["Brand visuals", "Concept art", "Editorial illustration"],
    pros: ["Best style consistency", "Sref codes", "Active community"],
    cons: ["No real API", "Subscription only", "Discord legacy still hurts UX"],
    pricing: "SUBSCRIPTION", pricingNotes: "$10 / $30 / $60 / $120 monthly",
    categories: ["image", "creator", "design"],
    alternatives: ["flux", "ideogram", "dalle"],
    popularityScore: 86, momentumScore: 65, trendingScore: 60, ranking: 8,
    keywords: ["midjourney", "ai image"] },

  { slug: "flux", name: "Flux", vendor: "Black Forest Labs", url: "https://blackforestlabs.ai",
    tagline: "Open-source photorealism that overtook Midjourney on benchmarks.",
    overview: "Flux 1.x family — pro and dev variants. Best open-weights image model; runs on Replicate, FAL, and self-hosted.",
    whyItMatters: "For builders who need an image API (not a subscription), Flux is the answer. Powers most new AI image SaaS launched in 2025-26.",
    useCases: ["AI image APIs", "Custom fine-tunes", "On-prem image gen"],
    pros: ["Best open model", "Real API access", "Photorealism leader"],
    cons: ["Less aesthetic than MJ for art", "Compute cost", "No native consumer UI"],
    pricing: "USAGE", pricingNotes: "Per-image via FAL / Replicate (~$0.025+)",
    categories: ["image", "api", "dev"],
    alternatives: ["midjourney", "ideogram", "stable-diffusion"],
    popularityScore: 78, momentumScore: 88, trendingScore: 85, ranking: 7,
    keywords: ["flux", "black forest labs", "open image model"] },

  { slug: "runway", name: "Runway", url: "https://runwayml.com",
    tagline: "Best-in-class AI video — Gen-4 production-grade clips.",
    overview: "Gen-4 image-to-video and text-to-video used by film production, ad agencies, and creators. Tight editing tools alongside generation.",
    whyItMatters: "Video is the next big AI category and Runway leads. Used in real Hollywood + Indian commercial work in 2025-26.",
    useCases: ["Ad creative", "Film pre-viz", "Social video"],
    pros: ["Best video model", "Editing suite included", "Brand-safe outputs"],
    cons: ["Expensive at scale", "Clip length limits", "Coherence still imperfect"],
    pricing: "SUBSCRIPTION", pricingNotes: "$15 to $95/mo + Enterprise",
    categories: ["video", "creator", "design"],
    alternatives: ["pika", "kling", "sora"],
    popularityScore: 82, momentumScore: 80, trendingScore: 78, ranking: 9,
    keywords: ["runway", "ai video"] },

  { slug: "n8n", name: "n8n", url: "https://n8n.io",
    tagline: "Open-source Zapier — the workflow engine of choice for AI builders.",
    overview: "Self-hostable workflow automation with native OpenAI/Anthropic nodes. Used by indie operators and agencies to ship client automations fast.",
    whyItMatters: "Foundation of the AI-automation agency boom. Cheaper than Zapier at scale, more flexible than Make for AI nodes.",
    useCases: ["Lead-to-CRM automation", "AI invoice extraction", "Multi-step agent workflows"],
    pros: ["Self-hostable + free", "AI nodes built-in", "Massive community"],
    cons: ["Steeper learning curve than Zapier", "Self-hosting requires ops", "UI is functional, not pretty"],
    pricing: "FREEMIUM", pricingNotes: "Self-host free; Cloud €20+/mo",
    categories: ["automation", "workflow", "dev"],
    alternatives: ["make", "zapier", "pipedream"],
    popularityScore: 80, momentumScore: 90, trendingScore: 88, ranking: 10,
    keywords: ["n8n", "ai automation", "workflow"] },

  { slug: "vapi", name: "Vapi", url: "https://vapi.ai",
    tagline: "Production-ready voice agents API — the Twilio for AI calls.",
    overview: "Build voice agents that make and take calls. Handles ASR, TTS, LLM orchestration, telephony. The infra layer under most voice-AI startups.",
    whyItMatters: "Voice AI is the fastest-growing AI category in 2026. Vapi removes 90% of the engineering. Indian-language tuning is the wedge for India founders.",
    useCases: ["AI receptionists", "Outbound sales calls", "Appointment booking bots"],
    pros: ["Fast time-to-prod", "Telephony built in", "Model-agnostic"],
    cons: ["Per-minute pricing adds up", "Latency tuning required", "Some languages still weak"],
    pricing: "USAGE", pricingNotes: "$0.05 / min approx",
    categories: ["voice", "api", "agent"],
    alternatives: ["retell", "bland", "sarvam"],
    popularityScore: 72, momentumScore: 95, trendingScore: 92, ranking: 11,
    keywords: ["vapi", "voice agent", "ai phone"] },

  { slug: "retell", name: "Retell AI", url: "https://www.retellai.com",
    tagline: "Cheaper Vapi alternative with conversation-quality edge.",
    overview: "Voice agent platform competing directly with Vapi on price and quality. Sub-300ms latency and excellent interruption handling.",
    whyItMatters: "Picking Vapi vs Retell is the first technical choice every voice-AI founder makes in 2026. Retell wins on conversational feel.",
    useCases: ["Conversational AI receptionists", "Sales qualification calls", "Customer support voice"],
    pros: ["Lower per-min cost", "Strong barge-in handling", "Quick start"],
    cons: ["Smaller integration catalog than Vapi", "Less mature dashboard"],
    pricing: "USAGE", pricingNotes: "Per-minute, scaled discounts",
    categories: ["voice", "api", "agent"],
    alternatives: ["vapi", "bland", "sarvam"],
    popularityScore: 68, momentumScore: 88, trendingScore: 85, ranking: 12,
    keywords: ["retell", "voice agent"] },

  { slug: "lovable", name: "Lovable", url: "https://lovable.dev",
    tagline: "Prompt-to-app generator — ship a full web app from a sentence.",
    overview: "AI app builder that turns prompts into deployable React+Tailwind apps with Supabase backend. Iteration loop is fast enough to prototype in minutes.",
    whyItMatters: "Lowest barrier to AI-shipped products in 2026. Solo founders and agencies use it to ship MVPs for clients in hours, not weeks.",
    useCases: ["Client MVPs", "Internal tools", "Idea validation"],
    pros: ["Real working apps from prompts", "Github + Supabase integration", "Fast iteration"],
    cons: ["Generated code can be messy", "Subscription stacks", "Database design still needs review"],
    pricing: "SUBSCRIPTION", pricingNotes: "$20 to $100/mo",
    categories: ["dev", "no-code", "app-builder"],
    alternatives: ["bolt", "v0", "replit"],
    popularityScore: 75, momentumScore: 92, trendingScore: 90, ranking: 13,
    keywords: ["lovable", "ai app builder"] },

  { slug: "bolt", name: "Bolt", vendor: "StackBlitz", url: "https://bolt.new",
    tagline: "In-browser AI dev environment — instant full-stack from prompt.",
    overview: "WebContainer-powered AI builder. No setup, instant preview. Competes with Lovable + v0 for the prompt-to-app crown.",
    whyItMatters: "Hit 20M ARR in record time. The shift from 'AI helps me code' to 'AI ships the app' starts here.",
    useCases: ["Prototype in minutes", "Demo apps for sales", "Client iterations"],
    pros: ["Zero setup", "Real Node + npm in-browser", "Fast prompt-to-deploy"],
    cons: ["Resource limits", "Auth + DB are extras"],
    pricing: "FREEMIUM", pricingNotes: "Free; Pro $20+/mo",
    categories: ["dev", "app-builder", "no-code"],
    alternatives: ["lovable", "v0", "replit"],
    popularityScore: 78, momentumScore: 90, trendingScore: 88, ranking: 14,
    keywords: ["bolt", "stackblitz", "ai builder"] },

  { slug: "replit", name: "Replit", url: "https://replit.com",
    tagline: "Browser IDE going all-in on AI Agents — Replit Agent ships apps.",
    overview: "Replit Agent + Ghostwriter let you describe an app and have it built + deployed inside Replit. Strong for educators and bootcamps.",
    whyItMatters: "Strong distribution to non-engineers + students. Replit Agent is one of the only end-to-end 'AI ships your app' products at scale.",
    useCases: ["Teaching coding", "Indie SaaS hosting", "Agent-built apps"],
    pros: ["Hosted out-of-the-box", "Education-friendly", "Agent does deploy"],
    cons: ["Performance for big apps", "Cost compounds with usage"],
    pricing: "FREEMIUM", pricingNotes: "Free; Core $20/mo; Teams scales",
    categories: ["dev", "ide", "app-builder"],
    alternatives: ["bolt", "lovable", "cursor"],
    popularityScore: 82, momentumScore: 75, trendingScore: 72, ranking: 15,
    keywords: ["replit", "replit agent"] },

  { slug: "notion-ai", name: "Notion AI", url: "https://www.notion.so/product/ai",
    tagline: "AI inside Notion — the most-used assistant for solo founders.",
    overview: "Q&A across your workspace + writing + automations. Bundled with Notion plans makes it the cheapest 'AI everywhere' option for builders already on Notion.",
    whyItMatters: "Distribution + price. Many users get a 'good enough' Claude/GPT inside their existing tool, lowering need to switch.",
    useCases: ["Doc summarization", "Workspace Q&A", "Project planning"],
    pros: ["Free with Notion Plus+", "Workspace-aware", "Zero learning curve"],
    cons: ["Generic personality", "Not best-in-class quality", "Limited outside Notion"],
    pricing: "SUBSCRIPTION", pricingNotes: "Included with Notion Plus and above",
    categories: ["productivity", "writing", "workspace"],
    alternatives: ["chatgpt", "claude", "gemini"],
    popularityScore: 80, momentumScore: 60, trendingScore: 55, ranking: 18,
    keywords: ["notion ai"] },

  { slug: "sarvam", name: "Sarvam AI", url: "https://www.sarvam.ai",
    tagline: "India-native LLM + voice — Hindi & regional language leader.",
    overview: "Models tuned for Indian languages. Used by Indian voice-agent startups and gov-tech for vernacular AI. Backed by Lightspeed + Khosla.",
    whyItMatters: "If you're building AI for Indian users, English-only models miss the country. Sarvam is the most production-ready Indic option in 2026.",
    useCases: ["Hindi voice agents", "Vernacular chatbots", "Indic content generation"],
    pros: ["Best Indic quality", "Voice + text", "India-aware"],
    cons: ["Smaller ecosystem", "Less ready for niche use cases", "Pricing less transparent"],
    pricing: "USAGE", pricingNotes: "Per-token; contact for plans",
    categories: ["chat", "voice", "india", "api"],
    alternatives: ["openai", "google-gemini", "krutrim"],
    popularityScore: 65, momentumScore: 90, trendingScore: 85, ranking: 16,
    keywords: ["sarvam ai", "indic llm", "hindi ai"] },

  { slug: "beehiiv", name: "Beehiiv", url: "https://www.beehiiv.com",
    tagline: "Newsletter platform built for growth + monetization.",
    overview: "Substack alternative with sponsorship marketplace, referral programs, and analytics built in. Default choice for new monetized newsletters.",
    whyItMatters: "Newsletters are still one of the cleanest paths to revenue for an AI brand. Beehiiv's built-in ad network shortcuts the hardest growth step.",
    useCases: ["Paid newsletters", "AI-curated daily briefs", "Audience-building"],
    pros: ["Built-in monetization", "Strong analytics", "Generous free tier"],
    cons: ["Younger than Substack", "Some integrations limited"],
    pricing: "FREEMIUM", pricingNotes: "Free; Scale $39+/mo",
    categories: ["newsletter", "creator", "monetization"],
    alternatives: ["substack", "ghost", "convertkit"],
    popularityScore: 76, momentumScore: 78, trendingScore: 75, ranking: 19,
    keywords: ["beehiiv", "newsletter platform"] },

  { slug: "windsurf", name: "Windsurf", vendor: "Codeium", url: "https://codeium.com/windsurf",
    tagline: "Cursor competitor with the strongest agent flow.",
    overview: "VS Code-derived AI IDE focused on the 'Cascade' agent model. Strong free tier; popular with developers who want the agent without paying Cursor.",
    whyItMatters: "Real Cursor competitor with a different pricing posture. Picking Cursor vs Windsurf is the new vim vs emacs.",
    useCases: ["Agent-driven dev", "Pair programming", "Codebase Q&A"],
    pros: ["Strong free tier", "Cascade agent", "Snappy UI"],
    cons: ["Smaller community than Cursor", "Some IDE quirks"],
    pricing: "FREEMIUM", pricingNotes: "Free; Pro $15/mo",
    categories: ["code", "ide", "dev"],
    alternatives: ["cursor", "github-copilot"],
    popularityScore: 72, momentumScore: 86, trendingScore: 82, ranking: 17,
    keywords: ["windsurf", "codeium", "ai ide"] },

  { slug: "ideogram", name: "Ideogram", url: "https://ideogram.ai",
    tagline: "AI image model that finally renders text correctly.",
    overview: "Image gen with the best in-image text rendering and aspect-ratio control. Loved for posters, social graphics, and ads.",
    whyItMatters: "If your image needs words on it (and most marketing visuals do), Ideogram is the only model that's reliable in 2026.",
    useCases: ["Social graphics", "Posters with text", "Ad creative"],
    pros: ["Best text-in-image", "Solid free tier", "Fast iterations"],
    cons: ["Aesthetic below MJ", "Smaller style range"],
    pricing: "FREEMIUM", pricingNotes: "Free tier; $8 to $48/mo",
    categories: ["image", "creator", "design"],
    alternatives: ["midjourney", "flux"],
    popularityScore: 70, momentumScore: 82, trendingScore: 78, ranking: 20,
    keywords: ["ideogram", "ai image text"] },
];

async function main() {
  console.log(`Seeding ${seeds.length} tools…`);
  for (const s of seeds) {
    const row = await prisma.tool.upsert({
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
