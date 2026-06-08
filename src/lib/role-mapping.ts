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
export const ROLE_MAP: Record<Role, {
  label: string;
  emoji: string;
  tagline: string;
  hue: string;
  opportunityKinds: string[];
  workflowKinds: string[];
  toolCategories: string[];
}> = {
  founder: {
    label: "Founder",
    emoji: "🚀",
    tagline: "Startup plays + venture-scale opportunities.",
    hue: "text-startup",
    opportunityKinds: ["STARTUP", "BUSINESS", "AUTOMATION"],
    workflowKinds: ["BUSINESS", "AUTOMATION", "DEVELOPER"],
    toolCategories: ["dev", "code", "api", "agent"],
  },
  creator: {
    label: "Creator",
    emoji: "🎨",
    tagline: "Audience, content, and monetisation angles.",
    hue: "text-accent",
    opportunityKinds: ["CREATOR", "MONETIZATION", "NICHE"],
    workflowKinds: ["CREATOR", "MARKETING"],
    toolCategories: ["voice", "image", "video", "creator", "writing"],
  },
  developer: {
    label: "Developer",
    emoji: "💻",
    tagline: "Code, agents, automation, dev tools.",
    hue: "text-tool",
    opportunityKinds: ["AUTOMATION", "STARTUP", "AGENCY"],
    workflowKinds: ["DEVELOPER", "AUTOMATION"],
    toolCategories: ["code", "dev", "ide", "api", "agent"],
  },
  marketer: {
    label: "Marketer",
    emoji: "📈",
    tagline: "Growth, content, outreach, GTM.",
    hue: "text-signal",
    opportunityKinds: ["AGENCY", "CREATOR", "NICHE"],
    workflowKinds: ["MARKETING", "CREATOR", "AUTOMATION"],
    toolCategories: ["writing", "research", "voice", "image"],
  },
  trader: {
    label: "Trader",
    emoji: "📊",
    tagline: "Market signals, AI investing, edge.",
    hue: "text-growth",
    opportunityKinds: ["STARTUP", "BUSINESS"],
    workflowKinds: ["TRADING", "RESEARCH"],
    toolCategories: ["research", "search", "chat"],
  },
  student: {
    label: "Student",
    emoji: "🎓",
    tagline: "Learn AI, explore opportunities, earn early.",
    hue: "text-workflow",
    opportunityKinds: ["NICHE", "MONETIZATION", "CREATOR"],
    workflowKinds: ["RESEARCH", "CREATOR"],
    toolCategories: ["chat", "writing", "research"],
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
