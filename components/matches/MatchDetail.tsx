"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  GENDER_PREF_LABEL,
  MATCH_STATUS_LABEL,
  REQUEST_STATUS_LABEL,
  SKILL_LEVEL_LABEL,
  cancelMatch,
  getMatch,
  joinMatch,
  respondToJoinRequest,
  withdrawMyJoinRequest,
  type MatchJoinRequest,
  type MatchPostDetail,
} from "@/lib/api/matches";
import {
  Alert,
  Badge,
  Button,
  Spinner,
  Textarea,
} from "@/components/ui";
import { ApiError } from "@/lib/api/types";

function formatLongDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function MatchDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [post, setPost] = useState<MatchPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPost(await getMatch(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const isCustomer = user?.role === "CUSTOMER";
  const isCreator = !!user && post?.creatorId === user.id;

  const myRequest: MatchJoinRequest | undefined = useMemo(() => {
    if (!post || !user) return undefined;
    return post.requests.find((r) => r.userId === user.id);
  }, [post, user]);

  const acceptedCount = useMemo(
    () => post?.requests.filter((r) => r.status === "ACCEPTED").length ?? 0,
    [post],
  );

  const remaining = post ? Math.max(0, post.neededPlayers - acceptedCount) : 0;
  const isFull = post ? acceptedCount >= post.neededPlayers : false;
  const isOpen = post?.status === "OPEN";

  const onJoin = async () => {
    if (!post) return;
    setActionError(null);
    setActionMessage(null);
    setSubmitting(true);
    try {
      await joinMatch(post.id, joinMessage.trim() || undefined);
      setActionMessage("Demande envoyée. L'organisateur vous répondra rapidement.");
      setJoinMessage("");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Demande impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  const onWithdraw = async () => {
    if (!post) return;
    setActionError(null);
    setActionMessage(null);
    setSubmitting(true);
    try {
      await withdrawMyJoinRequest(post.id);
      setActionMessage("Demande retirée.");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRespond = async (
    requestId: string,
    status: "ACCEPTED" | "DECLINED",
  ) => {
    if (!post) return;
    setActionError(null);
    setActionMessage(null);
    setRespondingId(requestId);
    try {
      await respondToJoinRequest(post.id, requestId, status);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action impossible.");
    } finally {
      setRespondingId(null);
    }
  };

  const onCancelPost = async () => {
    if (!post) return;
    if (!confirm("Annuler cette annonce ?")) return;
    setActionError(null);
    setActionMessage(null);
    setSubmitting(true);
    try {
      await cancelMatch(post.id);
      router.replace("/mon-compte/parties");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Annulation impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-16 text-zinc-400">
        <Spinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-3">
        <Alert>{error ?? "Annonce introuvable."}</Alert>
        <Link href="/jouer">
          <Button variant="secondary">Retour aux annonces</Button>
        </Link>
      </div>
    );
  }

  const creatorName = post.creator.customerProfile
    ? `${post.creator.customerProfile.firstName} ${post.creator.customerProfile.lastName}`
    : "Joueur";
  const location = [post.city, post.governorate].filter(Boolean).join(", ");

  return (
    <article className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Annonce de {creatorName}
              </p>
              <h1 className="mt-1 text-xl font-semibold text-zinc-900">
                {formatLongDate(post.date)}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                {post.startTime} – {post.endTime}
                {location ? ` · ${location}` : ""}
              </p>
            </div>
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

          <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
              Niveau : {SKILL_LEVEL_LABEL[post.skillLevel]}
            </span>
            <span className="rounded-md bg-sky-50 px-2 py-1 font-medium text-sky-700">
              Préférence : {GENDER_PREF_LABEL[post.genderPref]}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
              {acceptedCount}/{post.neededPlayers} joueur{post.neededPlayers > 1 ? "s" : ""}
            </span>
          </div>

          {post.description ? (
            <p className="mt-4 whitespace-pre-line text-sm text-zinc-700">
              {post.description}
            </p>
          ) : null}
        </header>

        {isCreator ? (
          <CreatorRequestsPanel
            post={post}
            onRespond={onRespond}
            respondingId={respondingId}
          />
        ) : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">
            {isCreator ? "Votre annonce" : "Rejoindre cette partie"}
          </h2>

          {actionMessage ? (
            <div className="mt-3">
              <Alert variant="success">{actionMessage}</Alert>
            </div>
          ) : null}
          {actionError ? (
            <div className="mt-3">
              <Alert>{actionError}</Alert>
            </div>
          ) : null}

          <div className="mt-3 space-y-3 text-sm">
            {isCreator ? (
              <CreatorActions
                onCancel={onCancelPost}
                disabled={submitting || post.status === "CANCELLED"}
                status={post.status}
              />
            ) : !user ? (
              <>
                <p className="text-zinc-600">
                  Connectez-vous pour envoyer une demande à l&apos;organisateur.
                </p>
                <Link href="/connexion">
                  <Button className="w-full">Se connecter</Button>
                </Link>
                <p className="text-xs text-zinc-500">
                  Pas de compte ?{" "}
                  <Link
                    href="/inscription/client"
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    Créer un compte
                  </Link>
                </p>
              </>
            ) : !isCustomer ? (
              <p className="text-zinc-600">
                Seuls les comptes joueurs peuvent rejoindre une annonce.
              </p>
            ) : myRequest ? (
              <MyRequestStatus
                request={myRequest}
                onWithdraw={onWithdraw}
                disabled={submitting}
              />
            ) : !isOpen ? (
              <p className="text-zinc-600">Cette annonce n&apos;accepte plus de demandes.</p>
            ) : isFull ? (
              <p className="text-zinc-600">Cette partie est complète.</p>
            ) : (
              <>
                <p className="text-xs text-zinc-500">
                  {remaining} place{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}.
                </p>
                <Textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Message pour l'organisateur (optionnel)"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                />
                <Button
                  className="w-full"
                  loading={submitting}
                  onClick={onJoin}
                >
                  Demander à rejoindre
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-xs text-zinc-500">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Organisé par
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-900">{creatorName}</p>
          {post.creator.customerProfile?.region ? (
            <p className="text-xs text-zinc-500">{post.creator.customerProfile.region}</p>
          ) : null}
          <ContactInfoBlock
            phone={post.creator.customerProfile?.phone}
            email={post.creator.email}
          />
        </div>
      </aside>
    </article>
  );
}

function CreatorActions({
  onCancel,
  disabled,
  status,
}: {
  onCancel: () => void;
  disabled: boolean;
  status: MatchPostDetail["status"];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Vous gérez cette annonce. Acceptez ou refusez les demandes ci-contre.
      </p>
      {status !== "CANCELLED" ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={onCancel}
          disabled={disabled}
        >
          Annuler l&apos;annonce
        </Button>
      ) : null}
    </div>
  );
}

function MyRequestStatus({
  request,
  onWithdraw,
  disabled,
}: {
  request: MatchJoinRequest;
  onWithdraw: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Votre demande</span>
        <Badge
          variant={
            request.status === "ACCEPTED"
              ? "success"
              : request.status === "DECLINED"
                ? "danger"
                : "warning"
          }
        >
          {REQUEST_STATUS_LABEL[request.status]}
        </Badge>
      </div>
      {request.status === "ACCEPTED" ? (
        <p className="text-xs text-emerald-700">
          Votre demande a été acceptée. Les coordonnées de l&apos;organisateur
          sont visibles ci-dessous.
        </p>
      ) : null}
      {request.message ? (
        <p className="rounded-md bg-zinc-50 p-2 text-xs text-zinc-600">
          {request.message}
        </p>
      ) : null}
      {request.status === "PENDING" ? (
        <Button
          variant="ghost"
          className="w-full"
          onClick={onWithdraw}
          disabled={disabled}
        >
          Retirer ma demande
        </Button>
      ) : null}
    </div>
  );
}

function CreatorRequestsPanel({
  post,
  onRespond,
  respondingId,
}: {
  post: MatchPostDetail;
  onRespond: (requestId: string, status: "ACCEPTED" | "DECLINED") => void;
  respondingId: string | null;
}) {
  const pending = post.requests.filter((r) => r.status === "PENDING");
  const answered = post.requests.filter((r) => r.status !== "PENDING");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Demandes reçues</h2>
        <span className="text-xs text-zinc-500">{post.requests.length} au total</span>
      </header>

      {post.requests.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          Aucune demande pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {pending.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                En attente
              </h3>
              <ul className="space-y-2">
                {pending.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    onAccept={() => onRespond(r.id, "ACCEPTED")}
                    onDecline={() => onRespond(r.id, "DECLINED")}
                    busy={respondingId === r.id}
                    canAct
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {answered.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Réponses précédentes
              </h3>
              <ul className="space-y-2">
                {answered.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    onAccept={() => {}}
                    onDecline={() => {}}
                    busy={false}
                    canAct={false}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ContactInfoBlock({
  phone,
  email,
}: {
  phone?: string;
  email?: string;
}) {
  if (!phone && !email) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
          {phone}
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          {email}
        </a>
      ) : null}
    </div>
  );
}

function RequestRow({
  request,
  onAccept,
  onDecline,
  busy,
  canAct,
}: {
  request: MatchJoinRequest;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
  canAct: boolean;
}) {
  const name = request.user?.customerProfile
    ? `${request.user.customerProfile.firstName} ${request.user.customerProfile.lastName}`
    : "Joueur";
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">{name}</p>
        {request.user?.customerProfile?.region ? (
          <p className="text-xs text-zinc-500">{request.user.customerProfile.region}</p>
        ) : null}
        <ContactInfoBlock
          phone={request.user?.customerProfile?.phone}
          email={request.user?.email}
        />
        {request.message ? (
          <p className="mt-1 rounded-md bg-zinc-50 p-2 text-xs text-zinc-600">
            {request.message}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canAct ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={onAccept}
              loading={busy}
            >
              Accepter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecline}
              disabled={busy}
            >
              Refuser
            </Button>
          </>
        ) : (
          <Badge
            variant={request.status === "ACCEPTED" ? "success" : "default"}
          >
            {REQUEST_STATUS_LABEL[request.status]}
          </Badge>
        )}
      </div>
    </li>
  );
}
