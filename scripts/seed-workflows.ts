// Seed AI Workflows — practical, replicable stacks. Each one shows tools used,
// steps, expected results, and time saved. Retention engine per the vision doc.
import { prisma } from "../src/lib/db";

type Kind = "CREATOR" | "BUSINESS" | "AUTOMATION" | "DEVELOPER" | "MARKETING" | "TRADING" | "RESEARCH";

const seeds: {
  slug: string;
  title: string;
  kind: Kind;
  objective: string;
  toolsRequired: { name: string; url?: string; role: string }[];
  steps: { title: string; detail: string }[];
  expectedResults: string;
  timeSavedHours: number;
  difficultyScore: number;
  popularityScore: number;
  keywords: string[];
}[] = [
  {
    slug: "daily-faceless-youtube-pipeline",
    title: "Daily faceless YouTube video pipeline (script → upload in 90 min)",
    kind: "CREATOR",
    objective: "Ship one fully edited faceless YouTube video per day from a single operator using AI for script, voiceover, B-roll, and thumbnail.",
    toolsRequired: [
      { name: "Claude", url: "https://claude.ai", role: "Script + hook generation" },
      { name: "ElevenLabs", url: "https://elevenlabs.io", role: "Voiceover" },
      { name: "Pexels", url: "https://pexels.com", role: "Stock B-roll" },
      { name: "CapCut", url: "https://www.capcut.com", role: "Editing" },
      { name: "Ideogram", url: "https://ideogram.ai", role: "Thumbnails with text" },
    ],
    steps: [
      { title: "Topic selection (5 min)", detail: "Pull a high-CPM topic from your content calendar. Validate against current YouTube trending." },
      { title: "Script in Claude (15 min)", detail: "Use a tested prompt template: hook → 3 sections → CTA. Target 1100 words for a 7-minute video." },
      { title: "Voiceover (10 min)", detail: "Paste into ElevenLabs. Pick the same voice every time for brand consistency." },
      { title: "B-roll collection (15 min)", detail: "Search Pexels by section keywords. Download 25-30 clips." },
      { title: "Edit + cut (30 min)", detail: "CapCut: drag voiceover onto timeline, cut B-roll to match every 2-4 seconds." },
      { title: "Thumbnail (10 min)", detail: "Generate 3 with Ideogram, A/B once a week." },
      { title: "Upload + describe (5 min)", detail: "Title from hook, description from Claude SEO prompt." },
    ],
    expectedResults: "1 video/day, 30 days = 30 videos. AdSense at 1k subs, affiliate revenue from day 1 if you pick a high-CPM niche (finance, tech, real estate).",
    timeSavedHours: 4.5,
    difficultyScore: 35,
    popularityScore: 88,
    keywords: ["faceless youtube", "ai content pipeline"],
  },
  {
    slug: "cold-outbound-with-ai-personalization",
    title: "AI-personalized cold outbound at 5x reply rate",
    kind: "MARKETING",
    objective: "Run 500-lead cold campaigns weekly with personalized first lines based on each lead's LinkedIn, hitting 5-8% reply rates instead of 1-2%.",
    toolsRequired: [
      { name: "Apollo / Lemlist", role: "Lead sourcing + sequence sending" },
      { name: "Apify", url: "https://apify.com", role: "LinkedIn scraping" },
      { name: "Claude or GPT-4o", role: "Personalized first-line generation" },
      { name: "Google Sheets", role: "Mid-pipeline review" },
    ],
    steps: [
      { title: "Build the list", detail: "Export 500 ICP leads from Apollo. Include LinkedIn URL." },
      { title: "Scrape LinkedIn About + last 3 posts", detail: "Use Apify's LinkedIn scraper. Pull About, headline, last 3 post titles." },
      { title: "Generate personalized openers", detail: "Send each row to GPT-4o with a strict prompt: 'In 1 sentence, react to one specific thing about this person. No flattery, no compliments.'" },
      { title: "Review 10% sample by hand", detail: "Spot-check 50 rows. Keep tone consistent." },
      { title: "Load into sequence tool", detail: "Personalized line goes in {{custom1}}. Rest of email is templated." },
      { title: "Send 50/day per inbox", detail: "Stay under deliverability thresholds. Use multiple inboxes if scaling." },
    ],
    expectedResults: "Reply rates from 1-2% baseline → 5-8%. For a B2B SaaS, that's a 3-4x increase in pipeline per dollar.",
    timeSavedHours: 6,
    difficultyScore: 50,
    popularityScore: 82,
    keywords: ["cold outbound", "ai personalization"],
  },
  {
    slug: "weekly-newsletter-via-ai-curation",
    title: "AI-curated weekly newsletter shipped in 45 min",
    kind: "CREATOR",
    objective: "Ship a high-signal weekly newsletter in under 1 hour by using AI to filter, synthesize, and draft from a fixed source list.",
    toolsRequired: [
      { name: "Beehiiv", url: "https://www.beehiiv.com", role: "Hosting + monetization" },
      { name: "Feedbin / Inoreader", role: "RSS reader" },
      { name: "Claude", role: "Synthesis + drafting" },
      { name: "Notion", role: "Editorial pipeline" },
    ],
    steps: [
      { title: "Source list (one-time)", detail: "Pick 25-40 sources: HN, ProductHunt, sub-Twitter lists, 5 niche newsletters." },
      { title: "Weekly scan (15 min)", detail: "Open RSS, star 12-20 stories that matter for YOUR niche." },
      { title: "Synthesize with Claude (15 min)", detail: "Paste headlines + summaries. Prompt: 'Pick the 5 most important. For each, write 2-3 sentences in our voice.'" },
      { title: "Human polish (10 min)", detail: "Edit for voice, add a personal opener, write the subject line." },
      { title: "Send (5 min)", detail: "Push from Beehiiv. Schedule for your audience's open window." },
    ],
    expectedResults: "Save 4+ hours/week. Newsletter audience grows organically when each issue is genuinely high-signal vs spam.",
    timeSavedHours: 4,
    difficultyScore: 25,
    popularityScore: 80,
    keywords: ["ai newsletter", "beehiiv"],
  },
  {
    slug: "client-mvp-in-a-weekend",
    title: "Ship a client MVP in a weekend with Lovable + Claude",
    kind: "DEVELOPER",
    objective: "Take a client requirement → deployed working MVP in 2 days for ₹50k-₹1L, mostly using prompt-driven generation.",
    toolsRequired: [
      { name: "Lovable", url: "https://lovable.dev", role: "Prompt-to-app generation" },
      { name: "Claude", role: "Refining prompts + code review" },
      { name: "Supabase", role: "Auth + database" },
      { name: "Razorpay / Stripe", role: "Payments if needed" },
      { name: "Vercel", role: "Deployment" },
    ],
    steps: [
      { title: "1-page spec with the client", detail: "Pin down: who uses it, what they do, what they pay for. Get in writing." },
      { title: "Lovable prompt v1 (Day 1 morning)", detail: "Describe the app in 3 paragraphs + 5 pages. Iterate the prompt until the shell works." },
      { title: "Supabase wiring (Day 1 afternoon)", detail: "Add auth, schema, RLS policies. Have Claude generate the SQL." },
      { title: "Polish + payments (Day 2 morning)", detail: "Brand it. Add Razorpay if needed. Ensure mobile works." },
      { title: "Deploy + handover (Day 2 afternoon)", detail: "Push to Vercel. Record a Loom walkthrough for the client." },
    ],
    expectedResults: "Project rates ₹50k-₹1L for what used to take 2 weeks. Margin per hour 5-10x.",
    timeSavedHours: 40,
    difficultyScore: 55,
    popularityScore: 86,
    keywords: ["lovable", "ai mvp", "ai agency"],
  },
  {
    slug: "twitter-x-content-engine",
    title: "Daily X/Twitter content engine (10 posts/day from 1 hour)",
    kind: "MARKETING",
    objective: "Run a high-output X account by AI-drafting from your own raw notes + competitor analysis, polishing only the openers and closers.",
    toolsRequired: [
      { name: "Claude or GPT-4o", role: "Draft generation" },
      { name: "Typefully", role: "Scheduling" },
      { name: "Tweet Hunter / Vista Social", role: "Competitor & swipe library" },
    ],
    steps: [
      { title: "Capture raw thoughts (10 min)", detail: "Voice-note 5-7 things you actually believe about your niche today." },
      { title: "AI expand each (15 min)", detail: "Give Claude voice notes + 10 examples of your past best tweets. Ask for 2 variants per thought." },
      { title: "Polish openers + hooks (20 min)", detail: "Only humans write the first line and the punchline. AI handles the middle." },
      { title: "Schedule via Typefully (10 min)", detail: "Spread 10 posts across the day, 2 threads, 8 single posts." },
    ],
    expectedResults: "5-10x output without losing voice. Hardest part is the voice-note discipline, not the AI step.",
    timeSavedHours: 8,
    difficultyScore: 40,
    popularityScore: 78,
    keywords: ["x content", "twitter ai"],
  },
  {
    slug: "ai-voice-agent-for-appointments",
    title: "Build an AI voice agent for appointment booking in 2 days",
    kind: "AUTOMATION",
    objective: "Stand up a working English+Hindi voice agent that books appointments and answers FAQs for a clinic/coaching center in 2 days.",
    toolsRequired: [
      { name: "Vapi", url: "https://vapi.ai", role: "Voice agent platform" },
      { name: "GPT-4o or Claude", role: "Conversation brain" },
      { name: "Google Calendar / Calendly API", role: "Slot management" },
      { name: "Twilio", role: "Phone number" },
    ],
    steps: [
      { title: "Define call flows", detail: "Map 4-5 scripted scenarios: new patient, returning, reschedule, FAQ, escalate." },
      { title: "Create Vapi assistant", detail: "Set voice, model, system prompt, max duration. Add function-calling for calendar." },
      { title: "Wire calendar function", detail: "Vapi calls a webhook → looks up slots → returns 3 options to the caller." },
      { title: "Hindi tuning", detail: "Use ElevenLabs Hindi voice or Sarvam. Test 20 calls; tune prompt for natural code-switching." },
      { title: "Buy + connect Twilio number", detail: "Forward client's existing line during off-hours." },
      { title: "Soft launch + monitor", detail: "First week: read every transcript. Adjust prompt + add edge cases." },
    ],
    expectedResults: "Client converts a ₹15-25k/month receptionist cost into a ₹3-5k/month SaaS while capturing 30-40% more after-hours calls.",
    timeSavedHours: 16,
    difficultyScore: 70,
    popularityScore: 84,
    keywords: ["vapi", "voice agent", "appointment booking"],
  },
  {
    slug: "research-deep-dives-with-claude-projects",
    title: "1-hour deep research dives using Claude Projects + Perplexity",
    kind: "RESEARCH",
    objective: "Produce investor-grade research on any niche company or market in under an hour by stacking Perplexity + Claude Projects.",
    toolsRequired: [
      { name: "Perplexity Pro", role: "Live web research with citations" },
      { name: "Claude Projects", role: "Synthesis with persistent context" },
      { name: "Notion or Google Doc", role: "Final write-up" },
    ],
    steps: [
      { title: "Define the question crisply (5 min)", detail: "Write it down in 1 sentence. If you can't, you don't know what you're researching." },
      { title: "Perplexity sweep (20 min)", detail: "Ask 8-10 increasingly specific questions. Save citations and key paragraphs to a doc." },
      { title: "Drop into Claude Project (5 min)", detail: "Create a Project. Upload your notes + competitor URLs as Project Knowledge." },
      { title: "Claude synthesis (15 min)", detail: "Ask Claude to draft the memo. Iterate: 'now make Section 2 sharper', 'add risks', 'find counterevidence'." },
      { title: "Final pass (15 min)", detail: "You edit for voice and judgment. AI never wins on judgment." },
    ],
    expectedResults: "1-hour research outputs that rival what used to take a junior analyst a full day.",
    timeSavedHours: 6,
    difficultyScore: 30,
    popularityScore: 84,
    keywords: ["claude projects", "ai research"],
  },
  {
    slug: "auto-tagging-and-internal-linking-for-cms",
    title: "Auto-tag + internal-link 1000 old posts in an afternoon",
    kind: "MARKETING",
    objective: "Pull SEO juice out of an existing content backlog by AI-tagging every post and adding contextual internal links.",
    toolsRequired: [
      { name: "GPT-4o", role: "Tag + link suggestion" },
      { name: "Your CMS API", role: "Read + write posts" },
      { name: "Python or Node script", role: "Batch processing" },
    ],
    steps: [
      { title: "Export all posts (title + body)", detail: "Pull as CSV or JSON. Strip HTML to plain text for the prompt." },
      { title: "Generate canonical tag list", detail: "Have GPT-4o cluster topics across the corpus → 30-50 tags." },
      { title: "Assign tags to each post", detail: "For each post: prompt → 3-5 best tags from canonical list. Cost ~$0.005/post." },
      { title: "Suggest internal links", detail: "For each post: 'pick 3 other posts most relevant; suggest natural anchor text'." },
      { title: "Write back to CMS", detail: "Bulk-update. Re-submit sitemap to Google." },
    ],
    expectedResults: "10-30% lift in organic traffic over 60 days from improved topical clustering and internal-link density.",
    timeSavedHours: 30,
    difficultyScore: 55,
    popularityScore: 76,
    keywords: ["seo automation", "internal linking"],
  },
];

async function main() {
  console.log(`Seeding ${seeds.length} workflows…`);
  for (const s of seeds) {
    const row = await prisma.workflow.upsert({
      where: { slug: s.slug },
      create: { ...s, status: "PUBLISHED", publishedAt: new Date(),
        seoTitle: s.title, seoDescription: s.objective.slice(0, 160) },
      update: { ...s, status: "PUBLISHED" },
    });
    console.log(`  ✓ ${row.slug}`);
  }
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
