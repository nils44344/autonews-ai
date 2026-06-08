// ASCII-style horizontal rule used as a graphic separator. Mono chars repeated
// across the available width — distinctive vs <hr> or a flat line. Aria-hidden
// because it's purely decorative.

export function AsciiRule({
  char = "═",
  className = "",
}: {
  char?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none overflow-hidden whitespace-nowrap font-mono text-[11px] leading-none text-[color:rgb(var(--canvas-rule))] ${className}`}
    >
      {char.repeat(400)}
    </div>
  );
}
