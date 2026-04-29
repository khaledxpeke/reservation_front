"use client";

import { DashboardAreaLayout, type DashboardNavLink } from "@/components/layout/DashboardAreaLayout";
import type { UserRole } from "@/lib/api/types";

const adminRoles: UserRole[] = ["SUPER_ADMIN"];
const adminLinks: DashboardNavLink[] = [
  { href: "/admin", label: "Vue d'ensemble", exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/partenaires", label: "Partenaires" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/etat-reglement", label: "Etat règlement" },
  { href: "/admin/offres", label: "Offres" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/packs", label: "Packs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAreaLayout links={adminLinks} roles={adminRoles}>{children}</DashboardAreaLayout>;
}
