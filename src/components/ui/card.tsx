import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--soft)] bg-[var(--surface)] p-5 shadow-[0_12px_24px_-20px_rgba(20,32,30,0.4)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={cn(
        "font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-[var(--ink)]",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/**
 * CardSection — a grouped block inside a Card, separated from siblings by a
 * soft top border. The first section in a card has no divider.
 */
export function CardSection({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-[var(--soft)] pt-4 first:border-t-0 first:pt-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
