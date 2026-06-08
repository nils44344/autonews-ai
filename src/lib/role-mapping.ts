// Maps the user's role (Founder, Creator, Developer, etc.) to the entity
// kinds that should rank higher for them. Used by the homepage personalised
// rail + every "for you" badge. Without this, the role chooser was decorative.

export type Role = "founder" | "creator" | "developer" | "marketer" | "trader" | "student";

// Each role gets:
//   - opportunityKinds: prioritise these opp kinds
//   - workflowKinds:    prioritise these workflow kinds
//   - toolCategories:   tool categories that resonate
//   - tagline:          shown in personalised hero strip
//   - hue:              accent for the role pill
// Each role gets distinct color psychology + hero copy. Tokens are R G B
// triplets so they slot directly into the CSS variable system in globals.css.
export interface RoleTheme {
  label: string;
  emoji: string;
  tagline: string;
  hue: string;
  opportunityKinds: string[];
  workflowKinds: string[];
  toolCategories: string[];
  // Color signature (R G B triplets, used by the role-themed CSS overrides)
  brandRgb: string;
  accentRgb: string;
  // Hero copy that personalises the homepage headline
  heroHeadline: string;
  heroItalic: string;
  heroSub: string;
  ctaPrimary: string;
}

export const ROLE_MAP: Record<Role, RoleTheme> = {
  // FOUNDER — urgent red/orange (action, leadership, momentum)
  founder: {
    label: "Founder", emoji: "🚀",
    tagline: "Build the next breakout.",
    hue: "text-startup",
    opportunityKinds: ["STARTUP", "BUSINESS", "AUTOMATION"],
    workflowKinds: ["BUSINESS", "AUTOMATION", "DEVELOPER"],
    toolCategories: ["dev", "code", "api", "agent"],
    brandRgb: "251 113 133",   // rose-400 — urgency
    accentRgb: "251 191 36",   // amber — alarm
    heroHeadline: "The market is moving.",
    heroItalic: "Your startup is your edge.",
    heroSub: "Venture-scale opportunities, founder workflows, breakout startups. The signals other founders see seven days late.",
    ctaPrimary: "[→] FIND YOUR EDGE",
  },
  // CREATOR — magenta/pink (creativity, passion, expression)
  creator: {
    label: "Creator", emoji: "🎨",
    tagline: "Make what spreads.",
    hue: "text-accent",
    opportunityKinds: ["CREATOR", "MONETIZATION", "NICHE"],
    workflowKinds: ["CREATOR", "MARKETING"],
    toolCategories: ["voice", "image", "video", "creator", "writing"],
    brandRgb: "236 72 153",    // pink-500 — creative energy
    accentRgb: "168 85 247",   // purple — imagination
    heroHeadline: "Your audience is waiting.",
    heroItalic: "Make something they share.",
    heroSub: "Faceless YouTube pipelines, AI voice, image gen, monetisation. The workflows top creators ship daily.",
    ctaPrimary: "[→] BUILD AN AUDIENCE",
  },
  // DEVELOPER — teal/green (logic, focus, productive flow)
  developer: {
    label: "Developer", emoji: "💻",
    tagline: "Ship faster, ship deeper.",
    hue: "text-tool",
    opportunityKinds: ["AUTOMATION", "STARTUP", "AGENCY"],
    workflowKinds: ["DEVELOPER", "AUTOMATION"],
    toolCategories: ["code", "dev", "ide", "api", "agent"],
    brandRgb: "34 211 184",    // teal — focus
    accentRgb: "56 189 248",   // sky — flow
    heroHeadline: "Build the next layer.",
    heroItalic: "Code, agents, automation.",
    heroSub: "Cursor, Claude, Vapi, n8n. The dev workflows that 10x output and the agencies booking 6-figures shipping them.",
    ctaPrimary: "[→] SHIP MORE",
  },
  // MARKETER — orange/yellow (energy, optimism, attention)
  marketer: {
    label: "Marketer", emoji: "📈",
    tagline: "Capture attention. Convert it.",
    hue: "text-signal",
    opportunityKinds: ["AGENCY", "CREATOR", "NICHE"],
    workflowKinds: ["MARKETING", "CREATOR", "AUTOMATION"],
    toolCategories: ["writing", "research", "voice", "image"],
    brandRgb: "251 146 60",    // orange — energy
    accentRgb: "250 204 21",   // yellow — attention
    heroHeadline: "Win the attention race.",
    heroItalic: "Growth is a system.",
    heroSub: "AI personalisation, cold outbound, content pipelines, GTM plays. The agencies and operators running circles right now.",
    ctaPrimary: "[→] FIND YOUR LEVER",
  },
  // TRADER — gold/amber (wealth, signals, precision)
  trader: {
    label: "Trader", emoji: "📊",
    tagline: "Edge compounds. Take it early.",
    hue: "text-growth",
    opportunityKinds: ["STARTUP", "BUSINESS"],
    workflowKinds: ["TRADING", "RESEARCH"],
    toolCategories: ["research", "search", "chat"],
    brandRgb: "234 179 8",     // amber-yellow — wealth
    accentRgb: "34 211 184",   // teal — signal
    heroHeadline: "The signal before the move.",
    heroItalic: "Read the market early.",
    heroSub: "Funding rounds, breakout startups, signal velocity. Every cycle plots what the smart money is doing 48h before consensus.",
    ctaPrimary: "[→] TRACK THE SIGNALS",
  },
  // STUDENT — violet/blue (learning, calm, trust)
  student: {
    label: "Student", emoji: "🎓",
    tagline: "Learn AI. Earn early.",
    hue: "text-workflow",
    opportunityKinds: ["NICHE", "MONETIZATION", "CREATOR"],
    workflowKinds: ["RESEARCH", "CREATOR"],
    toolCategories: ["chat", "writing", "research"],
    brandRgb: "139 92 246",    // violet — learning
    accentRgb: "59 130 246",   // blue — trust
    heroHeadline: "Skip the syllabus.",
    heroItalic: "Build something real this semester.",
    heroSub: "Side hustles that pay, AI workflows you can master in a weekend, niches that don't need credentials.",
    ctaPrimary: "[→] START LEARNING",
  },
};

// Sort/filter helpers — pure, work on any list with a `kind` field.
export function rankByRole<T extends { kind: string }>(items: T[], role: Role | null, kinds: "opportunityKinds" | "workflowKinds" = "opportunityKinds"): T[] {
  if (!role) return items;
  const prefer = new Set(ROLE_MAP[role][kinds]);
  return [...items].sort((a, b) => {
    const ap = prefer.has(a.kind) ? 0 : 1;
    const bp = prefer.has(b.kind) ? 0 : 1;
    return ap - bp;
  });
}

export function rankToolsByRole<T extends { categories: string[] }>(items: T[], role: Role | null): T[] {
  if (!role) return items;
  const prefer = new Set(ROLE_MAP[role].toolCategories);
  return [...items].sort((a, b) => {
    const aHits = a.categories.filter((c) => prefer.has(c)).length;
    const bHits = b.categories.filter((c) => prefer.has(c)).length;
    return bHits - aHits;
  });
}
