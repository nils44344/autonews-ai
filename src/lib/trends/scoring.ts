import { clamp } from "../utils";

export interface TopicScoreInput {
  /** Average raw popularity (0-100) across this topic's signals. */
  popularity: number;
  /** Distinct sources that mention this topic. */
  sourceCount: number;
  /** Hours since the earliest signal for this topic. */
  ageHours: number;
  /** Sum of source weights backing this topic. */
  weightSum: number;
  /** Total keyword length / specificity heuristic. */
  keywordSpecificity: number;
}

export interface TopicScores {
  viralScore: number;
  seoScore: number;
  freshnessScore: number;
  competitionScore: number; // higher = lower competition (more opportunity)
  finalScore: number;
  isBreaking: boolean;
}

/**
 * Transparent, tunable scoring model. No magic — each sub-score is 0-100 and the
 * final score is a weighted blend, so the ranking is explainable in the admin UI.
 */
export function scoreTopic(input: TopicScoreInput): TopicScores {
  const { popularity, sourceCount, ageHours, weightSum, keywordSpecificity } = input;

  // Viral: popularity amplified by cross-source corroboration.
  const crossSource = Math.min(1, sourceCount / 4); // saturates at 4+ sources
  const viralScore = clamp(popularity * (0.6 + 0.4 * crossSource) * Math.min(1.3, 0.7 + weightSum / 10));

  // Freshness: exponential decay over ~36h.
  const freshnessScore = clamp(100 * Math.exp(-ageHours / 36));

  // SEO opportunity: specific, multi-word long-tail topics with decent volume
  // rank more easily. Reward specificity + moderate popularity.
  const longTail = clamp(keywordSpecificity * 12); // 0-100 from ~8 keywords
  const seoScore = clamp(0.5 * longTail + 0.5 * popularity);

  // Competition (proxy): broad single-source topics are crowded; multi-source
  // niche-specific topics signal an underserved angle. Higher = better.
  const competitionScore = clamp(40 + longTail * 0.4 + crossSource * 20 - popularity * 0.1);

  // Breaking: very fresh + corroborated by multiple sources.
  const isBreaking = ageHours < 6 && sourceCount >= 2 && popularity > 55;

  const finalScore = clamp(
    0.34 * viralScore +
      0.28 * seoScore +
      0.20 * freshnessScore +
      0.18 * competitionScore +
      (isBreaking ? 8 : 0),
  );

  return { viralScore, seoScore, freshnessScore, competitionScore, finalScore, isBreaking };
}
