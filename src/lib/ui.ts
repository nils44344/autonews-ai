// Visual styling per category. The articles have no images (AI text), so color
// keyed to category is what gives the site hierarchy and life. Full literal
// Tailwind class strings so they survive purge (src/lib is in the content glob).

export interface CategoryStyle {
  badge: string; // badge background + text
  dot: string; // small accent dot bg
  gradient: string; // from/to for hero + card strips
  ring: string; // hover border color
}

const PALETTES: Record<string, CategoryStyle> = {
  technology: { badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500", gradient: "from-blue-500 to-indigo-600", ring: "hover:border-blue-400" },
  ai: { badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500", gradient: "from-violet-500 to-fuchsia-600", ring: "hover:border-violet-400" },
  business: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", gradient: "from-emerald-500 to-teal-600", ring: "hover:border-emerald-400" },
  crypto: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500", gradient: "from-amber-500 to-orange-600", ring: "hover:border-amber-400" },
  finance: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", gradient: "from-emerald-500 to-green-600", ring: "hover:border-emerald-400" },
  sports: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500", gradient: "from-rose-500 to-red-600", ring: "hover:border-rose-400" },
  entertainment: { badge: "bg-pink-50 text-pink-700", dot: "bg-pink-500", gradient: "from-pink-500 to-rose-600", ring: "hover:border-pink-400" },
  science: { badge: "bg-cyan-50 text-cyan-700", dot: "bg-cyan-500", gradient: "from-cyan-500 to-sky-600", ring: "hover:border-cyan-400" },
  health: { badge: "bg-green-50 text-green-700", dot: "bg-green-500", gradient: "from-green-500 to-emerald-600", ring: "hover:border-green-400" },
  world: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500", gradient: "from-slate-600 to-slate-800", ring: "hover:border-slate-400" },
  politics: { badge: "bg-red-50 text-red-700", dot: "bg-red-500", gradient: "from-red-500 to-rose-700", ring: "hover:border-red-400" },
};

const FALLBACKS: CategoryStyle[] = [
  { badge: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500", gradient: "from-indigo-500 to-blue-600", ring: "hover:border-indigo-400" },
  { badge: "bg-teal-50 text-teal-700", dot: "bg-teal-500", gradient: "from-teal-500 to-cyan-600", ring: "hover:border-teal-400" },
  { badge: "bg-orange-50 text-orange-700", dot: "bg-orange-500", gradient: "from-orange-500 to-amber-600", ring: "hover:border-orange-400" },
  { badge: "bg-fuchsia-50 text-fuchsia-700", dot: "bg-fuchsia-500", gradient: "from-fuchsia-500 to-purple-600", ring: "hover:border-fuchsia-400" },
];

export function categoryStyle(name?: string | null): CategoryStyle {
  if (!name) return FALLBACKS[0];
  const key = name.toLowerCase();
  for (const k of Object.keys(PALETTES)) {
    if (key.includes(k)) return PALETTES[k];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACKS[hash % FALLBACKS.length];
}
