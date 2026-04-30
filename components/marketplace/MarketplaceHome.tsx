"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  searchCourtSlots,
  searchPartners,
  type CourtOfferRow,
  type MarketplacePartnerItem,
} from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { picsumFromSeed, partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import { Alert, Button, Chip, Select } from "@/components/ui";

// ─── Utils ────────────────────────────────────────────────────────────────────

type RentalMode = "hour" | "day" | "multiday";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1, day!));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatDayLabel(iso: string): { weekday: string; day: string; month: string } {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y!, m! - 1, day!);
  return {
    weekday: d.toLocaleDateString("fr-FR", { weekday: "short" }),
    day: String(d.getDate()),
    month: d.toLocaleDateString("fr-FR", { month: "short" }),
  };
}

function formatDateRange(from: string, to: string): string {
  if (!from) return "";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const a = new Date(from).toLocaleDateString("fr-FR", opts);
  if (!to) return a;
  const b = new Date(to).toLocaleDateString("fr-FR", opts);
  const nights = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  return `${a} → ${b} · ${nights} nuit${nights > 1 ? "s" : ""}`;
}

function cardImage(row: CourtOfferRow): string {
  if (row.imageUrl) return row.imageUrl;
  return picsumFromSeed(`court-offer-${row.resourceId}`, 960, 540);
}

const MODE_LABELS: Record<RentalMode, string> = {
  hour:     "À l'heure",
  day:      "À la journée",
  multiday: "Plusieurs jours",
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="h-4 w-4 shrink-0 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-4 w-4 shrink-0 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3 w-3" aria-hidden>
      <circle cx="10" cy="10" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6.5V10l2.2 1.5" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg className="h-4 w-4 shrink-0 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
    </svg>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

interface SearchBarProps {
  mode: RentalMode;
  setMode: (m: RentalMode) => void;
  query: string;
  setQuery: (v: string) => void;
  governorate: string;
  setGovernorate: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  onSearch: () => void;
}

function SearchBar({
  mode, setMode,
  query, setQuery,
  governorate, setGovernorate,
  date, setDate,
  dateTo, setDateTo,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md sm:-mx-6">
      <div className="mx-auto max-w-5xl px-5 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">

        {/* Mode tabs — scrollable on xs */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-5 [&::-webkit-scrollbar]:hidden">
          {(Object.keys(MODE_LABELS) as RentalMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mode === m
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Search fields */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0 sm:divide-x sm:divide-slate-100 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:shadow-sm">

          {/* Quoi */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 sm:flex-1 sm:rounded-none sm:border-0 sm:px-4 sm:py-3">
            <IconSearch />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Quoi</span>
              <input
                className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 outline-none"
                placeholder="Voiture, terrain, drone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
            </div>
          </div>

          {/* Où */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 sm:min-w-[170px] sm:rounded-none sm:border-0 sm:px-4 sm:py-3">
            <IconPin />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Où</span>
              <Select
                className="!border-0 !bg-transparent !px-0 !py-0 !shadow-none text-sm font-medium text-slate-900 focus:!ring-0"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                aria-label="Région"
              >
                <option value="">Toute la Tunisie</option>
                {TUNISIA_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </div>
          </div>

          {/* Date départ */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 sm:min-w-[150px] sm:rounded-none sm:border-0 sm:px-4 sm:py-3">
            <IconCalendar />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {mode === "multiday" ? "Du" : "Date"}
              </span>
              <input
                type="date"
                className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Date retour — multiday only */}
          {mode === "multiday" && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 sm:min-w-[150px] sm:rounded-none sm:border-0 sm:px-4 sm:py-3">
              <IconArrow />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Au</span>
                <input
                  type="date"
                  className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
                  value={dateTo}
                  min={date || todayISO()}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex pt-0.5 sm:items-stretch sm:pt-0 sm:p-1.5">
            <button
              type="button"
              onClick={onSearch}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-600 sm:py-2.5 sm:w-auto sm:rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <span>Rechercher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category filter chips ─────────────────────────────────────────────────────

function CategoryFilters({
  categories,
  categoryId,
  setCategoryId,
  subCategoryId,
  setSubCategoryId,
  subCategories,
}: {
  categories: Category[];
  categoryId: string;
  setCategoryId: (v: string) => void;
  subCategoryId: string;
  setSubCategoryId: (v: string) => void;
  subCategories: { id: string; name: string }[];
}) {
  return (
    <div className="-mx-4 border-b border-slate-100 bg-white pt-1 sm:-mx-6">
      {/* Category row — horizontal scroll on mobile */}
      <div className="mx-auto max-w-5xl">
        <div className="flex gap-2.5 overflow-x-auto px-5 pb-4 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:px-6 sm:pb-4 sm:pt-3 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => { setCategoryId(""); setSubCategoryId(""); }}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              !categoryId
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCategoryId(c.id === categoryId ? "" : c.id); setSubCategoryId(""); }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                categoryId === c.id
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sub-category row */}
        {subCategories.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto border-t border-slate-100 px-5 pb-4 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:px-6 [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sous-cat. :
            </span>
            {subCategories.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubCategoryId(s.id === subCategoryId ? "" : s.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  subCategoryId === s.id
                    ? "border-teal-400 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Date strip ───────────────────────────────────────────────────────────────

function DateStrip({
  selectedDate,
  setSelectedDate,
  dateOffset,
  setDateOffset,
}: {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  dateOffset: number;
  setDateOffset: (f: (o: number) => number) => void;
}) {
  const strip = useMemo(() => {
    const start = addDaysISO(todayISO(), dateOffset);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  }, [dateOffset]);

  const monthYear = useMemo(() => {
    const [y, m, day] = strip[0].split("-").map(Number);
    return new Date(y!, m! - 1, day!).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [strip]);

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:mb-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
        <span className="text-xs font-semibold capitalize text-slate-700 sm:text-sm">{monthYear}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDateOffset((o) => Math.max(0, o - 7))}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 active:bg-slate-100"
            aria-label="Semaine précédente"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setDateOffset(() => 0); setSelectedDate(todayISO()); }}
            className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => setDateOffset((o) => o + 7)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 active:bg-slate-100"
            aria-label="Semaine suivante"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day buttons — natural scroll on mobile */}
      <div className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {strip.map((d) => {
          const active = d === selectedDate;
          const { weekday, day, month } = formatDayLabel(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={`flex flex-1 min-w-[60px] flex-col items-center gap-0.5 border-t-[3px] px-0.5 py-3.5 transition-colors sm:min-w-[72px] sm:px-1 sm:py-4 ${
                active
                  ? "border-teal-500 bg-teal-50"
                  : "border-transparent hover:bg-slate-50 active:bg-slate-100"
              }`}
            >
              <span className={`text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] ${active ? "text-teal-600" : "text-slate-400"}`}>
                {weekday}
              </span>
              <span className={`text-sm font-bold leading-none sm:text-base ${active ? "text-teal-700" : "text-slate-800"}`}>
                {day}
              </span>
              <span className={`text-[9px] sm:text-[10px] ${active ? "text-teal-500" : "text-slate-400"}`}>
                {month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time chips ───────────────────────────────────────────────────────────────

function TimeChips({
  times,
  selected,
  setSelected,
  loading,
}: {
  times: string[];
  selected: string | null;
  setSelected: (t: string) => void;
  loading: boolean;
}) {
  if (loading && times.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-slate-100 bg-white p-4 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Horaire disponible</p>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-9 w-16 animate-pulse rounded-xl bg-slate-100 sm:w-20" />)}
        </div>
      </div>
    );
  }
  if (!loading && times.length === 0) return null;
  return (
    <div className="mb-6 rounded-xl border border-slate-100 bg-white p-4 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Horaire disponible</p>
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {times.map((t) => (
          <Chip key={t} active={selected === t} onClick={() => setSelected(t)}>
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({ row, date, durationMin }: { row: CourtOfferRow; date: string; durationMin: number }) {
  const img = cardImage(row);
  const bookHref = `/partenaires/${row.partnerId}?date=${encodeURIComponent(date)}&resourceId=${encodeURIComponent(row.resourceId)}&start=${encodeURIComponent(row.startTime)}&durationMin=${durationMin}`;
  const hasResource = row.resourceName && row.resourceName !== "Ressource";

  return (
    <article className="group rounded-xl border border-slate-200 bg-white transition hover:border-teal-200 hover:shadow-sm">
      <div className="flex items-start gap-3.5 p-4 sm:items-center sm:gap-4 sm:p-5">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-20 sm:w-20">
          <Image src={img} alt="" fill sizes="80px" className="object-cover transition group-hover:scale-[1.03]" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {row.partnerName}
              {hasResource && <span className="font-normal text-slate-400"> · {row.resourceName}</span>}
            </h3>
            {row.offerTitle && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                {row.offerTitle}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {row.city}{row.governorate ? `, ${row.governorate}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              <IconClock />
              {row.startTime} – {row.endTime}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {durationMin} min
            </span>
          </div>
        </div>

        {/* Price + CTA — visible on sm+ */}
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <div className="text-right">
            {row.originalPrice && (
              <span className="block text-xs text-slate-400 line-through">{row.originalPrice} DT</span>
            )}
            <span className={`text-lg font-bold leading-none ${row.originalPrice ? "text-rose-600" : "text-slate-900"}`}>
              {row.price > 0 ? row.price : "--"}
              <span className="ml-0.5 text-xs font-normal text-slate-400">DT</span>
            </span>
          </div>
          <Link href={bookHref}>
            <Button variant="primary" size="sm">Réserver</Button>
          </Link>
        </div>
      </div>

      {/* Mobile bottom row — price + button */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3.5 sm:hidden">
        <div>
          {row.originalPrice && (
            <span className="mr-1.5 text-xs text-slate-400 line-through">{row.originalPrice} DT</span>
          )}
          <span className={`text-sm font-bold ${row.originalPrice ? "text-rose-600" : "text-slate-900"}`}>
            {row.price > 0 ? row.price : "--"} <span className="text-xs font-normal text-slate-400">DT</span>
          </span>
        </div>
        <Link href={bookHref}>
          <Button variant="primary" size="sm">Réserver</Button>
        </Link>
      </div>
    </article>
  );
}

// ─── Partner card ─────────────────────────────────────────────────────────────

function PartnerCard({
  partner, date, dateTo, mode,
}: {
  partner: MarketplacePartnerItem;
  date: string;
  dateTo: string;
  mode: RentalMode;
}) {
  const hero = partnerHeroUrl({ id: partner.id, coverImage: partner.coverImage, logo: partner.logo });
  const logo = partnerLogoUrl({ id: partner.id, logo: partner.logo });
  const minPrice = useMemo(() => {
    const prices = partner.resources.map((r) => Number(r.price ?? 0)).filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [partner.resources]);

  const nights = useMemo(() => {
    if (mode !== "multiday" || !date || !dateTo) return null;
    const diff = Math.round((new Date(dateTo).getTime() - new Date(date).getTime()) / 86400000);
    return diff > 0 ? diff : null;
  }, [mode, date, dateTo]);

  const href = `/partenaires/${partner.id}${date ? `?date=${date}${dateTo ? `&dateTo=${dateTo}` : ""}` : ""}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md"
    >
      {/* Hero image */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100 sm:h-44">
        <Image
          src={hero}
          alt={partner.name}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          className="object-cover transition group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 sm:bottom-3 sm:left-3">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:h-8 sm:w-8">
            <Image src={logo} alt="" fill sizes="32px" className="object-cover" />
          </div>
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 backdrop-blur-sm sm:px-2.5 sm:text-[11px]">
            {partner.category.name}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-4 sm:p-5">
        <h3 className="truncate text-sm font-semibold text-slate-900">{partner.name}</h3>
        <p className="truncate text-xs text-slate-500">
          {partner.city}{partner.governorate ? `, ${partner.governorate}` : ""}
        </p>
        {partner.resources.length > 0 && (
          <p className="text-xs text-slate-400">
            {partner.resources.length} ressource{partner.resources.length > 1 ? "s" : ""}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          {minPrice != null ? (
            <div>
              <span className="text-sm font-bold text-teal-600 sm:text-base">
                {minPrice.toFixed(0)} DT
              </span>
              <span className="ml-1 text-xs text-slate-400">
                {mode === "multiday" ? "/ nuit" : "/ jour"}
              </span>
              {nights && (
                <p className="text-xs text-slate-500">
                  ≈ {(minPrice * nights).toFixed(0)} DT · {nights} nuit{nights > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">Prix sur demande</span>
          )}
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 sm:px-3">
            Voir →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function SlotSkeletons() {
  return (
    <ul className="flex flex-col gap-3 sm:gap-4">
      {[1,2,3,4].map((i) => (
        <li key={i} className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <div className="flex items-start gap-3.5 p-4 sm:items-center sm:gap-4 sm:p-5">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-slate-100 sm:h-20 sm:w-20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3.5 sm:hidden">
            <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PartnerSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {[1,2,3,4,5,6].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="h-40 bg-slate-100 sm:h-44" />
          <div className="space-y-2 p-4 sm:p-5">
            <div className="h-4 w-3/5 rounded bg-slate-100" />
            <div className="h-3 w-2/5 rounded bg-slate-100" />
            <div className="mt-3 flex justify-between">
              <div className="h-5 w-16 rounded bg-slate-100" />
              <div className="h-7 w-14 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ mode }: { mode: RentalMode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center sm:px-8 sm:py-20">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
        <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <p className="font-semibold text-slate-700">Aucun résultat</p>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        {mode === "hour"
          ? "Aucun créneau disponible pour cette date. Essayez une autre date ou élargissez les filtres."
          : "Aucun partenaire ne correspond à vos critères. Essayez de changer la catégorie ou la région."}
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MarketplaceHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<RentalMode>("hour");
  const [query, setQuery] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [date, setDate] = useState(todayISO());
  const [dateTo, setDateTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [dateOffset, setDateOffset] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [slots, setSlots] = useState<CourtOfferRow[]>([]);
  const [partners, setPartners] = useState<MarketplacePartnerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL params init
  useEffect(() => {
    const m = searchParams.get("mode") as RentalMode | null;
    if (m && ["hour", "day", "multiday"].includes(m)) setMode(m);
    const d = searchParams.get("date");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setDate(d);
    const dt = searchParams.get("dateTo");
    if (dt && /^\d{4}-\d{2}-\d{2}$/.test(dt)) setDateTo(dt);
    const g = searchParams.get("governorate");
    if (g) setGovernorate(g);
    const q = searchParams.get("q");
    if (q) setQuery(q);
    const cat = searchParams.get("categoryId");
    if (cat) setCategoryId(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const subCategories = useMemo(
    () => categories.find((x) => x.id === categoryId)?.subCategories ?? [],
    [categories, categoryId],
  );

  useEffect(() => { setSubCategoryId(""); }, [categoryId]);

  useEffect(() => {
    if (mode === "hour") {
      const strip = Array.from({ length: 7 }, (_, i) => addDaysISO(todayISO(), dateOffset + i));
      if (!strip.includes(date)) setDate(strip[0]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateOffset]);

  // Data fetch
  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchCourtSlots({
        date, durationMin: 60, timeBand: "all",
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(governorate.trim() ? { governorate: governorate.trim() } : {}),
      });
      setSlots(res.items);
    } catch (e) {
      setSlots([]);
      setError(e instanceof ApiError ? e.message : "Impossible de charger les créneaux.");
    } finally {
      setLoading(false);
    }
  }, [date, categoryId, subCategoryId, governorate]);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchPartners({
        page: 1, limit: 48,
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(governorate.trim() ? { governorate: governorate.trim() } : {}),
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      setPartners(res.items);
    } catch (e) {
      setPartners([]);
      setError(e instanceof ApiError ? e.message : "Impossible de charger les partenaires.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, subCategoryId, governorate, query]);

  useEffect(() => {
    if (mode === "hour") void loadSlots();
    else void loadPartners();
  }, [mode, loadSlots, loadPartners]);

  const availableTimes = useMemo(
    () => Array.from(new Set(slots.map((i) => i.startTime))).sort(),
    [slots],
  );

  useEffect(() => {
    if (availableTimes.length > 0 && (!selectedTime || !availableTimes.includes(selectedTime))) {
      setSelectedTime(availableTimes[0]!);
    } else if (availableTimes.length === 0) {
      setSelectedTime(null);
    }
  }, [availableTimes, selectedTime]);

  const displayedSlots = useMemo(
    () => (selectedTime ? slots.filter((i) => i.startTime === selectedTime) : []),
    [slots, selectedTime],
  );

  const handleSearch = () => {
    const p = new URLSearchParams();
    p.set("mode", mode);
    if (query.trim()) p.set("q", query.trim());
    if (governorate.trim()) p.set("governorate", governorate.trim());
    if (date) p.set("date", date);
    if (mode === "multiday" && dateTo) p.set("dateTo", dateTo);
    if (categoryId) p.set("categoryId", categoryId);
    router.push(`/recherche?${p.toString()}`);
  };

  const resultCount = loading ? null : mode === "hour" ? displayedSlots.length : partners.length;
  const dateLabel = mode === "multiday" && date && dateTo ? formatDateRange(date, dateTo) : "";

  return (
    <div className="-mx-4 -mt-8 min-h-screen bg-slate-50 sm:-mx-6 sm:-mt-10">
      <SearchBar
        mode={mode} setMode={setMode}
        query={query} setQuery={setQuery}
        governorate={governorate} setGovernorate={setGovernorate}
        date={date} setDate={setDate}
        dateTo={dateTo} setDateTo={setDateTo}
        onSearch={handleSearch}
      />
      <CategoryFilters
        categories={categories}
        categoryId={categoryId} setCategoryId={setCategoryId}
        subCategoryId={subCategoryId} setSubCategoryId={setSubCategoryId}
        subCategories={subCategories}
      />

      {/* Content */}
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">

        {/* Summary bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          {resultCount !== null && (
            <span className="text-sm font-semibold text-slate-900">
              {resultCount} résultat{resultCount !== 1 ? "s" : ""}
            </span>
          )}
          {loading && (
            <span className="text-sm text-slate-400">Chargement…</span>
          )}
          {dateLabel && (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              {dateLabel}
            </span>
          )}
          {governorate && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {governorate}
            </span>
          )}
          {query && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              &ldquo;{query}&rdquo;
            </span>
          )}
        </div>

        {error && <div className="mb-6"><Alert>{error}</Alert></div>}

        {/* Hourly */}
        {mode === "hour" && (
          <>
            <DateStrip
              selectedDate={date}
              setSelectedDate={setDate}
              dateOffset={dateOffset}
              setDateOffset={setDateOffset}
            />
            <TimeChips
              times={availableTimes}
              selected={selectedTime}
              setSelected={setSelectedTime}
              loading={loading}
            />
            {loading && slots.length === 0 ? (
              <SlotSkeletons />
            ) : !loading && displayedSlots.length === 0 ? (
              <EmptyState mode="hour" />
            ) : (
              <ul className={`flex flex-col gap-3 sm:gap-4 transition-opacity ${loading ? "pointer-events-none opacity-60" : "opacity-100"}`}>
                {displayedSlots.map((row) => (
                  <li key={`${row.resourceId}-${row.startTime}`}>
                    <SlotCard row={row} date={date} durationMin={row.durationMin || 60} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Day / multiday */}
        {(mode === "day" || mode === "multiday") && (
          <>
            {loading ? (
              <PartnerSkeletons />
            ) : partners.length === 0 ? (
              <EmptyState mode={mode} />
            ) : (
              <div className={`grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 transition-opacity ${loading ? "pointer-events-none opacity-60" : "opacity-100"}`}>
                {partners.map((p) => (
                  <PartnerCard key={p.id} partner={p} date={date} dateTo={dateTo} mode={mode} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
