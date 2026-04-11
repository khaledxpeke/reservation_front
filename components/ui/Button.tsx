import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "gradient";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95";

const variants: Record<Variant, string> = {
  primary:  "bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30",
  secondary: "border-2 border-indigo-100 bg-white px-5 py-2.5 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md",
  danger:   "bg-rose-500 px-5 py-2.5 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30",
  ghost:    "px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50",
  gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-white hover:shadow-lg hover:shadow-purple-500/40 hover:scale-105",
};

export function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
