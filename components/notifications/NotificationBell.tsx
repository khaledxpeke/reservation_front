"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification as NotifType,
} from "@/lib/api/notifications";

const POLL_MS = 30_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "maintenant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export function NotificationBell() {
  const { user, loading } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifType[]>([]);
  const [fetching, setFetching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnread(res.count);
    } catch {
      /* swallow */
    }
  }, []);

  // Poll unread count while user is logged in
  useEffect(() => {
    if (!user) return;
    const initial = setTimeout(() => void fetchCount(), 0);
    const id = setInterval(fetchCount, POLL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [user, fetchCount]);

  // Fetch recent notifications when panel opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const task = setTimeout(() => {
      setFetching(true);
      listNotifications({ limit: 15, page: 1 })
        .then((res) => {
          if (cancelled) return;
          setItems(res.items);
          setUnread(res.unreadCount);
        })
        .catch(() => {
          /* ignore notification refresh failures */
        })
        .finally(() => {
          if (!cancelled) setFetching(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(task);
    };
  }, [open]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const onClickNotif = async (n: NotifType) => {
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
          ),
        );
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* ignore notification read failures */
      }
    }
    setOpen(false);
  };

  const onMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })),
      );
      setUnread(0);
    } catch {
      /* ignore notification read failures */
    }
  };

  if (loading || !user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:w-96">
          <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </header>

          <div className="max-h-[28rem] overflow-y-auto">
            {fetching && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-zinc-400">
                Chargement…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-400">
                Aucune notification.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    {n.url ? (
                      <Link
                        href={n.url}
                        onClick={() => onClickNotif(n)}
                        className={`block px-4 py-3 transition-colors hover:bg-zinc-50 ${
                          !n.readAt ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        <NotifContent notif={n} />
                      </Link>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onClickNotif(n)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onClickNotif(n);
                        }}
                        className={`cursor-pointer px-4 py-3 transition-colors hover:bg-zinc-50 ${
                          !n.readAt ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        <NotifContent notif={n} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifContent({ notif }: { notif: NotifType }) {
  return (
    <div className="flex items-start gap-2.5">
      {!notif.readAt && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">{notif.title}</p>
        {notif.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{notif.body}</p>
        ) : null}
        <p className="mt-1 text-[10px] text-zinc-400">{timeAgo(notif.createdAt)}</p>
      </div>
    </div>
  );
}
