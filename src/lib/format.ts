// Formatting helpers. Server + client safe.

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});
const fmtPct = new Intl.NumberFormat("en-US", {
  style: "percent", maximumFractionDigits: 1,
});

export const formatNumber = (n: number): string => fmt.format(n);
export const formatUsd    = (n: number): string => fmtUsd.format(n);
export const formatPct    = (n: number): string => fmtPct.format(n / 100);
export const formatSigned = (n: number): string => (n >= 0 ? `+${fmt.format(n)}` : fmt.format(n));

export const dateShort = (d: Date | string): string => {
  const x = new Date(d);
  return x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
