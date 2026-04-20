"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/auth/RequireRole";
import {
  GENDER_PREF_LABEL,
  SKILL_LEVEL_LABEL,
  createMatch,
  type GenderPreference,
  type SkillLevel,
} from "@/lib/api/matches";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import {
  Alert,
  Button,
  FormField,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:30");
  const [governorate, setGovernorate] = useState(defaultRegion);
  const [city, setCity] = useState("");
  const [neededPlayers, setNeededPlayers] = useState(3);
  const [genderPref, setGenderPref] = useState<GenderPreference>("ANY");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!governorate && defaultRegion) setGovernorate(defaultRegion);
  }, [defaultRegion, governorate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setError("L'heure de début doit être avant l'heure de fin.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createMatch({
        date,
        startTime,
        endTime,
        governorate: governorate || undefined,
        city: city.trim() || undefined,
        neededPlayers,
        genderPref,
        skillLevel,
        description: description.trim() || undefined,
      });
      router.replace(`/jouer/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Publication impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Publier une annonce"
        description="Indiquez la date, le créneau et vos préférences pour trouver des partenaires."
      />

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-xl border border-zinc-100 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <FormField label="Date">
          <Input
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </FormField>
        <FormField label="Joueurs recherchés">
          <Input
            type="number"
            required
            min={1}
            max={20}
            value={neededPlayers}
            onChange={(e) => setNeededPlayers(Number(e.target.value))}
          />
        </FormField>

        <FormField label="Heure de début">
          <Input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </FormField>
        <FormField label="Heure de fin">
          <Input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </FormField>

        <FormField label="Région">
          <Select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
          >
            <option value="">— Choisir —</option>
            {TUNISIA_GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ville (optionnel)">
          <Input
            placeholder="Ex. La Marsa"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </FormField>

        <FormField label="Niveau">
          <Select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          >
            {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as SkillLevel[]).map((s) => (
              <option key={s} value={s}>
                {SKILL_LEVEL_LABEL[s]}
              </option>
            ))}
          </Select>
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

        <FormField label="Description (optionnel)" className="sm:col-span-2">
          <Textarea
            rows={3}
            maxLength={500}
            placeholder="Présentez votre partie, le lieu envisagé, le niveau attendu…"
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={submitting}
          >
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
