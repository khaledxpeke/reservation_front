"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { searchPartners, type MarketplacePartnerItem } from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { Alert, Pagination, EmptyState } from "@/components/ui";
import { categoryImageUrl, partnerHeroUrl, partnerLogoUrl, picsumFromSeed } from "@/lib/imageUrls";

function PartnerCard({ p, priorityLcp }: { p: MarketplacePartnerItem; priorityLcp?: boolean }) {
  const capacity = p.resources.length > 0 ? p.resources[0].capacity || 4 : 4;
  const hero = partnerHeroUrl(p);
  const logo = partnerLogoUrl(p);

  return (
    <div className="flex flex-col sm:flex-row gap-6 bg-white rounded-3xl p-4 border border-zinc-200 transition-shadow hover:shadow-md">
      <div className="relative w-full sm:w-64 h-48 sm:min-h-[200px] shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
        <Image
          src={hero}
          alt={`${p.name} — photo`}
          fill
          priority={priorityLcp}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 256px"
        />
        <div className="absolute bottom-2 left-2 h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <Image
            src={logo}
            alt={`Logo ${p.name}`}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Middle Content */}
      <div className="flex-1 py-2 flex flex-col">
        <div className="mb-2">
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            {p.category.name}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-zinc-900 mb-2">
          {p.name}
        </h3>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-3">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {capacity} Joueurs
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {p.city}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            {p._count.resources} Terrains
          </span>
        </div>
        
        <p className="text-zinc-500 text-sm mt-auto max-w-md">
          Espace professionnel et lumineux parfait pour vos parties de Padel. {p.address ? p.address : ''}
        </p>
      </div>

      <div className="flex w-full flex-col items-start justify-between border-zinc-100 py-2 sm:w-48 sm:items-end sm:border-l sm:pl-6">
        <div className="mb-4 w-full text-left sm:mb-0 sm:text-right">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Créneaux</p>
          <p className="text-sm text-zinc-600">Voir disponibilités et tarifs sur la fiche club.</p>
        </div>
        <Link href={`/partenaires/${p.id}`} className="w-full">
          <button
            type="button"
            className="w-full rounded-xl bg-zinc-900 py-3 px-4 font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Réserver
          </button>
        </Link>
      </div>
    </div>
  );
}

export function MarketplaceHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MarketplacePartnerItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchPartners({
        page,
        limit: 12,
        city: city || undefined,
        search: search || undefined,
        categoryId: categoryId || undefined,
      });
      setItems(data.items);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger les partenaires.");
    } finally {
      setLoading(false);
    }
  }, [city, search, categoryId]);

  useEffect(() => {
    void listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => { void load(1); }, [load]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
            {/* Search Form Card */}
            <div className="bg-white rounded-[24px] border border-zinc-200 p-6 shadow-sm">
              <form onSubmit={(e) => { e.preventDefault(); void load(1); }} className="space-y-6">
                
                {/* What do you need */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Que cherchez-vous ?</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <select
                      className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent appearance-none font-medium"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Tous les types</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date (Mock) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Ville</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <input 
                        type="text"
                        placeholder="Ex: Paris"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent font-medium"
                      />
                    </div>
                  </div>

                  {/* People (Mock - Map to search) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Club</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Nom..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#162a22] hover:bg-[#0f1f18] text-white font-medium py-4 px-4 rounded-xl transition-colors mt-2"
                >
                  Trouver & Réserver
                </button>
              </form>
            </div>

            {/* Instant Confirmation Card */}
            <div className="bg-[#f0f7f4] rounded-[20px] p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-emerald-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">Confirmation Instantanée</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Pas d'inscription requise. Réservez en quelques secondes.</p>
              </div>
            </div>

            {/* Quick Tip Card */}
            <div className="bg-[#fcfbf9] border border-zinc-100 rounded-[20px] p-5 flex items-start gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wide mb-1 text-[11px]">Astuce</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Filtrez vos résultats, changez la ville, ou mettez à jour votre recherche sans quitter la page.</p>
              </div>
            </div>

          </aside>

          {/* Right Content Area */}
          <main className="flex-1 min-w-0">
            {/* Top Bar: Results count & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-900">
                {loading ? "Recherche en cours..." : `${items.length} ESPACE${items.length > 1 ? "S" : ""} TROUVÉ${items.length > 1 ? "S" : ""}`}
              </h2>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  Filtres
                </button>
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2">
                  <span className="text-sm text-zinc-500">Trier par:</span>
                  <select className="text-sm font-medium text-zinc-900 bg-transparent focus:outline-none appearance-none pr-4 relative">
                    <option>Recommandé</option>
                    <option>Prix croissant</option>
                    <option>Prix décroissant</option>
                  </select>
                </div>
              </div>
            </div>

            {error && <Alert>{error}</Alert>}

            {categories.length > 0 && (
              <div className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Par catégorie
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  <button
                    type="button"
                    onClick={() => setCategoryId("")}
                    className={`flex shrink-0 flex-col overflow-hidden rounded-2xl border-2 text-left transition ${
                      categoryId === ""
                        ? "border-[#162a22] ring-2 ring-[#162a22]/20"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="relative h-20 w-28 bg-zinc-100">
                      <Image
                        src={picsumFromSeed("marketplace-all-categories", 280, 200)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                    <span className="bg-white px-2 py-2 text-center text-xs font-semibold text-zinc-800">
                      Tous
                    </span>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`flex shrink-0 flex-col overflow-hidden rounded-2xl border-2 text-left transition ${
                        categoryId === c.id
                          ? "border-[#162a22] ring-2 ring-[#162a22]/20"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="relative h-20 w-28 bg-zinc-100">
                        <Image
                          src={categoryImageUrl(c)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>
                      <span className="max-w-[7rem] truncate bg-white px-2 py-2 text-center text-xs font-semibold text-zinc-800">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 bg-white border border-zinc-200 rounded-3xl animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-400 rounded-full animate-spin"></div>
                  </div>
                ))
              ) : items.length === 0 ? (
                <EmptyState
                  title="Oups, aucun club trouvé !"
                  description="Essayez de modifier vos filtres ou de changer de ville."
                />
              ) : (
                items.map((p, i) => (
                  <PartnerCard key={p.id} p={p} priorityLcp={i === 0} />
                ))
              )}
            </div>

            {/* Pagination */}
            {items.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  loading={loading}
                  onPrev={() => void load(pagination.page - 1)}
                  onNext={() => void load(pagination.page + 1)}
                />
              </div>
            )}
          </main>
          
        </div>
      </div>
    </div>
  );
}
