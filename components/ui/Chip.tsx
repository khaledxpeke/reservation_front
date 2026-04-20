import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1";

export function Chip({
  active = false,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
}) {
  const state = active
    ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
    : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700";
  return (
    <button type="button" className={`${base} ${state} ${className}`} {...rest}>
      {children}
    </button>
  );
}
