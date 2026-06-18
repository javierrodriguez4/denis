import { cn } from "@/lib/utils";

interface UserChipProps {
  /** Display name (e.g. "Javi"). */
  name: string;
  /** Secondary line (e.g. "Medicina · 3.º año"). */
  subtitle?: string;
  /** Avatar initial override; defaults to the first letter of `name`. */
  initial?: string;
  className?: string;
}

/**
 * UserChip — avatar initial + name + subtitle. Placeholder-safe: it renders
 * purely from props and has no auth dependency yet.
 */
export function UserChip({ name, subtitle, initial, className }: UserChipProps) {
  const letter = (initial ?? name.charAt(0) ?? "?").toUpperCase();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        aria-hidden="true"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--soft)] bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-[13px] font-semibold text-[var(--accent)]"
      >
        {letter}
      </div>
      <div className="min-w-0">
        <b className="block truncate text-[13.5px] font-semibold leading-tight text-[var(--ink)]">
          {name}
        </b>
        {subtitle && (
          <span className="block truncate text-[11.5px] text-[var(--muted)]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
