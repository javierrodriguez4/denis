"use client";

import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { LerBadge } from "@/components/ui/ler-badge";
import { SectionLabel } from "@/components/ui/section-label";
import { updateTopicProgress } from "@/lib/actions/checklist";
import type { TopicWithSubject } from "@/lib/actions/checklist";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the LER·C numeric value (0‒4) from the four boolean fields. */
function lerValue(topic: TopicWithSubject): number {
  return (
    (topic.read_done ? 1 : 0) +
    (topic.studied_done ? 1 : 0) +
    (topic.reviewed_done ? 1 : 0) +
    (topic.choice_done ? 1 : 0)
  );
}

/** A topic is fully done only when all four stages are complete. */
function isFullyDone(topic: TopicWithSubject): boolean {
  return (
    topic.read_done && topic.studied_done && topic.reviewed_done && topic.choice_done
  );
}

/**
 * Translate a LER·C count (0‒4) back to the four individual boolean fields and
 * call updateTopicProgress for each field that actually changed.
 *
 * LER·C model: stages are sequential — completing stage N implies stages 0..N-1
 * are also complete.  The badge reports a new total count.
 */
async function applyLerChange(
  topicId: string,
  prev: TopicWithSubject,
  next: number,
) {
  const desired = {
    read_done: next >= 1,
    studied_done: next >= 2,
    reviewed_done: next >= 3,
    choice_done: next >= 4,
  } as const;

  const calls: Promise<unknown>[] = [];

  if (prev.read_done !== desired.read_done)
    calls.push(updateTopicProgress(topicId, "read_done", desired.read_done));
  if (prev.studied_done !== desired.studied_done)
    calls.push(updateTopicProgress(topicId, "studied_done", desired.studied_done));
  if (prev.reviewed_done !== desired.reviewed_done)
    calls.push(updateTopicProgress(topicId, "reviewed_done", desired.reviewed_done));
  if (prev.choice_done !== desired.choice_done)
    calls.push(updateTopicProgress(topicId, "choice_done", desired.choice_done));

  await Promise.all(calls);
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <Card>
      <p className="text-sm text-[var(--muted)]">
        No hay temas todavía. Creá materias y agregá temas desde el programa curricular.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Subject group card
// ---------------------------------------------------------------------------

interface SubjectGroupProps {
  subjectId: string;
  topics: TopicWithSubject[];
  onToggle: (topic: TopicWithSubject, next: number) => void;
}

function SubjectGroup({ subjectId: _subjectId, topics, onToggle }: SubjectGroupProps) {
  const subject = topics[0].subjects;

  const done = topics.filter(isFullyDone).length;
  const pct = topics.length > 0 ? Math.round((done / topics.length) * 100) : 0;

  return (
    <Card className="p-0 overflow-hidden">
      {/* Subject header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div
          className="h-9 w-9 shrink-0 rounded-xl"
          style={{ backgroundColor: subject.color }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <CardTitle>{subject.name}</CardTitle>
          {/* Inline progress bar + pct */}
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--soft)]"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${subject.name}: ${pct}%`}
            >
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className="text-xs tabular-nums font-semibold font-[family-name:var(--font-display)] text-[var(--muted)] min-w-[2.5rem] text-right"
              aria-hidden="true"
            >
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Topic rows */}
      <ul className="border-t border-[var(--soft)] divide-y divide-[var(--soft)]">
        {topics.map((topic) => (
          <TopicItem key={topic.id} topic={topic} onToggle={onToggle} />
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Single topic item
// ---------------------------------------------------------------------------

interface TopicItemProps {
  topic: TopicWithSubject;
  onToggle: (topic: TopicWithSubject, next: number) => void;
}

function TopicItem({ topic, onToggle }: TopicItemProps) {
  const ler = lerValue(topic);

  return (
    <li className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[var(--accent-soft)]/30">
      {/* Colored subject tick */}
      <span
        aria-hidden="true"
        className="w-1.5 flex-none self-stretch rounded-full bg-[var(--accent)]"
        style={{
          opacity: ler === 4 ? 1 : ler >= 1 ? 0.6 : 0.25,
        }}
      />

      {/* Topic name */}
      <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--ink)]">
        {topic.title}
      </span>

      {/* Interactive LER badge — individual button aria-labels come from LerBadge itself */}
      <LerBadge
        value={ler}
        onChange={(next) => onToggle(topic, next)}
        size="sm"
        segments={4}
      />
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ChecklistView({ topics }: { topics: TopicWithSubject[] }) {
  const router = useRouter();

  if (topics.length === 0) return <EmptyState />;

  // Group by subject, preserving the original sort order
  const grouped = topics.reduce<Record<string, TopicWithSubject[]>>((acc, t) => {
    if (!acc[t.subject_id]) acc[t.subject_id] = [];
    acc[t.subject_id].push(t);
    return acc;
  }, {});

  async function handleToggle(topic: TopicWithSubject, next: number) {
    await applyLerChange(topic.id, topic, next);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <SectionLabel>Temas por materia</SectionLabel>
      {Object.entries(grouped).map(([subjectId, subjectTopics]) => (
        <SubjectGroup
          key={subjectId}
          subjectId={subjectId}
          topics={subjectTopics}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
