import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { extractTextFromPdfBuffer } from "@/lib/pdf/extract-text";
import { extractTopicsWithAI } from "@/lib/ai/extract-topics";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  try {
    const { fileId } = (await request.json()) as { fileId: string };
    if (!fileId) {
      return NextResponse.json({ error: "fileId requerido" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: file, error: fileError } = await supabase
      .from("subject_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    if (file.mime_type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Solo se pueden extraer temas de archivos PDF" },
        { status: 400 },
      );
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from("subject-files")
      .download(file.storage_path);

    if (downloadError || !blob) {
      return NextResponse.json({ error: "No se pudo descargar el archivo" }, { status: 500 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const text = await extractTextFromPdfBuffer(buffer);
    const topics = await extractTopicsWithAI(text);
    const usedAI = Boolean(process.env.ANTHROPIC_API_KEY);

    return NextResponse.json({
      topics,
      sourceFileId: file.id,
      sourceFileName: file.name,
      extractionMethod: usedAI ? "ai" : "heuristic",
      message: usedAI
        ? "Temas sugeridos con IA. Revísalos antes de confirmar."
        : "Temas sugeridos automáticamente (sin clave de IA). Revísalos antes de confirmar.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al procesar PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
