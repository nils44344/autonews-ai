// Seed the first batch of AI Opportunities. Hand-curated, India-aware, and
// chosen to demonstrate range across the OpportunityKind taxonomy. Re-runnable
// (upsert on slug). This populates Pillar 1 so the page isn't empty on launch
// and so Google has real content to index on day one.
import { prisma } from "../src/lib/db";
import { computeOpportunityScore } from "../src/lib/opportunity-score";

interface Seed {
  slug: string;
  title: string;
  kind:
    | "BUSINESS"
    | "STARTUP"
    | "AUTOMATION"
    | "CREATOR"
    | "AGENCY"
    | "NICHE"
    | "MONETIZATION";
  summary: string;
  whyItMatters: string;
  marketContext?: string;
  implementation?: string;
  monetizationPaths: { path: string; model?: string; revenueRange?: string }[];
  recommendedTools: { name: string; url?: string; why?: string }[];
  demandScore: number;
  growthScore: number;
  competitionScore: number;
  monetizationScore: number;
  difficultyScore: number;
  keywords: string[];
}

const seeds: Seed[] = [
  {
    slug: "ai-newsletter-for-indian-smbs",
    title: "AI-powered newsletter for Indian SMBs",
    kind: "BUSINESS",
    summary:
      "A daily 5-minute briefing that translates global AI news into practical, India-relevant actions for small business owners. Curated by AI, edited by humans. Subscription + sponsorship model.",
    whyItMatters:
      "India has 64 million SMBs but almost none of them read TechCrunch or The Information. They need AI translated into 'what does this mean for my kirana / clinic / coaching class on Monday morning?' The gap is huge, the audience is buying, and Substack/Beehiiv make the infrastructure free.",
    marketContext:
      "Beehiiv newsletters in the SMB space routinely cross 50k subscribers in 12 months with $5k+ MRR via sponsorships. India's MSME-focused content market is dominated by generic finance creators — almost none specialise in AI utility.",
    implementation:
      "1. Pick one vertical (retail, healthcare, coaching). 2. Set up a Beehiiv newsletter. 3. Use ChatGPT + Claude to draft daily briefs from a fixed source list (Hacker News, ProductHunt, AI newsletters). 4. Human edits + India-fies in 30 minutes. 5. Grow via LinkedIn + Twitter + WhatsApp broadcast. 6. Monetize via tool sponsorships ($200-2000 per slot) and a paid tier ($5/month) after 1k subs.",
    monetizationPaths: [
      { path: "Sponsored slots in newsletter", model: "Per-issue ads", revenueRange: "$200 – $2,000 / slot" },
      { path: "Paid premium tier", model: "$5/month subscription", revenueRange: "$2k – $20k MRR at scale" },
      { path: "Affiliate links to AI tools", model: "Recurring revenue share", revenueRange: "$500 – $5k / month" },
    ],
    recommendedTools: [
      { name: "Beehiiv", url: "https://www.beehiiv.com", why: "Best newsletter platform for growth + monetization (built-in ads)" },
      { name: "ChatGPT", url: "https://chat.openai.com", why: "Fast drafting + India context tuning" },
      { name: "Notion", url: "https://www.notion.so", why: "Editorial pipeline" },
    ],
    demandScore: 82,
    growthScore: 88,
    competitionScore: 25,
    monetizationScore: 75,
    difficultyScore: 35,
    keywords: ["AI newsletter", "SMB India", "Beehiiv", "AI for small business"],
  },
  {
    slug: "ai-voice-agents-for-indian-clinics",
    title: "AI voice agents for Indian doctor clinics",
    kind: "STARTUP",
    summary:
      "Vapi/Retell-style multilingual AI voice receptionists that handle appointment booking, reminders, and FAQs in Hindi + 5 regional languages for India's 1M+ independent clinics. Per-clinic SaaS at ₹2,000-5,000/month.",
    whyItMatters:
      "Independent clinics in India lose 30-40% of calls outside hours and pay receptionists ₹15k-25k/month. AI voice has crossed the quality threshold in English; Hindi/Tamil/Telugu are catching up fast. First mover with Indian-language tuning + billing/EMR integrations wins a massive long-tail market the West won't touch.",
    marketContext:
      "Vapi raised $20M at a $130M valuation in 2025 for English-only voice agents. India has 1.2M registered allopathic doctors plus dental/ayurvedic. ARPU of ₹3000/month × even 1% penetration = $4M+ ARR.",
    implementation:
      "1. White-label Vapi or Retell as the underlying voice engine. 2. Build the appointment-booking + EMR-lookup function calls. 3. Tune the voice/prompts for Hindi-first interactions. 4. Sell to 10 clinics in one city via a doctor-network introducer. 5. Charge ₹2,000 setup + ₹3,000/month. Scale via medical associations.",
    monetizationPaths: [
      { path: "Per-clinic SaaS", model: "Monthly subscription", revenueRange: "₹2k – ₹10k / clinic / mo" },
      { path: "Setup + integration fees", model: "One-time", revenueRange: "₹5k – ₹25k / clinic" },
      { path: "Pay-per-minute overage", model: "Usage-based", revenueRange: "₹2 – ₹5 / min" },
    ],
    recommendedTools: [
      { name: "Vapi", url: "https://vapi.ai", why: "Production-ready voice agent infra; you focus on Indian-language prompts + integrations" },
      { name: "Retell AI", url: "https://www.retellai.com", why: "Alternative to Vapi with lower per-min pricing" },
      { name: "Sarvam AI", url: "https://www.sarvam.ai", why: "India-native LLM/voice for Hindi + regional languages" },
    ],
    demandScore: 78,
    growthScore: 92,
    competitionScore: 30,
    monetizationScore: 85,
    difficultyScore: 70,
    keywords: ["AI voice agent", "Vapi", "Retell", "clinic SaaS India", "AI receptionist"],
  },
  {
    slug: "n8n-automation-agency-india",
    title: "n8n / Make automation agency for Indian businesses",
    kind: "AGENCY",
    summary:
      "Productized service: install AI-powered automations (lead routing, invoice extraction, WhatsApp follow-ups) for D2C and SaaS companies. ₹50k-₹2L per project. Recurring retainer for maintenance.",
    whyItMatters:
      "Every founder wants 'AI in our workflow' but doesn't know what to automate. n8n + GPT + Claude APIs are now mature enough that a single operator can deliver real automation value in days. India has thousands of D2C brands that would pay ₹50k for a working WhatsApp-Shopify-CRM AI flow.",
    marketContext:
      "n8n's GitHub stars 4xed in 2025. Western automation agencies (Make Heroes, Zapier Certified Experts) charge $5k-$50k per build. India pricing is 1/3 of West but volume is 10x.",
    implementation:
      "1. Spend 2 weeks mastering n8n + OpenAI function calling. 2. Build 3 demo automations (lead-to-CRM-to-WhatsApp, invoice-to-Zoho, support-ticket-triage). 3. Cold-DM 100 D2C founders on LinkedIn with a Loom of one demo. 4. Charge ₹50k for the first 5 clients to build case studies. 5. Add ₹10k/month retainers for monitoring + tweaks.",
    monetizationPaths: [
      { path: "Per-project build fees", model: "Fixed scope", revenueRange: "₹50k – ₹3L / project" },
      { path: "Monthly retainer", model: "Maintenance + improvements", revenueRange: "₹10k – ₹50k / mo / client" },
      { path: "Productized templates", model: "Sell prebuilt flows", revenueRange: "₹5k – ₹25k / template" },
    ],
    recommendedTools: [
      { name: "n8n", url: "https://n8n.io", why: "Self-hostable workflow engine; cheaper than Zapier for clients at scale" },
      { name: "Make.com", url: "https://www.make.com", why: "Better for clients who want a managed platform" },
      { name: "OpenAI API", url: "https://platform.openai.com", why: "GPT-4o for the AI nodes inside automations" },
    ],
    demandScore: 85,
    growthScore: 80,
    competitionScore: 45,
    monetizationScore: 78,
    difficultyScore: 40,
    keywords: ["n8n agency", "automation agency India", "AI workflow", "Make.com"],
  },
  {
    slug: "ai-faceless-youtube-india-finance",
    title: "Faceless AI YouTube channel: Indian personal finance",
    kind: "CREATOR",
    summary:
      "AI-narrated, stock-footage Indian personal finance channel (mutual funds, tax, NPS, real estate). 1 video/day pipeline using ElevenLabs + scripts from Claude. Monetize via AdSense + affiliate (Zerodha, Groww, ETMoney).",
    whyItMatters:
      "Indian personal finance is the highest-CPM category on Indian YouTube ($3-7 RPM vs $0.50 for entertainment), and audience demand is uncapped — 200M+ first-time investors entered markets post-COVID. AI narration has crossed the 'sounds human' bar. One operator can ship 30 videos/month.",
    marketContext:
      "Channels like 'Pranjal Kamra' and 'Asset Yogi' have crossed 5M subs purely on personal finance. AdSense + affiliate revenue on a 100k-sub Indian finance channel routinely crosses ₹3-5L/month.",
    implementation:
      "1. Pick a narrow niche (tax saving, NPS, REITs). 2. Build a content calendar of 90 evergreen topics. 3. Draft scripts in Claude. 4. Narrate via ElevenLabs Hindi/English voices. 5. Edit with CapCut + Pexels stock + Canva thumbnails. 6. Publish daily. AdSense at 1k subs + Zerodha/Groww affiliate from day 1.",
    monetizationPaths: [
      { path: "YouTube AdSense", model: "RPM-based", revenueRange: "₹3 – ₹7 per 1k views" },
      { path: "Affiliate: broker signups", model: "₹100 – ₹500 / signup", revenueRange: "₹50k – ₹3L / mo at scale" },
      { path: "Sponsored videos", model: "Fintech sponsors", revenueRange: "₹50k – ₹5L / video" },
    ],
    recommendedTools: [
      { name: "ElevenLabs", url: "https://elevenlabs.io", why: "Best AI voice; Hindi + Indian English are usable now" },
      { name: "Claude", url: "https://claude.ai", why: "Best script writing for long-form explanation content" },
      { name: "Pexels + Canva", url: "https://www.pexels.com", why: "Free stock footage + thumbnail design" },
    ],
    demandScore: 80,
    growthScore: 75,
    competitionScore: 55,
    monetizationScore: 82,
    difficultyScore: 45,
    keywords: ["faceless YouTube", "AI YouTube channel", "Indian personal finance", "ElevenLabs"],
  },
  {
    slug: "ai-resume-rewrite-saas-india",
    title: "AI resume rewrite + ATS optimization SaaS for Indian job seekers",
    kind: "STARTUP",
    summary:
      "Upload resume + job description, get an ATS-optimized rewrite tuned to Indian recruiter biases (years of experience, skill ordering, project quantification). ₹99 single, ₹499 unlimited monthly.",
    whyItMatters:
      "India has 12M+ active job seekers at any time. Existing tools (Enhancv, Rezi) are Western-priced ($30/mo) and don't understand Indian resume conventions (objective sections, photo, marital status nuances). A localized version at 1/10 the price taps a massive paying market.",
    marketContext:
      "Naukri's premium tier alone does ₹400+ crore/year. Resume optimization is a known willing-to-pay category. CPMs on 'resume' keyword on Google are ₹150+ — proven commercial intent.",
    implementation:
      "1. Build a Next.js app with PDF upload + GPT-4o resume rewrite. 2. Add ATS score using a simple keyword match algorithm + LLM rubric. 3. Razorpay payments. 4. Launch on r/IndianJobs + LinkedIn + paid Google ads on 'resume builder India'. 5. Add cover-letter + LinkedIn rewrite as upsells.",
    monetizationPaths: [
      { path: "One-time rewrite", model: "Pay-per-use", revenueRange: "₹99 – ₹299 / resume" },
      { path: "Monthly unlimited", model: "Subscription", revenueRange: "₹499 / mo / user" },
      { path: "B2B campus licensing", model: "Per-student bulk", revenueRange: "₹50k – ₹5L / college / yr" },
    ],
    recommendedTools: [
      { name: "OpenAI API", url: "https://platform.openai.com", why: "GPT-4o for rewriting; cost per resume <₹3" },
      { name: "Razorpay", url: "https://razorpay.com", why: "Best Indian payment gateway with UPI" },
      { name: "Next.js + Vercel", url: "https://nextjs.org", why: "Ship the entire app in a weekend" },
    ],
    demandScore: 88,
    growthScore: 70,
    competitionScore: 60,
    monetizationScore: 80,
    difficultyScore: 30,
    keywords: ["AI resume builder India", "ATS optimization", "Naukri alternative"],
  },
  {
    slug: "ai-content-localization-agency",
    title: "AI content localization agency for global SaaS entering India",
    kind: "AGENCY",
    summary:
      "Translate + culturally adapt Western SaaS marketing into Hindi, Tamil, Telugu, Bengali landing pages + ads. AI-first workflow, human polish. ₹2-10 lakh per launch package.",
    whyItMatters:
      "Every Western SaaS now wants India as growth market #1 post-2024. They cannot afford traditional translation agencies (₹15-25 per word × 50k words = ₹10L+ for a single language). AI translation + light human edit cuts cost 80% with comparable quality. The agency that captures this first wins multi-year retainers.",
    marketContext:
      "Stripe, Notion, Linear, Vercel — all expanding India ops in 2025-26. Indian-language internet user growth is 4x English. CMOs at these companies have line items but no clear vendor for AI-assisted localization.",
    implementation:
      "1. Build a translation pipeline (DeepL/GPT-4o + glossary memory + human review). 2. Hire 1 senior reviewer per language from college campuses. 3. Offer 'Hindi landing page package' = ₹2L. 4. Outbound to 50 Western SaaS marketing heads on LinkedIn with a free Hindi version of their hero page as a sample.",
    monetizationPaths: [
      { path: "Per-project packages", model: "Fixed scope", revenueRange: "₹2L – ₹10L / launch" },
      { path: "Retainer for ongoing content", model: "Monthly", revenueRange: "₹50k – ₹3L / mo / client" },
      { path: "Per-word for one-offs", model: "Volume rate", revenueRange: "₹3 – ₹8 / word" },
    ],
    recommendedTools: [
      { name: "DeepL API", url: "https://www.deepl.com/pro-api", why: "Highest-quality translation baseline" },
      { name: "GPT-4o", url: "https://platform.openai.com", why: "Cultural adaptation pass on top of DeepL output" },
      { name: "Crowdin", url: "https://crowdin.com", why: "Translation memory + glossary management" },
    ],
    demandScore: 72,
    growthScore: 85,
    competitionScore: 35,
    monetizationScore: 88,
    difficultyScore: 50,
    keywords: ["AI localization", "Hindi translation agency", "SaaS India localization"],
  },
  {
    slug: "ai-cold-email-warmup-tool",
    title: "AI cold email + LinkedIn outreach personalizer (Indian B2B)",
    kind: "AUTOMATION",
    summary:
      "Upload a list of 500 leads + product description, get hyper-personalized first lines for each based on the lead's LinkedIn/website. ₹2/lead. Integrates with Apollo, Lemlist, Instantly.",
    whyItMatters:
      "Indian B2B SaaS founders run cold outreach at scale but their reply rates are 1-2% because of generic copy. AI personalization triples reply rates. Existing tools (Clay, Lyne.ai) are Western-priced; an Indian alternative at 1/5 the price wins thousands of indie operators.",
    marketContext:
      "Clay raised $40M+ on this exact wedge. Lyne.ai sold for an undisclosed amount. India's outbound B2B market is shifting from manual VAs to AI tooling — perfect timing for a localized, cheaper alternative.",
    implementation:
      "1. Wrap GPT-4o + web scraping (lead's LinkedIn About + last 3 posts → personalized opener). 2. Bulk CSV in, CSV out. 3. Pricing: ₹500 for 250 leads, ₹1500 for 1000. 4. Launch on r/SaaS + IndieHackers + LinkedIn. 5. Add LinkedIn DM personalization as v2.",
    monetizationPaths: [
      { path: "Pay-as-you-go credits", model: "Per-lead", revenueRange: "₹1 – ₹3 / personalized line" },
      { path: "Monthly plan", model: "Flat", revenueRange: "₹2,000 – ₹10,000 / mo" },
      { path: "Agency white-label", model: "Reseller", revenueRange: "₹25k – ₹1L / agency / mo" },
    ],
    recommendedTools: [
      { name: "Apify", url: "https://apify.com", why: "LinkedIn scraping without building your own infra" },
      { name: "OpenAI API", url: "https://platform.openai.com", why: "Personalization engine" },
      { name: "Apollo / Instantly", url: "https://apollo.io", why: "Integration targets — meet customers where they already send" },
    ],
    demandScore: 78,
    growthScore: 82,
    competitionScore: 55,
    monetizationScore: 75,
    difficultyScore: 35,
    keywords: ["cold email AI", "Clay alternative", "AI personalization", "B2B outreach India"],
  },
  {
    slug: "ai-tutor-jee-neet",
    title: "AI tutor for JEE / NEET / UPSC aspirants (vernacular)",
    kind: "STARTUP",
    summary:
      "ChatGPT-style tutor trained on the exact NCERT + previous year question bank for JEE/NEET/UPSC, in Hindi + English. ₹299/month. Group/parent dashboards for tracking.",
    whyItMatters:
      "20M+ Indian students prep for these exams annually. Existing edtech (Byju's, Unacademy) is collapsing under unit economics. A pure-AI tutor at 1/10 the price with infinite patience + vernacular support is a generational opportunity — and now technically feasible.",
    marketContext:
      "Indian edtech imploded 2023-25 but demand didn't go anywhere — it just stopped accepting ₹50k course fees. ChatGPT Plus already has millions of Indian student users despite English-only + no exam tuning. A specialised, cheaper, vernacular product wins.",
    implementation:
      "1. Build a RAG system over NCERT textbooks + 10 years of PYQs. 2. Fine-tune for chain-of-thought solutions (not just answers). 3. Add doubt-image upload (most students photograph problems). 4. Hindi-first UI. 5. Distribute via teacher networks + WhatsApp study groups. 6. Parent dashboard for retention.",
    monetizationPaths: [
      { path: "Student subscription", model: "Monthly", revenueRange: "₹199 – ₹499 / mo" },
      { path: "Annual prep plan", model: "Upfront", revenueRange: "₹2,000 – ₹5,000 / yr" },
      { path: "Coaching institute licensing", model: "B2B per-seat", revenueRange: "₹100 – ₹300 / student / mo" },
    ],
    recommendedTools: [
      { name: "OpenAI / Gemini API", url: "https://platform.openai.com", why: "Foundation model" },
      { name: "Pinecone / Qdrant", url: "https://www.pinecone.io", why: "Vector DB for NCERT RAG" },
      { name: "Razorpay UPI Autopay", url: "https://razorpay.com", why: "Best subscription billing for ₹299 tier in India" },
    ],
    demandScore: 92,
    growthScore: 85,
    competitionScore: 50,
    monetizationScore: 80,
    difficultyScore: 65,
    keywords: ["AI tutor India", "JEE NEET AI", "Byju's alternative", "Hindi tutor"],
  },
];

async function main() {
  console.log(`Seeding ${seeds.length} opportunities…`);
  for (const s of seeds) {
    const score = computeOpportunityScore({
      demandScore: s.demandScore,
      growthScore: s.growthScore,
      competitionScore: s.competitionScore,
      monetizationScore: s.monetizationScore,
      difficultyScore: s.difficultyScore,
    });
    const row = await prisma.opportunity.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        title: s.title,
        kind: s.kind,
        summary: s.summary,
        whyItMatters: s.whyItMatters,
        marketContext: s.marketContext,
        monetizationPaths: s.monetizationPaths,
        recommendedTools: s.recommendedTools,
        demandScore: s.demandScore,
        growthScore: s.growthScore,
        competitionScore: s.competitionScore,
        monetizationScore: s.monetizationScore,
        difficultyScore: s.difficultyScore,
        opportunityScore: score,
        keywords: s.keywords,
        seoTitle: `${s.title} — Opportunity Score ${score.toFixed(0)}`,
        seoDescription: s.summary.slice(0, 160),
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      update: {
        title: s.title,
        kind: s.kind,
        summary: s.summary,
        whyItMatters: s.whyItMatters,
        marketContext: s.marketContext,
        monetizationPaths: s.monetizationPaths,
        recommendedTools: s.recommendedTools,
        demandScore: s.demandScore,
        growthScore: s.growthScore,
        competitionScore: s.competitionScore,
        monetizationScore: s.monetizationScore,
        difficultyScore: s.difficultyScore,
        opportunityScore: score,
        keywords: s.keywords,
        status: "PUBLISHED",
      },
    });
    console.log(`  ✓ ${row.slug}  score=${score.toFixed(1)}`);
  }
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
