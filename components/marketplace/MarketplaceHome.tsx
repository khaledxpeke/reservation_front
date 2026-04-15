"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { searchCourtSlots, type CourtOfferRow } from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { picsumFromSeed } from "@/lib/imageUrls";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import { Alert } from "@/components/ui";

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
  const [city, setCity] = useState("");

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
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase mb-1">Catégorie</label>
              <select className="border border-zinc-300 rounded-md p-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Toutes</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase mb-1">Sous-catégorie</label>
              <select className="border border-zinc-300 rounded-md p-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow disabled:opacity-50 disabled:bg-zinc-50" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} disabled={!categoryId}>
                <option value="">Toutes</option>
                {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase mb-1">Région</label>
              <select className="border border-zinc-300 rounded-md p-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none transition-shadow" value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
                <option value="">Toutes</option>
                {TUNISIA_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Date Picker & Time Bands Card */}
        <div className="bg-white rounded-xl border border-zinc-200 mb-6 overflow-hidden">
          <div className="border-b border-zinc-200 p-3 sm:p-4">
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                
                {/* Top Header Mobile / Left Side Desktop */}
                <div className="flex items-center justify-between w-full sm:w-auto shrink-0">
                   <div className="flex flex-col items-start sm:items-center justify-center w-auto sm:w-32">
                      <span className="text-sm sm:text-base font-bold capitalize text-zinc-800 mb-0.5 sm:mb-2 text-left sm:text-center leading-tight">{currentMonthYear}</span>
                      <button 
                         onClick={handleToday} 
                         className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 px-2 py-1 rounded-md sm:rounded-full bg-emerald-50 hover:bg-emerald-100 transition"
                      >
                         Aujourd'hui
                      </button>
                   </div>

                   {/* Mobile Arrows */}
                   <div className="flex items-center gap-2 sm:hidden">
                      <button 
                         onClick={handlePrevDays} 
                         className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-emerald-700 hover:bg-emerald-50 transition"
                         title="Semaine précédente"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button 
                         onClick={handleNextDays} 
                         className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-emerald-700 hover:bg-emerald-50 transition"
                         title="Semaine suivante"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                   </div>
                </div>

                {/* Desktop Prev Arrow */}
                <button 
                   onClick={handlePrevDays} 
                   className="hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition"
                   title="Semaine précédente"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>

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
                <button 
                   onClick={handleNextDays} 
                   className="hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition"
                   title="Semaine suivante"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
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
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-5 py-2 rounded-xl text-sm font-bold border-2 transition shadow-sm ${
                        selectedTime === time
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-white text-emerald-700 border-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {time}
                    </button>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Results */}
        {error && <Alert>{error}</Alert>}
        {loading && items.length === 0 ? (
          <div className="space-y-4 min-h-[300px]">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden p-3 sm:p-4 animate-pulse">
                 <div className="flex items-center flex-1 min-w-0">
                   <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 mr-3 sm:mr-4 rounded-full bg-zinc-200"></div>
                   <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                     <div className="h-4 sm:h-5 bg-zinc-200 rounded w-3/4 sm:w-1/2"></div>
                     <div className="h-3 sm:h-4 bg-zinc-200 rounded w-1/2 sm:w-1/3"></div>
                   </div>
                 </div>
                 <div className="flex items-center justify-between sm:justify-end shrink-0 mt-3 sm:mt-0 w-full sm:w-auto border-t sm:border-t-0 border-zinc-100 pt-3 sm:pt-0 sm:pl-4">
                   <div className="h-5 sm:h-6 bg-zinc-200 rounded w-16"></div>
                   <div className="h-9 sm:h-10 bg-zinc-200 rounded w-24 sm:w-28 ml-4"></div>
                 </div>
              </div>
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className={`bg-white rounded-xl shadow-sm border border-zinc-200 p-12 text-center text-zinc-500 font-medium min-h-[300px] flex items-center justify-center transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
            Aucun créneau disponible pour cette date et ces critères. Essayez une autre date ou un autre filtre.
          </div>
        ) : (
          <div className={`space-y-4 min-h-[300px] transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
            {displayedItems.map((row) => (
              <CourtCard key={`${row.resourceId}-${row.startTime}`} row={row} date={selectedDate} durationMin={durationMin} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function CourtCard({ row, date, durationMin }: { row: CourtOfferRow; date: string; durationMin: number }) {
  const img = cardImage(row);
  const bookHref = `/partenaires/${row.partnerId}?date=${encodeURIComponent(date)}&resourceId=${encodeURIComponent(row.resourceId)}&start=${encodeURIComponent(row.startTime)}&durationMin=${durationMin}`;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition p-3 sm:p-4">
       
       <div className="flex items-center flex-1 min-w-0">
         {/* Image */}
         <div className="relative w-14 h-14 sm:w-20 sm:h-20 shrink-0 mr-3 sm:mr-4 rounded-full overflow-hidden border border-zinc-100">
           <Image src={img} alt="" fill className="object-cover" sizes="(max-width:640px) 56px, 80px" />
         </div>

         {/* Content */}
         <div className="flex-1 min-w-0">
           <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
             <h3 className="font-bold text-zinc-900 text-sm sm:text-base truncate w-full sm:w-auto">
               {row.partnerName} <span className="font-medium text-zinc-500">{row.resourceName !== "Ressource" ? `- ${row.resourceName}` : ""}</span>
             </h3>
             {row.offerTitle && (
               <span className="shrink-0 bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wide">
                 {row.offerTitle}
               </span>
             )}
           </div>
           <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-500 mt-1">
              <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md">{row.startTime} - {row.endTime}</span>
              <span className="hidden sm:inline">•</span>
              <span>{durationMin} min</span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate w-full sm:w-auto">{row.city}{row.governorate ? `, ${row.governorate}` : ""}</span>
           </div>
         </div>
       </div>

       {/* Action Box */}
       <div className="flex items-center justify-between sm:justify-end shrink-0 mt-3 sm:mt-0 w-full sm:w-auto border-t sm:border-t-0 border-zinc-100 pt-3 sm:pt-0 sm:pl-4">
         <div className="flex items-baseline sm:flex-col sm:items-end gap-2 sm:gap-0">
           {row.originalPrice && (
             <span className="text-xs font-bold text-zinc-400 line-through sm:mb-0.5">
               {row.originalPrice.toString()} DT
             </span>
           )}
           <span className={`text-base sm:text-lg font-bold leading-none ${row.originalPrice ? "text-red-600" : "text-zinc-900"}`}>
             {row.price > 0 ? row.price.toString() : "--"} DT
           </span>
         </div>
         <Link href={bookHref} className="shrink-0 ml-4">
           <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 sm:px-5 py-2 rounded-lg transition shadow-sm whitespace-nowrap">
             Réserver
           </button>
         </Link>
       </div>
    </div>
  );
}
