import Link from "next/link";
import type { Metadata } from "next";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Inscription",
  description:
    "Créez votre compte sur Rent zone pour louer ou proposer du matériel et des espaces, ou inscrivez-vous comme partenaire.",
});

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
          description="Réservez des créneaux, suivez vos locations et votre historique."
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
        <Link href="/connexion" className="font-semibold text-teal-600 hover:text-teal-700">
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
      className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 flex-1 text-sm text-zinc-500">{description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-semibold text-teal-600">
        {cta}
        <span className="ml-1" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
