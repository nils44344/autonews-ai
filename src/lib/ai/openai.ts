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
    const res = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      response_format: opts.json ? { type: "json_object" } : undefined,
      messages: [
        ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
        { role: "user" as const, content: prompt },
      ],
    });
    return res.choices[0]?.message?.content?.trim() ?? "";
  }
}
