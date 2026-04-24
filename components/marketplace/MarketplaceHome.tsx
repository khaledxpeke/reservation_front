"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { searchCourtSlots, type CourtOfferRow } from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { picsumFromSeed } from "@/lib/imageUrls";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import { Alert, Button, Chip, FormField, Select } from "@/components/ui";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatDayLabel(iso: string): { weekday: string; day: string; month: string } {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return {
    weekday: d.toLocaleDateString("fr-FR", { weekday: "long" }),
    day: d.toLocaleDateString("fr-FR", { day: "numeric" }),
    month: d.toLocaleDateString("fr-FR", { month: "short" })
  };
}

function formatMonthYear(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function cardImage(row: CourtOfferRow): string {
  if (row.imageUrl) return row.imageUrl;
  return picsumFromSeed(`court-offer-${row.resourceId}`, 960, 540);
}

export function MarketplaceHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [governorate, setGovernorate] = useState("");
  const city = "";

  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [durationMin] = useState(60); // Hardcoded duration since it was removed from UI
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [items, setItems] = useState<CourtOfferRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const subCategories = useMemo(() => {
    const c = categories.find((x) => x.id === categoryId);
    return c?.subCategories ?? [];
  }, [categories, categoryId]);

  useEffect(() => {
    setSubCategoryId("");
  }, [categoryId]);

  const dateStrip = useMemo(() => {
    const start = addDaysISO(todayISO(), dateOffset);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  }, [dateOffset]);

  const currentMonthYear = useMemo(() => {
    return formatMonthYear(dateStrip[0]);
  }, [dateStrip]);

  // Synchronize selected date to be within the visible strip if possible
  useEffect(() => {
    if (!dateStrip.includes(selectedDate)) {
      setSelectedDate(dateStrip[0]);
    }
  }, [dateStrip, selectedDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchCourtSlots({
        date: selectedDate,
        durationMin,
        timeBand: "all",
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(governorate.trim() ? { governorate: governorate.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
      });
      setItems(res.items);
    } catch (e) {
      setItems([]);
      setError(e instanceof ApiError ? e.message : "Impossible de charger les créneaux.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, durationMin, categoryId, subCategoryId, governorate, city]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableTimes = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.startTime))).sort();
  }, [items]);

  useEffect(() => {
    if (availableTimes.length > 0 && (!selectedTime || !availableTimes.includes(selectedTime))) {
      setSelectedTime(availableTimes[0]);
    } else if (availableTimes.length === 0) {
      setSelectedTime(null);
    }
  }, [availableTimes, selectedTime]);

  const displayedItems = useMemo(() => {
    if (!selectedTime) return [];
    return items.filter((i) => i.startTime === selectedTime);
  }, [items, selectedTime]);

  const handlePrevDays = () => setDateOffset(o => Math.max(0, o - 7));
  const handleNextDays = () => setDateOffset(o => o + 7);
  const handleToday = () => {
    setDateOffset(0);
    setSelectedDate(todayISO());
  };

  return (
    <div className="bg-white py-4 font-sans">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* Filters Top Bar */}
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <FormField label="Catégorie">
              <Select size="sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Toutes</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Sous-catégorie">
              <Select
                size="sm"
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                disabled={!categoryId}
              >
                <option value="">Toutes</option>
                {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Région">
              <Select size="sm" value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
                <option value="">Toutes</option>
                {TUNISIA_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
          </div>
        </div>

        {/* Date Picker & Time Bands Card */}
        <div className="bg-white rounded-xl border border-zinc-200 mb-6 overflow-hidden">
          <div className="border-b border-zinc-200 p-3 sm:p-4">
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                
                {/* Top Header Mobile / Left Side Desktop */}
                <div className="flex w-full shrink-0 items-center justify-between sm:w-auto">
                   <div className="flex w-auto flex-col items-start justify-center sm:w-32 sm:items-center">
                      <span className="mb-0.5 text-left text-sm font-semibold capitalize leading-tight text-zinc-800 sm:mb-2 sm:text-center sm:text-base">
                        {currentMonthYear}
                      </span>
                      <Button variant="ghost" size="sm" onClick={handleToday}>
                        Aujourd&apos;hui
                      </Button>
                   </div>

                   {/* Mobile Arrows */}
                   <div className="flex items-center gap-2 sm:hidden">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={handlePrevDays}
                        aria-label="Semaine précédente"
                        className="!rounded-full"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleNextDays}
                        aria-label="Semaine suivante"
                        className="!rounded-full"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </Button>
                   </div>
                </div>

                {/* Desktop Prev Arrow */}
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handlePrevDays}
                  aria-label="Semaine précédente"
                  className="hidden shrink-0 !rounded-full sm:inline-flex"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </Button>

                {/* Days Strip */}
                <div className="flex-1 flex overflow-hidden w-full rounded-lg sm:rounded-none border sm:border-0 border-zinc-200">
                  <div className="flex-1 flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:[scrollbar-width:thin] [&::-webkit-scrollbar]:hidden sm:[&::-webkit-scrollbar]:auto">
                    {dateStrip.map((d) => {
                      const active = d === selectedDate;
                      const { weekday, day, month } = formatDayLabel(d);
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(d)}
                          className={`flex-1 min-w-[65px] sm:min-w-[70px] py-2 sm:py-3 flex flex-col items-center sm:border-t-4 transition-colors ${
                            active
                              ? "bg-emerald-700 text-white sm:border-emerald-700"
                              : "bg-white text-zinc-400 hover:bg-zinc-50 border-transparent border-r last:border-r-0 border-zinc-100 sm:border-r-0 sm:border-x sm:border-x-zinc-100"
                          }`}
                        >
                          <span className={`text-[10px] sm:text-xs capitalize ${active ? "opacity-90 text-emerald-100 sm:text-white" : "text-zinc-400"}`}>{weekday}</span>
                          <span className={`text-sm font-semibold mt-0.5 sm:mt-1 ${active ? "text-white" : "text-zinc-800"}`}>{day} {month}.</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Next Arrow */}
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleNextDays}
                  aria-label="Semaine suivante"
                  className="hidden shrink-0 !rounded-full sm:inline-flex"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </Button>
             </div>
          </div>

          {/* Exact Times */}
          <div className="p-4 bg-white border-t border-zinc-200 min-h-[88px]">
             <div className={`flex flex-wrap gap-3 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                {loading && items.length === 0 ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-20 h-10 rounded-xl bg-zinc-200 animate-pulse"></div>
                    ))}
                  </>
                ) : availableTimes.length === 0 ? (
                  <span className="text-sm text-zinc-500">Aucun horaire</span>
                ) : (
                  availableTimes.map((time) => (
                    <Chip
                      key={time}
                      active={selectedTime === time}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Chip>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Results */}
        {error && <Alert>{error}</Alert>}
        {loading && items.length === 0 ? (
          <ul className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3"
              >
                <div className="h-14 w-14 shrink-0 rounded-xl bg-zinc-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/5 rounded bg-zinc-100" />
                  <div className="h-3 w-1/3 rounded bg-zinc-100" />
                  <div className="h-3 w-1/4 rounded bg-zinc-100" />
                </div>
                <div className="hidden flex-col items-end gap-2 sm:flex">
                  <div className="h-4 w-14 rounded bg-zinc-100" />
                  <div className="h-9 w-24 rounded-lg bg-zinc-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : displayedItems.length === 0 ? (
          <div
            className={`rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm font-medium text-zinc-500 transition-opacity duration-200 ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            Aucun créneau disponible pour cette date et ces critères. Essayez une autre date ou un autre filtre.
          </div>
        ) : (
          <ul
            className={`flex flex-col gap-2 transition-opacity duration-200 ${
              loading ? "pointer-events-none opacity-60" : "opacity-100"
            }`}
          >
            {displayedItems.map((row) => (
              <li key={`${row.resourceId}-${row.startTime}`}>
                <CourtCard row={row} date={selectedDate} durationMin={durationMin} />
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}

function CourtCard({
  row,
  date,
  durationMin,
}: {
  row: CourtOfferRow;
  date: string;
  durationMin: number;
}) {
  const img = cardImage(row);
  const bookHref = `/partenaires/${row.partnerId}?date=${encodeURIComponent(date)}&resourceId=${encodeURIComponent(row.resourceId)}&start=${encodeURIComponent(row.startTime)}&durationMin=${durationMin}`;
  const hasResource = row.resourceName && row.resourceName !== "Ressource";

  return (
    <article className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-sm sm:gap-4">
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-16 sm:w-16">
        <Image src={img} alt="" fill sizes="64px" className="object-cover" />
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold text-zinc-900">
            {row.partnerName}
            {hasResource && (
              <span className="font-normal text-zinc-500"> · {row.resourceName}</span>
            )}
          </h3>
          {row.offerTitle && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
              {row.offerTitle}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {row.city}
          {row.governorate ? `, ${row.governorate}` : ""}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
            <ClockIcon />
            {row.startTime} – {row.endTime}
          </span>
          <span className="text-zinc-500">{durationMin} min</span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex items-baseline gap-1.5">
          {row.originalPrice && (
            <span className="text-[11px] font-semibold text-zinc-400 line-through">
              {row.originalPrice.toString()} DT
            </span>
          )}
          <span
            className={`text-sm font-bold leading-none sm:text-base ${
              row.originalPrice ? "text-rose-600" : "text-zinc-900"
            }`}
          >
            {row.price > 0 ? row.price.toString() : "--"} DT
          </span>
        </div>
        <Link href={bookHref}>
          <Button variant="gradient" size="sm" className="whitespace-nowrap">
            Réserver
          </Button>
        </Link>
      </div>
    </article>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-3 w-3"
      aria-hidden
    >
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6.5V10l2.2 1.5" />
    </svg>
  );
}
