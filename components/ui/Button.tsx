import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "gradient";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 active:scale-95";

const variants: Record<Variant, string> = {
  primary:  "bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20",
  secondary: "border-2 border-zinc-200 bg-white px-5 py-2.5 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm",
  danger:   "bg-rose-500 px-5 py-2.5 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30",
  ghost:    "px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
  gradient: "bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02]",
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
