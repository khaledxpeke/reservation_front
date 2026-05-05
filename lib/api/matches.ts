import { apiRequest } from "@/lib/api/client";
import type { Gender, Paginated } from "@/lib/api/types";

export type GenderPreference = "ANY" | "MALE" | "FEMALE";
export type MatchPostStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type MatchRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface PartnerBrief {
  id: string;
  name: string;
  city: string;
}

export interface MatchCreatorPublic {
  id: string;
  email?: string;
  customerProfile: {
    firstName: string;
    lastName: string;
    gender: Gender;
    region: string | null;
    phone?: string;
  } | null;
}

export interface MatchJoinRequest {
  id: string;
  matchPostId: string;
  userId: string;
  message: string | null;
  status: MatchRequestStatus;
  createdAt: string;
  updatedAt: string;
  user?: MatchCreatorPublic;
}

export interface MatchCategoryBrief {
  id: string;
  name: string;
  slug: string;
}

export interface MatchSubCategoryBrief {
  id: string;
  name: string;
}

export interface MatchPostListItem {
  id: string;
  creatorId: string;
  categoryId: string;
  subCategoryId: string;
  category: MatchCategoryBrief;
  subCategory: MatchSubCategoryBrief;
  date: string;
  startTime: string;
  endTime: string;
  lastSlotDate: string;
  scheduleSlots: ScheduleSlot[];
  governorate: string | null;
  city: string | null;
  neededPeople: number;
  /** Rétrocompat affichage : [nom sous-catégorie]. */
  categories: string[];
  genderPref: GenderPreference;
  /** Niveau recherché (texte libre), surtout pour la catégorie marketplace « sports ». */
  skillLevel: string | null;
  meta: Record<string, unknown>;
  partner: PartnerBrief | null;
  description: string | null;
  status: MatchPostStatus;
  createdAt: string;
  creator: MatchCreatorPublic;
  _count: { requests: number };
}

export interface MatchPostDetail extends Omit<MatchPostListItem, "_count"> {
  requests: MatchJoinRequest[];
}

export interface MyJoinRequestRow {
  id: string;
  matchPostId: string;
  userId: string;
  message: string | null;
  status: MatchRequestStatus;
  createdAt: string;
  matchPost: MatchPostListItem;
}

export interface ListMatchesParams {
  page?: number;
  limit?: number;
  status?: MatchPostStatus;
  governorate?: string;
  /** Filtre listings : valeur dans categories (ex. « Padel »). */
  category?: string;
  categoryId?: string;
  subCategoryId?: string;
  genderPref?: GenderPreference;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateMatchPostBody {
  categoryId: string;
  subCategoryId: string;
  scheduleSlots: ScheduleSlot[];
  governorate?: string;
  city?: string;
  neededPeople: number;
  description: string;
  partnerId?: string | null;
  meta?: Record<string, unknown>;
  genderPref?: GenderPreference;
  /** Facultatif ; souvent utilisé pour la catégorie « sports ». */
  skillLevel?: string;
}

export type UpdateMatchPostBody = Partial<CreateMatchPostBody> & {
  status?: MatchPostStatus;
};

export function listMatches(params: ListMatchesParams = {}) {
  return apiRequest<Paginated<MatchPostListItem>>("/api/matches", {
    query: params as Record<string, string | number | undefined>,
    auth: false,
  });
}

export function getMatch(id: string) {
  return apiRequest<MatchPostDetail>(`/api/matches/${id}`);
}

export function createMatch(body: CreateMatchPostBody) {
  return apiRequest<MatchPostListItem>("/api/matches", {
    method: "POST",
    body,
  });
}

export function updateMatch(id: string, body: UpdateMatchPostBody) {
  return apiRequest<MatchPostDetail>(`/api/matches/${id}`, {
    method: "PATCH",
    body,
  });
}

export function cancelMatch(id: string) {
  return apiRequest<MatchPostListItem>(`/api/matches/${id}`, {
    method: "DELETE",
  });
}

export function joinMatch(id: string, message?: string) {
  return apiRequest<MatchJoinRequest>(`/api/matches/${id}/requests`, {
    method: "POST",
    body: message ? { message } : {},
  });
}

export function withdrawMyJoinRequest(id: string) {
  return apiRequest<{ message: string }>(`/api/matches/${id}/requests/me`, {
    method: "DELETE",
  });
}

export function respondToJoinRequest(
  id: string,
  requestId: string,
  status: "ACCEPTED" | "DECLINED",
) {
  return apiRequest<MatchJoinRequest>(
    `/api/matches/${id}/requests/${requestId}`,
    {
      method: "PATCH",
      body: { status },
    },
  );
}

export function listMyCreatedMatches(params: ListMatchesParams = {}) {
  return apiRequest<Paginated<MatchPostDetail>>("/api/matches/me/created", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function listMyJoinRequests(params: ListMatchesParams = {}) {
  return apiRequest<Paginated<MyJoinRequestRow>>("/api/matches/me/requests", {
    query: params as Record<string, string | number | undefined>,
  });
}

export interface ChatMessageItem {
  id: string;
  matchPostId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    customerProfile: { firstName: string; lastName: string } | null;
  };
}

export function getMatchChatMessages(
  matchPostId: string,
  opts: { before?: string; limit?: number } = {},
) {
  return apiRequest<ChatMessageItem[]>(`/api/matches/${matchPostId}/messages`, {
    query: { before: opts.before, limit: opts.limit },
  });
}

/** Activités proposées lorsque le type d'annonce est « Sport » (Padel n'est pas un type d'annonce à part). */
export const SPORT_DISCIPLINE_PRESETS = [
  "Padel",
  "Tennis",
  "Football",
  "Basket",
  "Volleyball",
  "Course à pied",
  "Fitness",
  "Squash",
] as const;

export const SPORT_DISCIPLINE_OPTIONS = [...SPORT_DISCIPLINE_PRESETS, "Autre"] as const;
export type SportDisciplineOption = (typeof SPORT_DISCIPLINE_OPTIONS)[number];

/** @deprecated Utiliser SPORT_DISCIPLINE_PRESETS */
export const CATEGORY_PRESETS = SPORT_DISCIPLINE_PRESETS;
/** @deprecated Utiliser SPORT_DISCIPLINE_OPTIONS */
export const SPORT_CATEGORY_OPTIONS = SPORT_DISCIPLINE_OPTIONS;
/** @deprecated Utiliser SportDisciplineOption */
export type SportCategoryOption = SportDisciplineOption;

/** Exemples pour le champ niveau (saisie libre côté API). */
export const SKILL_LEVEL_SUGGESTIONS = ["Débutant", "Intermédiaire", "Avancé", "Confirmé", "3-4", "5-6"] as const;

export const GENDER_PREF_LABEL: Record<GenderPreference, string> = {
  ANY: "Tous",
  MALE: "Hommes",
  FEMALE: "Femmes",
};

export const MATCH_STATUS_LABEL: Record<MatchPostStatus, string> = {
  OPEN: "Ouverte",
  CLOSED: "Complète",
  CANCELLED: "Annulée",
};

export const REQUEST_STATUS_LABEL: Record<MatchRequestStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  DECLINED: "Refusée",
};

export function formatShortDate(iso: string): string {
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

/** Affiche le programme multi-jours de façon lisible */
export function formatScheduleSummary(slots: ScheduleSlot[]): string {
  if (slots.length === 0) return "";
  if (slots.length === 1) {
    return `${formatShortDate(slots[0]!.date)} · ${slots[0]!.startTime}–${slots[0]!.endTime}`;
  }
  return `${slots.length} jours (${formatShortDate(slots[0]!.date)} → ${formatShortDate(slots[slots.length - 1]!.date)})`;
}
