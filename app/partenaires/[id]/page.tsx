import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPartner } from "@/lib/api/marketplace";
import { PartnerBooking } from "@/components/partner/PartnerBooking";
import { ApiError } from "@/lib/api/types";
import { seo } from "@/lib/seo";
import { Card } from "@/components/ui";
import { partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";

function formatDateFR(d: string) {
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await getPublicPartner(id);
    const ogImage = partnerHeroUrl(p);
    return seo({
      title: p.name,
      description: `Réservez un terrain chez ${p.name} à ${p.city}. Consultez les créneaux et offres disponibles.`,
      openGraph: {
        type: "article",
        images: [{ url: ogImage, width: 1200, height: 630, alt: p.name }],
      },
    });
  } catch {
    return seo({ title: "Partenaire introuvable" });
  }
}

export default async function PartenairePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const initialDate = typeof sp.date === "string" ? sp.date : undefined;
  const initialResourceId = typeof sp.resourceId === "string" ? sp.resourceId : undefined;
  const initialStartTime = typeof sp.start === "string" ? sp.start : undefined;
  const initialDurationMin =
    typeof sp.durationMin === "string" ? Number(sp.durationMin) : undefined;
  let partner;
  try {
    partner = await getPublicPartner(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const hero = partnerHeroUrl(partner);
  const logo = partnerLogoUrl(partner);

  return (
    <article>
      <header className="relative mb-10 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        <div className="relative h-52 md:h-72">
          <Image
            src={hero}
            alt={partner.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 p-6 md:p-8">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg">
              <Image
                src={logo}
                alt={`Logo ${partner.name}`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-200">{partner.category.name}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{partner.name}</h1>
              <p className="mt-1 text-sm text-zinc-200">
                {partner.city}
                {partner.address ? ` · ${partner.address}` : ""}
              </p>
              <p className="mt-1 text-sm text-zinc-300">Tél. {partner.phone}</p>
            </div>
          </div>
        </div>
      </header>

      {partner.settings &&
        (partner.settings.description ||
          (partner.settings.keyFeatures && partner.settings.keyFeatures.length > 0)) && (
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/40">
          {partner.settings.description && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">À propos</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {partner.settings.description}
              </p>
            </div>
          )}
          {partner.settings.keyFeatures && partner.settings.keyFeatures.length > 0 && (
            <div className={partner.settings.description ? "mt-6" : ""}>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Points forts</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {partner.settings.keyFeatures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {partner.offers.length > 0 && (
        <section className="mt-8" aria-label="Offres en cours">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Offres en cours</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {partner.offers.map((o) => (
              <li key={o.id}>
                <Card className="p-4">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{o.title}</p>
                  {o.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{o.description}</p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    −{o.discountPercent}% jusqu&apos;au {formatDateFR(o.validUntil)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PartnerBooking
        partner={partner}
        initialDate={initialDate}
        initialResourceId={initialResourceId}
        initialStartTime={initialStartTime}
        initialDurationMin={
          initialDurationMin !== undefined && !Number.isNaN(initialDurationMin) && initialDurationMin > 0
            ? initialDurationMin
            : undefined
        }
      />
    </article>
  );
}
