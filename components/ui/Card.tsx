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
    <Card className="p-6 bg-white border border-zinc-200">
      <dt className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-2 text-4xl font-black text-zinc-900">{value}</dd>
      {detail && <p className="mt-2 text-xs font-bold text-teal-700 bg-teal-50 inline-block px-2.5 py-1 rounded-md uppercase tracking-wide">{detail}</p>}
    </Card>
  );
}
