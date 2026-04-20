import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription | Padel Résa",
  description:
    "Créez votre compte joueur pour réserver vos terrains, ou rejoignez la plateforme en tant que partenaire.",
};

export default function InscriptionPage() {
  return (
    <div className="mx-auto w-full max-w-3xl pt-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Créer un compte</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Choisissez le type de compte qui correspond à votre besoin.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ChoiceCard
          href="/inscription/client"
          title="Je suis joueur"
          description="Réservez vos terrains, suivez vos parties et retrouvez votre historique."
          cta="S'inscrire comme joueur"
        />
        <ChoiceCard
          href="/inscription/partenaire"
          title="Je suis partenaire"
          description="Gérez votre établissement, vos ressources et vos réservations en ligne."
          cta="S'inscrire comme partenaire"
        />
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-emerald-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function ChoiceCard({
  href,
  title,
  description,
  cta,
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-zinc-500">{description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-emerald-600 group-hover:underline">
        {cta} →
      </span>
    </Link>
  );
}
