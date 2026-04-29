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
    <nav className="mb-5 flex flex-wrap gap-2 border-b border-zinc-100/90 pb-4">
      {links.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
      <section className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col pb-4">
        <DashboardSubNav links={links} />
        <div className="min-h-0 w-full flex-1">{children}</div>
      </section>
    </RequireRole>
  );
}
