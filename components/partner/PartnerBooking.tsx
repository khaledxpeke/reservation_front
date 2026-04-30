"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createReservation } from "@/lib/api/reservations";
import { getAvailableSlots } from "@/lib/api/slots";
import type { PublicPartner } from "@/lib/api/marketplace";
import type { TimeSlot } from "@/lib/api/slots";
import { ApiError } from "@/lib/api/types";
import { Alert, Button, Chip, DatePicker, FormField, Input, Select, Spinner } from "@/components/ui";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLongFR(iso: string): string {
  try {
    const [y, m, day] = iso.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function PartnerBooking({
  partner,
  initialDate,
  initialResourceId,
  initialStartTime,
  initialDurationMin,
}: {
  partner: PublicPartner;
  initialDate?: string;
  initialResourceId?: string;
  initialStartTime?: string;
  initialDurationMin?: number;
}) {
  const resources = partner.resources;
  const defaultDuration =
    resources[0]?.subCategory?.defaultDurationMin ??
    partner.category.subCategories[0]?.defaultDurationMin ??
    60;

  const [resourceId, setResourceId] = useState(() => {
    if (initialResourceId && resources.some((r) => r.id === initialResourceId)) return initialResourceId;
    return resources[0]?.id ?? "";
  });

  const selectedResourceObj = useMemo(
    () => resources.find((r) => r.id === resourceId),
    [resources, resourceId]
  );
  const bookingUnit = selectedResourceObj?.bookingUnit ?? "MINUTES";

  const [date, setDate] = useState(
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayISO(),
  );
  const [endDate, setEndDate] = useState(date);

  const durationMin = initialDurationMin ?? defaultDuration;

  const { user } = useAuth();
  const customerProfile = user?.role === "CUSTOMER" ? user.customerProfile ?? null : null;

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usePrefill, setUsePrefill] = useState(true);

  useEffect(() => {
    if (!customerProfile) return;
    if (!usePrefill) return;
    setGuestName(`${customerProfile.firstName} ${customerProfile.lastName}`.trim());
    setGuestPhone(customerProfile.phone);
    setGuestEmail(user?.email ?? "");
  }, [customerProfile, usePrefill, user?.email]);

  const onToggleGuestMode = () => {
    if (!customerProfile) return;
    if (usePrefill) {
      setUsePrefill(false);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
    } else {
      setUsePrefill(true);
    }
  };

  const loadSlots = useCallback(async () => {
    if (!resourceId || !date) return;
    if (bookingUnit === "DAYS") {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
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
  }, [resourceId, date, durationMin, bookingUnit]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (!initialStartTime || slots.length === 0) return;
    const found = slots.find((s) => s.startTime === initialStartTime);
    if (found) setSelectedSlot(found);
  }, [initialStartTime, slots]);

  const resourceName = selectedResourceObj?.name ?? "Ressource";

  const onBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const isReady = bookingUnit === "DAYS" ? !!date && !!endDate : !!selectedSlot;
    if (!isReady || !resourceId) return;
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
        endDate: bookingUnit === "DAYS" ? endDate : undefined,
        startTime: bookingUnit === "DAYS" ? "00:00" : selectedSlot!.startTime,
        endTime: bookingUnit === "DAYS" ? "23:59" : selectedSlot!.endTime,
      });
      setMessage("Demande envoyée. Le partenaire confirmera votre réservation.");
      setSelectedSlot(null);
      if (customerProfile && usePrefill) {
        // keep prefill values intact for the next booking
      } else {
        setGuestName("");
        setGuestPhone("");
        setGuestEmail("");
      }
      void loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réservation impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (resources.length === 0) {
    return <Alert variant="warning">Ce partenaire n&apos;a pas encore de ressource active.</Alert>;
  }

  const canSubmit = bookingUnit === "DAYS" ? !!date && !!endDate : !!selectedSlot;

  return (
    <form
      onSubmit={onBook}
      className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white"
    >
      <div className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">Réservation</h2>
        <p className="text-xs text-zinc-500">
          Choisissez votre créneau et renseignez vos coordonnées.
        </p>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        {/* Left column: slot picker */}
        <div className="space-y-4 border-b border-zinc-100 p-5 md:border-b-0 md:border-r">
          <FormField label="Ressource">
            <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.capacity ? ` (${r.capacity} places)` : ""}
                </option>
              ))}
            </Select>
          </FormField>

          {bookingUnit === "DAYS" ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date de début">
                <DatePicker
                  value={date}
                  onChange={(next) => {
                    setDate(next);
                    if (endDate < next) setEndDate(next);
                  }}
                />
              </FormField>
              <FormField label="Date de fin">
                <DatePicker
                  min={date}
                  value={endDate}
                  onChange={(next) => setEndDate(next)}
                />
              </FormField>
            </div>
          ) : (
            <FormField label="Date">
              <DatePicker value={date} onChange={(next) => setDate(next)} />
            </FormField>
          )}

          {bookingUnit !== "DAYS" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Créneaux disponibles
                </h3>
                {slotsLoading && <Spinner className="h-3.5 w-3.5" />}
              </div>
              {!slotsLoading && slots.length === 0 ? (
                <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                  Aucun créneau libre à cette date.
                </p>
              ) : (
                <ul className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {slots.map((s) => {
                    const active =
                      selectedSlot?.startTime === s.startTime &&
                      selectedSlot?.endTime === s.endTime;
                    return (
                      <li key={`${s.startTime}-${s.endTime}`}>
                        <Chip active={active} onClick={() => setSelectedSlot(s)}>
                          {s.startTime}
                        </Chip>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right column: summary + guest details */}
        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Récapitulatif
            </p>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Ressource</dt>
                <dd className="truncate font-medium text-zinc-900">{resourceName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Date</dt>
                <dd className="font-medium text-zinc-900">
                  {bookingUnit === "DAYS"
                    ? `${formatDateLongFR(date)} → ${formatDateLongFR(endDate)}`
                    : formatDateLongFR(date)}
                </dd>
              </div>
              {bookingUnit !== "DAYS" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Créneau</dt>
                  <dd className="font-medium text-zinc-900">
                    {selectedSlot
                      ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
                      : "Non sélectionné"}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {customerProfile ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">
              <span className="truncate">
                Connecté en tant que{" "}
                <strong className="font-semibold">
                  {customerProfile.firstName} {customerProfile.lastName}
                </strong>
              </span>
              <button
                type="button"
                onClick={onToggleGuestMode}
                className="font-medium underline hover:no-underline"
              >
                {usePrefill ? "Réserver en tant qu'invité" : "Utiliser mon compte"}
              </button>
            </div>
          ) : null}

          <div className="space-y-3">
            <FormField label="Nom complet *">
              <Input
                required
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (customerProfile && usePrefill) setUsePrefill(false);
                }}
                placeholder="Jean Dupont"
              />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Téléphone *">
                <Input
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+216 ..."
                />
              </FormField>
              <FormField label="E-mail">
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                />
              </FormField>
            </div>
          </div>

          <Button type="submit" loading={submitting} disabled={!canSubmit} className="w-full">
            Envoyer la demande
          </Button>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert>{error}</Alert>}
        </div>
      </div>
    </form>
  );
}
