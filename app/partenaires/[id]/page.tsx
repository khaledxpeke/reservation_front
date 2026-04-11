import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPartner } from "@/lib/api/marketplace";
import { PartnerBooking } from "@/components/partner/PartnerBooking";
import { ApiError } from "@/lib/api/types";
import { seo } from "@/lib/seo";
import { Card } from "@/components/ui";

function formatDateFR(d: string) {
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await getPublicPartner(id);
    return seo({
      title: p.name,
      description: `Réservez un terrain chez ${p.name} à ${p.city}. Consultez les créneaux et offres disponibles.`,
      openGraph: { type: "article" },
    });
  } catch {
    return seo({ title: "Partenaire introuvable" });
  }
}

export default async function PartenairePage({ params }: Props) {
  const { id } = await params;
  let partner;
  try {
    partner = await getPublicPartner(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <article>
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{partner.category.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {partner.name}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {partner.city}{partner.address ? ` · ${partner.address}` : ""}
        </p>
        <p className="mt-1 text-sm text-zinc-500">Tél. {partner.phone}</p>
      </header>

      {partner.offers.length > 0 && (
        <section className="mt-8" aria-label="Offres en cours">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Offres en cours</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {partner.offers.map((o) => (
              <li key={o.id}>
                <Card className="p-4">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{o.title}</p>
                  {o.description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{o.description}</p>}
                  <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    −{o.discountPercent}% jusqu'au {formatDateFR(o.validUntil)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PartnerBooking partner={partner} />
    </article>
  );
}
