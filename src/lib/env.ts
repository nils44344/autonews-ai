import { z } from "zod";

// Centralised env validation. Import `env` everywhere instead of process.env
// directly so misconfiguration fails fast and loudly.

try {
  (process as NodeJS.Process & { loadEnvFile?: (p?: string) => void }).loadEnvFile?.();
} catch { /* .env may be absent in prod */ }

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SITE_NAME: z.string().default("AutoNews AI"),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("postgresql://localhost:5432/autonews"),
  // API key required to POST /api/ingest. Set in prod via env var.
  INGEST_API_KEY: z.string().default("change-me-ingest-key"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
