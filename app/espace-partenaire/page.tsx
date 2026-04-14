"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, Card, PageHeader } from "@/components/ui";

const tiles = [
  { href: "/espace-partenaire/profil", title: "Profil & images", desc: "Logo, bannière (Cloudinary) et coordonnées." },
  { href: "/espace-partenaire/reservations", title: "Réservations", desc: "Confirmer ou refuser les demandes." },
  { href: "/espace-partenaire/ressources", title: "Terrains", desc: "Ajouter des terrains et définir les horaires." },
  { href: "/espace-partenaire/offres", title: "Offres", desc: "Promotions soumises à validation admin." },
] as const;

export default function EspacePartenaireDashboard() {
  const { user } = useAuth();
  const p = user?.partner;

  return (
    <div>
      <PageHeader
        title="Espace partenaire"
        description={`Bienvenue${p?.name ? `, ${p.name}` : ""}. Gérez vos terrains, créneaux et réservations.`}
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href}>
              <Card className="p-6 transition hover:border-emerald-300">
                <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{t.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {p && !p.isVerified && (
        <div className="mt-8">
          <Alert variant="warning">
            Votre compte n'est pas encore vérifié : vous n'apparaîtrez pas sur la place de marché tant qu'un administrateur n'aura pas validé votre profil.
          </Alert>
        </div>
      )}
    </div>
  );
}
