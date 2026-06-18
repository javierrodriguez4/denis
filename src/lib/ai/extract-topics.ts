import Anthropic from "@anthropic-ai/sdk";
import type { SuggestedTopic } from "@/lib/supabase/types";
import { extractTopicsHeuristic } from "@/lib/pdf/extract-text";

const SYSTEM_PROMPT = `Eres un asistente que extrae temas de programas curriculares de medicina.
Analiza el texto y devuelve SOLO un JSON array de objetos con "title" (string) y "sort_order" (number empezando en 0).
Incluye unidades, temas, capítulos o bloques de contenido relevantes para estudiar.
No incluyas metadatos administrativos, bibliografía ni horarios.
Máximo 80 temas. Responde únicamente con el JSON, sin markdown.`;

export async function extractTopicsWithAI(
  pdfText: string,
): Promise<SuggestedTopic[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return extractTopicsHeuristic(pdfText);
  }

  const truncated = pdfText.slice(0, 120000);
  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
      return extractTopicsHeuristic(pdfText);
    }

    const parsed = JSON.parse(block.text.trim()) as SuggestedTopic[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return extractTopicsHeuristic(pdfText);
    }

    return parsed.map((t, i) => ({
      title: String(t.title).trim(),
      sort_order: t.sort_order ?? i,
    }));
  } catch {
    return extractTopicsHeuristic(pdfText);
  }
}
