"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SUBJECT_COLORS } from "@/lib/constants";
import { createSubject } from "@/lib/actions/subjects";

export function CreateSubjectForm() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const result = await createSubject(name, color);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject-name">Nombre de la materia</Label>
        <Input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Anatomía"
          autoComplete="off"
          required
        />
      </div>

      <div>
        <Label>Color</Label>
        <div
          className="mt-1.5 flex flex-wrap gap-2.5"
          role="radiogroup"
          aria-label="Color de la materia"
        >
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              role="radio"
              aria-checked={color === c}
              aria-label={`Color ${c}`}
              className="h-8 w-8 rounded-full border-2 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] motion-reduce:transition-none"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "var(--ink)" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !name.trim()}
        aria-busy={loading}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {loading ? "Creando..." : "Agregar materia"}
      </Button>
    </form>
  );
}
