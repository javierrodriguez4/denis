import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  /** Optional right-side action link. */
  action?: { label: string; href: string };
  className?: string;
}

/**
 * SectionLabel — uppercase muted eyebrow with an optional right-aligned
 * action link. Used as a lightweight header above stacked content blocks.
 */
export function SectionLabel({ children, action, className }: SectionLabelProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between px-0.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {children}
      </span>
      {action && (
        <Link
          href={action.href}
          className="rounded-md text-[13px] font-medium text-[var(--accent)] outline-none transition-colors hover:text-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
