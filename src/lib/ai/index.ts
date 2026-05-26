import { env } from "../env";
import { AnthropicProvider } from "./anthropic";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import type { GenerateOptions, LLMProvider } from "./types";

let cached: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (cached) return cached;
  switch (env.AI_PROVIDER) {
    case "openai":
      cached = new OpenAIProvider();
      break;
    case "anthropic":
      cached = new AnthropicProvider();
      break;
    case "ollama":
    default:
      cached = new OllamaProvider();
  }
  return cached;
}

export async function generate(prompt: string, opts?: GenerateOptions): Promise<string> {
  return getProvider().generate(prompt, opts);
}

/**
 * Generate and parse strict JSON. Tolerates models that wrap JSON in prose or
 * markdown fences by extracting the first balanced {...} / [...] block.
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  opts?: GenerateOptions,
): Promise<T> {
  const raw = await generate(prompt, { ...opts, json: true });
  return parseLooseJSON<T>(raw);
}

export function parseLooseJSON<T = unknown>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to extracting the first balanced object/array.
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Could not parse JSON from model output: ${raw.slice(0, 200)}`);
  }
}

export type { GenerateOptions, LLMProvider };
