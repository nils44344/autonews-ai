import Link from "next/link";

// Opportunity Radar — 2D scatter plot of opportunities positioned by
// demand (x-axis) × growth (y-axis), sized by overall score. Real data
// visualization that nobody else in the AI-platform space ships. Pure SVG,
// SSR-rendered, zero JS, fully crawlable, links inside.
//
// Quadrants the viewer reads at a glance:
//   top-right    high demand + high growth = HOT
//   top-left     low demand + high growth  = EMERGING
//   bottom-right high demand + low growth  = MATURE
//   bottom-left  low demand + low growth   = WAIT

interface Item {
  slug: string;
  title: string;
  demandScore: number;
  growthScore: number;
  opportunityScore: number;
  kind?: string;
}

export function OpportunityRadar({ items }: { items: Item[] }) {
  const W = 760, H = 420, PAD = 56;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const x = (v: number) => PAD + (v / 100) * innerW;
  const y = (v: number) => H - PAD - (v / 100) * innerH;
  // Bubble size — 4..18 px radius depending on score.
  const r = (v: number) => 4 + (Math.max(0, Math.min(100, v)) / 100) * 14;

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-auto"
        aria-label="Opportunity radar — demand by growth"
      >
        <defs>
          <radialGradient id="bubble" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgb(34 211 184)" stopOpacity="0.9" />
            <stop offset="60%" stopColor="rgb(34 211 184)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(34 211 184)" stopOpacity="0.05" />
          </radialGradient>
          <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
            <path d="M 38 0 L 0 0 0 38" fill="none" stroke="rgb(30 30 34)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Background */}
        <rect x={PAD} y={PAD} width={innerW} height={innerH} fill="url(#grid)" />

        {/* Quadrant rules */}
        <line x1={PAD + innerW / 2} y1={PAD} x2={PAD + innerW / 2} y2={H - PAD}
              stroke="rgb(40 40 46)" strokeDasharray="2 3" strokeWidth="1" />
        <line x1={PAD} y1={PAD + innerH / 2} x2={W - PAD} y2={PAD + innerH / 2}
              stroke="rgb(40 40 46)" strokeDasharray="2 3" strokeWidth="1" />

        {/* Quadrant labels */}
        <text x={W - PAD - 10} y={PAD + 18} textAnchor="end" fontSize="10"
              fontFamily="var(--font-geist-mono)" letterSpacing="0.18em" fill="rgb(34 211 184)" opacity="0.9">
          HOT
        </text>
        <text x={PAD + 10} y={PAD + 18} fontSize="10"
              fontFamily="var(--font-geist-mono)" letterSpacing="0.18em" fill="rgb(251 191 36)" opacity="0.9">
          EMERGING
        </text>
        <text x={W - PAD - 10} y={H - PAD - 8} textAnchor="end" fontSize="10"
              fontFamily="var(--font-geist-mono)" letterSpacing="0.18em" fill="rgb(148 163 184)" opacity="0.7">
          MATURE
        </text>
        <text x={PAD + 10} y={H - PAD - 8} fontSize="10"
              fontFamily="var(--font-geist-mono)" letterSpacing="0.18em" fill="rgb(100 116 139)" opacity="0.6">
          WAIT
        </text>

        {/* Axis labels */}
        <text x={W / 2} y={H - 14} textAnchor="middle" fontSize="9"
              fontFamily="var(--font-geist-mono)" letterSpacing="0.22em" fill="rgb(156 156 148)" opacity="0.7">
          DEMAND  →
        </text>
        <text x={20} y={H / 2} textAnchor="middle" fontSize="9"
              fontFamily="var(--font-geist-mono)" letterSpacing="0.22em" fill="rgb(156 156 148)" opacity="0.7"
              transform={`rotate(-90 20 ${H / 2})`}>
          GROWTH  →
        </text>

        {/* Points */}
        {items.map((it) => {
          const cx = x(it.demandScore);
          const cy = y(it.growthScore);
          const radius = r(it.opportunityScore);
          return (
            <g key={it.slug}>
              <Link href={`/opportunities/${it.slug}`}>
                <circle cx={cx} cy={cy} r={radius} fill="url(#bubble)"
                        stroke="rgb(34 211 184)" strokeWidth="1.2" opacity="0.95" />
                <circle cx={cx} cy={cy} r={2} fill="rgb(245 245 240)" />
                <text x={cx + radius + 6} y={cy + 3} fontSize="10"
                      fontFamily="var(--font-geist-mono)" fill="rgb(245 245 240)" opacity="0.92">
                  {it.opportunityScore.toFixed(0)}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
