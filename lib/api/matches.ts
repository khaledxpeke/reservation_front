import { apiRequest } from "@/lib/api/client";
import type { Gender, Paginated } from "@/lib/api/types";

export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type GenderPreference = "ANY" | "MALE" | "FEMALE";
export type MatchPostStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type MatchRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

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

export interface MatchPostListItem {
  id: string;
  creatorId: string;
  date: string;
  startTime: string;
  endTime: string;
  governorate: string | null;
  city: string | null;
  neededPlayers: number;
  genderPref: GenderPreference;
  skillLevel: SkillLevel;
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
  skillLevel?: SkillLevel;
  genderPref?: GenderPreference;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateMatchPostBody {
  date: string;
  startTime: string;
  endTime: string;
  governorate?: string;
  city?: string;
  neededPlayers: number;
  genderPref?: GenderPreference;
  skillLevel: SkillLevel;
  description?: string;
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
  return apiRequest<MatchPostDetail>(`/api/matches/${id}`, { auth: false });
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

// ----- helpers -----

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

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
