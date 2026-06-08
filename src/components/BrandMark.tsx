// Custom inline-SVG brand mark. Replaces the generic logo PNG. Geometric "A"
// rendered as bracketed line segments — recognisable, distinctive, scales
// crisp at any size, no network request.

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="AutoNews AI"
      className="text-brand"
    >
      {/* Outer bracket frame */}
      <path d="M5 4 L5 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M5 4 L9 4"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M5 28 L9 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M27 4 L27 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M23 4 L27 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M23 28 L27 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      {/* The "A" inside */}
      <path d="M11 24 L16 8 L21 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.2 19 L18.8 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Active signal dot */}
      <circle cx="16" cy="29" r="1.5" fill="rgb(251 191 36)" />
    </svg>
  );
}
