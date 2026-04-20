"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireRole } from "@/components/auth/RequireRole";

const customerLinks = [
  { href: "/mon-compte", label: "Tableau de bord", exact: true },
  { href: "/mon-compte/reservations", label: "Mes réservations" },
  { href: "/mon-compte/parties", label: "Mes parties" },
  { href: "/mon-compte/profil", label: "Profil" },
];

function SubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-12 flex flex-wrap gap-6 border-b border-zinc-100 pb-0">
      {customerLinks.map(({ href, label, exact }) => {
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

export default function MonCompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <div className="mx-auto w-full max-w-6xl">
        <SubNav />
        <div>{children}</div>
      </div>
    </RequireRole>
  );
}
