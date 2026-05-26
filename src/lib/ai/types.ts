export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask the model to return strict JSON. */
  json?: boolean;
}

export interface LLMProvider {
  readonly name: string;
  /** Returns raw text completion. */
  generate(prompt: string, opts?: GenerateOptions): Promise<string>;
}
