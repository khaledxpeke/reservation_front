"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/types";
import { TUNISIA_GOVERNORATES } from "@/lib/tunisiaGovernorates";
import { Alert, Button, DatePicker, FormField, Input, Select } from "@/components/ui";
import type { Gender } from "@/lib/api/types";

export default function InscriptionClientPage() {
  const { registerCustomer } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxDob = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dob,
        email: email.trim(),
        phone: phone.trim(),
        region: region || undefined,
        password,
      });
      router.replace("/mon-compte");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg pt-6">
      <div className="rounded-xl border border-zinc-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Inscription joueur</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Créez votre compte pour réserver et suivre vos parties.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField label="Prénom">
            <Input
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FormField>
          <FormField label="Nom">
            <Input
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FormField>

          <FormField label="Genre">
            <Select
              required
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="MALE">Homme</option>
              <option value="FEMALE">Femme</option>
              <option value="OTHER">Autre</option>
            </Select>
          </FormField>
          <FormField label="Date de naissance">
            <DatePicker value={dob} onChange={(next) => setDob(next)} max={maxDob} />
          </FormField>

          <FormField label="E-mail" className="sm:col-span-2">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField label="Téléphone">
            <Input
              required
              autoComplete="tel"
              placeholder="+216 00 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <FormField label="Région">
            <Select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">— Choisir —</option>
              {TUNISIA_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Mot de passe (min. 6 caractères)" className="sm:col-span-2">
            <Input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          {error && (
            <div className="sm:col-span-2">
              <Alert>{error}</Alert>
            </div>
          )}

          <Button type="submit" loading={loading} className="sm:col-span-2 w-full">
            Créer mon compte
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-emerald-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
