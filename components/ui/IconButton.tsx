import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonColor = "default" | "danger" | "success" | "warning";
type IconButtonSize = "sm" | "md";

const colors: Record<IconButtonColor, string> = {
  default: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-700",
  success: "text-teal-600 hover:bg-teal-50 hover:text-teal-800",
  warning: "text-amber-600 hover:bg-amber-50 hover:text-amber-800",
};

const sizes: Record<IconButtonSize, string> = {
  sm: "h-8 w-8 rounded-xl",
  md: "rounded-lg p-2",
};

export function IconButton({
  color = "default",
  size = "md",
  children,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: IconButtonColor;
  size?: IconButtonSize;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center transition disabled:opacity-40 ${sizes[size]} ${colors[color]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
