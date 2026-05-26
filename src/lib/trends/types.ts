import type { SourceType } from "@prisma/client";

// A normalized observation returned by any source fetcher.
export interface RawSignal {
  title: string;
  url?: string;
  summary?: string;
  /** Raw popularity from the source (upvotes, comments, rank-derived). */
  score: number;
  category?: string;
  raw?: unknown;
}

export interface SourceDef {
  type: SourceType;
  name: string;
  url?: string;
  category: string;
  weight: number;
}

export interface SourceFetcher {
  type: SourceType;
  fetch(def: SourceDef): Promise<RawSignal[]>;
}
