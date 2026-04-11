type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "gradient";

const styles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200 shadow-sm",
  success: "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shadow-emerald-100",
  warning: "bg-amber-100 text-amber-800 border border-amber-200 shadow-sm shadow-amber-100",
  danger: "bg-rose-100 text-rose-800 border border-rose-200 shadow-sm shadow-rose-100",
  info: "bg-sky-100 text-sky-800 border border-sky-200 shadow-sm shadow-sky-100",
  gradient: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200 border-none",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}

const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "En attente", variant: "warning" },
  CONFIRMED: { label: "Confirmée", variant: "success" },
  REJECTED: { label: "Refusée", variant: "danger" },
  CANCELLED: { label: "Annulée", variant: "default" },
  APPROVED: { label: "Approuvée", variant: "success" },
  ACTIVE: { label: "Actif", variant: "success" },
  BLOCKED: { label: "Bloqué", variant: "danger" },
};

export function StatusBadge({ status }: { status: string }) {
  const mapped = statusMap[status];
  if (!mapped) return <Badge>{status}</Badge>;
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
}
