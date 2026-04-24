"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import type { UserRole } from "@/lib/api/types";

export type DashboardNavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

function DashboardSubNav({ links }: { links: DashboardNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="mb-12 flex flex-wrap gap-6 border-b border-zinc-100 pb-0">
      {links.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
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

export function DashboardAreaLayout({
  children,
  links,
  roles,
}: {
  children: ReactNode;
  links: DashboardNavLink[];
  roles: UserRole[];
}) {
  return (
    <RequireRole roles={roles}>
      <section className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col">
        <DashboardSubNav links={links} />
        <div className="w-full flex-1">{children}</div>
      </section>
    </RequireRole>
  );
}
