import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
        variant === "secondary" &&
          "border border-[var(--soft)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--soft)]",
        variant === "ghost" && "text-[var(--ink)] hover:bg-[var(--soft)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
