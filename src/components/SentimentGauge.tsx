// Inline-SVG semicircular sentiment gauge. Server-rendered (zero JS). Width
// and height are explicit so it never causes CLS.

export function SentimentGauge({
  score,           // -100 to +100
  size = 220,
  label = "Sentiment",
}: { score: number; size?: number; label?: string }) {
  const w = size;
  const h = size / 1.7;
  const cx = w / 2;
  const cy = h * 0.95;
  const r = h * 0.78;
  // Map score (-100..100) to angle (180..0 degrees)
  const angle = 180 - ((Math.max(-100, Math.min(100, score)) + 100) / 200) * 180;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + Math.cos(rad) * r * 0.92;
  const needleY = cy - Math.sin(rad) * r * 0.92;

  // Pre-compute arc segments for color bands
  const arc = (from: number, to: number, color: string) => {
    const fromRad = ((180 - from) * Math.PI) / 180;
    const toRad   = ((180 - to)   * Math.PI) / 180;
    const x1 = cx + Math.cos(fromRad) * r;
    const y1 = cy - Math.sin(fromRad) * r;
    const x2 = cx + Math.cos(toRad)   * r;
    const y2 = cy - Math.sin(toRad)   * r;
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const tone =
    score >= 33 ? "rgb(var(--up))"
    : score <= -33 ? "rgb(var(--down))"
    : "rgb(var(--accent))";

  return (
    <figure className="flex flex-col items-center" style={{ width: w }}>
      <svg width={w} height={h + 18} viewBox={`0 0 ${w} ${h + 18}`} aria-label={`${label}: ${score.toFixed(0)}`}>
        <path d={arc(0,   33,  "rgb(var(--down))")}   stroke="rgb(var(--down))"   strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d={arc(33,  66,  "rgb(var(--accent))")} stroke="rgb(var(--accent))" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d={arc(66,  100, "rgb(var(--up))")}     stroke="rgb(var(--up))"     strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={tone} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={tone} />
        <text x={cx} y={cy - 16} textAnchor="middle" fontSize="22" fontFamily="var(--font-geist-mono)" fontWeight="800" fill="rgb(var(--fg))">
          {score >= 0 ? "+" : ""}{score.toFixed(0)}
        </text>
      </svg>
      <figcaption className="bracket mt-1">[ {label.toUpperCase()} ]</figcaption>
    </figure>
  );
}
