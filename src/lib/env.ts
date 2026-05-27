import { z } from "zod";

// Centralised, validated environment access. Import `env` everywhere instead of
// reading process.env directly, so misconfiguration fails fast and loudly.

// Load .env for non-Next entrypoints (the BullMQ worker and tsx scripts) BEFORE
// we read process.env below. Without this, env.ts parses process.env before
// anything loads .env, so values like REDIS_URL silently fall back to their
// defaults (e.g. redis://localhost:6379). Next.js loads .env on its own, so
// there this is effectively a harmless no-op. loadEnvFile() exists on Node 20.12+.
try {
  (process as NodeJS.Process & { loadEnvFile?: (path?: string) => void }).loadEnvFile?.();
} catch {
  // .env may be absent (e.g. production using real environment variables) — fine.
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SITE_NAME: z.string().default("AutoNews AI"),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_TOKEN: z.string().min(8).default("change-me-please-change-me"),

  DATABASE_URL: z.string().default("postgresql://autonews:autonews@localhost:5432/autonews"),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  AI_PROVIDER: z.enum(["ollama", "openai", "anthropic"]).default("ollama"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1"),
  OPENAI_API_KEY: z.string().optional(),
  // Optional override for OpenAI-compatible providers (e.g. Groq:
  // https://api.groq.com/openai/v1). Leave unset for real OpenAI.
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5-20251001"),

  // Email (Resend). Without a verified domain, Resend test mode only delivers to
  // your own account email and must send from onboarding@resend.dev.
  RESEND_API_KEY: z.string().optional(),
  NEWSLETTER_FROM: z.string().default("AutoNews AI <onboarding@resend.dev>"),

  // IndexNow key (served at /<key>.txt) — instant search-engine push on publish.
  INDEXNOW_KEY: z.string().optional(),

  // Pexels API key — real HD stock photos per article (free).
  PEXELS_API_KEY: z.string().optional(),

  REDDIT_USER_AGENT: z.string().default("autonews-ai/0.1"),
  NEWSAPI_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  X_BEARER_TOKEN: z.string().optional(),

  PUBLISH_MODE: z.enum(["manual", "auto"]).default("manual"),
  MIN_QUALITY_SCORE: z.coerce.number().min(0).max(100).default(70),
  TOPICS_PER_CYCLE: z.coerce.number().int().positive().default(5),
  TREND_INTERVAL_MIN: z.coerce.number().int().positive().default(30),
  PUBLISH_INTERVAL_MIN: z.coerce.number().int().positive().default(10),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
