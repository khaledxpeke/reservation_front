"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  getAvailabilities,
  setAvailabilities,
  type AvailabilityEntry,
} from "@/lib/api/availabilities";
import type { DayOfWeek } from "@/lib/api/offers";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: DayOfWeek; label: string; abbr: string; weekend: boolean }[] = [
  { key: "MONDAY",    label: "Lundi",    abbr: "Lu", weekend: false },
  { key: "TUESDAY",   label: "Mardi",    abbr: "Ma", weekend: false },
  { key: "WEDNESDAY", label: "Mercredi", abbr: "Me", weekend: false },
  { key: "THURSDAY",  label: "Jeudi",    abbr: "Je", weekend: false },
  { key: "FRIDAY",    label: "Vendredi", abbr: "Ve", weekend: false },
  { key: "SATURDAY",  label: "Samedi",   abbr: "Sa", weekend: true  },
  { key: "SUNDAY",    label: "Dimanche", abbr: "Di", weekend: true  },
];

const INTERVAL_OPTIONS = [
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 h"    },
  { value: 90,  label: "1 h 30" },
  { value: 120, label: "2 h"    },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type RowState = { enabled: boolean; startTime: string; endTime: string; slotIntervalMin: number };

function emptyRows(): Record<DayOfWeek, RowState> {
  const o = {} as Record<DayOfWeek, RowState>;
  for (const d of DAYS)
    o[d.key] = { enabled: false, startTime: "08:00", endTime: "22:00", slotIntervalMin: 60 };
  return o;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Time input ───────────────────────────────────────────────────────────────

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className={`relative flex items-center ${disabled ? "opacity-40" : ""}`}>
      <svg
        className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <input
        type="time"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-[112px] rounded-xl border border-zinc-200 bg-white pl-8 pr-2 text-sm font-medium text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DisponibilitesPage() {
  const { resourceId } = useParams() as { resourceId: string };
  const [rows, setRows] = useState(emptyRows());
  const [message, setMessage] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    const data = await getAvailabilities(resourceId);
    const next = emptyRows();
    for (const a of data) {
      if (a.dayOfWeek in next) {
        next[a.dayOfWeek as DayOfWeek] = {
          enabled: true,
          startTime: a.startTime,
          endTime: a.endTime,
          slotIntervalMin: a.slotIntervalMin ?? 60,
        };
      }
    }
    setRows(next);
    return data;
  }, [resourceId]);

  const { loading, error } = useApi(fetcher);
  const saveMut = useMutation(
    useCallback(
      (avail: AvailabilityEntry[]) => setAvailabilities(resourceId, avail),
      [resourceId],
    ),
  );

  const updateRow = (day: DayOfWeek, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  const enabledCount = DAYS.filter((d) => rows[d.key].enabled).length;
  const toggleAll = (val: boolean) =>
    setRows((prev) => {
      const next = { ...prev };
      for (const d of DAYS) next[d.key] = { ...next[d.key], enabled: val };
      return next;
    });

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const avail: AvailabilityEntry[] = [];
    for (const d of DAYS) {
      const r = rows[d.key];
      if (r.enabled)
        avail.push({ dayOfWeek: d.key, startTime: r.startTime, endTime: r.endTime, slotIntervalMin: r.slotIntervalMin });
    }
    if (avail.length === 0) { saveMut.setError("Activez au moins un jour."); return; }
    setMessage(null);
    const ok = await saveMut.execute(avail);
    if (ok !== null) setMessage("Disponibilités enregistrées avec succès.");
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/espace-partenaire/ressources"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Retour aux ressources
      </Link>

      <div className="mt-4">
        <PageHeader
          title="Disponibilités"
          description="Activez les jours et configurez les plages horaires de chaque journée."
        />
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={onSave} className="mt-6 space-y-4">
        {/* Main card */}
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {DAYS.map(({ key, label, abbr, weekend }) => {
            const row = rows[key];
            return (
              <div
                key={key}
                className={`grid grid-cols-[44px_32px_96px_1fr_100px_80px] items-center gap-4 px-5 py-3.5 transition-colors ${
                  row.enabled ? "bg-white" : "bg-zinc-50"
                }`}
              >
                {/* Toggle */}
                <Toggle checked={row.enabled} onChange={(v) => updateRow(key, { enabled: v })} />

                {/* Day badge */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                    row.enabled
                      ? weekend
                        ? "bg-violet-100 text-violet-700"
                        : "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {abbr}
                </div>

                {/* Label */}
                <span
                  className={`text-sm font-semibold transition ${
                    row.enabled ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {label}
                </span>

                {/* Time range */}
                <div className="flex items-center gap-3">
                  <TimeInput
                    value={row.startTime}
                    onChange={(v) => updateRow(key, { startTime: v })}
                    disabled={!row.enabled}
                  />
                  <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                  <TimeInput
                    value={row.endTime}
                    onChange={(v) => updateRow(key, { endTime: v })}
                    disabled={!row.enabled}
                  />
                </div>

                {/* Interval */}
                <select
                  disabled={!row.enabled}
                  value={row.slotIntervalMin}
                  onChange={(e) => updateRow(key, { slotIntervalMin: Number(e.target.value) })}
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-700 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {INTERVAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Status */}
                <div className="flex justify-end">
                  {row.enabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Ouvert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-400">
                      Fermé
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer inside card */}
          <div className="flex items-center justify-between bg-zinc-50 px-5 py-3">
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900">{enabledCount}</span> / {DAYS.length} jours actifs
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-xs font-medium text-zinc-600 underline-offset-2 transition hover:underline"
              >
                Tout activer
              </button>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-xs font-medium text-zinc-600 underline-offset-2 transition hover:underline"
              >
                Tout désactiver
              </button>
            </div>
          </div>
        </div>

        {/* Column hint */}
        <div className="grid grid-cols-[44px_32px_96px_1fr_100px_48px] items-center gap-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          <span />
          <span />
          <span>Jour</span>
          <span>Plage horaire</span>
          <span className="text-center">Créneau</span>
          <span />
        </div>

        {/* Alerts + save */}
        {saveMut.error && <Alert>{saveMut.error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveMut.loading}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {saveMut.loading ? (
              "Enregistrement…"
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Enregistrer l&apos;agenda
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
