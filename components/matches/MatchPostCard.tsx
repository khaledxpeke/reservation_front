import Link from "next/link";
import {
  GENDER_PREF_LABEL,
  MATCH_STATUS_LABEL,
  formatScheduleSummary,
  type MatchPostListItem,
} from "@/lib/api/matches";
import { Badge } from "@/components/ui";

export function MatchPostCard({ post }: { post: MatchPostListItem }) {
  const accepted = post._count.requests;
  const remaining = Math.max(0, post.neededPeople - accepted);
  const creatorName = post.creator.customerProfile
    ? `${post.creator.customerProfile.firstName} ${post.creator.customerProfile.lastName.charAt(0)}.`
    : "Membre";
  const location = [post.city, post.governorate].filter(Boolean).join(", ");

  return (
    <Link
      href={`/annonces/${post.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">{creatorName}</p>
          <p className="truncate text-xs text-zinc-500">{location || "Lieu à préciser"}</p>
        </div>
        {post.status !== "OPEN" ? (
          <Badge variant={post.status === "CLOSED" ? "info" : "default"}>
            {MATCH_STATUS_LABEL[post.status]}
          </Badge>
        ) : (
          <Badge variant="success">
            {remaining} place{remaining !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">
          {post.category.name}
        </span>
        <span className="rounded-md bg-violet-50 px-2 py-1 font-medium text-violet-700">
          {post.subCategory.name}
        </span>
        <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
          {formatScheduleSummary(post.scheduleSlots)}
        </span>
        {post.skillLevel && post.category.slug === "sports" ? (
          <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
            Niveau : {post.skillLevel}
          </span>
        ) : null}
        {post.genderPref !== "ANY" && post.category.slug === "sports" ? (
          <span className="rounded-md bg-sky-50 px-2 py-1 font-medium text-sky-700">
            {GENDER_PREF_LABEL[post.genderPref]}
          </span>
        ) : null}
        {post.partner ? (
          <span className="rounded-md bg-teal-50 px-2 py-1 font-medium text-teal-800">
            Partenaire : {post.partner.name}
          </span>
        ) : null}
      </div>

      {post.description ? (
        <p className="line-clamp-2 text-xs text-zinc-600">{post.description}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
        <span>
          {accepted}/{post.neededPeople} confirmé{post.neededPeople > 1 ? "s" : ""}
        </span>
        <span className="font-medium text-emerald-600 group-hover:underline">Voir →</span>
      </div>
    </Link>
  );
}
