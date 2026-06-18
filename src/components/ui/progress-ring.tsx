import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** Progress from 0 to 1. */
  value: number;
  /** Large numeric/text label rendered in the center (e.g. "2/3"). */
  label?: React.ReactNode;
  /** Small caption under the label (e.g. "hoy"). */
  caption?: React.ReactNode;
  /** sm = r32 / lg = r36. */
  size?: "sm" | "lg";
  /** Accessible description; defaults to a percentage. */
  ariaLabel?: string;
  className?: string;
}

const RING = {
  sm: { box: 74, r: 32, stroke: 6, label: "text-[17px]" },
  lg: { box: 86, r: 36, stroke: 6.5, label: "text-[20px]" },
} as const;

export function ProgressRing({
  value,
  label,
  caption,
  size = "sm",
  ariaLabel,
  className,
}: ProgressRingProps) {
  const cfg = RING[size];
  const clamped = Math.min(1, Math.max(0, value));
  const circumference = 2 * Math.PI * cfg.r;
  const offset = circumference * (1 - clamped);
  const center = cfg.box / 2;
  const description = ariaLabel ?? `${Math.round(clamped * 100)}% completado`;

  return (
    <div
      className={cn("relative flex-none", className)}
      style={{ width: cfg.box, height: cfg.box }}
      role="img"
      aria-label={description}
    >
      <svg
        width={cfg.box}
        height={cfg.box}
        viewBox={`0 0 ${cfg.box} ${cfg.box}`}
        className="-rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={cfg.r}
          fill="none"
          strokeWidth={cfg.stroke}
          className="stroke-[var(--soft)]"
        />
        <circle
          cx={center}
          cy={center}
          r={cfg.r}
          fill="none"
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-[var(--accent)] [transition:stroke-dashoffset_1.1s_cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label != null && (
          <span
            className={cn(
              "font-[family-name:var(--font-display)] font-semibold leading-none text-[var(--ink)]",
              cfg.label,
            )}
          >
            {label}
          </span>
        )}
        {caption != null && (
          <span className="mt-0.5 text-[10px] text-[var(--muted)]">{caption}</span>
        )}
      </div>
    </div>
  );
}
