// CLS-safe skeleton placeholder. Explicit width/height eliminate layout shift
// during data loading. Used as a Suspense fallback by every chart on the page.

export function SkeletonChart({ height = 260 }: { height?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading data"
      className="skeleton w-full"
      style={{ height }}
    />
  );
}

export function SkeletonRow({ height = 48 }: { height?: number }) {
  return <div className="skeleton w-full" style={{ height }} aria-hidden />;
}
