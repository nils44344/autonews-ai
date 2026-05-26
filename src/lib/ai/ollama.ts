import { env } from "../env";
import type { GenerateOptions, LLMProvider } from "./types";

// Serialize model inference across the whole process. A CPU-only host can only
// hold one llama runner in memory at a time; two concurrent /api/chat calls each
// spin up a runner and exhaust RAM ("unable to allocate CPU buffer"). This gate
// chains calls so exactly one runs at a time, regardless of worker concurrency.
let inflight: Promise<unknown> = Promise.resolve();
function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const result = inflight.then(fn, fn);
  // Keep the chain alive whether the previous call resolved or rejected.
  inflight = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

// Free, local provider via Ollama's HTTP API (http://localhost:11434).
// Pull a model first:  `ollama pull llama3.1`
export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
    // One inference at a time (see runExclusive) so we never load the model twice.
    return runExclusive(() => this.generateOnce(prompt, opts));
  }

  private async generateOnce(prompt: string, opts: GenerateOptions = {}): Promise<string> {
    // We stream the response. With `stream: false`, Ollama withholds the HTTP
    // response headers until the *entire* generation is finished — on a CPU-only
    // box that can exceed Node's ~5min fetch headers timeout (UND_ERR_HEADERS_TIMEOUT).
    // Streaming makes Ollama send headers immediately and emit tokens as they
    // come, so the request never idles long enough to be aborted.
    const res = await fetch(`${env.OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        stream: true,
        format: opts.json ? "json" : undefined,
        options: {
          temperature: opts.temperature ?? 0.7,
          num_predict: opts.maxTokens ?? 2048,
        },
        messages: [
          ...(opts.system ? [{ role: "system", content: opts.system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }
    if (!res.body) {
      throw new Error("Ollama returned no response body");
    }

    // Ollama streams newline-delimited JSON; concatenate each chunk's content.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let out = "";

    const drain = () => {
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        let chunk: { message?: { content?: string }; error?: string };
        try {
          chunk = JSON.parse(line);
        } catch {
          continue; // ignore partial/non-JSON lines
        }
        if (chunk.error) throw new Error(`Ollama error: ${chunk.error}`);
        if (chunk.message?.content) out += chunk.message.content;
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      drain();
    }
    buffer += decoder.decode();
    drain();

    return out.trim();
  }
}
