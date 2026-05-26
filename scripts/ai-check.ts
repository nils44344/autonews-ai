// Quick check that the configured AI provider (Groq via OpenAI-compatible API) responds.
import { generate } from "../src/lib/ai";
import { env } from "../src/lib/env";

async function main() {
  console.log(`provider=${env.AI_PROVIDER} model=${env.OPENAI_MODEL} base=${env.OPENAI_BASE_URL ?? "(default)"}`);
  const t0 = Date.now();
  const out = await generate("In one short sentence, confirm you are working.", { maxTokens: 60 });
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s) reply: ${out}`);
}

main().catch((e) => {
  console.error("AI CHECK FAILED:", (e as Error).message);
  process.exit(1);
});
