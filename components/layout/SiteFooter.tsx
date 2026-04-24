export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 text-center text-xs text-zinc-400">
        <span className="font-medium text-zinc-500">Padel Résa</span>
        <span>Plateforme de réservation multi-partenaires</span>
        <span>© {new Date().getFullYear()} — Tous droits réservés</span>
      </div>
    </footer>
  );
}
