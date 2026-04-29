"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { setStoredUser } from "@/lib/api/client";
import { getMyAccount, updateMyProfile } from "@/lib/api/customers";
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
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";
import type { Gender } from "@/lib/api/types";

export default function MonProfilPage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyAccount()
      .then((account) => {
        if (cancelled || !account.customerProfile) return;
        const p = account.customerProfile;
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setGender(p.gender);
        setDob(p.dob.slice(0, 10));
        setPhone(p.phone);
        setRegion(p.region ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateMyProfile({
        firstName,
        lastName,
        gender,
        dob,
        phone,
        region: region || null,
      });
      if (user) {
        const next = { ...user, customerProfile: updated };
        setUser(next);
        setStoredUser(JSON.stringify(next));
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-zinc-400">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Mettez à jour vos informations personnelles."
      />

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-xl border border-zinc-100 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <FormField label="Prénom">
          <Input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </FormField>
        <FormField label="Nom">
          <Input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </FormField>

        <FormField label="Genre">
          <Select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="MALE">Homme</option>
            <option value="FEMALE">Femme</option>
            <option value="OTHER">Autre</option>
          </Select>
        </FormField>
        <FormField label="Date de naissance">
          <DatePicker
            value={dob}
            onChange={(next) => setDob(next)}
          />
        </FormField>

        <FormField label="E-mail" className="sm:col-span-2">
          <Input value={user?.email ?? ""} disabled />
        </FormField>

        <FormField label="Téléphone">
          <Input
            required
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

        {error ? (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        {success ? (
          <div className="sm:col-span-2">
            <Alert variant="success">Profil mis à jour.</Alert>
          </div>
        ) : null}

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" loading={submitting}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
