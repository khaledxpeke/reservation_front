"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { searchPartners, type MarketplacePartnerItem } from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { Alert, Button, Pagination, CardSkeleton, EmptyState, Input } from "@/components/ui";

function PartnerCard({ p }: { p: MarketplacePartnerItem }) {
  return (
    <Link href={`/partenaires/${p.id}`} className="group block h-full">
      <div className="relative h-full flex flex-col rounded-3xl border-2 border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10">
        <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
          </svg>
        </div>

        <div className="mb-4">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
            {p.category.name}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {p.name}
        </h3>
        <p className="mt-2 text-sm font-medium text-slate-500 flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
          </svg>
          {p.city}
        </p>

        <div className="mt-auto pt-6 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            {p._count.resources} terrain{p._count.resources > 1 ? "s" : ""}
          </span>
          <span className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
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
    <div className="flex flex-col gap-12 bg-grid-pattern relative pb-16">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>

      {/* Hero Section */}
      <div className="relative text-center mt-12 mb-8 animate-fade-in z-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6">
          Trouvez votre terrain <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse">
            de Padel.
          </span>
        </h1>
        <p className="mt-4 text-xl text-slate-600 font-medium max-w-2xl mx-auto">
          Parcourez nos clubs partenaires, découvrez des offres incroyables et réservez en un clin d'œil.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 relative z-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="sticky top-24 rounded-3xl border-2 border-slate-100 bg-white/80 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Filtres
            </h2>
            <form
              onSubmit={(e) => { e.preventDefault(); void load(1); }}
              className="flex flex-col gap-6"
            >
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ville</label>
                <Input
                  type="text"
                  placeholder="Où voulez-vous jouer ?"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom du club</label>
                <Input
                  type="text"
                  placeholder="Ex: Padel Arena..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button type="submit" variant="gradient" className="w-full">
                  Rechercher
                </Button>
              </div>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Categories Horizontal Scroll */}
          <div className="mb-10">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setCategoryId("")}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  categoryId === "" 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105" 
                    : "bg-white text-slate-600 border-2 border-slate-100 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                Tous les terrains
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    categoryId === c.id 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105" 
                      : "bg-white text-slate-600 border-2 border-slate-100 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {error && <Alert>{error}</Alert>}

          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900">
              Clubs disponibles
            </h2>
            <div className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold animate-pulse">
              {loading ? "..." : `${items.length} club${items.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Oups, aucun club trouvé !"
              description="Essayez de modifier vos filtres ou de changer de ville."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => <PartnerCard key={p.id} p={p} />)}
            </div>
          )}

          <div className="mt-16 flex justify-center">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              loading={loading}
              onPrev={() => void load(pagination.page - 1)}
              onNext={() => void load(pagination.page + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
