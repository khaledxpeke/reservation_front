"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createReservation } from "@/lib/api/reservations";
import { getAvailableSlots } from "@/lib/api/slots";
import type { PublicPartner } from "@/lib/api/marketplace";
import type { TimeSlot } from "@/lib/api/slots";
import { ApiError } from "@/lib/api/types";
import { Alert, Button, FormField, Input, Select, PageHeader } from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";

const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PartnerBooking({ partner }: { partner: PublicPartner }) {
  const resources = partner.resources;
  const defaultDuration = partner.category.subCategories[0]?.defaultDurationMin ?? 60;

  const [resourceId, setResourceId] = useState(resources[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [durationMin, setDurationMin] = useState(defaultDuration);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!resourceId || !date) return;
    setSlotsLoading(true);
    setError(null);
    setSelectedSlot(null);
    try {
      const res = await getAvailableSlots({ resourceId, date, durationMin });
      setSlots(res.slots.filter((s) => s.status === "available"));
    } catch (e) {
      setSlots([]);
      setError(e instanceof ApiError ? e.message : "Créneaux indisponibles.");
    } finally {
      setSlotsLoading(false);
    }
  }, [resourceId, date, durationMin]);

  useEffect(() => { void loadSlots(); }, [loadSlots]);

  const resourceName = useMemo(
    () => resources.find((r) => r.id === resourceId)?.name ?? "Terrain",
    [resources, resourceId],
  );

  const onBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !resourceId) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await createReservation({
        resourceId,
        guestName,
        guestPhone,
        guestEmail: guestEmail || undefined,
        date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      setMessage("Demande envoyée. Le partenaire confirmera votre réservation.");
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setSelectedSlot(null);
      void loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réservation impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (resources.length === 0) {
    return <Alert variant="warning">Ce partenaire n'a pas encore de terrain actif.</Alert>;
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      <div>
        <PageHeader title="Réserver un créneau" description="Choisissez un terrain, une date et une durée." />
        <div className="mt-6 space-y-4">
          <FormField label="Terrain">
            <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.capacity} places)</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label="Durée (minutes)">
            <Select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Créneaux disponibles</h3>
          {slotsLoading ? (
            <div className="mt-2"><Spinner /></div>
          ) : slots.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Aucun créneau libre.</p>
          ) : (
            <ul className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
              {slots.map((s) => {
                const active = selectedSlot?.startTime === s.startTime && selectedSlot?.endTime === s.endTime;
                return (
                  <li key={`${s.startTime}-${s.endTime}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100"
                          : "border-zinc-200 bg-white hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-950"
                      }`}
                    >
                      {s.startTime} – {s.endTime}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <form
        onSubmit={onBook}
        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Vos coordonnées</h3>
        <p className="mt-1 text-xs text-zinc-500">{resourceName} — {date}</p>
        <div className="mt-4 space-y-3">
          <FormField label="Nom complet *">
            <Input required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </FormField>
          <FormField label="Téléphone *">
            <Input required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
          </FormField>
          <FormField label="E-mail (optionnel)">
            <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
          </FormField>
        </div>
        <Button type="submit" loading={submitting} disabled={!selectedSlot} className="mt-6 w-full">
          Envoyer la demande
        </Button>
        {message && <Alert variant="success" >{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </form>
    </div>
  );
}
