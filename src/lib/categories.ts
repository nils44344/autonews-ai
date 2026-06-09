// Vehicle categories used by predictions/[category] routes. Slug = URL.

export interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
}

export const CATEGORIES: CategorySeed[] = [
  {
    slug: "ev",
    name: "Electric Vehicles (EV)",
    description: "Battery-electric vehicles across all segments. Tracks adoption curves, range improvements, charging infrastructure impact, and pricing.",
    keywords: ["electric vehicle", "EV", "battery electric", "BEV", "Tesla", "Rivian", "Lucid"],
  },
  {
    slug: "hybrid",
    name: "Hybrid Vehicles",
    description: "Conventional and plug-in hybrids. Bridges ICE and EV markets — tracks consumer migration and fuel-economy positioning.",
    keywords: ["hybrid", "plug-in hybrid", "PHEV", "HEV", "Prius", "RAV4 hybrid"],
  },
  {
    slug: "suv",
    name: "SUVs",
    description: "Sport utility vehicles — the highest-volume segment globally. Tracks pricing, sentiment, and incoming model releases.",
    keywords: ["SUV", "sport utility", "crossover", "CUV", "compact SUV", "midsize SUV"],
  },
  {
    slug: "truck",
    name: "Pickup Trucks",
    description: "Light-duty and heavy-duty pickup trucks. Profitability anchor for US OEMs.",
    keywords: ["pickup truck", "F-150", "Silverado", "Ram", "EV truck", "Cybertruck"],
  },
  {
    slug: "sedan",
    name: "Sedans",
    description: "Traditional 3-box sedans. Declining segment but high enthusiast loyalty in luxury tier.",
    keywords: ["sedan", "Camry", "Accord", "Model 3", "luxury sedan"],
  },
  {
    slug: "luxury",
    name: "Luxury",
    description: "Premium and luxury vehicles across body styles. High margin, sentiment-sensitive.",
    keywords: ["luxury car", "Mercedes", "BMW", "Audi", "Porsche", "Lexus"],
  },
  {
    slug: "sports",
    name: "Sports Cars",
    description: "Performance and sports coupes. Enthusiast segment with outsized brand-loyalty signals.",
    keywords: ["sports car", "supercar", "performance", "Corvette", "Porsche 911", "Mustang"],
  },
  {
    slug: "compact",
    name: "Compact",
    description: "Compact and subcompact passenger cars. Entry-level segment most exposed to pricing pressure.",
    keywords: ["compact car", "subcompact", "Civic", "Corolla", "entry-level"],
  },
];

export function findCategory(slug: string): CategorySeed | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
