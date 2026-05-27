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
  /** Override the configured model for this call (e.g. a cheaper model for
   *  scoring/planning tasks that don't need the premium content model). */
  model?: string;
}

export interface LLMProvider {
  readonly name: string;
  /** Returns raw text completion. */
  generate(prompt: string, opts?: GenerateOptions): Promise<string>;
}
