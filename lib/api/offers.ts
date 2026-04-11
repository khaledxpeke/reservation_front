import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  approvalStatus: string;
  partnerId?: string;
  partner?: { name: string; city: string };
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
  validFrom: string;
  validUntil: string;
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
