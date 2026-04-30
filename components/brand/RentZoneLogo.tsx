import type { ReactNode } from "react";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/brand";

/** Teal map pin + arc — inline SVG, no external asset. */
export function RentZoneMark({ className = "h-10 w-10 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M20 36s9-9.2 9-17a9 9 0 10-18 0c0 7.8 9 17 9 17z"
        fill="currentColor"
        className="text-teal-500"
      />
      <circle cx="20" cy="15" r="4" fill="white" />
      <path
        d="M11.5 10.5c2.3-3.8 6.5-6 13-4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-teal-300"
      />
    </svg>
  );
}

export function RentZoneWordmark({
  layout = "horizontal",
  className = "",
}: {
  layout?: "horizontal" | "stacked";
  className?: string;
}) {
  const text: ReactNode = (
    <>
      <span className="font-bold tracking-tight text-slate-900">rent</span>
      <span className="font-bold tracking-tight text-teal-500">zone</span>
    </>
  );

  if (layout === "stacked") {
    return (
      <div className={`flex flex-col leading-tight ${className}`}>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">{SITE_TAGLINE}</span>
        <span className="text-lg sm:text-xl">{text}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-400">{SITE_TAGLINE}</span>
      <span className="text-lg font-bold sm:text-xl">{text}</span>
    </div>
  );
}

export function RentZoneLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <RentZoneMark />
      <RentZoneWordmark />
    </span>
  );
}

export function rentZoneAriaLabel() {
  return `${SITE_NAME} — ${SITE_TAGLINE}`;
}
