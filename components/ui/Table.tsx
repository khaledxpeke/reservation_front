import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  ReactNode,
} from "react";
import { Button } from "./Button";

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function TableCard({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClasses(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DataTable({
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={joinClasses("w-full text-left text-sm", className)} {...props}>
      {children}
    </table>
  );
}

export function TableHead({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={joinClasses("border-b border-zinc-200 bg-zinc-50", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={joinClasses("divide-y divide-zinc-100", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={joinClasses("transition-colors hover:bg-zinc-50", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHeadCell({
  children,
  className,
  align = "left",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      className={joinClasses(
        "px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={joinClasses("px-5 py-3", className)} {...props}>
      {children}
    </td>
  );
}

export function TableEmptyRow({
  children,
  colSpan,
}: {
  children: ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-zinc-400">
        {children}
      </td>
    </tr>
  );
}

export function TableActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function TablePagination({
  total,
  label,
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: {
  total: number;
  label: string;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
      <span className="text-xs text-zinc-500">
        {total} {label}
        {total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={onPrev}>
          ← Préc.
        </Button>
        <span className="text-xs text-zinc-500">
          {page} / {totalPages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={onNext}>
          Suiv. →
        </Button>
      </div>
    </div>
  );
}
