"use client";

import { useCallback, useEffect, useState } from "react";
import {
  downloadFacturePdf,
  listEtatReglement,
  updateFacturePayment,
  type FactureRow,
  type FactureStatus,
  type EtatReglementResult,
} from "@/lib/api/factures";
import { listPartnersAdmin, type PartnerListItem } from "@/lib/api/partners";
import { useMutation } from "@/hooks/useApi";
import { ApiError, type Paginated } from "@/lib/api/types";
import {
  Alert,
  Button,
  DataTable,
  DatePicker,
  FormField,
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
  XIcon,
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

export default function EtatReglementPage() {
  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState(toISODate(new Date()));
  const [customTo, setCustomTo] = useState(toISODate(new Date()));
  const [partnerId, setPartnerId] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<"" | FactureStatus>("");
  const [data, setData] = useState<EtatReglementResult | null>(null);
  const [partners, setPartners] = useState<Paginated<PartnerListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFacture, setPaymentFacture] = useState<FactureRow | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  const paymentMut = useMutation(updateFacturePayment);

  const load = useCallback(
    async (p: number, filters = { datePreset, customFrom, customTo, partnerId, clientName, status }) => {
      setLoading(true);
      setError(null);
      try {
        const range = dateRangeForPreset(filters.datePreset, filters.customFrom, filters.customTo);
        const [facturesData, partnersData] = await Promise.all([
          listEtatReglement({
            page: p,
            limit: 15,
            ...range,
            ...(filters.partnerId ? { partnerId: filters.partnerId } : {}),
            ...(filters.clientName.trim() ? { clientName: filters.clientName.trim() } : {}),
            ...(filters.status ? { status: filters.status } : {}),
          }),
          listPartnersAdmin({ page: 1, limit: 100 }),
        ]);
        setData(facturesData);
        setPartners(partnersData);
        setPage(p);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [datePreset, customFrom, customTo, partnerId, clientName, status],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const applyFilters = (next: { datePreset?: DatePreset; customFrom?: string; customTo?: string; partnerId?: string; clientName?: string; status?: "" | FactureStatus }) => {
    const filters = {
      datePreset: next.datePreset ?? datePreset,
      customFrom: next.customFrom ?? customFrom,
      customTo: next.customTo ?? customTo,
      partnerId: next.partnerId ?? partnerId,
      clientName: next.clientName ?? clientName,
      status: next.status ?? status,
    };
    void load(1, filters);
  };

  const factureRemaining = (f: FactureRow) =>
    Math.max(0, asNumber(f.amountDue) - asNumber(f.amountPaid));

  const openPayment = (facture: FactureRow) => {
    setPaymentModalError(null);
    setPaymentFacture(facture);
    setAmountPaid(factureRemaining(facture).toFixed(2));
  };

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFacture) return;
    const increment = asNumber(amountPaid);
    const already = asNumber(paymentFacture.amountPaid);
    const due = asNumber(paymentFacture.amountDue);
    const newTotal = Number((already + increment).toFixed(2));
    if (increment < 0) {
      setPaymentModalError("Le montant doit être positif.");
      return;
    }
    if (newTotal > due + 0.001) {
      setPaymentModalError(`Le total réglé ne peut pas dépasser ${money(due)}.`);
      return;
    }
    setPaymentModalError(null);
    const ok = await paymentMut.execute(paymentFacture.id, newTotal);
    if (ok !== null) {
      setPaymentFacture(null);
      void load(page);
    }
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
        description="Suivez les factures générées quand les partenaires marquent les réservations comme payées."
      />

      {(error || paymentMut.error || downloadError) && <Alert>{error || paymentMut.error || downloadError}</Alert>}

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
          value={partnerId}
          onChange={(e) => {
            setPartnerId(e.target.value);
            applyFilters({ partnerId: e.target.value });
          }}
          className="!w-52 shrink-0"
        >
          <option value="">Tous les partenaires</option>
          {partners?.items.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name}
            </option>
          ))}
        </Select>
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

      {paymentFacture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={savePayment} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setPaymentModalError(null);
                setPaymentFacture(null);
              }}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <XIcon className="h-5 w-5" strokeWidth={2} />
            </button>
            <h3 className="pr-8 text-lg font-semibold text-zinc-900">Règlement {paymentFacture.reference}</h3>
            {paymentModalError && (
              <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                {paymentModalError}
              </p>
            )}
            <div className="mt-2 space-y-1 text-sm text-zinc-500">
              <p>
                Commission (total dû): <strong className="text-zinc-800">{money(paymentFacture.amountDue)}</strong>
              </p>
              <p>
                Déjà réglé: <strong className="text-zinc-800">{money(paymentFacture.amountPaid)}</strong>
              </p>
              <p>
                Reste à payer:{" "}
                <strong className="text-zinc-800">{money(factureRemaining(paymentFacture))}</strong>
              </p>
            </div>
            <div className="mt-5">
              <FormField label="Montant de ce règlement">
                <Input
                  type="number"
                  min={0}
                  max={factureRemaining(paymentFacture)}
                  step={0.01}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPaymentModalError(null);
                  setPaymentFacture(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" loading={paymentMut.loading}>
                Enregistrer
              </Button>
            </div>
          </form>
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
                <TableHeadCell>Partenaire</TableHeadCell>
                <TableHeadCell>Montants</TableHeadCell>
                <TableHeadCell align="right">Actions</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {!data?.items.length ? (
                <TableEmptyRow colSpan={5}>Aucune facture trouvée.</TableEmptyRow>
              ) : (
                data.items.map((facture) => {
                  const remaining = asNumber(facture.amountDue) - asNumber(facture.amountPaid);
                  return (
                    <TableRow key={facture.id} className="align-top">
                      <TableCell className="w-[18%]">
                        <p className="break-words font-semibold leading-snug text-zinc-900">{facture.reference}</p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDateFR(facture.generatedAt)}</p>
                        <div className="mt-2">
                          <FactureStatusBadge status={facture.status} />
                        </div>
                      </TableCell>
                      <TableCell className="w-[26%]">
                        <p className="font-semibold text-zinc-900">{facture.reservation.reference}</p>
                        <p className="font-semibold text-zinc-900">{facture.reservation.guestName}</p>
                        <p className="text-xs text-zinc-500">{facture.reservation.guestPhone}</p>
                        <p className="mt-2 text-sm font-medium text-zinc-800">{formatDateFR(facture.reservation.date)}</p>
                        <p className="text-xs text-zinc-500">
                          {facture.reservation.startTime} - {facture.reservation.endTime}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{facture.reservation.resource.name}</p>
                      </TableCell>
                      <TableCell className="w-[20%]">
                        <p className="font-semibold text-zinc-900">{facture.partner.name}</p>
                        <p className="text-xs text-zinc-500">{facture.partner.phone}</p>
                      </TableCell>
                      <TableCell className="w-[24%]">
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
                      <TableCell align="right" className="w-[12%]">
                        <div className="flex flex-col items-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => void downloadPdf(facture)}>
                            PDF
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openPayment(facture)}>
                            Règlement
                          </Button>
                        </div>
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
