"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Card, CardTitle, CardSection } from "@/components/ui/card";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createBrowserClient();

      // Storage is partitioned per user: the first path segment must be the
      // user id (the storage RLS policy enforces this).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tu sesión expiró. Vuelve a iniciar sesión.");
        return;
      }

      const ext = file.name.split(".").pop() ?? "bin";
      const storagePath = `${user.id}/${subjectId}/${crypto.randomUUID()}.${ext}`;

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

      {/* Upload section */}
      <CardSection className="mt-4 space-y-3">
        <div>
          <Label htmlFor="file-type-select">Tipo de archivo</Label>
          <Select
            id="file-type-select"
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

        {/* Hidden file input, triggered by the button */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
          className="sr-only"
          aria-label="Seleccionar archivo para subir"
          onChange={handleUpload}
          disabled={loading}
        />
        <Button
          variant="secondary"
          className="w-full"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          aria-busy={loading}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {loading ? "Subiendo…" : "Subir archivo"}
        </Button>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </CardSection>

      {/* File list */}
      <CardSection className="mt-4">
        {files.length === 0 ? (
          <p className="py-2 text-sm text-[var(--muted)]">
            Aún no hay archivos. Sube el programa, libros o presentaciones.
          </p>
        ) : (
          <ul role="list" className="divide-y divide-[var(--soft)]">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <FileText
                  className="h-4 w-4 shrink-0 text-[var(--muted)]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {FILE_TYPE_LABELS[file.file_type]}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpen(file.storage_path)}
                  aria-label={`Abrir ${file.name}`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  aria-label={`Eliminar ${file.name}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardSection>
    </Card>
  );
}
