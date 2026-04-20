"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { searchPartners, type MarketplacePartnerItem } from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import { Alert, Button, FormField, Input, PageHeader, Select } from "@/components/ui";

export function PartnersListing() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");

  const [partners, setPartners] = useState<MarketplacePartnerItem[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchPartners({
        page: 1,
        limit: 48,
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(governorate.trim() ? { governorate: governorate.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setPartners(data.items);
    } catch (e) {
      setPartners([]);
      setError(
        e instanceof ApiError ? e.message : "Impossible de charger les partenaires.",
      );
    } finally {
      setLoading(false);
    }
  }, [categoryId, subCategoryId, governorate, city, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetFilters = () => {
    setCategoryId("");
    setSubCategoryId("");
    setGovernorate("");
    setCity("");
    setSearch("");
  };

  const activeFiltersCount = [categoryId, subCategoryId, governorate, city.trim(), search.trim()]
    .filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Nos partenaires"
        description="Retrouvez l'ensemble des clubs et espaces qui vous accueillent."
      />

      {/* Filters */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Catégorie">
            <Select
              size="sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
              {subCategories.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Région">
            <Select
              size="sm"
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
            >
              <option value="">Toutes</option>
              {TUNISIA_GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Ville">
            <Input
              size="sm"
              placeholder="Tunis, Sfax..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </FormField>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 sm:max-w-xs">
            <Input
              size="sm"
              placeholder="Rechercher un partenaire…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {loading ? "Chargement…" : `${partners.length} partenaire${partners.length > 1 ? "s" : ""}`}
            </span>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      {loading && partners.length === 0 ? (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <li
              key={i}
              className="aspect-[4/5] animate-pulse rounded-xl bg-zinc-100"
            />
          ))}
        </ul>
      ) : !loading && partners.length === 0 ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Aucun partenaire ne correspond à ces critères.
          {activeFiltersCount > 0 && (
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ul
          className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 transition-opacity ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {partners.map((p) => (
            <li key={p.id}>
              <PartnerTile partner={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PartnerTile({ partner }: { partner: MarketplacePartnerItem }) {
  const hero = partnerHeroUrl({
    id: partner.id,
    coverImage: partner.coverImage,
    logo: partner.logo,
  });
  const logo = partnerLogoUrl({ id: partner.id, logo: partner.logo });

  return (
    <Link
      href={`/partenaires/${partner.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <Image
          src={hero}
          alt={partner.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white bg-white">
            <Image src={logo} alt="" fill sizes="24px" className="object-cover" />
          </div>
          <span className="truncate rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
            {partner.category.name}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <h3 className="truncate text-sm font-semibold text-zinc-900">{partner.name}</h3>
        <p className="truncate text-xs text-zinc-500">
          {partner.city}
          {partner.governorate ? `, ${partner.governorate}` : ""}
        </p>
      </div>
    </Link>
  );
}
