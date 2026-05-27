import OpenAI from "openai";
import { env } from "../env";
import type { GenerateOptions, LLMProvider } from "./types";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
    // baseURL lets this same provider talk to any OpenAI-compatible API
    // (e.g. Groq at https://api.groq.com/openai/v1). Unset = real OpenAI.
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
      // Groq's free tier rate-limits under bursts; retry 429/5xx with backoff
      // (respects Retry-After) so a cycle doesn't strand half-written articles.
      maxRetries: 5,
      timeout: 90_000,
    });
  }

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
    const base = {
      model: env.OPENAI_MODEL,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      messages: [
        ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
        { role: "user" as const, content: prompt },
      ],
    };

    if (!opts.json) {
      const res = await this.client.chat.completions.create(base);
      return res.choices[0]?.message?.content?.trim() ?? "";
    }

    // JSON mode. Groq's strict `json_object` validator returns a hard 400
    // ("Failed to generate JSON") when the output is truncated or otherwise
    // imperfect — even though the model usually produced usable content. So:
    //   1. try strict JSON mode,
    //   2. on a json-validation 400, salvage the model's raw attempt from the
    //      error's `failed_generation` field (Groq includes it),
    //   3. if that's unavailable, retry once in plain-text mode and let the
    //      upstream loose parser extract the JSON.
    try {
      const res = await this.client.chat.completions.create({
        ...base,
        response_format: { type: "json_object" },
      });
      return res.choices[0]?.message?.content?.trim() ?? "";
    } catch (err) {
      const salvaged = failedGeneration(err);
      if (salvaged) return salvaged;
      if (!isJsonValidationError(err)) throw err;
      const res = await this.client.chat.completions.create(base); // plain text
      return res.choices[0]?.message?.content?.trim() ?? "";
    }
  }
}

/** Groq attaches the model's raw output to a json-validation 400 here. */
function failedGeneration(err: unknown): string | null {
  const e = err as { error?: { failed_generation?: unknown }; failed_generation?: unknown };
  const fg = e?.error?.failed_generation ?? e?.failed_generation;
  return typeof fg === "string" && fg.trim() ? fg.trim() : null;
}

/** A 400 from Groq's strict JSON mode that the plain-text path can recover from. */
function isJsonValidationError(err: unknown): boolean {
  const e = err as {
    status?: number;
    code?: string;
    error?: { code?: string; message?: string };
  };
  if (e?.status !== 400) return false;
  const code = e?.code ?? e?.error?.code;
  const msg = e?.error?.message ?? "";
  return code === "json_validate_failed" || /failed to generate json/i.test(msg);
}
