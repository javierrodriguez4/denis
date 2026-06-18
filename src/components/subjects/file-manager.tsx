"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { FILE_TYPE_LABELS } from "@/lib/constants";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  registerSubjectFile,
  deleteSubjectFile,
  getFileSignedUrl,
} from "@/lib/actions/files";
import type { FileType, SubjectFile } from "@/lib/supabase/types";

export function FileManager({
  subjectId,
  files,
}: {
  subjectId: string;
  files: SubjectFile[];
}) {
  const [fileType, setFileType] = useState<FileType>("program");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const storagePath = `${subjectId}/${crypto.randomUUID()}.${ext}`;
      const supabase = createBrowserClient();

      const { error: uploadError } = await supabase.storage
        .from("subject-files")
        .upload(storagePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const result = await registerSubjectFile({
        subjectId,
        name: file.name,
        fileType,
        storagePath,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });

      if (result.error) {
        await supabase.storage.from("subject-files").remove([storagePath]);
        setError(result.error);
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este archivo?")) return;
    await deleteSubjectFile(id, subjectId);
    router.refresh();
  }

  async function handleOpen(storagePath: string) {
    const url = await getFileSignedUrl(storagePath);
    if (url) window.open(url, "_blank");
  }

  return (
    <Card>
      <CardTitle>Archivos</CardTitle>
      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Tipo de archivo</Label>
            <Select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
            >
              {Object.entries(FILE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleUpload}
              disabled={loading}
            />
            <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
              <Upload className="h-4 w-4" />
              {loading ? "Subiendo..." : "Subir archivo"}
            </span>
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <ul className="divide-y divide-[var(--border)]">
          {files.length === 0 && (
            <li className="py-4 text-sm text-[var(--muted)]">
              Aún no hay archivos. Sube el programa, libros o presentaciones.
            </li>
          )}
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-3">
              <FileText className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {FILE_TYPE_LABELS[file.file_type]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpen(file.storage_path)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
