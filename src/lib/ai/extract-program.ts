import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/openai-client";
import { PROGRAM_SYSTEM_PROMPT, type ProgramData } from "@/lib/ai/program-schema";

function isProgramData(value: unknown): value is ProgramData {
  if (value == null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.materia === "string" &&
    typeof v.anio === "number" &&
    typeof v.cuatrimestre === "string" &&
    Array.isArray(v.comisiones) &&
    Array.isArray(v.seminarios) &&
    Array.isArray(v.examenes)
  );
}

/**
 * Extracts the structured program data from a syllabus PDF's text using OpenAI.
 * Returns null when no API key is configured or parsing fails — the caller is
 * responsible for surfacing a useful message to the student.
 */
export async function extractProgram(pdfText: string): Promise<ProgramData | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const truncated = pdfText.slice(0, 120000);

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PROGRAM_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analizá este programa de materia y devolvé el JSON estructurado:\n\n${truncated}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as unknown;
    if (!isProgramData(parsed)) return null;
    return parsed;
  } catch (err) {
    console.error("Program extraction failed:", err);
    return null;
  }
}
