"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RentZoneLogo, rentZoneAriaLabel } from "@/components/brand/RentZoneLogo";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { AuthUser } from "@/lib/api/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(user: AuthUser): string {
  if (user.role === "CUSTOMER" && user.customerProfile) {
    const { firstName, lastName } = user.customerProfile;
    return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  }
  if (user.role === "PARTNER" && user.partner?.name) {
    const parts = user.partner.name.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  // Admin / fallback — use first two chars of email
  return user.email.slice(0, 2).toUpperCase();
}

function getDisplayName(user: AuthUser): string {
  if (user.role === "CUSTOMER" && user.customerProfile) {
    return `${user.customerProfile.firstName} ${user.customerProfile.lastName}`;
  }
  if (user.role === "PARTNER" && user.partner?.name) {
    return user.partner.name;
  }
  return user.email;
}

function getSettingsHref(user: AuthUser): string {
  if (user.role === "CUSTOMER")  return "/mon-compte/profil";
  if (user.role === "PARTNER")   return "/espace-partenaire/profil";
  if (user.role === "SUPER_ADMIN") return "/admin";
  return "/";
}

function getAvatarImg(user: AuthUser): string | null {
  if (user.role === "PARTNER" && user.partner?.logo) return user.partner.logo;
  return null;
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  pathname,
  onClick,
  matchPrefix = true,
  exact = false,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
  matchPrefix?: boolean;
  /** When true, active only if pathname equals the path part of href (no #). */
  exact?: boolean;
}) {
  const pathPart = href.split("#")[0]?.split("?")[0] || "/";

  let active: boolean;
  if (exact) {
    active = pathname === pathPart;
  } else if (href.includes("#")) {
    active = pathname === pathPart;
  } else if (matchPrefix) {
    active = pathname === pathPart || (pathPart !== "/" && pathname.startsWith(`${pathPart}/`));
  } else {
    active = pathname === pathPart;
  }
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

// ─── Role nav link ────────────────────────────────────────────────────────────

function RoleLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  if (user.role === "PARTNER")    return <NavLink href="/espace-partenaire" label="Espace partenaire" pathname={pathname} onClick={onClose} />;
  if (user.role === "SUPER_ADMIN") return <NavLink href="/admin" label="Administration" pathname={pathname} onClick={onClose} />;
  if (user.role === "CUSTOMER")   return <NavLink href="/mon-compte" label="Mon compte" pathname={pathname} onClick={onClose} />;
  return null;
}

// ─── Avatar button + dropdown ─────────────────────────────────────────────────

function AvatarMenu({ onClose }: { onClose?: () => void }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading) return <div aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-zinc-100 animate-pulse ring-2 ring-white" />;

  if (!user) {
    return (
      <div className="flex items-center gap-5">
        <Link
          href="/connexion"
          prefetch={false}
          onClick={onClose}
          className="text-sm font-medium tracking-wide text-slate-500 transition-colors hover:text-slate-900"
        >
          Connexion
        </Link>
        <Link
          href="/inscription"
          prefetch={false}
          onClick={onClose}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          S&apos;inscrire
        </Link>
      </div>
    );
  }

  const initials   = getInitials(user);
  const name       = getDisplayName(user);
  const settingsHref = getSettingsHref(user);
  const avatarImg  = getAvatarImg(user);

  const handleLogout = async () => {
    setOpen(false);
    onClose?.();
    await logout();
    router.push("/");
  };

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-200/90 bg-zinc-100 text-xs font-bold uppercase text-zinc-700 shadow-sm ring-2 ring-white transition hover:border-zinc-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        {avatarImg ? (
          <Image src={avatarImg} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          {/* User info header */}
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
            <p className="truncate text-xs text-zinc-400">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <Link
              href={settingsHref}
              prefetch={false}
              onClick={() => { setOpen(false); onClose?.(); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Paramètres
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Site header ──────────────────────────────────────────────────────────────

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        <Link href="/" prefetch={false} className="min-w-0 shrink" aria-label={rentZoneAriaLabel()}>
          <RentZoneLogo className="[&_svg]:h-9 [&_svg]:w-9 sm:[&_svg]:h-10 sm:[&_svg]:w-10" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-6 lg:gap-8 md:flex">
          <NavLink href="/" label="Explorer" pathname={pathname} exact />
          <NavLink href="/partenaires" label="Catégories" pathname={pathname} exact />
          <NavLink href="/offres" label="Annonces" pathname={pathname} exact />
          <NavLink href="/jouer" label="Jouer" pathname={pathname} />
          <RoleLinks pathname={pathname} />
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex md:gap-3">
          <NotificationBell />
          <AvatarMenu />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-900 md:hidden"
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

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-6 pb-8 pt-6 md:hidden">
          <nav className="flex flex-col gap-6">
            <NavLink href="/" label="Explorer" pathname={pathname} onClick={close} exact />
            <NavLink href="/partenaires" label="Catégories" pathname={pathname} onClick={close} exact />
            <NavLink href="/offres" label="Annonces" pathname={pathname} onClick={close} exact />
            <NavLink href="/jouer" label="Jouer" pathname={pathname} onClick={close} />
            <RoleLinks pathname={pathname} onClose={close} />
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
              <NotificationBell />
              <AvatarMenu onClose={close} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
