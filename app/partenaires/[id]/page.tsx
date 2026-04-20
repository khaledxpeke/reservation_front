import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPartner } from "@/lib/api/marketplace";
import { PartnerBooking } from "@/components/partner/PartnerBooking";
import { ApiError } from "@/lib/api/types";
import { seo } from "@/lib/seo";
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
      description: `Réservez une ressource chez ${p.name} à ${p.city}. Consultez les créneaux et offres disponibles.`,
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
  const description = partner.settings?.description;
  const keyFeatures = partner.settings?.keyFeatures ?? [];

  return (
    <article className="flex flex-col gap-6">
      {/* Compact hero */}
      <header className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        <div className="relative h-32 md:h-36">
          <Image
            src={hero}
            alt={partner.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 md:p-5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow md:h-14 md:w-14">
              <Image
                src={logo}
                alt={`Logo ${partner.name}`}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                {partner.category.name}
              </p>
              <h1 className="truncate text-lg font-semibold text-white md:text-xl">
                {partner.name}
              </h1>
              <p className="truncate text-xs text-zinc-200">
                {partner.city}
                {partner.address ? ` · ${partner.address}` : ""} · Tél. {partner.phone}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main reservation content - designed to fit without much scrolling */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Side panel: infos + offers (collapses below booking on small screens) */}
        <aside className="order-2 space-y-4 lg:order-1 lg:col-span-1">
          {(description || keyFeatures.length > 0) && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4">
              {description && (
                <>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    À propos
                  </h2>
                  <p className="mt-2 line-clamp-4 text-sm text-zinc-600">{description}</p>
                </>
              )}
              {keyFeatures.length > 0 && (
                <div className={description ? "mt-4" : ""}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Points forts
                  </h2>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {keyFeatures.slice(0, 6).map((f) => (
                      <li
                        key={f}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {partner.offers.length > 0 && (
            <section
              className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
              aria-label="Offres en cours"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Offres en cours
              </h2>
              <ul className="mt-2 space-y-2">
                {partner.offers.map((o) => (
                  <li key={o.id} className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">{o.title}</p>
                        {o.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">
                            {o.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
                        −{o.discountPercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Jusqu&apos;au {formatDateFR(o.validUntil)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* Booking form takes the remaining space */}
        <div className="order-1 lg:order-2 lg:col-span-2">
          <PartnerBooking
            partner={partner}
            initialDate={initialDate}
            initialResourceId={initialResourceId}
            initialStartTime={initialStartTime}
            initialDurationMin={
              initialDurationMin !== undefined &&
              !Number.isNaN(initialDurationMin) &&
              initialDurationMin > 0
                ? initialDurationMin
                : undefined
            }
          />
        </div>
      </div>
    </article>
  );
}
