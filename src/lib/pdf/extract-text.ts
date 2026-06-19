/**
 * Extracts plain text from a PDF buffer.
 *
 * Uses `unpdf` (a serverless-friendly PDF extractor with no native
 * dependencies) instead of pdf-parse, which hangs/fails in Vercel's serverless
 * runtime. The import is dynamic so that merely loading this module — and the
 * server-action chunk it shares with unrelated actions like file upload — never
 * initializes the PDF engine. The engine is only loaded when actually parsing.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const result = (Array.isArray(text) ? text.join("\n") : text).trim();

  if (result.length < 50) {
    throw new Error(
      "No se pudo extraer texto del PDF. Puede ser un escaneo; sube una versión digital o carga los temas a mano.",
    );
  }
  return result;
}

export function extractTopicsHeuristic(text: string): { title: string; sort_order: number }[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && l.length < 200);

  const topicLines = lines.filter((line) =>
    /^(\d+[\.\)]\s|(?:unidad|tema|capítulo|cap\.|modulo|módulo)\s*\d|•|-|\*)/i.test(line),
  );

  const source = topicLines.length >= 3 ? topicLines : lines.slice(0, 30);

  return source.map((title, i) => ({
    title: title.replace(/^(\d+[\.\)]\s|•|-|\*)\s*/, "").trim(),
    sort_order: i,
  }));
}
