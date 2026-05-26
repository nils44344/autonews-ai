import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import type { GenerateOptions, LLMProvider } from "./types";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private client: Anthropic;

  constructor() {
    if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
    // Nudge JSON via the system prompt — Anthropic has no response_format flag.
    const system = opts.json
      ? `${opts.system ?? ""}\nRespond with ONLY valid minified JSON, no prose, no markdown fences.`.trim()
      : opts.system;

    const res = await this.client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : "";
  }
}
