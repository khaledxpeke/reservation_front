"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/types";
import { Alert, Button, FormField, Input } from "@/components/ui";

export default function ConnexionPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await login({ email, password });
      router.replace(r.user.role === "SUPER_ADMIN" ? "/admin" : "/espace-partenaire");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm pt-8">
      <div className="rounded-xl border border-zinc-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Connexion</h1>
        <p className="mt-1 text-sm text-zinc-500">Accès partenaire et administrateur.</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <FormField label="E-mail">
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Mot de passe">
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" loading={loading} className="mt-1 w-full py-2.5">
            Se connecter
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-emerald-600 hover:underline">
          S&apos;inscrire comme partenaire
        </Link>
      </p>
    </div>
  );
}
