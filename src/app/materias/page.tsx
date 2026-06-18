import { MobileHeader } from "@/components/navigation";
import { SetupBanner } from "@/components/setup-banner";
import { Card, CardTitle } from "@/components/ui/card";
import { CreateSubjectForm } from "@/components/subjects/create-subject-form";
import { SubjectCard } from "@/components/subjects/subject-card";
import { getSubjects } from "@/lib/actions/subjects";
import { getSubjectProgress } from "@/lib/actions/planner";

export default async function MateriasPage() {
  const subjects = await getSubjects();
  const progressList = await Promise.all(
    subjects.map(async (s) => ({
      subject: s,
      progress: await getSubjectProgress(s.id),
    })),
  );

  return (
    <>
      <MobileHeader title="Materias" />
      <div className="hidden md:mb-6 md:block">
        <h1 className="text-2xl font-semibold">Materias</h1>
        <p className="text-[var(--muted)]">
          Organiza programas, libros y presentaciones por materia
        </p>
      </div>

      <SetupBanner />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle>Nueva materia</CardTitle>
          <div className="mt-4">
            <CreateSubjectForm />
          </div>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          {progressList.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--muted)]">
                Crea tu primera materia para empezar a organizar tus contenidos.
              </p>
            </Card>
          ) : (
            progressList.map(({ subject, progress }) => (
              <SubjectCard key={subject.id} subject={subject} progress={progress} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
