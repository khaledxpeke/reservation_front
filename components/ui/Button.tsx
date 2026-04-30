import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "dark";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";

const sizes: Record<Size, string> = {
  sm:   "px-3 py-1.5 text-xs",
  md:   "px-5 py-2.5 text-sm",
  lg:   "px-6 py-3 text-sm",
  icon: "h-9 w-9 text-sm",
};

const variants: Record<Variant, string> = {
  primary:   "bg-teal-500 text-white hover:bg-teal-600",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  outline:   "border border-teal-500 bg-white text-teal-600 hover:bg-teal-50",
  danger:    "bg-rose-500 text-white hover:bg-rose-600",
  ghost:     "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  dark:      "bg-slate-900 text-white hover:bg-slate-800",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
