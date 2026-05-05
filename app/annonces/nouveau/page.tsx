"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/auth/RequireRole";
import { fetchAllPartners, type MarketplacePartnerItem } from "@/lib/api/marketplace";
import { listCategories, type Category } from "@/lib/api/categories";
import {
  GENDER_PREF_LABEL,
  createMatch,
  type GenderPreference,
  type ScheduleSlot,
} from "@/lib/api/matches";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import {
  Alert,
  Button,
  DatePicker,
  FormField,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const partnerTriggerClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-left text-sm text-zinc-900 transition-colors duration-200 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500";

/** Partenaires du même secteur que l’annonce ; priorité aux établissements avec une ressource dans la sous-catégorie choisie. */
function filterPartnersByAnnonceCategory(
  partners: MarketplacePartnerItem[],
  annonceCategoryId: string,
  annonceSubCategoryId: string,
): MarketplacePartnerItem[] {
  if (!annonceCategoryId) return [];
  const inCategory = partners.filter((p) => p.category.id === annonceCategoryId);
  if (!annonceSubCategoryId) {
    return inCategory.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }
  const withMatchingResource = inCategory.filter((p) =>
    p.resources.some((r) => r.subCategoryId === annonceSubCategoryId),
  );
  const list =
    withMatchingResource.length > 0 ? withMatchingResource : inCategory;
  return list.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}

function PartnerSearchSelect({
  partners,
  value,
  onChange,
  loading,
}: {
  partners: MarketplacePartnerItem[];
  value: string;
  onChange: (partnerId: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = useMemo(() => partners.find((p) => p.id === value), [partners, value]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return partners;
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.city.toLowerCase().includes(t) ||
        (p.governorate?.toLowerCase().includes(t) ?? false),
    );
  }, [partners, q]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const triggerLabel = loading
    ? "Chargement des partenaires…"
    : selected
      ? `${selected.name} — ${selected.city}`
      : "— Aucun partenaire —";

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={loading}
        className={partnerTriggerClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 p-2">
            <Input
              size="sm"
              placeholder="Rechercher nom, ville, région…"
              value={q}
              autoComplete="off"
              onChange={(e) => setQ(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1" role="listbox">
            <li role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                — Aucun partenaire —
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-zinc-500">
                {partners.length === 0
                  ? "Aucun partenaire pour cette catégorie."
                  : "Aucun résultat pour cette recherche."}
              </li>
            ) : (
              filtered.map((p) => (
                <li key={p.id} role="option">
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                      value === p.id ? "bg-emerald-50 text-emerald-900" : "text-zinc-900"
                    }`}
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-zinc-500">
                      {" "}
                      — {p.city}
                      {p.governorate ? ` · ${p.governorate}` : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function NouvelleAnnoncePage() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <NouvelleAnnonceForm />
    </RequireRole>
  );
}

function NouvelleAnnonceForm() {
  const router = useRouter();
  const { user } = useAuth();

  const today = todayISO();
  const defaultRegion = user?.customerProfile?.region ?? "";

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const [slots, setSlots] = useState<ScheduleSlot[]>([
    { date: today, startTime: "18:00", endTime: "19:30" },
  ]);
  const [governorate, setGovernorate] = useState(defaultRegion);
  const [city, setCity] = useState("");
  const [neededPeople, setNeededPeople] = useState(3);
  const [genderPref, setGenderPref] = useState<GenderPreference>("ANY");
  const [skillLevel, setSkillLevel] = useState("");
  const [description, setDescription] = useState("");

  const [transportFrom, setTransportFrom] = useState("");
  const [transportTo, setTransportTo] = useState("");

  const [partnerId, setPartnerId] = useState("");
  const [partners, setPartners] = useState<MarketplacePartnerItem[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const list = await listCategories();
        if (!cancelled) {
          const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
          setCategories(sorted);
          if (sorted.length > 0 && !categoryId) {
            const first = sorted[0]!;
            setCategoryId(first.id);
            const subs = [...first.subCategories].sort((a, b) => a.name.localeCompare(b.name, "fr"));
            if (subs[0]) setSubCategoryId(subs[0].id);
          }
        }
      } catch {
        if (!cancelled) {
          setCatalogError("Impossible de charger les catégories. Réessayez plus tard.");
          setCategories([]);
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    if (!governorate && defaultRegion) setGovernorate(defaultRegion);
  }, [defaultRegion, governorate]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPartnersLoading(true);
      try {
        const all = await fetchAllPartners();
        if (!cancelled) setPartners(all);
      } catch {
        if (!cancelled) setPartners([]);
      } finally {
        if (!cancelled) setPartnersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const subCategoriesSorted = useMemo(() => {
    if (!selectedCategory) return [];
    return [...selectedCategory.subCategories].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory || subCategoriesSorted.length === 0) return;
    const stillValid = subCategoriesSorted.some((s) => s.id === subCategoryId);
    if (!stillValid) setSubCategoryId(subCategoriesSorted[0]!.id);
  }, [selectedCategory, subCategoriesSorted, subCategoryId]);

  const categorySlug = selectedCategory?.slug ?? "";

  const partnersForPicker = useMemo(
    () => filterPartnersByAnnonceCategory(partners, categoryId, subCategoryId),
    [partners, categoryId, subCategoryId],
  );

  const selectedSubName = useMemo(
    () => subCategoriesSorted.find((s) => s.id === subCategoryId)?.name,
    [subCategoriesSorted, subCategoryId],
  );

  useEffect(() => {
    if (!partnerId) return;
    if (!partnersForPicker.some((p) => p.id === partnerId)) {
      setPartnerId("");
    }
  }, [partnerId, partnersForPicker]);

  const updateSlot = (index: number, patch: Partial<ScheduleSlot>) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSlot = () => {
    const lastDate = slots[slots.length - 1]?.date ?? today;
    setSlots((prev) => [...prev, { date: lastDate, startTime: "14:00", endTime: "17:00" }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  function buildMeta(): Record<string, unknown> | undefined {
    if (categorySlug === "vehicules") {
      return {
        transportFrom: transportFrom.trim(),
        transportTo: transportTo.trim(),
      };
    }
    return undefined;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId || !subCategoryId) {
      setError("Choisissez une catégorie et une sous-catégorie.");
      return;
    }

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]!;
      if (s.startTime >= s.endTime) {
        setError(`Jour ${i + 1} : l'heure de début doit être avant l'heure de fin.`);
        return;
      }
    }

    if (description.trim().length < 10) {
      setError("La description est obligatoire (au moins quelques phrases).");
      return;
    }

    if (categorySlug === "vehicules") {
      if (!transportFrom.trim() || !transportTo.trim()) {
        setError("Indiquez le départ et la destination pour la location / le trajet.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = await createMatch({
        categoryId,
        subCategoryId,
        scheduleSlots: slots,
        governorate: governorate || undefined,
        city: city.trim() || undefined,
        neededPeople,
        description: description.trim(),
        partnerId: partnerId || undefined,
        meta: buildMeta(),
        genderPref: categorySlug === "sports" ? genderPref : "ANY",
        skillLevel:
          categorySlug === "sports" && skillLevel.trim()
            ? skillLevel.trim()
            : undefined,
      });
      router.replace(`/annonces/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const detailMsg = err.details
          .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
          .join(" · ");
        setError(detailMsg || err.message);
      } else {
        setError(err instanceof ApiError ? err.message : "Publication impossible.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (catalogLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500">
        <Spinner />
        <p className="text-sm">Chargement des catégories…</p>
      </div>
    );
  }

  if (catalogError || categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader title="Publier une annonce" description="Catégories indisponibles." />
        <Alert>{catalogError ?? "Aucune catégorie configurée. Contactez l'administrateur."}</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Publier une annonce"
        description="Choisissez la catégorie et la sous-catégorie du site (comme sur le marketplace), puis décrivez votre besoin et vos créneaux."
      />

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-xl border border-zinc-100 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <FormField label="Catégorie" className="sm:col-span-2">
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubCategoryId("");
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-zinc-500">
            Les mêmes catégories que pour les partenaires (ex. Sports & Terrains, Activités Nautiques).
          </p>
        </FormField>

        <FormField label="Sous-catégorie" className="sm:col-span-2">
          <Select
            value={subCategoryId}
            onChange={(e) => setSubCategoryId(e.target.value)}
            disabled={!selectedCategory || subCategoriesSorted.length === 0}
          >
            {!selectedCategory || subCategoriesSorted.length === 0 ? (
              <option value="">—</option>
            ) : (
              subCategoriesSorted.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </Select>
        </FormField>

        <div className="sm:col-span-2 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-800">Créneaux (1 jour ou plusieurs)</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={addSlot}>
                + Jour
              </Button>
            </div>
          </div>
          {slots.map((slot, i) => (
            <div
              key={i}
              className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <FormField label={`Date — jour ${i + 1}`}>
                <DatePicker min={today} value={slot.date} onChange={(d) => updateSlot(i, { date: d })} />
              </FormField>
              <FormField label="Début">
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                />
              </FormField>
              <FormField label="Fin">
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                />
              </FormField>
              {slots.length > 1 ? (
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSlot(i)}>
                    Retirer
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <FormField label="Personnes recherchées">
          <Input
            type="number"
            required
            min={1}
            max={50}
            value={neededPeople}
            onChange={(e) => setNeededPeople(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-zinc-500">Joueurs, passagers, places, participants…</p>
        </FormField>

        {categorySlug === "sports" ? (
          <>
            <FormField label="Niveau recherché (facultatif)" className="sm:col-span-2">
              <Input
                type="text"
                placeholder="Ex. Intermédiaire, 3-4, confirmé club…"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
              />
            </FormField>
            <FormField label="Préférence de genre">
              <Select
                value={genderPref}
                onChange={(e) => setGenderPref(e.target.value as GenderPreference)}
              >
                {(["ANY", "MALE", "FEMALE"] as GenderPreference[]).map((g) => (
                  <option key={g} value={g}>
                    {GENDER_PREF_LABEL[g]}
                  </option>
                ))}
              </Select>
            </FormField>
          </>
        ) : null}

        {categorySlug === "vehicules" ? (
          <>
            <FormField label="Départ">
              <Input
                placeholder="Ex. Djerba"
                value={transportFrom}
                onChange={(e) => setTransportFrom(e.target.value)}
              />
            </FormField>
            <FormField label="Destination">
              <Input
                placeholder="Ex. Tunis"
                value={transportTo}
                onChange={(e) => setTransportTo(e.target.value)}
              />
            </FormField>
          </>
        ) : null}

        <FormField label="Région">
          <Select value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
            <option value="">— Choisir —</option>
            {TUNISIA_GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ville (optionnel)">
          <Input placeholder="Ex. centre-ville" value={city} onChange={(e) => setCity(e.target.value)} />
        </FormField>

        <FormField label="Partenaire (optionnel)" className="sm:col-span-2">
          <PartnerSearchSelect
            key={`${categoryId}-${subCategoryId}`}
            partners={partnersForPicker}
            value={partnerId}
            onChange={setPartnerId}
            loading={partnersLoading}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Liste limitée aux partenaires de la catégorie{" "}
            <span className="font-medium text-zinc-700">{selectedCategory?.name ?? "—"}</span>
            {selectedSubName ? (
              <>
                {" "}
                (priorité à ceux qui ont une ressource «{" "}
                <span className="font-medium text-zinc-700">{selectedSubName}</span> »)
              </>
            ) : null}
            . La recherche filtre cette liste.
          </p>
        </FormField>

        <FormField label="Description (obligatoire)" className="sm:col-span-2">
          <Textarea
            rows={5}
            maxLength={4000}
            required
            placeholder="Décrivez votre annonce : activité, contraintes, contexte…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        {error ? (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            Publier
          </Button>
        </div>
      </form>
    </div>
  );
}
