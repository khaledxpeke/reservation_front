"use client";

import { RequireRole } from "@/components/auth/RequireRole";
import Link from "next/link";
import { usePathname } from "next/navigation";

const partnerLinks = [
  { href: "/espace-partenaire", label: "Tableau de bord", exact: true },
  { href: "/espace-partenaire/profil", label: "Profil & images" },
  { href: "/espace-partenaire/reservations", label: "Réservations" },
  { href: "/espace-partenaire/offres", label: "Mes offres" },
  { href: "/espace-partenaire/ressources", label: "Ressources" },
];

function SubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-12 flex flex-wrap gap-6 border-b border-zinc-100 pb-0">
      {partnerLinks.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`-mb-px border-b-2 py-3 text-sm font-medium tracking-wide transition-colors ${
              active
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function EspacePartenaireLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["PARTNER"]}>
      <div className="max-w-6xl mx-auto w-full">
        <SubNav />
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </RequireRole>
  );
}
