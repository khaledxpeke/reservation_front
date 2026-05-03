"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { searchPartners, type MarketplacePartnerItem } from "@/lib/api/marketplace";
import { Input, Select } from "@/components/ui";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import { partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Recommended card ─────────────────────────────────────────────────────────

function RecommendCard({ partner }: { partner: MarketplacePartnerItem }) {
  const hero = partnerHeroUrl({ id: partner.id, coverImage: partner.coverImage, logo: partner.logo });
  const logo = partnerLogoUrl({ id: partner.id, logo: partner.logo });
  const minPrice = useMemo(() => {
    const prices = partner.resources.map((r) => Number(r.price ?? 0)).filter((n) => n > 0);
    if (!prices.length) return null;
    return Math.min(...prices);
  }, [partner.resources]);

  return (
    <Link
      href={`/partenaires/${partner.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-teal-300/60 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <Image src={hero} alt={partner.name} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition group-hover:scale-[1.03]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow">
            <Image src={logo} alt="" fill sizes="32px" className="object-cover" />
          </div>
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 backdrop-blur-sm">
            {partner.category.name}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="truncate text-sm font-semibold text-slate-900">{partner.name}</h3>
        <p className="truncate text-xs text-slate-500">
          {partner.city}{partner.governorate ? `, ${partner.governorate}` : ""}
        </p>
        {minPrice != null && (
          <p className="mt-auto pt-2 text-sm font-bold text-teal-600">
            {minPrice.toFixed(0)} <span className="text-xs font-normal text-slate-400">DT / unité</span>
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Trust badge ──────────────────────────────────────────────────────────────

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">{icon}</span>
      {label}
    </span>
  );
}

// ─── Hero search moteur ───────────────────────────────────────────────────────

function SearchMoteur() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [gov, setGov] = useState("");
  const [mode, setMode] = useState<"hour" | "day" | "multiday">("hour");
  const [date, setDate] = useState(todayISO());
  const [dateTo, setDateTo] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set("mode", mode);
    if (query.trim()) p.set("q", query.trim());
    if (gov.trim()) p.set("governorate", gov.trim());
    if (date) p.set("date", date);
    if (mode === "multiday" && dateTo) p.set("dateTo", dateTo);
    router.push(`/recherche?${p.toString()}`);
  };

  const modeLabel: Record<typeof mode, string> = { hour: "À l'heure", day: "À la journée", multiday: "Multi-jours" };

  return (
    <form onSubmit={onSubmit} className="relative z-[1] mx-auto mt-8 max-w-4xl">
      {/* Mode tabs */}
      <div className="mb-3 flex items-center gap-1 rounded-full border border-slate-200/80 bg-white p-1 shadow-sm w-fit mx-auto">
        {(["hour", "day", "multiday"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === m
                ? "bg-teal-500 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {modeLabel[m]}
          </button>
        ))}
      </div>

      {/* Main pill */}
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200/90 bg-white p-2 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)] sm:flex-row sm:items-stretch sm:p-2.5">
        {/* What */}
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-50/80 px-3 py-2.5 sm:rounded-full">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <Input
            className="!border-0 !bg-transparent !px-0 !shadow-none focus:!ring-0 text-sm"
            placeholder="Que voulez-vous louer ?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Recherche"
          />
        </div>

        {/* Where */}
        <div className="flex min-w-[140px] shrink-0 flex-col gap-0.5 rounded-2xl border border-slate-100 bg-white px-3 py-2 sm:border-0 sm:rounded-full sm:py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Région</span>
          <Select
            className="!border-0 !bg-transparent !px-0 !py-0 text-sm font-medium text-slate-900 focus:!ring-0"
            value={gov}
            onChange={(e) => setGov(e.target.value)}
            aria-label="Région"
          >
            <option value="">Toute la Tunisie</option>
            {TUNISIA_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>

        {/* Date */}
        <div className="flex min-w-[140px] shrink-0 flex-col gap-0.5 rounded-2xl border border-slate-100 bg-white px-3 py-2 sm:border-0 sm:rounded-full sm:py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {mode === "multiday" ? "Du" : "Date"}
          </span>
          <input
            type="date"
            className="bg-transparent text-sm font-medium text-slate-900 outline-none"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Date To (multiday only) */}
        {mode === "multiday" && (
          <div className="flex min-w-[140px] shrink-0 flex-col gap-0.5 rounded-2xl border border-slate-100 bg-white px-3 py-2 sm:border-0 sm:rounded-full sm:py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Au</span>
            <input
              type="date"
              className="bg-transparent text-sm font-medium text-slate-900 outline-none"
              value={dateTo}
              min={date || todayISO()}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          className="shrink-0 rounded-2xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 sm:rounded-full"
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RentZoneHome() {
  const [recommended, setRecommended] = useState<MarketplacePartnerItem[]>([]);

  const loadRecommended = useCallback(async () => {
    try {
      const data = await searchPartners({ page: 1, limit: 6 });
      setRecommended(data.items);
    } catch {
      setRecommended([]);
    }
  }, []);

  useEffect(() => { void loadRecommended(); }, [loadRecommended]);

  return (
    <div className="-mt-8 sm:-mt-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="breakout-viewport relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl md:h-96 md:w-96" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Tout louer,{" "}
              <span className="text-teal-500">en un clic<span className="text-slate-900">.</span></span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Équipements, véhicules, espaces et services — à l'heure, à la journée ou pour plusieurs jours.
            </p>
          </div>

          <SearchMoteur />

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-6 sm:gap-10">
            <TrustBadge label="Partenaires vérifiés" icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z" />
              </svg>
            } />
            <TrustBadge label="Réponse en moins de 30 min" icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            } />
            <TrustBadge label="Disponibilité en temps réel" icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 10.5 6.75 14.25 11.25 20.25 4.5" />
              </svg>
            } />
          </div>
        </div>
      </section>

      {/* ── Trouver des joueurs ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pb-12">
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Cherchez des coéquipiers
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Publiez une annonce (il vous manque des joueurs) ou rejoignez une partie près de chez vous — padel, tennis et autres sports.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:shrink-0 sm:flex-row sm:items-center">
            <Link
              href="/jouer"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 sm:min-w-[11rem]"
            >
              Voir les annonces
            </Link>
            <Link
              href="/jouer/nouveau"
              className="inline-flex items-center justify-center rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 sm:min-w-[11rem]"
            >
              Publier une annonce
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recommended ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Populaires en ce moment</h2>
            <p className="mt-1 text-sm text-slate-500">Sélection de partenaires les plus demandés.</p>
          </div>
          <Link href="/partenaires" className="hidden text-sm font-semibold text-teal-600 hover:text-teal-700 sm:inline">
            Voir tout →
          </Link>
        </div>
        {recommended.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((p) => <RecommendCard key={p.id} partner={p} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
            Aucune recommandation pour le moment.
          </p>
        )}
        <div className="mt-6 text-center sm:hidden">
          <Link href="/partenaires" className="text-sm font-semibold text-teal-600">Voir tout →</Link>
        </div>
      </section>
    </div>
  );
}
