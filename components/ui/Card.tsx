import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
      <dt className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-2 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{value}</dd>
      {detail && <p className="mt-2 text-xs font-medium text-slate-400 bg-slate-100 inline-block px-2 py-1 rounded-md">{detail}</p>}
    </Card>
  );
}
