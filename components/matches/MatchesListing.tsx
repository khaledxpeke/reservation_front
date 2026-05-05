"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listCategories, type Category } from "@/lib/api/categories";
import {
  GENDER_PREF_LABEL,
  listMatches,
  type GenderPreference,
  type ListMatchesParams,
  type MatchPostListItem,
} from "@/lib/api/matches";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import {
  Button,
  DatePicker,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";
import { MatchPostCard } from "./MatchPostCard";

export function MatchesListing() {
  const { user } = useAuth();
  const [items, setItems] = useState<MatchPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterSubCategoryId, setFilterSubCategoryId] = useState("");

  const [governorate, setGovernorate] = useState("");
  const [categoryKeyword, setCategoryKeyword] = useState("");
  const [genderPref, setGenderPref] = useState<GenderPreference | "">("");
  const [date, setDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listCategories();
        if (!cancelled) {
          setCategories([...list].sort((a, b) => a.name.localeCompare(b.name, "fr")));
        }
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFilterCategory = useMemo(
    () => categories.find((c) => c.id === filterCategoryId),
    [categories, filterCategoryId],
  );

  const filterSubCategories = useMemo(() => {
    if (!selectedFilterCategory) return [];
    return [...selectedFilterCategory.subCategories].sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );
  }, [selectedFilterCategory]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ListMatchesParams = { limit: 50, page: 1 };
    if (governorate) params.governorate = governorate;
    if (filterCategoryId) params.categoryId = filterCategoryId;
    if (filterSubCategoryId) params.subCategoryId = filterSubCategoryId;
    const kw = categoryKeyword.trim();
    if (kw) params.category = kw;
    if (genderPref) params.genderPref = genderPref;
    if (date) params.date = date;
    try {
      const result = await listMatches(params);
      setItems(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [
    governorate,
    filterCategoryId,
    filterSubCategoryId,
    categoryKeyword,
    genderPref,
    date,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const ctaHref = useMemo(() => {
    if (!user) return "/connexion";
    if (user.role !== "CUSTOMER") return "/connexion";
    return "/annonces/nouveau";
  }, [user]);

  const resetFilters = () => {
    setGovernorate("");
    setFilterCategoryId("");
    setFilterSubCategoryId("");
    setCategoryKeyword("");
    setGenderPref("");
    setDate("");
  };

  const hasFilters = !!(
    governorate ||
    filterCategoryId ||
    filterSubCategoryId ||
    categoryKeyword.trim() ||
    genderPref ||
    date
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Annonces"
          description="Filtrez par catégorie du site (comme le marketplace), date, région… ou publiez votre annonce."
        />
        <div className="flex shrink-0 items-center gap-2">
          <Link href={ctaHref}>
            <Button variant="primary">Publier une annonce</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FormField label="Date (dans le créneau)">
          <DatePicker value={date} onChange={(next) => setDate(next)} size="sm" />
        </FormField>
        <FormField label="Catégorie">
          <Select
            value={filterCategoryId}
            onChange={(e) => {
              setFilterCategoryId(e.target.value);
              setFilterSubCategoryId("");
            }}
            size="sm"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Sous-catégorie">
          <Select
            value={filterSubCategoryId}
            onChange={(e) => setFilterSubCategoryId(e.target.value)}
            size="sm"
            disabled={!filterCategoryId || filterSubCategories.length === 0}
          >
            <option value="">Toutes</option>
            {filterSubCategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Mot-clé (nom affiché)">
          <Input
            size="sm"
            placeholder="Ex. Padel"
            value={categoryKeyword}
            onChange={(e) => setCategoryKeyword(e.target.value)}
          />
        </FormField>
        <FormField label="Région">
          <Select value={governorate} onChange={(e) => setGovernorate(e.target.value)} size="sm">
            <option value="">Toutes les régions</option>
            {TUNISIA_GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Préférence">
          <Select
            value={genderPref}
            onChange={(e) => setGenderPref(e.target.value as GenderPreference | "")}
            size="sm"
          >
            <option value="">Toutes</option>
            {(["ANY", "MALE", "FEMALE"] as GenderPreference[]).map((g) => (
              <option key={g} value={g}>
                {GENDER_PREF_LABEL[g]}
              </option>
            ))}
          </Select>
        </FormField>

        {hasFilters ? (
          <div className="flex justify-end sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-400">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune annonce ouverte"
          description={
            hasFilters
              ? "Essayez de retirer un filtre, ou publiez votre propre annonce."
              : "Soyez le premier à publier une annonce."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <li key={post.id}>
              <MatchPostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
