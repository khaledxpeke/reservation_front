"use client";

import { useCallback } from "react";
import {
  listAllOffersAdmin,
  updateOfferApproval,
  type Offer,
  RECURRENCE_LABELS,
  DAY_LABELS,
} from "@/lib/api/offers";
import { useApi, useMutation } from "@/hooks/useApi";
import {
  Alert,
  CheckIcon,
  DataTable,
  EmptyState,
  IconButton,
  PageHeader,
  RepeatIcon,
  StatusBadge,
  TableActions,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TableSkeleton,
  XIcon,
} from "@/components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

function scheduleCell(o: Offer) {
  if (o.recurrence === "NONE") {
    const from = o.validFrom ? fmtDate(o.validFrom) : "—";
    const to   = o.validUntil ? fmtDate(o.validUntil) : "—";
    return (
      <span className="text-zinc-500 text-xs">{from} → {to}</span>
    );
  }
  const days = o.recurrenceDays.map((d) => DAY_LABELS[d]).join(", ");
  const time = o.timeStart && o.timeEnd ? `${o.timeStart}–${o.timeEnd}` : null;
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700">
        <RepeatIcon />
        {RECURRENCE_LABELS[o.recurrence]}{days ? ` (${days})` : ""}
      </span>
      {time && <span className="text-xs text-zinc-400">{time}</span>}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOffersPage() {
  const fetcher = useCallback(() => listAllOffersAdmin({ limit: 100 }).then((d) => d.items), []);
  const { data: offers, loading, error, reload } = useApi<Offer[]>(fetcher);
  const approvalMut = useMutation(updateOfferApproval);

  const decide = async (id: string, status: "APPROVED" | "REJECTED") => {
    const ok = await approvalMut.execute(id, status);
    if (ok !== null) reload();
  };

  const pending  = offers?.filter((o) => o.approvalStatus === "PENDING").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Modération des offres"
          description="Approuvez ou rejetez les offres soumises par les partenaires."
        />
        {pending > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {pending} en attente
          </span>
        )}
      </div>

      {(error || approvalMut.error) && (
        <div className="mb-4"><Alert>{error || approvalMut.error}</Alert></div>
      )}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : !offers || offers.length === 0 ? (
        <EmptyState title="Aucune offre" description="Les offres soumises par les partenaires apparaîtront ici." />
      ) : (
        <TableCard>
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Offre</TableHeadCell>
                <TableHeadCell>Partenaire</TableHeadCell>
                <TableHeadCell>Réduction</TableHeadCell>
                <TableHeadCell>Planification</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <p className="font-semibold text-zinc-900">{o.title}</p>
                    {o.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{o.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-600">{o.partner?.name ?? "—"}</TableCell>
                  <TableCell>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      −{o.discountPercent}%
                    </span>
                  </TableCell>
                  <TableCell>{scheduleCell(o)}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.approvalStatus} />
                  </TableCell>
                  <TableCell>
                    <TableActions>
                      {o.approvalStatus !== "APPROVED" && (
                        <IconButton onClick={() => void decide(o.id, "APPROVED")} title="Approuver" color="success" size="sm">
                          <CheckIcon />
                        </IconButton>
                      )}
                      {o.approvalStatus !== "REJECTED" && (
                        <IconButton onClick={() => void decide(o.id, "REJECTED")} title="Rejeter" color="danger" size="sm">
                          <XIcon />
                        </IconButton>
                      )}
                    </TableActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </TableCard>
      )}
    </div>
  );
}
