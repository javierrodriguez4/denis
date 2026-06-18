import { MobileHeader } from "@/components/navigation";
import { SetupBanner } from "@/components/setup-banner";
import { ChecklistView } from "@/components/checklist/checklist-view";
import { getAllTopicsWithProgress } from "@/lib/actions/checklist";

export default async function ChecklistPage() {
  const topics = await getAllTopicsWithProgress();

  return (
    <>
      <MobileHeader title="Checklist" />
      <div className="hidden md:mb-6 md:block">
        <h1 className="text-2xl font-semibold">Checklist</h1>
        <p className="text-[var(--muted)]">
          Marca cada tema como leído, estudiado o resumido
        </p>
      </div>

      <SetupBanner />
      <ChecklistView topics={topics} />
    </>
  );
}
