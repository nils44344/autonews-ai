// Inline-SVG sparkline + prediction chart. Server-rendered, no JS, no CLS.
import { formatUsd } from "@/lib/format";

interface PriceChartProps {
  current: number;
  predicted: number;
  low: number;
  high: number;
  width?: number;
  height?: number;
}

export function PriceChart({ current, predicted, low, high, width = 480, height = 200 }: PriceChartProps) {
  // Synthesize a 30-day projection envelope
  const days = 30;
  const points: { d: number; p: number }[] = [];
  for (let i = 0; i <= days; i++) {
    const t = i / days;
    points.push({ d: i, p: current + (predicted - current) * t });
  }
  const min = Math.min(low, current, predicted) * 0.97;
  const max = Math.max(high, current, predicted) * 1.03;
  const span = max - min;

  const x = (d: number) => 50 + (d / days) * (width - 70);
  const y = (p: number) => height - 30 - ((p - min) / span) * (height - 60);

  const path = points.map((pt, i) => `${i === 0 ? "M" : "L"}${x(pt.d).toFixed(1)},${y(pt.p).toFixed(1)}`).join(" ");
  const lowPath  = `M${x(0)},${y(current)} L${x(days)},${y(low)}`;
  const highPath = `M${x(0)},${y(current)} L${x(days)},${y(high)}`;
  const trendUp = predicted >= current;

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet" aria-label="30-day price projection">
        {/* Y-axis grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={50} y1={30 + (height - 60) * t} x2={width - 20} y2={30 + (height - 60) * t}
            stroke="rgb(var(--canvas-rule))" strokeWidth="0.5" />
        ))}
        {/* Confidence cone */}
        <path d={`${lowPath} L${x(days)},${y(high)} L${x(0)},${y(current)} Z`}
          fill="rgb(var(--brand))" opacity="0.08" />
        <path d={lowPath}  stroke="rgb(var(--canvas-rule))" strokeWidth="1" strokeDasharray="4 4" fill="none" />
        <path d={highPath} stroke="rgb(var(--canvas-rule))" strokeWidth="1" strokeDasharray="4 4" fill="none" />
        {/* Forecast line */}
        <path d={path} stroke={trendUp ? "rgb(var(--up))" : "rgb(var(--down))"} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* End-points */}
        <circle cx={x(0)} cy={y(current)} r="4" fill="rgb(var(--fg))" />
        <circle cx={x(days)} cy={y(predicted)} r="5" fill={trendUp ? "rgb(var(--up))" : "rgb(var(--down))"} />
        {/* Labels */}
        <text x={x(0)} y={y(current) - 10} fontSize="11" fontFamily="var(--font-geist-mono)" fill="rgb(var(--fg))">
          {formatUsd(current)}
        </text>
        <text x={x(days)} y={y(predicted) - 10} textAnchor="end" fontSize="11" fontFamily="var(--font-geist-mono)"
              fill={trendUp ? "rgb(var(--up))" : "rgb(var(--down))"}>
          {formatUsd(predicted)}
        </text>
        <text x={50} y={height - 8} fontSize="10" fontFamily="var(--font-geist-mono)" fill="rgb(var(--muted-fg))">TODAY</text>
        <text x={width - 20} y={height - 8} textAnchor="end" fontSize="10" fontFamily="var(--font-geist-mono)" fill="rgb(var(--muted-fg))">+30D</text>
      </svg>
    </figure>
  );
}
