import { SITE_DESCRIPTION, SITE_NAME, SUPPORT_EMAIL } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-slate-200/80 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{SITE_NAME}</span>
        <span className="max-w-md">{SITE_DESCRIPTION}</span>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-teal-600 hover:text-teal-700">
          {SUPPORT_EMAIL}
        </a>
        <span>© {new Date().getFullYear()} — Tous droits réservés</span>
      </div>
    </footer>
  );
}
