"use client";

import { useCallback, useState } from "react";
import {
  createOffer,
  listPartnerOffers,
  type Offer,
  type OfferRecurrence,
  type DayOfWeek,
  RECURRENCE_LABELS,
  DAY_LABELS,
  ALL_DAYS,
} from "@/lib/api/offers";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, DatePicker, FormField, Input, Textarea, PageHeader, Select, StatusBadge } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const TagIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);
const RepeatIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
  </svg>
);

// ─── Status badge ─────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function recurrenceSummary(o: Offer): string {
  if (o.recurrence === "NONE") {
    const from = o.validFrom ? fmtDate(o.validFrom) : "—";
    const to   = o.validUntil ? fmtDate(o.validUntil) : "—";
    return `${from} → ${to}`;
  }
  const label = RECURRENCE_LABELS[o.recurrence];
  const days  = o.recurrenceDays.map((d) => DAY_LABELS[d]).join(", ");
  const time  = o.timeStart && o.timeEnd ? ` · ${o.timeStart}–${o.timeEnd}` : "";
  return `${label}${days ? ` (${days})` : ""}${time}`;
}

// ─── Offer card ───────────────────────────────────────────────────────────────

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${offer.recurrence !== "NONE" ? "bg-violet-50 text-violet-500" : "bg-zinc-50 text-zinc-400"}`}>
        {offer.recurrence !== "NONE" ? <RepeatIcon /> : <TagIcon />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-900">{offer.title}</p>
          <StatusBadge status={offer.approvalStatus} />
          {offer.recurrence !== "NONE" && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              Récurrente
            </span>
          )}
        </div>
        {offer.description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">{offer.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            −{offer.discountPercent}%
          </span>
          <span>{recurrenceSummary(offer)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerOffersPage() {
  const fetcher = useCallback(() => listPartnerOffers({ limit: 50 }).then((d) => d.items), []);
  const { data: offers, loading, error, reload } = useApi<Offer[]>(fetcher);
  const mutation = useMutation(createOffer);

  const [showForm, setShowForm] = useState(false);

  // Common
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);

  // Recurrence
  const [recurrence, setRecurrence] = useState<OfferRecurrence>("NONE");
  const [recurrenceDays, setRecurrenceDays] = useState<DayOfWeek[]>([]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  // One-shot dates
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const resetForm = () => {
    setTitle(""); setDescription(""); setDiscountPercent(10);
    setRecurrence("NONE"); setRecurrenceDays([]);
    setTimeStart(""); setTimeEnd("");
    setValidFrom(""); setValidUntil("");
  };

  const toggleDay = (day: DayOfWeek) =>
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await mutation.execute({
      title,
      description: description || undefined,
      discountPercent,
      recurrence,
      validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
      ...(validUntil ? { validUntil: new Date(validUntil).toISOString() } : {}),
      ...(recurrence === "WEEKLY" ? { recurrenceDays } : {}),
      ...(timeStart ? { timeStart } : {}),
      ...(timeEnd   ? { timeEnd   } : {}),
    });
    if (ok !== null) {
      resetForm();
      setShowForm(false);
      reload();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Mes offres"
          description="Les offres sont visibles après validation par un administrateur."
        />
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 w-full sm:w-auto justify-center"
        >
          <PlusIcon /> Nouvelle offre
        </button>
      </div>

      {/* ── Create modal ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <form
            onSubmit={onCreate}
            className="relative w-full max-w-lg my-8 rounded-2xl bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Nouvelle offre</h3>
                <p className="mt-0.5 text-xs text-zinc-400">Soumise pour validation par un administrateur.</p>
              </div>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <XIcon />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 p-6">
              <FormField label="Titre *">
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormField>

              <FormField label="Description">
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormField>

              <FormField label="Réduction (%)">
                <Input type="number" min={0} max={100} value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))} />
              </FormField>

              {/* Recurrence type */}
              <FormField label="Type d'offre">
                <Select value={recurrence} onChange={(e) => { setRecurrence(e.target.value as OfferRecurrence); setRecurrenceDays([]); }}>
                  {(Object.keys(RECURRENCE_LABELS) as OfferRecurrence[]).map((r) => (
                    <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                  ))}
                </Select>
              </FormField>

              {/* Start date — always required for all offer types */}
              <FormField label="Date de début *">
                <DatePicker
                  min={new Date().toISOString().split("T")[0]}
                  value={validFrom}
                  onChange={(next) => setValidFrom(next)}
                />
              </FormField>

              {/* One-shot: end date required */}
              {recurrence === "NONE" && (
                <FormField label="Date de fin *">
                  <DatePicker
                    min={validFrom || new Date().toISOString().split("T")[0]}
                    value={validUntil}
                    onChange={(next) => setValidUntil(next)}
                  />
                </FormField>
              )}

              {/* Weekly: day picker */}
              {recurrence === "WEEKLY" && (
                <FormField label="Jours *">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          recurrenceDays.includes(day)
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    ))}
                  </div>
                </FormField>
              )}

              {/* Time range (for all recurring types) */}
              {recurrence !== "NONE" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Heure de début">
                    <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                  </FormField>
                  <FormField label="Heure de fin">
                    <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
                  </FormField>
                </div>
              )}

              {/* End date for recurring (optional — when the recurring pattern expires) */}
              {recurrence !== "NONE" && (
                <FormField label="Date de fin (optionnelle)">
                  <DatePicker
                    min={validFrom || new Date().toISOString().split("T")[0]}
                    value={validUntil}
                    onChange={(next) => setValidUntil(next)}
                  />
                </FormField>
              )}

              {mutation.error && <Alert>{mutation.error}</Alert>}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100">
                Annuler
              </button>
              <button type="submit" disabled={mutation.loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50">
                {mutation.loading ? "Envoi…" : "Soumettre l'offre"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Offers list ───────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Historique</h2>
          {offers && offers.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
              {offers.length} offre{offers.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && <div className="mb-4"><Alert>{error}</Alert></div>}

        {loading ? (
          <PageSpinner />
        ) : !offers || offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-300">
              <TagIcon />
            </div>
            <p className="font-medium text-zinc-600">Aucune offre pour l&apos;instant</p>
            <p className="mt-1 text-sm text-zinc-400">Cliquez sur « Nouvelle offre » pour commencer.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {offers.map((o) => (
              <li key={o.id}><OfferCard offer={o} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
