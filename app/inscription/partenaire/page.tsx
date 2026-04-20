"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listCategories, type Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import { Alert, Button, FormField, Input, Select } from "@/components/ui";

export default function InscriptionPartenairePage() {
  const { registerPartner } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listCategories()
      .then((c) => {
        setCategories(c);
        if (c[0]) setCategoryId(c[0].id);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError("Choisissez une catégorie.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerPartner({
        email,
        password,
        name,
        city,
        phone,
        address: address || undefined,
        categoryId,
      });
      router.replace("/espace-partenaire");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg pt-6">
      <div className="rounded-xl border border-zinc-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Inscription partenaire</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Créez votre espace pour gérer vos ressources et réservations.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField label="Nom de l'enseigne" className="sm:col-span-2">
            <Input
              required
              placeholder="Club Padel Tunis"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="E-mail" className="sm:col-span-2">
            <Input
              type="email"
              required
              placeholder="contact@club.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Mot de passe (min. 6 caractères)" className="sm:col-span-2">
            <Input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          <FormField label="Ville">
            <Input
              required
              placeholder="Tunis"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </FormField>
          <FormField label="Téléphone">
            <Input
              required
              placeholder="+216 00 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <FormField label="Adresse (optionnel)" className="sm:col-span-2">
            <Input
              placeholder="12 avenue Habib Bourguiba"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>
          <FormField label="Catégorie" className="sm:col-span-2">
            <Select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
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
