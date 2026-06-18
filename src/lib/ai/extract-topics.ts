import Anthropic from "@anthropic-ai/sdk";
import type { SuggestedTopic } from "@/lib/supabase/types";
import { extractTopicsHeuristic } from "@/lib/pdf/extract-text";

const SYSTEM_PROMPT = `Eres un asistente que extrae temas de programas curriculares de medicina.
Analiza el texto y devuelve SOLO un JSON array de objetos con "title" (string) y "sort_order" (number empezando en 0).
Incluye unidades, temas, capítulos o bloques de contenido relevantes para estudiar.
No incluyas metadatos administrativos, bibliografía ni horarios.
Máximo 80 temas. Responde únicamente con el JSON, sin markdown.`;

export type ExtractionMethod = "ai" | "heuristic";

export interface ExtractTopicsResult {
  topics: SuggestedTopic[];
  method: ExtractionMethod;
}

export async function extractTopicsWithAI(
  pdfText: string,
): Promise<ExtractTopicsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
  }

  const truncated = pdfText.slice(0, 120000);
  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extrae los temas de estudio de este programa curricular:\n\n${truncated}`,
        },
      ],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
    }

    const parsed = JSON.parse(block.text.trim()) as unknown;
    if (!Array.isArray(parsed)) {
      return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
    }

    const valid = parsed.filter(
      (t): t is { title: string; sort_order?: number } =>
        t != null &&
        typeof t === "object" &&
        typeof (t as { title?: unknown }).title === "string" &&
        (t as { title: string }).title.trim().length > 0,
    );
    if (valid.length === 0) {
      return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
    }

    const topics = valid.map((t, i) => ({
      title: t.title.trim(),
      sort_order: typeof t.sort_order === "number" ? t.sort_order : i,
    }));
    return { topics, method: "ai" };
  } catch (err) {
    console.error("AI topic extraction failed; falling back to heuristic:", err);
    return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
  }
}
