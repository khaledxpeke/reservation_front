import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-zinc-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-1 text-center text-xs text-zinc-400">
          <span className="font-medium text-zinc-500">Padel Résa</span>
          <span>Plateforme de réservation multi-partenaires</span>
          <span>© {new Date().getFullYear()} — Tous droits réservés</span>
        </div>
      </footer>
    </div>
  );
}
