"use client";

import { DashboardAreaLayout, type DashboardNavLink } from "@/components/layout/DashboardAreaLayout";
import type { UserRole } from "@/lib/api/types";

const customerRoles: UserRole[] = ["CUSTOMER"];
const customerLinks: DashboardNavLink[] = [
  { href: "/mon-compte", label: "Tableau de bord", exact: true },
  { href: "/mon-compte/reservations", label: "Mes réservations" },
  { href: "/mon-compte/parties", label: "Mes parties" },
  { href: "/mon-compte/profil", label: "Profil" },
];

export default function MonCompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardAreaLayout links={customerLinks} roles={customerRoles}>{children}</DashboardAreaLayout>;
}
