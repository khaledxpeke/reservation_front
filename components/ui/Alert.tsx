import type { ReactNode } from "react";

type Variant = "error" | "warning" | "success" | "info";

const styles: Record<Variant, string> = {
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  info:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
};

export function Alert({
  variant = "error",
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <p className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </p>
  );
}
