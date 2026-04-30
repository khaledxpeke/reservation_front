import Link from "next/link";
import type { Metadata } from "next";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({ title: "Page introuvable" });

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">404</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
