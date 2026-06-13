/**
 * Même règle que le backend (`slotPastFilter.ts`) pour masquer les créneaux déjà passés
 * quand la date choisie est « aujourd’hui » au lieu (fuseau du lieu / APP).
 */

const DEFAULT_VENUE_TZ =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_TIMEZONE
    ? process.env.NEXT_PUBLIC_APP_TIMEZONE
    : "Africa/Tunis";

function normalizeCalendarYmd(ymd: string): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(ymd.trim());
  if (!m) return ymd.trim();
  return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
}

function hhmmToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function calendarDateYmdInTimeZone(isoDate: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(isoDate);
  const y = parts.find((p) => p.type === "year")?.value;
  const mo = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (y && mo && d) {
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const raw = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(isoDate);
  return normalizeCalendarYmd(raw.replace(/\//g, "-"));
}

export function wallClockMinutesFromMidnightInTimeZone(now: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const match = /^(\d{1,2}):(\d{2})/.exec(formatted.trim());
  if (!match) {
    return now.getHours() * 60 + now.getMinutes();
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Pour la date calendaire `queryDateYmd` (YYYY-MM-DD), si c’est aujourd’hui dans `timeZone`,
 * retire les créneaux dont l’heure de début est avant l’heure actuelle (à la minute).
 */
export function omitPastSlotsForVenueToday<T extends { startTime: string }>(
  slots: T[],
  queryDateYmd: string,
  now: Date = new Date(),
  timeZone: string = DEFAULT_VENUE_TZ,
): T[] {
  const q = normalizeCalendarYmd(queryDateYmd);
  const today = calendarDateYmdInTimeZone(now, timeZone);
  if (today !== q) {
    return slots;
  }
  const cutoff = wallClockMinutesFromMidnightInTimeZone(now, timeZone);
  return slots.filter((s) => hhmmToMinutes(s.startTime) >= cutoff);
}
