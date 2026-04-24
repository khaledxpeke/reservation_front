"use client";

import { DashboardAreaLayout, type DashboardNavLink } from "@/components/layout/DashboardAreaLayout";
import type { UserRole } from "@/lib/api/types";

const partnerRoles: UserRole[] = ["PARTNER"];
const partnerLinks: DashboardNavLink[] = [
  { href: "/espace-partenaire/reservations", label: "Réservations" },
  { href: "/espace-partenaire/ressources", label: "Ressources" },
  { href: "/espace-partenaire/offres", label: "Mes offres" },
  { href: "/espace-partenaire/profil", label: "Paramètres" },
];

export default function EspacePartenaireLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAreaLayout links={partnerLinks} roles={partnerRoles}>{children}</DashboardAreaLayout>;
}
