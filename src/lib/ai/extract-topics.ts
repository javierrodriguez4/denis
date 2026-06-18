import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/openai-client";
import type { SuggestedTopic } from "@/lib/supabase/types";
import { extractTopicsHeuristic } from "@/lib/pdf/extract-text";

const SYSTEM_PROMPT = `Eres un asistente que extrae temas de programas curriculares de medicina.
Analiza el texto y devuelve SOLO un objeto JSON con la forma { "topics": [{ "title": string, "sort_order": number }] }, sin markdown.
El "sort_order" empieza en 0.
Incluye unidades, temas, capítulos o bloques de contenido relevantes para estudiar.
No incluyas metadatos administrativos, bibliografía ni horarios.
Máximo 80 temas.`;

export type ExtractionMethod = "ai" | "heuristic";

export interface ExtractTopicsResult {
  topics: SuggestedTopic[];
  method: ExtractionMethod;
}

export async function extractTopicsWithAI(
  pdfText: string,
): Promise<ExtractTopicsResult> {
  const client = getOpenAIClient();

  if (!client) {
    return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
  }

  const truncated = pdfText.slice(0, 120000);

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extrae los temas de estudio de este programa curricular:\n\n${truncated}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
    }

    const parsed = JSON.parse(content) as unknown;
    const rawTopics = Array.isArray(parsed)
      ? parsed
      : (parsed as { topics?: unknown })?.topics;
    if (!Array.isArray(rawTopics)) {
      return { topics: extractTopicsHeuristic(pdfText), method: "heuristic" };
    }

    const valid = rawTopics.filter(
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
