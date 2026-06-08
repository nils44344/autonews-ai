// Tiny inline-SVG sparkline. We don't store historical scores yet, so we
// synthesize a plausible trend from the current score (random walk seeded by
// the slug so the same item draws the same line every render — important for
// SSR consistency). Real time-series replaces this in v2.

function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };
}

export function Sparkline({
  score, seed, width = 80, height = 22, color = "currentColor",
}: {
  score: number;
  seed: string;
  width?: number;
  height?: number;
  color?: string;
}) {
  const rng = seeded(seed);
  const points: number[] = [];
  // 14 data points, ending at the current score, with momentum-shaped jitter.
  let v = score - (rng() * 30 + 5); // start lower
  for (let i = 0; i < 13; i++) {
    const drift = (score - v) * 0.18;     // tend toward current score
    const noise = (rng() - 0.5) * 16;
    v = Math.max(0, Math.min(100, v + drift + noise));
    points.push(v);
  }
  points.push(score);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(1, max - min);
  const stepX = width / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p - min) / span) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  // Direction arrow at the end: up if last > first.
  const trendUp = points[points.length - 1] >= points[0];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx={width} cy={height - ((points[points.length - 1] - min) / span) * (height - 2) - 1} r="1.8" fill={color} />
      <text x={width + 4} y={height - 2} fontSize="9" fill={color} fontFamily="var(--font-geist-mono)" opacity="0.7">
        {trendUp ? "▲" : "▼"}
      </text>
    </svg>
  );
}
