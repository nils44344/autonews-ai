// JSON-LD structured-data utilities. Output Dataset / NewsArticle / Product
// (AggregateOffer) schemas for max Google rich-result eligibility.

import { env } from "./env";

const safe = (s: string) => s.replace(/</g, "\\u003c");

export function ldScript(obj: unknown): string {
  return safe(JSON.stringify(obj));
}

// Dataset — for market-trend pages.
export function datasetSchema(opts: {
  name: string;
  description: string;
  url: string;
  keywords: string[];
  datePublished?: Date;
  dateModified?: Date;
  measurementTechnique?: string;
  variableMeasured?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    keywords: opts.keywords.join(", "),
    creator: { "@type": "Organization", name: env.SITE_NAME, url: env.SITE_URL },
    publisher: { "@type": "Organization", name: env.SITE_NAME, url: env.SITE_URL },
    datePublished: (opts.datePublished ?? new Date()).toISOString(),
    dateModified: (opts.dateModified ?? new Date()).toISOString(),
    license: `${env.SITE_URL}/license`,
    isAccessibleForFree: true,
    measurementTechnique: opts.measurementTechnique ?? "AI sentiment analysis + market signal aggregation",
    variableMeasured: opts.variableMeasured ?? ["sentiment score", "price prediction", "confidence interval"],
  };
}

// NewsArticle — for data-driven insight pages.
export function newsArticleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: Date;
  dateModified?: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    image: opts.image ?? `${env.SITE_URL}/og.png`,
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    author: { "@type": "Organization", name: env.SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: env.SITE_NAME,
      logo: { "@type": "ImageObject", url: `${env.SITE_URL}/logo.png` },
    },
  };
}

// Product (with AggregateOffer) — for vehicle price-prediction pages.
export function productAggregateOfferSchema(opts: {
  name: string;
  description: string;
  url: string;
  brandName: string;
  image?: string;
  lowPrice: number;
  highPrice: number;
  averagePrice?: number;
  currency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image: opts.image ?? `${env.SITE_URL}/og.png`,
    brand: { "@type": "Brand", name: opts.brandName },
    category: "Automotive",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: opts.currency ?? "USD",
      lowPrice: opts.lowPrice.toFixed(2),
      highPrice: opts.highPrice.toFixed(2),
      offerCount: 1,
      availability: "https://schema.org/InStock",
    },
  };
}

// BreadcrumbList — for nested pages.
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
