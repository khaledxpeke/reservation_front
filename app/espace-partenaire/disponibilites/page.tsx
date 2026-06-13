"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listResources, type Resource } from "@/lib/api/resources";
import { getAvailableSlots, type TimeSlot } from "@/lib/api/slots";
import {
  createPartnerTimeBlock,
  listPartnerReservations,
  updateReservationStatus,
  type PartnerReservation,
} from "@/lib/api/reservations";
import {
  computeBlockDurationOptions,
  formatBlockDurationLabel,
  isDayBasedResource,
  SLOTS_API_MAX_DURATION_MIN,
  type BlockDurationOption,
  type ResourceWithAvail,
} from "@/lib/partnerBlockingDurations";
import { useApi } from "@/hooks/useApi";
import { Alert, Button, DatePicker, FormField, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";
import { ApiError } from "@/lib/api/types";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function unitLabel(unit: string) {
  if (unit === "DAYS") return "jour";
  if (unit === "HOURS") return "heure";
  return "minute";
}

function slotKey(s: TimeSlot) {
  return `${s.startTime}-${s.endTime}`;
}

function isPartnerTimeBlock(r: PartnerReservation): boolean {
  return r.guestPhone === "externe" && r.guestName.startsWith("Hors plateforme");
}

function ymdFromReservation(iso: string): string {
  return iso.slice(0, 10);
}

function partnerBlockLabel(r: PartnerReservation): string {
  const d0 = ymdFromReservation(r.date);
  const d1 = r.endDate ? ymdFromReservation(r.endDate) : null;
  const range = d1 && d1 !== d0 ? `${d0} → ${d1}` : d0;
  return `${range} · ${r.startTime}–${r.endTime}`;
}

function resourceMetaLine(r: ResourceWithAvail) {
  const parts: string[] = [];
  if (r.price != null) parts.push(`${r.price} DT / ${unitLabel(r.bookingUnit)}`);
  else parts.push("Prix —");
  if (r.minBookingDuration != null || r.maxBookingDuration != null) {
    const mult = r.bookingUnit === "HOURS" ? 60 : r.bookingUnit === "DAYS" ? 1440 : 1;
    const lo = r.minBookingDuration != null ? r.minBookingDuration * mult : null;
    const hi = r.maxBookingDuration != null ? r.maxBookingDuration * mult : null;
    if (lo != null && hi != null) parts.push(`bloc ${formatBlockDurationLabel(lo)}–${formatBlockDurationLabel(hi)}`);
    else if (lo != null) parts.push(`min. ${formatBlockDurationLabel(lo)}`);
    else if (hi != null) parts.push(`max. ${formatBlockDurationLabel(hi)}`);
  }
  parts.push(r.isActive ? "Actif" : "Inactif");
  return parts.join(" · ");
}

export default function PartnerAvailabilitiesHubPage() {
  const fetcher = useCallback(() => listResources(), []);
  const { data: resources, loading, error } = useApi<Resource[]>(fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [durationMin, setDurationMin] = useState(60);
  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [blockingKey, setBlockingKey] = useState<string | null>(null);
  const [blockingDayRange, setBlockingDayRange] = useState(false);
  const [blockMessage, setBlockMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [partnerBlocks, setPartnerBlocks] = useState<PartnerReservation[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const activeResources = useMemo(
    () => (resources ?? []).filter((r) => r.isActive),
    [resources],
  );

  useEffect(() => {
    if (!resources?.length) return;
    if (selectedId && resources.some((r) => r.id === selectedId)) return;
    const first = activeResources[0] ?? resources[0];
    if (first) setSelectedId(first.id);
  }, [resources, selectedId, activeResources]);

  const selected = (resources?.find((r) => r.id === selectedId) ?? null) as ResourceWithAvail | null;
  const minDate = todayISO();
  const dayBased = selected ? isDayBasedResource(selected) : false;
  const hasWeeklyAvail = Boolean(selected && (selected.availabilities?.length ?? 0) > 0);

  const durationOptions = useMemo(() => {
    if (!selected || dayBased) return [];
    return computeBlockDurationOptions(selected);
  }, [selected, dayBased]);

  useEffect(() => {
    if (!selectedId || dayBased || !hasWeeklyAvail) return;
    if (!durationOptions.length) return;
    if (!durationOptions.some((o: BlockDurationOption) => o.min === durationMin)) {
      setDurationMin(durationOptions[0]!.min);
    }
  }, [selectedId, dayBased, hasWeeklyAvail, durationOptions, durationMin]);

  useEffect(() => {
    if (!selectedId) return;
    if (dayBased) setEndDate((e) => (e < date ? date : e));
  }, [selectedId, dayBased, date]);

  useEffect(() => {
    if (!selectedId || dayBased || !hasWeeklyAvail) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const res = await getAvailableSlots({
          resourceId: selectedId,
          date,
          durationMin,
        });
        if (!cancelled) setSlots(res.slots);
      } catch (e) {
        if (!cancelled) {
          setSlots(null);
          setSlotsError(e instanceof ApiError ? e.message : "Impossible de charger les créneaux.");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, date, durationMin, dayBased, hasWeeklyAvail]);

  const reloadPartnerBlocks = useCallback(async () => {
    if (!selectedId) {
      setPartnerBlocks([]);
      return;
    }
    setBlocksLoading(true);
    try {
      const res = await listPartnerReservations({
        resourceId: selectedId,
        date,
        dateOverlap: true,
        limit: 100,
        page: 1,
      });
      setPartnerBlocks(
        res.items.filter(
          (r) =>
            isPartnerTimeBlock(r) && r.status !== "CANCELLED" && r.status !== "REJECTED",
        ),
      );
    } catch {
      setPartnerBlocks([]);
    } finally {
      setBlocksLoading(false);
    }
  }, [selectedId, date]);

  useEffect(() => {
    void reloadPartnerBlocks();
  }, [reloadPartnerBlocks]);

  async function onBlock(slot: TimeSlot) {
    if (!selectedId) return;
    setBlockMessage(null);
    const key = slotKey(slot);
    setBlockingKey(key);
    try {
      await createPartnerTimeBlock({
        resourceId: selectedId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        note: note.trim() || undefined,
      });
      setBlockMessage({ type: "ok", text: "Créneau bloqué. Il n’apparaît plus comme libre pour les clients." });
      const res = await getAvailableSlots({ resourceId: selectedId, date, durationMin });
      setSlots(res.slots);
      await reloadPartnerBlocks();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Échec du blocage.";
      setBlockMessage({ type: "err", text: msg });
    } finally {
      setBlockingKey(null);
    }
  }

  async function onUnblock(block: PartnerReservation) {
    setBlockMessage(null);
    setUnblockingId(block.id);
    try {
      await updateReservationStatus(block.id, "CANCELLED");
      setBlockMessage({ type: "ok", text: "Blocage levé : le créneau redevient réservable." });
      await reloadPartnerBlocks();
      if (!dayBased && hasWeeklyAvail && selectedId && durationOptions.length) {
        const res = await getAvailableSlots({ resourceId: selectedId, date, durationMin });
        setSlots(res.slots);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Impossible de lever le blocage.";
      setBlockMessage({ type: "err", text: msg });
    } finally {
      setUnblockingId(null);
    }
  }

  async function onBlockDayRange() {
    if (!selectedId || !dayBased) return;
    if (endDate < date) {
      setBlockMessage({ type: "err", text: "La date de fin doit être le même jour ou après le début." });
      return;
    }
    setBlockMessage(null);
    setBlockingDayRange(true);
    try {
      await createPartnerTimeBlock({
        resourceId: selectedId,
        date,
        endDate: endDate !== date ? endDate : undefined,
        startTime: "00:00",
        endTime: "23:59",
        note: note.trim() || undefined,
      });
      const nights = Math.round(
        (new Date(endDate).getTime() - new Date(date).getTime()) / (24 * 60 * 60 * 1000),
      );
      const rangeLabel =
        endDate === date
          ? "la journée"
          : `du ${date} au ${endDate} (${nights + 1} jour${nights + 1 > 1 ? "s" : ""})`;
      setBlockMessage({
        type: "ok",
        text: `Période bloquée (${rangeLabel}). Elle n’apparaît plus comme libre pour les clients.`,
      });
      await reloadPartnerBlocks();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Échec du blocage.";
      setBlockMessage({ type: "err", text: msg });
    } finally {
      setBlockingDayRange(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disponibilités"
        description="Bloquez un créneau ou une période (hors plateforme), selon le mode de votre ressource : à l’heure / minute ou à la journée. Les horaires récurrents restent ceux définis dans l’agenda hebdomadaire."
      />

      {error && <Alert>{error}</Alert>}

      {!resources || resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-600">
          <p>Aucune ressource pour l’instant.</p>
          <Link
            href="/espace-partenaire/ressources"
            className="mt-3 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Créer une ressource
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <aside className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Vos ressources</p>
            <ul className="max-h-[min(70vh,520px)] space-y-1 overflow-y-auto pr-1">
              {resources.map((r) => {
                const rw = r as ResourceWithAvail;
                const isSel = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`flex w-full flex-col rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        isSel
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                          : "border-zinc-100 bg-zinc-50 text-zinc-800 hover:border-zinc-200 hover:bg-white"
                      }`}
                    >
                      <span className="font-semibold">{r.name}</span>
                      <span
                        className={`mt-0.5 text-xs ${isSel ? "text-zinc-300" : "text-zinc-500"}`}
                      >
                        {resourceMetaLine(rw)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selected ? (
              <p className="border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                Agenda récurrent (jours / tranches / pas des créneaux) :{" "}
                <Link
                  href={`/espace-partenaire/ressources/${selected.id}/disponibilites`}
                  className="font-medium text-zinc-700 underline-offset-2 hover:underline"
                >
                  modifier
                </Link>
              </p>
            ) : null}
          </aside>

          <section className="min-w-0 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
            {selected ? (
              <>
                {dayBased ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-600">
                      Cette ressource est facturée{" "}
                      <strong className="font-semibold text-zinc-800">à la journée</strong>. Indiquez la période à
                      bloquer (un ou plusieurs jours entiers).
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                      <FormField label="Du" className="min-w-[200px] flex-1">
                        <DatePicker min={minDate} value={date} onChange={setDate} />
                      </FormField>
                      <FormField label="Au (inclus)" className="min-w-[200px] flex-1">
                        <DatePicker min={date} value={endDate} onChange={setEndDate} />
                      </FormField>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <FormField label="Date" className="min-w-[200px] flex-1">
                      <DatePicker min={minDate} value={date} onChange={setDate} />
                    </FormField>
                    <FormField label="Durée du bloc" className="min-w-[220px]">
                      {!hasWeeklyAvail ? (
                        <p className="text-sm text-amber-800">
                          Définissez d’abord l’agenda hebdomadaire (au moins un jour avec horaires) pour cette ressource.
                        </p>
                      ) : durationOptions.length ? (
                        <>
                          <select
                            value={durationMin}
                            onChange={(e) => setDurationMin(Number(e.target.value))}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                          >
                            {durationOptions.map((o: BlockDurationOption) => (
                              <option key={o.min} value={o.min}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <p className="text-sm text-amber-800">
                          Durées incohérentes avec vos horaires : vérifiez min./max. de réservation et les tranches dans
                          l’agenda.
                        </p>
                      )}
                    </FormField>
                  </div>
                )}

                <FormField label="Note (optionnelle)">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Ex. résa téléphone" />
                  <p className="mt-1.5 text-xs text-zinc-500">
                    S’affiche dans le libellé du bloc pour vous repérer (ex. réservation par téléphone).
                  </p>
                </FormField>

                {blockMessage ? (
                  <Alert variant={blockMessage.type === "ok" ? "success" : "error"}>{blockMessage.text}</Alert>
                ) : null}

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
                  <p className="text-sm font-semibold text-zinc-800">Blocages actifs (hors plateforme)</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Pour la date affichée (et les plages multi-jours qui couvrent ce jour). Vous pouvez lever un blocage
                    pour libérer le créneau.
                  </p>
                  {blocksLoading ? (
                    <p className="mt-3 text-sm text-zinc-500">Chargement…</p>
                  ) : partnerBlocks.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600">Aucun blocage pour cette sélection.</p>
                  ) : (
                    <ul className="mt-3 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                      {partnerBlocks.map((b) => {
                        const canUnblock = b.status === "CONFIRMED" || b.status === "PENDING";
                        const busy = unblockingId === b.id;
                        return (
                          <li
                            key={b.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium tabular-nums text-zinc-900">
                                {partnerBlockLabel(b)}
                              </p>
                              <p className="truncate text-xs text-zinc-500" title={b.guestName}>
                                {b.guestName}
                                {b.reference ? ` · ${b.reference}` : ""}
                              </p>
                            </div>
                            {canUnblock ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => onUnblock(b)}
                              >
                                {busy ? "…" : "Débloquer"}
                              </Button>
                            ) : (
                              <span className="text-xs text-zinc-400">{b.status}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {dayBased ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" disabled={blockingDayRange || endDate < date} onClick={onBlockDayRange}>
                      {blockingDayRange ? "Blocage…" : "Bloquer la période"}
                    </Button>
                  </div>
                ) : (
                  <>
                    {slotsError ? <Alert>{slotsError}</Alert> : null}

                    {slotsLoading ? (
                      <p className="text-sm text-zinc-500">Chargement des créneaux…</p>
                    ) : slots && slots.length === 0 ? (
                      <p className="text-sm text-zinc-600">
                        Aucun créneau pour ce jour et cette durée. Vérifiez vos disponibilités récurrentes ou la date.
                      </p>
                    ) : slots ? (
                      <div>
                        <p className="mb-3 text-sm font-medium text-zinc-800">Créneaux libres — cliquez pour bloquer</p>
                        {(() => {
                          const free = slots.filter((s) => s.status === "available");
                          if (free.length === 0) {
                            return (
                              <p className="text-sm text-zinc-600">
                                Tous les créneaux sont déjà pris pour cette durée.
                              </p>
                            );
                          }
                          return (
                            <ul className="flex max-h-[min(60vh,420px)] flex-col gap-2 overflow-y-auto pr-1">
                              {free.map((s) => {
                                const key = slotKey(s);
                                const busy = blockingKey === key;
                                return (
                                  <li
                                    key={key}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                                  >
                                    <span className="text-sm font-semibold tabular-nums text-zinc-900">
                                      {s.startTime} – {s.endTime}
                                    </span>
                                    <Button type="button" size="sm" disabled={busy} onClick={() => onBlock(s)}>
                                      {busy ? "Blocage…" : "Bloquer"}
                                    </Button>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        })()}
                      </div>
                    ) : null}
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-500">Sélectionnez une ressource.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
