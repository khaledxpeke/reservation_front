import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

type FieldSize = "sm" | "md";

const fieldBase =
  "w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 hover:border-zinc-300";

const fieldSizes: Record<FieldSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function FormField({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-zinc-700">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}

export function Input({
  size = "md",
  className = "",
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: FieldSize }) {
  return <input className={`${fieldBase} ${fieldSizes[size]} ${className}`} {...rest} />;
}

export function Select({
  size = "md",
  className = "",
  children,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: FieldSize }) {
  return (
    <select className={`${fieldBase} ${fieldSizes[size]} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({
  size = "md",
  className = "",
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & { size?: FieldSize }) {
  return <textarea className={`${fieldBase} ${fieldSizes[size]} ${className}`} {...rest} />;
}
