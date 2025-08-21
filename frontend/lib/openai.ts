// frontend/lib/openai.ts
import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Kasta först när klienten faktiskt används (runtime), inte vid import (build)
    throw new Error(
      "OPENAI_API_KEY is missing. Set it in your environment variables."
    );
  }
  return new OpenAI({ apiKey });
}
