"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { MatchGroupChat } from "@/components/matches/MatchGroupChat";
import { MatchChatIncomingToast } from "@/components/matches/MatchChatIncomingToast";
import {
  GENDER_PREF_LABEL,
  MATCH_STATUS_LABEL,
  REQUEST_STATUS_LABEL,
  cancelMatch,
  getMatch,
  joinMatch,
  respondToJoinRequest,
  withdrawMyJoinRequest,
  formatScheduleSummary,
  type MatchJoinRequest,
  type MatchPostDetail,
} from "@/lib/api/matches";
import {
  Alert,
  Badge,
  Button,
  Spinner,
  Textarea,
  useConfirmDialog,
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
  const { socket, joinMatchRoom, watchMatchPost, unwatchMatchPost } = useSocket();

  const [post, setPost] = useState<MatchPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messageToast, setMessageToast] = useState<{
    id: string;
    senderName: string;
    preview: string;
  } | null>(null);
  const [chatUnread, setChatUnread] = useState(0);
  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

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

  const reloadPostQuiet = useCallback(async () => {
    try {
      setPost(await getMatch(id));
    } catch {
      /* keep current data on transient errors */
    }
  }, [id]);

  /** Live list of demands / status without full page reload */
  useEffect(() => {
    if (!user) return;
    watchMatchPost(id);
    return () => unwatchMatchPost(id);
  }, [user, id, watchMatchPost, unwatchMatchPost]);

  useEffect(() => {
    if (!socket || !user) return;
    const onUpdated = (payload: { matchPostId?: string }) => {
      if (payload.matchPostId !== id) return;
      void reloadPostQuiet();
    };
    socket.on("match:updated", onUpdated);
    return () => {
      socket.off("match:updated", onUpdated);
    };
  }, [socket, user, id, reloadPostQuiet]);

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

  const remaining = post ? Math.max(0, post.neededPeople - acceptedCount) : 0;
  const isFull = post ? acceptedCount >= post.neededPeople : false;
  const isOpen = post?.status === "OPEN";

  // User is a chat member if they are the creator OR their request was accepted
  const isChatMember =
    !!user && !!post && (isCreator || myRequest?.status === "ACCEPTED");

  // Stay in the match WebSocket room on this page so messages arrive even when the panel is closed
  useEffect(() => {
    if (!post?.id || !isChatMember) return;
    joinMatchRoom(post.id);
  }, [post?.id, isChatMember, joinMatchRoom]);

  useEffect(() => {
    if (!socket || !post?.id || !user || !isChatMember) return;

    const onMsg = (msg: {
      id: string;
      matchPostId: string;
      senderId: string;
      content: string;
      sender?: {
        customerProfile: { firstName: string; lastName: string } | null;
      };
    }) => {
      if (msg.matchPostId !== post.id) return;
      if (msg.senderId === user.id) return;
      if (!chatOpenRef.current) {
        const name = msg.sender?.customerProfile
          ? `${msg.sender.customerProfile.firstName} ${msg.sender.customerProfile.lastName}`.trim()
          : "Joueur";
        setMessageToast({
          id: msg.id,
          senderName: name,
          preview: msg.content.length > 180 ? `${msg.content.slice(0, 180)}…` : msg.content,
        });
        setChatUnread((c) => c + 1);
      }
    };

    socket.on("chat:message", onMsg);
    return () => {
      socket.off("chat:message", onMsg);
    };
  }, [socket, post?.id, user, isChatMember]);

  const openChat = useCallback(() => {
    setChatOpen(true);
    setChatUnread(0);
    setMessageToast(null);
  }, []);

  const dismissToast = useCallback(() => {
    setMessageToast(null);
  }, []);

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
    const confirmed = await confirmDialog({
      title: "Annuler cette annonce ?",
      description: "Les joueurs ne pourront plus demander à rejoindre cette partie.",
      confirmLabel: "Annuler l'annonce",
    });
    if (!confirmed) return;
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
        <Link href="/annonces">
          <Button variant="secondary">Retour aux annonces</Button>
        </Link>
      </div>
    );
  }

  const creatorName = post.creator.customerProfile
    ? `${post.creator.customerProfile.firstName} ${post.creator.customerProfile.lastName}`
    : "Joueur";
  const location = [post.city, post.governorate].filter(Boolean).join(", ");

  const groupChatTitle = post
    ? `Groupe · ${new Date(post.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
    : "Groupe";

  return (
    <article className="grid gap-6 lg:grid-cols-3">
      {dialog}

      {/* Floating group chat — visible to accepted members + creator */}
      {isChatMember && (
        <>
          {messageToast && (
            <MatchChatIncomingToast
              key={messageToast.id}
              senderName={messageToast.senderName}
              preview={messageToast.preview}
              chatTitle={groupChatTitle}
              onOpen={openChat}
              onDismiss={dismissToast}
            />
          )}
          <MatchGroupChat
            matchPostId={post!.id}
            matchLabel={groupChatTitle}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
          {!chatOpen && (
            <div className="fixed bottom-6 right-4 z-50 sm:right-8">
              <button
                type="button"
                onClick={openChat}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 shadow-lg transition-transform hover:scale-105 hover:bg-teal-600 min-h-[48px] min-w-[48px]"
                aria-label="Ouvrir la discussion du groupe"
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {chatUnread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}
      <div className="lg:col-span-2 space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Annonce de {creatorName}
              </p>
              <p className="mt-1 text-xs font-medium text-amber-800">
                {post.category.name} · {post.subCategory.name}
              </p>
              <h1 className="mt-1 text-xl font-semibold text-zinc-900">
                {formatScheduleSummary(post.scheduleSlots)}
              </h1>
              {location ? <p className="mt-1 text-sm text-zinc-600">{location}</p> : null}
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

          <ul className="mt-4 space-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {post.scheduleSlots.map((s, i) => (
              <li key={`${s.date}-${i}`}>
                <span className="font-medium">{formatLongDate(s.date)}</span> · {s.startTime} – {s.endTime}
              </li>
            ))}
          </ul>

          {post.category.slug === "vehicules" &&
          typeof post.meta.transportFrom === "string" &&
          typeof post.meta.transportTo === "string" ? (
            <p className="mt-3 text-sm text-zinc-700">
              Trajet : <strong>{post.meta.transportFrom}</strong> → <strong>{post.meta.transportTo}</strong>
            </p>
          ) : null}
          {typeof post.meta.groupTargetSize === "number" ? (
            <p className="mt-3 text-sm text-zinc-700">
              Groupe cible : {post.meta.groupTargetSize} personnes
              {typeof post.meta.discountPercent === "number"
                ? ` · réduction ~${post.meta.discountPercent}%`
                : null}
              {typeof post.meta.activityLabel === "string" ? ` · ${post.meta.activityLabel}` : null}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">
              {post.category.name}
            </span>
            <span className="rounded-md bg-violet-50 px-2 py-1 font-medium text-violet-700">
              {post.subCategory.name}
            </span>
            {post.skillLevel && post.category.slug === "sports" ? (
              <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                Niveau : {post.skillLevel}
              </span>
            ) : null}
            {post.genderPref !== "ANY" && post.category.slug === "sports" ? (
              <span className="rounded-md bg-sky-50 px-2 py-1 font-medium text-sky-700">
                Préférence : {GENDER_PREF_LABEL[post.genderPref]}
              </span>
            ) : null}
            <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
              {acceptedCount}/{post.neededPeople} participant{post.neededPeople > 1 ? "s" : ""}
            </span>
          </div>

          {post.partner ? (
            <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-teal-800">Partenaire lié</p>
              <Link
                href={`/partenaires/${post.partner.id}`}
                className="mt-1 inline-block font-medium text-teal-700 hover:underline"
              >
                {post.partner.name} — {post.partner.city}
              </Link>
            </div>
          ) : null}

          {post.description ? (
            <p className="mt-4 whitespace-pre-line text-sm text-zinc-700">{post.description}</p>
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
            {isCreator ? "Votre annonce" : "Rejoindre cette annonce"}
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
                partnerId={post.partner?.id}
                partnerName={post.partner?.name}
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
                creatorPhone={post.creator.customerProfile?.phone}
                creatorEmail={post.creator.email}
                onWithdraw={onWithdraw}
                disabled={submitting}
              />
            ) : !isOpen ? (
              <p className="text-zinc-600">Cette annonce n&apos;accepte plus de demandes.</p>
            ) : isFull ? (
              <p className="text-zinc-600">Le groupe est complet.</p>
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

        {isChatMember ? <GroupMembersCard post={post} /> : null}
      </aside>
    </article>
  );
}

/** Liste commune : prénom, nom, téléphone (données déjà filtrées côté API pour le groupe). */
function GroupMembersCard({ post }: { post: MatchPostDetail }) {
  const accepted = post.requests.filter((r) => r.status === "ACCEPTED");
  const creator = post.creator;
  const creatorProfile = creator.customerProfile;
  const organizerLabel = creatorProfile
    ? `${creatorProfile.firstName} ${creatorProfile.lastName}`.trim()
    : "Organisateur";

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-800">
        Membres du groupe
      </h3>
      <p className="mt-1 text-xs text-zinc-600">
        Prénom, nom et numéro visibles entre le groupe (organisateur et joueurs acceptés).
      </p>
      <ul className="mt-4 space-y-4">
        <li className="rounded-lg border border-white/80 bg-white/90 p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">
            Organisateur
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">{organizerLabel}</p>
          {creatorProfile?.phone ? (
            <a
              href={`tel:${creatorProfile.phone}`}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
            >
              {creatorProfile.phone}
            </a>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">Téléphone non renseigné</p>
          )}
        </li>
        {accepted.map((r) => {
          const p = r.user?.customerProfile;
          const full = p ? `${p.firstName} ${p.lastName}`.trim() : "Joueur";
          return (
            <li
              key={r.id}
              className="rounded-lg border border-white/80 bg-white/90 p-3 shadow-sm"
            >
              <p className="text-sm font-semibold text-zinc-900">{full}</p>
              {p?.phone ? (
                <a
                  href={`tel:${p.phone}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
                >
                  {p.phone}
                </a>
              ) : (
                <p className="mt-1 text-xs text-zinc-400">Téléphone non renseigné</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CreatorActions({
  onCancel,
  disabled,
  status,
  partnerId,
  partnerName,
}: {
  onCancel: () => void;
  disabled: boolean;
  status: MatchPostDetail["status"];
  partnerId?: string;
  partnerName?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Vous gérez cette annonce. Acceptez ou refusez les demandes ci-contre.
      </p>
      {status === "CLOSED" && partnerId ? (
        <Link href={`/partenaires/${partnerId}`} className="block">
          <Button variant="primary" className="w-full">
            Réserver chez {partnerName ?? "le partenaire"}
          </Button>
        </Link>
      ) : null}
      {status !== "CANCELLED" ? (
        <Button variant="secondary" className="w-full" onClick={onCancel} disabled={disabled}>
          Annuler l&apos;annonce
        </Button>
      ) : null}
    </div>
  );
}

function MyRequestStatus({
  request,
  creatorPhone,
  creatorEmail,
  onWithdraw,
  disabled,
}: {
  request: MatchJoinRequest;
  creatorPhone?: string;
  creatorEmail?: string;
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
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
          <p className="text-xs font-medium text-emerald-800">
            Demande acceptée — coordonnées de l&apos;organisateur :
          </p>
          <ContactInfoBlock phone={creatorPhone} email={creatorEmail} />
        </div>
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
