"use client";

import { DashboardAreaLayout, type DashboardNavLink } from "@/components/layout/DashboardAreaLayout";
import type { UserRole } from "@/lib/api/types";

const partnerRoles: UserRole[] = ["PARTNER"];
const partnerLinks: DashboardNavLink[] = [
  { href: "/espace-partenaire/reservations", label: "Réservations" },
  { href: "/espace-partenaire/etat-reglement", label: "Etat règlement" },
  { href: "/espace-partenaire/ressources", label: "Ressources" },
  { href: "/espace-partenaire/offres", label: "Mes offres" },
];

export default function EspacePartenaireLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAreaLayout links={partnerLinks} roles={partnerRoles}>{children}</DashboardAreaLayout>;
}
