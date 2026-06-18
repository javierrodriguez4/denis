import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MobileHeader } from "@/components/navigation";
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
    <>
      <MobileHeader title={subject.name} />
      <Link
        href="/materias"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a materias
      </Link>

      <div className="mb-6 hidden md:flex md:items-center md:gap-3">
        <div
          className="h-12 w-12 rounded-2xl"
          style={{ backgroundColor: subject.color }}
        />
        <div>
          <h1 className="text-2xl font-semibold">{subject.name}</h1>
          <p className="text-[var(--muted)]">{topics.length} temas · {files.length} archivos</p>
        </div>
      </div>

      <SetupBanner />

      <div className="space-y-6">
        <FileManager subjectId={id} files={files} />
        <TopicManager
          subjectId={id}
          topics={topics}
          programFiles={programFiles}
          nextExamDate={nextExam?.event_date}
        />
      </div>
    </>
  );
}
