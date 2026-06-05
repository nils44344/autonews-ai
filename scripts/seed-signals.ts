// Seed AI Signals — the live intelligence feed. Hand-curated for v1; future
// version replaces this with automated scrapers over PH/HN/GitHub/Reddit.
import { prisma } from "../src/lib/db";

type Kind = "LAUNCH" | "FUNDING" | "GROWTH" | "VIRAL_POST" | "RESEARCH" | "HIRING" | "ACQUISITION";

const now = Date.now();
const hAgo = (h: number) => new Date(now - h * 3600_000);

const seeds: {
  slug: string;
  title: string;
  kind: Kind;
  summary: string;
  sourceUrl?: string;
  sourceLabel: string;
  momentumScore: number;
  reachScore: number;
  opportunityScore: number;
  isHot: boolean;
  observedAt: Date;
  toolSlug?: string;
  startupSlug?: string;
  opportunitySlug?: string;
}[] = [
  { slug: "claude-4-7-coding-leadership-confirmed", title: "Claude 4.7 takes #1 across coding benchmarks",
    kind: "RESEARCH", summary: "Independent SWE-Bench reruns show Claude 4.7 leading Cursor + Aider on real-world coding tasks. Locking in Anthropic's developer-segment lead.",
    sourceLabel: "Benchmarks", momentumScore: 92, reachScore: 88, opportunityScore: 78, isHot: true,
    observedAt: hAgo(6), toolSlug: "claude", startupSlug: "anthropic" },
  { slug: "lovable-20m-arr-8-months", title: "Lovable hits $20M ARR in 8 months",
    kind: "GROWTH", summary: "Prompt-to-app builder reaches $20M ARR — fastest growth in AI SaaS this cycle. Validates the 'AI ships your app' meta.",
    sourceLabel: "Founder posts", momentumScore: 96, reachScore: 82, opportunityScore: 90, isHot: true,
    observedAt: hAgo(12), toolSlug: "lovable", startupSlug: "lovable", opportunitySlug: "n8n-automation-agency-india" },
  { slug: "vapi-series-a-20m", title: "Vapi raises $20M Series A from Bessemer",
    kind: "FUNDING", summary: "Voice-agent infrastructure leader closes Series A. Bessemer leads. Signals the voice-AI wave is going from indie to enterprise.",
    sourceLabel: "TechCrunch", momentumScore: 88, reachScore: 78, opportunityScore: 92, isHot: true,
    observedAt: hAgo(24), toolSlug: "vapi", startupSlug: "vapi", opportunitySlug: "ai-voice-agents-for-indian-clinics" },
  { slug: "sarvam-government-tier-deal", title: "Sarvam wins central-government AI tier deal",
    kind: "GROWTH", summary: "Sarvam reportedly contracted for vernacular AI in 3 ministries. India-native model becomes default for government workflows.",
    sourceLabel: "Industry source", momentumScore: 84, reachScore: 70, opportunityScore: 85, isHot: false,
    observedAt: hAgo(40), toolSlug: "sarvam", startupSlug: "sarvam-ai" },
  { slug: "cline-30k-stars", title: "Cline crosses 30k GitHub stars",
    kind: "GROWTH", summary: "Open-source coding-agent extension hits 30k stars. Real fast-follower threat to Cursor's paid agent flow.",
    sourceLabel: "GitHub", momentumScore: 82, reachScore: 68, opportunityScore: 72, isHot: false,
    observedAt: hAgo(48), startupSlug: "anthropic-cline" },
  { slug: "n8n-ai-nodes-go-mainstream", title: "n8n becomes default AI workflow engine",
    kind: "GROWTH", summary: "AI-node usage in n8n quadruples YoY. Cementing n8n's role as the OSS layer under most AI automation agencies.",
    sourceLabel: "Community telemetry", momentumScore: 85, reachScore: 72, opportunityScore: 88, isHot: true,
    observedAt: hAgo(72), toolSlug: "n8n", opportunitySlug: "n8n-automation-agency-india" },
  { slug: "bolt-acquires-quality-engineer", title: "Bolt poaches Vercel senior engineering lead",
    kind: "HIRING", summary: "Strategic hire to ship full agent workflows. Suggests Bolt is investing in catching Lovable on agent quality + reliability.",
    sourceLabel: "LinkedIn", momentumScore: 70, reachScore: 60, opportunityScore: 65, isHot: false,
    observedAt: hAgo(90), toolSlug: "bolt" },
  { slug: "elevenlabs-hindi-quality-jump", title: "ElevenLabs Hindi voice quality crosses production bar",
    kind: "LAUNCH", summary: "ElevenLabs ships a Hindi voice that finally clears the 'sounds human' bar. Indian voice-AI startups can now ship without compromise.",
    sourceLabel: "Vendor announcement", momentumScore: 86, reachScore: 72, opportunityScore: 95, isHot: true,
    observedAt: hAgo(20), toolSlug: "elevenlabs", opportunitySlug: "ai-voice-agents-for-indian-clinics" },
  { slug: "groq-free-tier-1m-devs", title: "Groq crosses 1M free-tier developers",
    kind: "GROWTH", summary: "Free LPU-powered inference API drives Groq past 1M dev signups. Forces incumbents to compete on price + latency.",
    sourceLabel: "Groq blog", momentumScore: 80, reachScore: 78, opportunityScore: 70, isHot: false,
    observedAt: hAgo(56), startupSlug: "groq" },
  { slug: "perplexity-comet-browser-beta", title: "Perplexity Comet browser opens public beta",
    kind: "LAUNCH", summary: "AI-native browser in public beta. Threat to Chrome's tab model — agentic browsing becomes a real consumer category.",
    sourceLabel: "Perplexity", momentumScore: 84, reachScore: 86, opportunityScore: 68, isHot: true,
    observedAt: hAgo(8), toolSlug: "perplexity", startupSlug: "perplexity" },
  { slug: "anthropic-claude-agent-sdk-release", title: "Anthropic ships Claude Agent SDK",
    kind: "LAUNCH", summary: "Official SDK for building Claude agents. Standardizes a fragmented ecosystem and shortens dev cycles materially.",
    sourceLabel: "Anthropic", momentumScore: 90, reachScore: 80, opportunityScore: 84, isHot: true,
    observedAt: hAgo(4), toolSlug: "claude", startupSlug: "anthropic" },
  { slug: "indian-voice-agent-saas-launches-cluster", title: "5 Indian voice-AI SaaS launch in one week",
    kind: "VIRAL_POST", summary: "Cluster of vernacular voice-AI startups launched on ProductHunt + LinkedIn in a single week. Category is now contested in India.",
    sourceLabel: "ProductHunt + LinkedIn", momentumScore: 78, reachScore: 60, opportunityScore: 88, isHot: false,
    observedAt: hAgo(60), opportunitySlug: "ai-voice-agents-for-indian-clinics" },
];

async function main() {
  console.log(`Seeding ${seeds.length} signals…`);
  for (const s of seeds) {
    const row = await prisma.signal.upsert({
      where: { slug: s.slug },
      create: { ...s, status: "PUBLISHED", publishedAt: new Date() },
      update: { ...s, status: "PUBLISHED" },
    });
    console.log(`  ✓ ${row.slug}`);
  }
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
