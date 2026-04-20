"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
        active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}

function AuthNav({ onClose }: { onClose?: () => void }) {
  const { user, loading, logout } = useAuth();

  // Render a fixed-width placeholder during hydration to avoid layout shift
  // (prevents the flicker where Connexion/Inscription briefly flash before the user is detected).
  if (loading) {
    return <div aria-hidden className="h-5 w-40" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="hidden max-w-[160px] truncate text-xs tracking-wide text-zinc-400 sm:block">
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => {
            void logout();
            onClose?.();
          }}
          className="text-sm font-medium tracking-wide text-zinc-400 transition-colors hover:text-zinc-900"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <Link
        href="/connexion"
        onClick={onClose}
        className="text-sm font-medium tracking-wide text-zinc-400 transition-colors hover:text-zinc-900"
      >
        Connexion
      </Link>
      <Link
        href="/inscription"
        onClick={onClose}
        className="text-sm font-medium tracking-wide text-zinc-900 transition-colors hover:text-zinc-600"
      >
        S&apos;inscrire
      </Link>
    </div>
  );
}

function RoleLinks({ onClose }: { onClose?: () => void }) {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  if (user.role === "PARTNER") {
    return <NavLink href="/espace-partenaire" label="Espace partenaire" onClick={onClose} />;
  }
  if (user.role === "SUPER_ADMIN") {
    return <NavLink href="/admin" label="Administration" onClick={onClose} />;
  }
  if (user.role === "CUSTOMER") {
    return <NavLink href="/mon-compte" label="Mon compte" onClick={onClose} />;
  }
  return null;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-zinc-900"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-900" />
          Padel Résa
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href="/" label="Accueil" />
          <NavLink href="/partenaires" label="Partenaires" />
          <NavLink href="/jouer" label="Jouer" />
          <NavLink href="/offres" label="Offres" />
          <RoleLinks />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <NotificationBell />
          <AuthNav />
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-zinc-900 md:hidden"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-100 bg-white px-6 pb-8 pt-6 md:hidden">
          <nav className="flex flex-col gap-6">
            <NavLink href="/" label="Accueil" onClick={close} />
            <NavLink href="/partenaires" label="Partenaires" onClick={close} />
            <NavLink href="/jouer" label="Jouer" onClick={close} />
            <NavLink href="/offres" label="Offres" onClick={close} />
            <RoleLinks onClose={close} />
            <div className="flex items-center gap-3 pt-2">
              <NotificationBell />
              <AuthNav onClose={close} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
