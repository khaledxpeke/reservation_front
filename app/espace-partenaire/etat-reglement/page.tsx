"use client";

import { useCallback, useEffect, useState } from "react";
import {
  downloadFacturePdf,
  listPartnerFactures,
  type EtatReglementResult,
  type FactureRow,
  type FactureStatus,
} from "@/lib/api/factures";
import { ApiError } from "@/lib/api/types";
import {
  Alert,
  Button,
  DataTable,
  DatePicker,
  Input,
  PageHeader,
  Select,
  TableBody,
  TableCard,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeadCell,
  TablePagination,
  TableRow,
  TableSkeleton,
} from "@/components/ui";

type DatePreset = "today" | "yesterday" | "week" | "month" | "year" | "custom";

function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateRangeForPreset(preset: DatePreset, customFrom: string, customTo: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (preset === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else if (preset === "month") {
    start.setDate(1);
  } else if (preset === "year") {
    start.setMonth(0, 1);
  } else if (preset === "custom") {
    return { dateFrom: customFrom, dateTo: customTo || customFrom };
  }

  return { dateFrom: toISODate(start), dateTo: toISODate(end) };
}

function asNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: string | number | null | undefined) {
  return `${asNumber(value).toFixed(2)} DT`;
}

function formatDateFR(d: string) {
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}

function FactureStatusBadge({ status }: { status: FactureStatus }) {
  const styles: Record<FactureStatus, string> = {
    UNPAID: "bg-amber-100 text-amber-800 border-amber-200",
    PARTIAL: "bg-sky-100 text-sky-800 border-sky-200",
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  const labels: Record<FactureStatus, string> = {
    UNPAID: "Non réglée",
    PARTIAL: "Partielle",
    PAID: "Réglée",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function PartnerEtatReglementPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState(toISODate(new Date()));
  const [customTo, setCustomTo] = useState(toISODate(new Date()));
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<"" | FactureStatus>("");
  const [data, setData] = useState<EtatReglementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, filters = { datePreset, customFrom, customTo, clientName, status }) => {
      setLoading(true);
      setError(null);
      try {
        const range = dateRangeForPreset(filters.datePreset, filters.customFrom, filters.customTo);
        const facturesData = await listPartnerFactures({
          page: p,
          limit: 15,
          ...range,
          ...(filters.clientName.trim() ? { clientName: filters.clientName.trim() } : {}),
          ...(filters.status ? { status: filters.status } : {}),
        });
        setData(facturesData);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [datePreset, customFrom, customTo, clientName, status],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const applyFilters = (next: { datePreset?: DatePreset; customFrom?: string; customTo?: string; clientName?: string; status?: "" | FactureStatus }) => {
    const filters = {
      datePreset: next.datePreset ?? datePreset,
      customFrom: next.customFrom ?? customFrom,
      customTo: next.customTo ?? customTo,
      clientName: next.clientName ?? clientName,
      status: next.status ?? status,
    };
    void load(1, filters);
  };

  const downloadPdf = async (facture: FactureRow) => {
    setDownloadError(null);
    try {
      await downloadFacturePdf(facture.id, facture.reference);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Téléchargement impossible.");
    }
  };

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etat règlement"
        description="Consultez les commissions générées lorsque vous marquez vos réservations comme payées."
      />

      {(error || downloadError) && <Alert>{error || downloadError}</Alert>}

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2">
        <Select
          size="sm"
          value={datePreset}
          onChange={(e) => {
            const next = e.target.value as DatePreset;
            setDatePreset(next);
            applyFilters({ datePreset: next });
          }}
          className="!w-40 shrink-0"
        >
          <option value="today">Aujourd&apos;hui</option>
          <option value="yesterday">Hier</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
          <option value="custom">Dates personnalisées</option>
        </Select>
        {datePreset === "custom" && (
          <>
            <DatePicker
              size="sm"
              value={customFrom}
              max={customTo}
              onChange={(next) => {
                setCustomFrom(next);
                applyFilters({ customFrom: next });
              }}
              className="!w-36 shrink-0"
            />
            <DatePicker
              size="sm"
              value={customTo}
              min={customFrom}
              onChange={(next) => {
                setCustomTo(next);
                applyFilters({ customTo: next });
              }}
              className="!w-36 shrink-0"
            />
          </>
        )}
        <Input
          size="sm"
          type="search"
          placeholder="Nom du client"
          value={clientName}
          onChange={(e) => {
            setClientName(e.target.value);
            applyFilters({ clientName: e.target.value });
          }}
          className="!w-56 shrink-0"
        />
        <Select
          size="sm"
          value={status}
          onChange={(e) => {
            const next = e.target.value as "" | FactureStatus;
            setStatus(next);
            applyFilters({ status: next });
          }}
          className="!w-40 shrink-0"
        >
          <option value="">Tous les statuts</option>
          <option value="UNPAID">Non réglée</option>
          <option value="PARTIAL">Partielle</option>
          <option value="PAID">Réglée</option>
        </Select>
      </div>

      {totals && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total à payer</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{money(totals.totalDue)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total payé</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{money(totals.totalPaid)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Reste</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{money(totals.remaining)}</p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <TableSkeleton rows={8} />
      ) : (
        <TableCard>
          <DataTable>
            <TableHead>
              <tr>
                <TableHeadCell>Facture</TableHeadCell>
                <TableHeadCell>Réservation</TableHeadCell>
                <TableHeadCell>Montants</TableHeadCell>
                <TableHeadCell align="right">Action</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {!data?.items.length ? (
                <TableEmptyRow colSpan={4}>Aucune facture trouvée.</TableEmptyRow>
              ) : (
                data.items.map((facture) => {
                  const remaining = asNumber(facture.amountDue) - asNumber(facture.amountPaid);
                  return (
                    <TableRow key={facture.id} className="align-top">
                      <TableCell className="w-[22%]">
                        <p className="break-words font-semibold leading-snug text-zinc-900">{facture.reference}</p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDateFR(facture.generatedAt)}</p>
                        <div className="mt-2">
                          <FactureStatusBadge status={facture.status} />
                        </div>
                      </TableCell>
                      <TableCell className="w-[34%]">
                        <p className="font-semibold text-zinc-900">{facture.reservation.reference}</p>
                        <p className="font-semibold text-zinc-900">{facture.reservation.guestName}</p>
                        <p className="text-xs text-zinc-500">{facture.reservation.guestPhone}</p>
                        <p className="mt-2 text-sm font-medium text-zinc-800">{formatDateFR(facture.reservation.date)}</p>
                        <p className="text-xs text-zinc-500">
                          {facture.reservation.startTime} - {facture.reservation.endTime}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{facture.reservation.resource.name}</p>
                      </TableCell>
                      <TableCell className="w-[30%]">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <span className="text-zinc-500">Total</span>
                          <strong className="text-right text-zinc-900">{money(facture.reservationTotal)}</strong>
                          <span className="text-zinc-500">Marge</span>
                          <strong className="text-right text-zinc-900">{asNumber(facture.commissionPercent).toFixed(2)} %</strong>
                          <span className="text-zinc-500">À payer</span>
                          <strong className="text-right text-zinc-900">{money(facture.amountDue)}</strong>
                          <span className="text-zinc-500">Payé</span>
                          <strong className="text-right text-emerald-700">{money(facture.amountPaid)}</strong>
                          <span className="text-zinc-500">Reste</span>
                          <strong className="text-right text-amber-700">{money(remaining)}</strong>
                        </div>
                      </TableCell>
                      <TableCell align="right" className="w-[14%]">
                        <Button size="sm" variant="secondary" onClick={() => void downloadPdf(facture)}>
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </DataTable>

          {data && (
            <TablePagination
              total={data.pagination.total}
              label="facture"
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              loading={loading}
              onPrev={() => void load(data.pagination.page - 1)}
              onNext={() => void load(data.pagination.page + 1)}
            />
          )}
        </TableCard>
      )}
    </div>
  );
}
