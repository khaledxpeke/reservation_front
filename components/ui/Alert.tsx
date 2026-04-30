import type { ReactNode } from "react";

type Variant = "error" | "warning" | "success" | "info";

const styles: Record<Variant, string> = {
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  success:
    "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200",
  info:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
};

export function Alert({
  variant = "error",
  children,
  hint,
}: {
  variant?: Variant;
  children: ReactNode;
  hint?: string | null;
}) {
  const showHint = variant === "error" && hint;

  return (
    <div className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
      <p>{children}</p>
      {showHint ? (
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold opacity-70"
          title={hint}
          aria-label="Détails de l'erreur"
        >
          ?
        </span>
      ) : null}
    </div>
  );
}
