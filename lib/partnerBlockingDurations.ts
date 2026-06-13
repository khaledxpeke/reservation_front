import type { Resource } from "@/lib/api/resources";

/** Doit rester identique à `SLOTS_DURATION_MAX_MINUTES` dans `backend/src/modules/slots/slots.schema.ts`. */
export const SLOTS_API_MAX_DURATION_MIN = 480;

export type ResourceWithAvail = Resource & {
  availabilities?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotIntervalMin: number;
  }[];
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function maxWindowMinutes(
  avail: { startTime: string; endTime: string; slotIntervalMin: number }[],
): number {
  if (!avail.length) return 24 * 60;
  return Math.max(0, ...avail.map((a) => timeToMinutes(a.endTime) - timeToMinutes(a.startTime)));
}

function gridStepMinutes(
  avail: { slotIntervalMin: number }[],
): number {
  const steps = avail.map((a) => a.slotIntervalMin).filter((s) => s > 0);
  if (!steps.length) return 60;
  return Math.min(...steps);
}

function unitToMinutesMultiplier(unit: Resource["bookingUnit"]): number {
  switch (unit) {
    case "HOURS":
      return 60;
    case "DAYS":
      return 1440;
    default:
      return 1;
  }
}

/** Libellé pour une durée en minutes (blocage / réservation). */
export function formatBlockDurationLabel(totalMin: number): string {
  if (totalMin >= 1440 && totalMin % 1440 === 0) {
    const d = totalMin / 1440;
    return d === 1 ? "1 jour" : `${d} jours`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m === 0) return h === 1 ? "1 h" : `${h} h`;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  return `${totalMin} min`;
}

export interface BlockDurationOption {
  min: number;
  label: string;
}

const MAX_DURATION_CHOICES = 72;

/**
 * Durées possibles pour le blocage horaire, dérivées de la ressource (unité de facturation,
 * min/max configurés, pas = plus petit slotIntervalMin des disponibilités, plafond = plus grande fenêtre).
 */
export function computeBlockDurationOptions(resource: ResourceWithAvail): BlockDurationOption[] {
  if (resource.bookingUnit === "DAYS") return [];

  const mult = unitToMinutesMultiplier(resource.bookingUnit);
  const avail = resource.availabilities ?? [];
  const step = gridStepMinutes(avail);
  const maxWindow = maxWindowMinutes(avail);

  let minM =
    resource.minBookingDuration != null ? resource.minBookingDuration * mult : step;
  let maxM =
    resource.maxBookingDuration != null ? resource.maxBookingDuration * mult : maxWindow;

  minM = Math.max(step, Math.ceil(minM / step) * step);
  maxM = Math.min(maxM, maxWindow, SLOTS_API_MAX_DURATION_MIN);

  if (maxM < minM) {
    return [];
  }

  const out: BlockDurationOption[] = [];
  for (let d = minM; d <= maxM; d += step) {
    out.push({ min: d, label: formatBlockDurationLabel(d) });
    if (out.length >= MAX_DURATION_CHOICES) break;
  }

  if (!out.length) {
    const fallback = Math.min(step, maxWindow, SLOTS_API_MAX_DURATION_MIN);
    if (fallback < minM) return [];
    return [{ min: fallback, label: formatBlockDurationLabel(fallback) }];
  }

  return out;
}

export function isDayBasedResource(resource: ResourceWithAvail): boolean {
  return resource.bookingUnit === "DAYS";
}
