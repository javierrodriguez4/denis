import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SetupBanner } from "@/components/setup-banner";
import { FileManager } from "@/components/subjects/file-manager";
import { TopicManager } from "@/components/subjects/topic-manager";
import { getSubject } from "@/lib/actions/subjects";
import { getSubjectFiles } from "@/lib/actions/files";
import { getTopicsBySubject } from "@/lib/actions/topics";
import { getNextExamForSubject } from "@/lib/actions/calendar";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [subject, files, topics, nextExam] = await Promise.all([
    getSubject(id),
    getSubjectFiles(id),
    getTopicsBySubject(id),
    getNextExamForSubject(id),
  ]);

  if (!subject) notFound();

  const programFiles = files.filter(
    (f) => f.file_type === "program" || f.name.toLowerCase().endsWith(".pdf"),
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Back link */}
      <Link
        href="/materias"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-[var(--muted)] outline-none transition-colors hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a materias
      </Link>

      {/* Page heading */}
      <div className="mb-7 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="h-11 w-11 flex-none rounded-2xl shadow-sm"
          style={{ backgroundColor: subject.color }}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Materia
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-3xl">
            {subject.name}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {topics.length} {topics.length === 1 ? "tema" : "temas"} · {files.length}{" "}
            {files.length === 1 ? "archivo" : "archivos"}
          </p>
        </div>
      </div>

      <SetupBanner />

      {/* Two-column on md+, single column on mobile */}
      <div className="space-y-6 md:grid md:grid-cols-[1fr_320px] md:gap-6 md:space-y-0 md:items-start">
        <TopicManager
          subjectId={id}
          topics={topics}
          programFiles={programFiles}
          nextExamDate={nextExam?.event_date}
        />
        <FileManager subjectId={id} files={files} />
      </div>
    </div>
  );
}
