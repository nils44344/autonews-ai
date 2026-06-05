// Opportunity Score formula. Used to rank /opportunities and surface the
// strongest plays on the homepage. Kept simple + auditable so editors can
// understand why a score went up or down.
//
// Inputs (0-100 each, set by AI generator or editor):
//   demand        — how much real-world demand exists right now
//   growth        — trajectory: rising, flat, declining
//   competition   — higher = MORE crowded (we invert it)
//   monetization  — how easy it is to charge money for this
//   difficulty    — higher = HARDER to execute (we invert it lightly)
//
// Weighting reflects what actually matters for a solo builder finding edges:
// demand and growth dominate; uncrowded markets matter a lot; monetization
// matters; difficulty is a tiebreaker because hard ≠ bad if reward is real.

export interface OpportunityScoreInputs {
  demandScore: number;
  growthScore: number;
  competitionScore: number;
  monetizationScore: number;
  difficultyScore: number;
}

export function computeOpportunityScore(i: OpportunityScoreInputs): number {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const demand = clamp(i.demandScore);
  const growth = clamp(i.growthScore);
  const compInverted = 100 - clamp(i.competitionScore);
  const mone = clamp(i.monetizationScore);
  const diffInverted = 100 - clamp(i.difficultyScore);

  const score =
    demand * 0.30 +
    growth * 0.25 +
    compInverted * 0.20 +
    mone * 0.15 +
    diffInverted * 0.10;

  return Math.round(score * 10) / 10; // one decimal
}

// Human-readable tier — shown next to the score as a quick gut check.
export function scoreTier(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Exceptional", color: "text-emerald-400" };
  if (score >= 70) return { label: "Strong", color: "text-green-400" };
  if (score >= 60) return { label: "Promising", color: "text-amber-400" };
  if (score >= 50) return { label: "Worth Watching", color: "text-slate-400" };
  return { label: "Early Signal", color: "text-slate-500" };
}
