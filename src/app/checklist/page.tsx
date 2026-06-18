import { SetupBanner } from "@/components/setup-banner";
import { ChecklistView } from "@/components/checklist/checklist-view";
import { getAllTopicsWithProgress } from "@/lib/actions/checklist";

export default async function ChecklistPage() {
  const topics = await getAllTopicsWithProgress();

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Page heading — eyebrow + display h1, matching serena visual language */}
      <header className="mb-6 px-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Estudio
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--ink)] md:text-[2rem]">
          Checklist
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Marcá cada tema como leído, estudiado y repasado.
        </p>
      </header>

      <SetupBanner />
      <ChecklistView topics={topics} />
    </div>
  );
}
