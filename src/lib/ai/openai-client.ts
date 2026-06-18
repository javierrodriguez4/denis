import OpenAI from "openai";

/**
 * Default model for all AI calls. Override via the OPENAI_MODEL env var.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

/**
 * Returns a configured OpenAI client, or null when no API key is present so
 * callers can fall back to deterministic/heuristic behavior.
 */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
