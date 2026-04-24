"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MATCH_STATUS_LABEL,
  REQUEST_STATUS_LABEL,
  SKILL_LEVEL_LABEL,
  listMyCreatedMatches,
  listMyJoinRequests,
  type MatchPostDetail,
  type MyJoinRequestRow,
} from "@/lib/api/matches";
import {
  Alert,
  Badge,
  Button,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";

type Tab = "created" | "requests";

export default function MesPartiesPage() {
  const [tab, setTab] = useState<Tab>("created");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Mes parties"
          description="Vos annonces publiées et vos demandes envoyées."
        />
        <Link href="/jouer/nouveau">
          <Button>Publier une annonce</Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b border-zinc-200">
        <TabButton active={tab === "created"} onClick={() => setTab("created")}>
          Mes annonces
        </TabButton>
        <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
          Mes demandes
        </TabButton>
      </div>

      {tab === "created" ? <CreatedTab /> : <RequestsTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-zinc-500 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function CreatedTab() {
  const [items, setItems] = useState<MatchPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMyCreatedMatches({ limit: 50, page: 1 });
      setItems(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-zinc-400">
        <Spinner />
      </div>
    );
  }
  if (error) return <Alert>{error}</Alert>;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-500">
        Vous n&apos;avez pas encore publié d&apos;annonce.{" "}
        <Link href="/jouer/nouveau" className="font-medium text-emerald-600 hover:underline">
          Publier maintenant
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((post) => {
        const accepted = post.requests.filter((r) => r.status === "ACCEPTED").length;
        const pending = post.requests.filter((r) => r.status === "PENDING").length;
        return (
          <li
            key={post.id}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900">
                  {formatDate(post.date)} · {post.startTime} – {post.endTime}
                </p>
                <Badge
                  variant={
                    post.status === "OPEN"
                      ? "success"
                      : post.status === "CLOSED"
                        ? "info"
                        : "default"
                  }
                >
                  {MATCH_STATUS_LABEL[post.status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {[post.city, post.governorate].filter(Boolean).join(", ") ||
                  "Lieu à définir"}{" "}
                · Niveau {SKILL_LEVEL_LABEL[post.skillLevel]}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-700">
                {accepted}/{post.neededPlayers} accepté{accepted > 1 ? "s" : ""}
                {pending > 0 ? ` · ${pending} en attente` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/jouer/${post.id}`}>
                <Button variant="secondary" size="sm">
                  Gérer
                </Button>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RequestsTab() {
  const [items, setItems] = useState<MyJoinRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const task = setTimeout(() => {
      setLoading(true);
      setError(null);
      listMyJoinRequests({ limit: 50, page: 1 })
        .then((res) => {
          if (cancelled) return;
          setItems(res.items);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof ApiError ? err.message : "Chargement impossible.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(task);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-zinc-400">
        <Spinner />
      </div>
    );
  }
  if (error) return <Alert>{error}</Alert>;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-500">
        Vous n&apos;avez envoyé aucune demande.{" "}
        <Link href="/jouer" className="font-medium text-emerald-600 hover:underline">
          Voir les annonces
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((row) => {
        const post = row.matchPost;
        return (
          <li
            key={row.id}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900">
                  {formatDate(post.date)} · {post.startTime} – {post.endTime}
                </p>
                <Badge
                  variant={
                    row.status === "ACCEPTED"
                      ? "success"
                      : row.status === "DECLINED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {REQUEST_STATUS_LABEL[row.status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {post.creator.customerProfile
                  ? `Avec ${post.creator.customerProfile.firstName} ${post.creator.customerProfile.lastName.charAt(0)}.`
                  : "Organisateur inconnu"}
                {" · "}
                {[post.city, post.governorate].filter(Boolean).join(", ") || "Lieu à définir"}
              </p>
              {row.status === "ACCEPTED" && (post.creator.customerProfile?.phone || post.creator.email) ? (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {post.creator.customerProfile?.phone ? (
                    <a
                      href={`tel:${post.creator.customerProfile.phone}`}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Tél : {post.creator.customerProfile.phone}
                    </a>
                  ) : null}
                  {post.creator.email ? (
                    <a
                      href={`mailto:${post.creator.email}`}
                      className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    >
                      {post.creator.email}
                    </a>
                  ) : null}
                </div>
              ) : null}
              {row.message ? (
                <p className="mt-1 line-clamp-2 rounded-md bg-zinc-50 p-2 text-xs text-zinc-600">
                  {row.message}
                </p>
              ) : null}
            </div>
            <div className="shrink-0">
              <Link href={`/jouer/${post.id}`}>
                <Button variant="secondary" size="sm">
                  Voir
                </Button>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
