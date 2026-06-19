import { cn } from "@/lib/utils";

interface UserChipProps {
  /** Display name (e.g. "Javi"). */
  name: string;
  /** Secondary line (e.g. an email or role). */
  subtitle?: string;
  /** Avatar initial override; defaults to the first letter of `name`. */
  initial?: string;
  className?: string;
  /** Optional trailing control (e.g. a logout button). */
  trailing?: React.ReactNode;
}

/**
 * UserChip — avatar initial + name + subtitle, with an optional trailing
 * control slot (used for the logout button).
 */
export function UserChip({
  name,
  subtitle,
  initial,
  className,
  trailing,
}: UserChipProps) {
  const letter = (initial ?? name.charAt(0) ?? "?").toUpperCase();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        aria-hidden="true"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--soft)] bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-[13px] font-semibold text-[var(--accent)]"
      >
        {letter}
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[13.5px] font-semibold leading-tight text-[var(--ink)]">
          {name}
        </b>
        {subtitle && (
          <span className="block truncate text-[11.5px] text-[var(--muted)]">
            {subtitle}
          </span>
        )}
      </div>
      {trailing}
    </div>
  );
}
