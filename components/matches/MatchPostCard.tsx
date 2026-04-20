import Link from "next/link";
import {
  GENDER_PREF_LABEL,
  MATCH_STATUS_LABEL,
  SKILL_LEVEL_LABEL,
  type MatchPostListItem,
} from "@/lib/api/matches";
import { Badge } from "@/components/ui";

function formatDate(iso: string): string {
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

export function MatchPostCard({ post }: { post: MatchPostListItem }) {
  const accepted = post._count.requests;
  const remaining = Math.max(0, post.neededPlayers - accepted);
  const creatorName = post.creator.customerProfile
    ? `${post.creator.customerProfile.firstName} ${post.creator.customerProfile.lastName.charAt(0)}.`
    : "Joueur";
  const location = [post.city, post.governorate].filter(Boolean).join(", ");

  return (
    <Link
      href={`/jouer/${post.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {creatorName}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {location || "Lieu à définir"}
          </p>
        </div>
        {post.status !== "OPEN" ? (
          <Badge variant={post.status === "CLOSED" ? "info" : "default"}>
            {MATCH_STATUS_LABEL[post.status]}
          </Badge>
        ) : (
          <Badge variant="success">{remaining} place{remaining > 1 ? "s" : ""}</Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
          {formatDate(post.date)}
        </span>
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
          {post.startTime} – {post.endTime}
        </span>
        <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
          {SKILL_LEVEL_LABEL[post.skillLevel]}
        </span>
        {post.genderPref !== "ANY" && (
          <span className="rounded-md bg-sky-50 px-2 py-1 font-medium text-sky-700">
            {GENDER_PREF_LABEL[post.genderPref]}
          </span>
        )}
      </div>

      {post.description ? (
        <p className="line-clamp-2 text-xs text-zinc-600">{post.description}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
        <span>
          {accepted}/{post.neededPlayers} joueur{post.neededPlayers > 1 ? "s" : ""}
        </span>
        <span className="font-medium text-emerald-600 group-hover:underline">
          Voir →
        </span>
      </div>
    </Link>
  );
}
