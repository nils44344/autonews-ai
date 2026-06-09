// AutoNews AI brand mark — "an" wordmark with accent dot.
// Pure inline SVG so it scales crisp at any size and never makes a network
// request. Two color slots so it works on dark + light surfaces.

export function Logo({
  size = 28,
  monogramColor,    // overrides — defaults match the brand
  dotColor = "rgb(85 135 196)",      // brand blue dot
  className = "",
}: {
  size?: number;
  monogramColor?: string;
  dotColor?: string;
  className?: string;
}) {
  // On a dark surface we want the wordmark light. Otherwise keep the navy.
  const fg = monogramColor ?? "currentColor";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 80"
      fill="none"
      aria-label="AutoNews AI"
      className={className}
    >
      {/* 'a' — round bowl with right-side stem */}
      <path
        d="M30 22
           C30 15.4 36 10 44 10
           C52 10 58 15.4 58 22
           L58 70
           L52 70
           L52 60
           C49 67 43 70 38 70
           C29 70 22 62 22 52
           C22 42 30 36 40 36
           C45 36 49 38 52 41
           L52 22
           C52 18 49 16 44 16
           C39 16 36 18 36 22
           L30 22 Z
           M40 42
           C34 42 28 47 28 52
           C28 58 33 64 38 64
           C45 64 52 58 52 52
           C52 46 47 42 40 42 Z"
        fill={fg}
      />
      {/* 'n' — round arches */}
      <path
        d="M64 70
           L64 22
           C64 15 70 10 78 10
           C86 10 92 15 92 22
           L92 70
           L86 70
           L86 22
           C86 18 83 16 78 16
           C73 16 70 18 70 22
           L70 70
           L64 70 Z"
        fill={fg}
      />
      {/* Accent dot */}
      <circle cx="58" cy="62" r="5" fill={dotColor} />
    </svg>
  );
}
