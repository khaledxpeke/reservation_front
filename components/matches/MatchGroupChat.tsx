"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { apiRequest } from "@/lib/api/client";
import { Spinner } from "@/components/ui";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatSender {
  id: string;
  customerProfile: { firstName: string; lastName: string } | null;
}

interface ChatMessage {
  id: string;
  matchPostId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ChatSender;
}

interface Props {
  matchPostId: string;
  matchLabel: string;
  /** If true, the chat panel is visible */
  open: boolean;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function senderName(sender: ChatSender) {
  if (sender.customerProfile) {
    return `${sender.customerProfile.firstName} ${sender.customerProfile.lastName}`;
  }
  return "Joueur";
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDay(messages: ChatMessage[]) {
  const groups: { day: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const day = dayLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.messages.push(msg);
    } else {
      groups.push({ day, messages: [msg] });
    }
  }
  return groups;
}

/** Composer grows with text up to this height (px), then scrolls — ChatGPT-style */
const COMPOSER_MAX_HEIGHT_PX = 200;
const COMPOSER_MIN_HEIGHT_PX = 44;

// ── Component ─────────────────────────────────────────────────────────────────

export function MatchGroupChat({ matchPostId, matchLabel, open, onClose }: Props) {
  const { user } = useAuth();
  const { socket, joinMatchRoom, sendMessage } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const joinedRef = useRef(false);
  const pulseClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);

  // ── Load history ────────────────────────────────────────────────────────────
  const loadHistory = useCallback(
    async (before?: string) => {
      if (before) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = before ? `?before=${before}&limit=30` : "?limit=30";
        const data = await apiRequest<ChatMessage[]>(
          `/api/matches/${matchPostId}/messages${params}`,
        );
        if (before) {
          setMessages((prev) => [...data, ...prev]);
          if (data.length < 30) setHasMore(false);
        } else {
          setMessages(data);
          if (data.length < 30) setHasMore(false);
        }
      } catch {
        // history unavailable – not a member yet, that's fine
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [matchPostId],
  );

  // ── Join room + load history when chat opens ─────────────────────────────
  useEffect(() => {
    if (!open || !user) return;
    if (!joinedRef.current) {
      joinMatchRoom(matchPostId);
      joinedRef.current = true;
    }
    void loadHistory();
  }, [open, user, matchPostId, joinMatchRoom, loadHistory]);

  // ── Reset when matchPostId changes ──────────────────────────────────────
  useEffect(() => {
    joinedRef.current = false;
    setMessages([]);
    setHasMore(true);
  }, [matchPostId]);

  // ── Listen for incoming messages ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: ChatMessage) => {
      if (msg.matchPostId !== matchPostId) return;
      setMessages((prev) => [...prev, msg]);
      if (open && user && msg.senderId !== user.id) {
        setPulseId(msg.id);
        if (pulseClearRef.current) clearTimeout(pulseClearRef.current);
        pulseClearRef.current = setTimeout(() => {
          setPulseId(null);
          pulseClearRef.current = null;
        }, 2600);
      }
    };
    socket.on("chat:message", handler);
    return () => {
      socket.off("chat:message", handler);
      if (pulseClearRef.current) {
        clearTimeout(pulseClearRef.current);
        pulseClearRef.current = null;
      }
    };
  }, [socket, matchPostId, open, user]);

  // ── Auto-scroll to bottom on new messages ───────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const adjustComposerHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const h = Math.min(
      Math.max(el.scrollHeight, COMPOSER_MIN_HEIGHT_PX),
      COMPOSER_MAX_HEIGHT_PX,
    );
    el.style.height = `${h}px`;
    el.style.overflowY = el.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    adjustComposerHeight();
  }, [text, adjustComposerHeight]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    sendMessage(matchPostId, content);
    setText("");
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = `${COMPOSER_MIN_HEIGHT_PX}px`;
        el.style.overflowY = "hidden";
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  // ── Load more on scroll to top ───────────────────────────────────────────
  const handleScroll = () => {
    if (!listRef.current || !hasMore || loadingMore) return;
    if (listRef.current.scrollTop < 60 && messages.length > 0) {
      void loadHistory(messages[0]?.createdAt);
    }
  };

  if (!open) return null;

  const groups = groupByDay(messages);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:inset-x-auto sm:right-4 sm:justify-end sm:p-0 md:right-6 lg:right-8">
      <div className="flex w-full max-w-[340px] flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-teal-600 px-4 py-3 text-white">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
          Gr
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{matchLabel}</p>
          <p className="text-xs text-teal-100">Discussion du groupe</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-full p-1 hover:bg-white/20"
          aria-label="Fermer le chat"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex h-[min(58vh,380px)] flex-col gap-1 overflow-y-auto bg-slate-50 px-3 py-3 sm:h-[min(52vh,440px)] md:h-[min(55vh,520px)] md:px-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Spinner className="h-4 w-4" />
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-sm text-slate-400">
              Aucun message pour le moment.
              <br />
              Soyez le premier à écrire !
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.day}>
              {/* Day separator */}
              <div className="my-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">{group.day}</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {group.messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.id;
                const prevMsg = group.messages[idx - 1];
                const showAvatar =
                  !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                const showName =
                  !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} mb-1`}
                  >
                    {/* Avatar placeholder for other users */}
                    {!isMe && (
                      <div
                        className={`h-7 w-7 shrink-0 rounded-full ${showAvatar ? "bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold" : "opacity-0"}`}
                      >
                        {showAvatar
                          ? (senderName(msg.sender)[0] ?? "?").toUpperCase()
                          : ""}
                      </div>
                    )}

                    <div
                      className={`flex min-w-0 max-w-[85%] flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
                    >
                      {showName && (
                        <span className="pl-1 text-[11px] text-slate-400">
                          {senderName(msg.sender)}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-snug transition-[box-shadow,transform] duration-300 ${
                          isMe
                            ? "rounded-br-sm bg-teal-500 text-white"
                            : "rounded-bl-sm bg-white text-slate-800 shadow-sm"
                        } ${!isMe && pulseId === msg.id ? "ring-2 ring-teal-400 ring-offset-2 scale-[1.02]" : ""}`}
                      >
                        {msg.content}
                      </div>
                      <span className="px-1 text-[10px] text-slate-400">
                        {timeLabel(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-slate-200 bg-white px-3 py-2.5"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          className="max-h-[200px] min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-normal outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          style={{ height: COMPOSER_MIN_HEIGHT_PX, overflowY: "hidden" }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:opacity-40"
          aria-label="Envoyer"
        >
          <svg
            className="h-4 w-4 translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
      </div>
    </div>
  );
}
