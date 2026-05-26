import { env } from "../env";

// JSON-LD structured data builders. Render the output inside a
// <script type="application/ld+json"> tag on the relevant page.

interface ArticleLD {
  type: "NewsArticle" | "BlogPosting";
  headline: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  keywords?: string[];
}

export function articleJsonLd(a: ArticleLD) {
  return {
    "@context": "https://schema.org",
    "@type": a.type,
    headline: a.headline.slice(0, 110),
    description: a.description,
    image: a.image ? [a.image] : undefined,
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    author: { "@type": "Organization", name: a.authorName ?? env.SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: env.SITE_NAME,
      logo: { "@type": "ImageObject", url: `${env.SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
    keywords: a.keywords?.join(", "),
  };
}

export function faqJsonLd(faq: { question: string; answer: string }[]) {
  if (!faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: env.SITE_NAME,
    url: env.SITE_URL,
    logo: `${env.SITE_URL}/logo.png`,
  };
}

/** Helper to serialise one or more JSON-LD blocks for a <script> tag. */
export function ldScript(...blocks: (object | null)[]): string {
  const valid = blocks.filter(Boolean);
  return JSON.stringify(valid.length === 1 ? valid[0] : valid);
}
