"use client";

import { useEffect } from "react";

interface Props {
  senderName: string;
  preview: string;
  chatTitle: string;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * Floating preview when someone sends a chat message while the panel is closed
 * (similar to Facebook Messenger toasts).
 */
export function MatchChatIncomingToast({
  senderName,
  preview,
  chatTitle,
  onOpen,
  onDismiss,
}: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 7000);
    return () => window.clearTimeout(t);
  }, [onDismiss, senderName, preview]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[55] flex justify-center px-3 sm:inset-x-auto sm:right-6 sm:justify-end sm:px-0 md:bottom-24 md:right-10"
      role="presentation"
    >
      <div className="pointer-events-auto flex w-full max-w-md animate-match-toast-in gap-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-black/5 sm:max-w-sm">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 gap-3 p-3 text-left transition hover:bg-slate-50 active:bg-slate-100 sm:p-3.5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
            {(senderName[0] ?? "?").toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {chatTitle}
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-slate-900">{senderName}</span>
            <span className="mt-1 line-clamp-2 text-sm leading-snug text-slate-600">{preview}</span>
            <span className="mt-2 text-xs font-medium text-teal-600">Ouvrir le chat</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 border-l border-slate-100 px-3 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fermer l'aperçu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
