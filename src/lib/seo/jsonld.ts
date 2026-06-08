// Shared JSON-LD helpers for rich-result eligibility. We emit Article schema
// for opportunity / tool / startup / workflow detail pages so Google can
// surface them as enhanced results (rating, image, byline).
import { env } from "../env";

export interface ArticleJsonLdInput {
  url: string;
  title: string;
  description: string;
  image?: string | null;
  datePublished?: Date | null;
  dateModified?: Date | null;
  authorName?: string;
}

export function articleJsonLd(i: ArticleJsonLdInput): string {
  const obj = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: i.title,
    description: i.description,
    image: i.image ?? `${env.SITE_URL}/opengraph-image`,
    url: i.url,
    datePublished: (i.datePublished ?? new Date()).toISOString(),
    dateModified: (i.dateModified ?? new Date()).toISOString(),
    author: { "@type": "Organization", name: i.authorName ?? env.SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: env.SITE_NAME,
      logo: { "@type": "ImageObject", url: `${env.SITE_URL}/logo.png` },
    },
  };
  return JSON.stringify(obj);
}
