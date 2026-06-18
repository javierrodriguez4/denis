import { PDFParse } from "pdf-parse";

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text = result.text?.trim() ?? "";
  if (text.length < 50) {
    throw new Error(
      "No se pudo extraer texto del PDF. Puede ser un escaneo; sube una versión digital o carga los temas a mano.",
    );
  }
  return text;
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
