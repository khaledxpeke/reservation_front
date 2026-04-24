import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export type OfferRecurrence = "NONE" | "DAILY" | "WEEKDAY" | "WEEKEND" | "WEEKLY";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const RECURRENCE_LABELS: Record<OfferRecurrence, string> = {
  NONE:    "Ponctuelle",
  DAILY:   "Chaque jour",
  WEEKDAY: "Jours ouvrables (lun – ven)",
  WEEKEND: "Week-end (sam – dim)",
  WEEKLY:  "Jours spécifiques",
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY:    "Lun",
  TUESDAY:   "Mar",
  WEDNESDAY: "Mer",
  THURSDAY:  "Jeu",
  FRIDAY:    "Ven",
  SATURDAY:  "Sam",
  SUNDAY:    "Dim",
};

export const ALL_DAYS: DayOfWeek[] = [
  "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY",
];

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number;
  validFrom: string | null;
  validUntil: string | null;
  recurrence: OfferRecurrence;
  recurrenceDays: DayOfWeek[];
  timeStart: string | null;
  timeEnd: string | null;
  approvalStatus: string;
  partnerId?: string;
  partner?: { name: string; city: string; logo: string | null; coverImage: string | null };
}

export interface ListOffersParams {
  page?: number;
  limit?: number;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

export function listPublicOffers(params: ListOffersParams = {}) {
  return apiRequest<Paginated<Offer>>("/api/offers/public", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function listPartnerOffers(params: ListOffersParams = {}) {
  return apiRequest<Paginated<Offer>>("/api/offers/partner", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function listAllOffersAdmin(params: ListOffersParams = {}) {
  return apiRequest<Paginated<Offer>>("/api/offers/admin", {
    query: params as Record<string, string | number | undefined>,
  });
}

export interface CreateOfferBody {
  title: string;
  description?: string;
  discountPercent: number;
  // One-shot
  validFrom?: string;
  validUntil?: string;
  // Recurring
  recurrence?: OfferRecurrence;
  recurrenceDays?: DayOfWeek[];
  timeStart?: string;
  timeEnd?: string;
}

export function createOffer(body: CreateOfferBody) {
  return apiRequest<Offer>("/api/offers", { method: "POST", body });
}

export function updateOfferApproval(id: string, approvalStatus: "APPROVED" | "REJECTED") {
  return apiRequest<Offer>(`/api/offers/${id}/approval`, {
    method: "PATCH",
    body: { approvalStatus },
  });
}
