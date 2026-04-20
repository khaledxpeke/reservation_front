"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  GENDER_PREF_LABEL,
  SKILL_LEVEL_LABEL,
  listMatches,
  type GenderPreference,
  type ListMatchesParams,
  type MatchPostListItem,
  type SkillLevel,
} from "@/lib/api/matches";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import {
  Button,
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

  const [governorate, setGovernorate] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [genderPref, setGenderPref] = useState<GenderPreference | "">("");
  const [date, setDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ListMatchesParams = { limit: 50, page: 1 };
    if (governorate) params.governorate = governorate;
    if (skillLevel) params.skillLevel = skillLevel;
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
  }, [governorate, skillLevel, genderPref, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const ctaHref = useMemo(() => {
    if (!user) return "/connexion";
    if (user.role !== "CUSTOMER") return "/connexion";
    return "/jouer/nouveau";
  }, [user]);

  const resetFilters = () => {
    setGovernorate("");
    setSkillLevel("");
    setGenderPref("");
    setDate("");
  };

  const hasFilters = !!(governorate || skillLevel || genderPref || date);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Trouver des partenaires"
          description="Parcourez les annonces ouvertes ou publiez la vôtre pour compléter votre équipe."
        />
        <div className="flex shrink-0 items-center gap-2">
          <Link href={ctaHref}>
            <Button variant="primary">Publier une annonce</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Date">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size="sm"
          />
        </FormField>
        <FormField label="Région">
          <Select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            size="sm"
          >
            <option value="">Toutes les régions</option>
            {TUNISIA_GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Niveau">
          <Select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel | "")}
            size="sm"
          >
            <option value="">Tous niveaux</option>
            {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as SkillLevel[]).map((s) => (
              <option key={s} value={s}>
                {SKILL_LEVEL_LABEL[s]}
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

        {hasFilters && (
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
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
              : "Soyez le premier à publier une annonce et trouver des partenaires."
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
