"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { listPublicOffers, type Offer, RECURRENCE_LABELS, DAY_LABELS } from "@/lib/api/offers";
import { useApi } from "@/hooks/useApi";
import { Alert, PageHeader } from "@/components/ui";
import { partnerLogoUrl } from "@/lib/imageUrls";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function scheduleLabel(o: Offer): { icon: "calendar" | "repeat"; text: string } {
  if (o.recurrence === "NONE") {
    const from = o.validFrom ? fmtDate(o.validFrom) : "—";
    const to   = o.validUntil ? fmtDate(o.validUntil) : "—";
    return { icon: "calendar", text: `${from} — ${to}` };
  }
  const base  = RECURRENCE_LABELS[o.recurrence];
  const days  = o.recurrenceDays.map((d) => DAY_LABELS[d]).join(", ");
  const time  = o.timeStart && o.timeEnd ? ` · ${o.timeStart} – ${o.timeEnd}` : "";
  const extra = days ? ` (${days})` : "";
  return { icon: "repeat", text: `${base}${extra}${time}` };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const RepeatIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

// ─── Offer card ───────────────────────────────────────────────────────────────

function OfferCard({ offer }: { offer: Offer }) {
  const logoSrc = offer.partner
    ? partnerLogoUrl({ id: offer.partnerId ?? "", logo: offer.partner.logo ?? null })
    : null;

  const { icon, text } = scheduleLabel(offer);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg">

      {/* ── Image banner — fixed height, always the same ── */}
      <div className="relative h-40 w-full shrink-0 bg-zinc-100">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={offer.partner?.name ?? ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 7.5 10.5l4.5 4.5 3-3 4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        )}
        {/* Discount badge */}
        <div className="absolute bottom-3 right-3 rounded-xl bg-zinc-900 px-3 py-1 text-sm font-extrabold tabular-nums text-white shadow-md">
          −{offer.discountPercent}%
        </div>
      </div>

      {/* ── Body — grows to fill remaining space ── */}
      <div className="flex flex-1 flex-col p-4">
        {/* Partner name */}
        {offer.partner && (
          <p className="truncate text-xs font-semibold text-zinc-500">
            {offer.partner.name}
            {offer.partner.city && (
              <span className="ml-1 font-normal text-zinc-400">· {offer.partner.city}</span>
            )}
          </p>
        )}

        {/* Offer title */}
        <h2 className="mt-1 line-clamp-1 text-sm font-bold leading-snug text-zinc-900 group-hover:text-zinc-700">
          {offer.title}
        </h2>

        {/* Description — always exactly 2 lines tall */}
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-zinc-500">
          {offer.description ?? ""}
        </p>
      </div>

      {/* ── Footer — always at the bottom ── */}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
          {icon === "repeat" ? <RepeatIcon /> : <CalendarIcon />}
          <span className="truncate">{text}</span>
        </span>

        {offer.partnerId && (
          <Link
            href={`/partenaires/${offer.partnerId}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-700 transition hover:text-zinc-900"
          >
            Voir
            <ArrowIcon />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OfferSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="h-40 w-full animate-pulse bg-zinc-100" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="h-11 border-t border-zinc-100" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyOffers() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-300">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      </div>
      <p className="font-semibold text-zinc-600">Aucune offre disponible</p>
      <p className="mt-1 text-sm text-zinc-400">Revenez bientôt — de nouvelles offres arrivent régulièrement.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OffresPublicPage() {
  const fetcher = useCallback(() => listPublicOffers({ limit: 50 }).then((d) => d.items), []);
  const { data: offers, loading, error } = useApi<Offer[]>(fetcher);

  return (
    <div>
      <PageHeader
        title="Offres promotionnelles"
        description="Les meilleures réductions du moment, validées par nos partenaires."
      />

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {loading ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}><OfferSkeleton /></li>
          ))}
        </ul>
      ) : !offers || offers.length === 0 ? (
        <EmptyOffers />
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <li key={o.id} className="flex flex-col">
              <OfferCard offer={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
