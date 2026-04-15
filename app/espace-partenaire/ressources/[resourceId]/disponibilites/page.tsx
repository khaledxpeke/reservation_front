"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  getAvailabilities,
  setAvailabilities,
  type AvailabilityEntry,
  type DayOfWeek,
} from "@/lib/api/availabilities";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Lundi" },
  { key: "TUESDAY", label: "Mardi" },
  { key: "WEDNESDAY", label: "Mercredi" },
  { key: "THURSDAY", label: "Jeudi" },
  { key: "FRIDAY", label: "Vendredi" },
  { key: "SATURDAY", label: "Samedi" },
  { key: "SUNDAY", label: "Dimanche" },
];

type RowState = { enabled: boolean; startTime: string; endTime: string; slotIntervalMin: number };

function emptyRows(): Record<DayOfWeek, RowState> {
  const o = {} as Record<DayOfWeek, RowState>;
  for (const d of DAYS) o[d.key] = { enabled: false, startTime: "09:00", endTime: "22:00", slotIntervalMin: 60 };
  return o;
}

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

  const updateRow = (day: DayOfWeek, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const avail: AvailabilityEntry[] = [];
    for (const d of DAYS) {
      const r = rows[d.key];
      if (r.enabled) avail.push({ dayOfWeek: d.key, startTime: r.startTime, endTime: r.endTime, slotIntervalMin: r.slotIntervalMin });
    }
    if (avail.length === 0) { saveMut.setError("Activez au moins un jour."); return; }
    setMessage(null);
    const ok = await saveMut.execute(avail);
    if (ok !== null) setMessage("Disponibilités enregistrées.");
  };

  if (loading) return <PageSpinner />;

  return (
    <div>
      <Link href="/espace-partenaire/ressources" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        ← Retour aux ressources
      </Link>
      <PageHeader title="Disponibilités" description="Pour chaque jour activé, définissez la plage horaire et l'intervalle." />

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={onSave} className="mt-8">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-xs w-12">Actif</th>
                <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-xs">Jour</th>
                <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-xs">Début</th>
                <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-xs">Fin</th>
                <th className="px-4 py-3 font-bold text-zinc-500 uppercase text-xs">Intervalle (min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {DAYS.map(({ key, label }) => (
                <tr key={key} className={`transition-colors ${rows[key].enabled ? "bg-white" : "bg-zinc-50/50 text-zinc-400"}`}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer"
                      checked={rows[key].enabled} 
                      onChange={(e) => updateRow(key, { enabled: e.target.checked })} 
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {label}
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="time" 
                      disabled={!rows[key].enabled}
                      className={`w-32 ${!rows[key].enabled && "opacity-50"}`} 
                      value={rows[key].startTime} 
                      onChange={(e) => updateRow(key, { startTime: e.target.value })} 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="time" 
                      disabled={!rows[key].enabled}
                      className={`w-32 ${!rows[key].enabled && "opacity-50"}`} 
                      value={rows[key].endTime} 
                      onChange={(e) => updateRow(key, { endTime: e.target.value })} 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      disabled={!rows[key].enabled}
                      min={15} max={1440} step={15} 
                      className={`w-24 ${!rows[key].enabled && "opacity-50"}`} 
                      value={rows[key].slotIntervalMin} 
                      onChange={(e) => updateRow(key, { slotIntervalMin: Number(e.target.value) })} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex flex-col items-end gap-3">
          {saveMut.error && <Alert>{saveMut.error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Button type="submit" loading={saveMut.loading} className="w-full sm:w-auto px-8">Enregistrer l'agenda</Button>
        </div>
      </form>
    </div>
  );
}
