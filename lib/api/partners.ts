import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface PartnerListItem {
  id: string;
  name: string;
  city: string;
  isVerified: boolean;
  category?: { name: string };
  user?: { email: string; status: string };
  pack?: { id: string; name: string; maxResources: number } | null;
}

export interface ListPartnersParams {
  page?: number;
  limit?: number;
  city?: string;
  categoryId?: string;
  isVerified?: boolean;
  search?: string;
}

export function listPartnersAdmin(params: ListPartnersParams = {}) {
  return apiRequest<Paginated<PartnerListItem>>("/api/partners", {
    query: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getPartner(id: string) {
  return apiRequest<unknown>(`/api/partners/${id}`);
}

export interface UpdatePartnerBody {
  name?: string;
  logo?: string | null;
  city?: string;
  phone?: string;
  address?: string;
  categoryId?: string;
}

export function updatePartner(id: string, body: UpdatePartnerBody) {
  return apiRequest<unknown>(`/api/partners/${id}`, { method: "PATCH", body });
}

export function verifyPartner(id: string, isVerified: boolean) {
  return apiRequest<unknown>(`/api/partners/${id}/verify`, {
    method: "PATCH",
    body: { isVerified },
  });
}

export function assignPackToPartner(id: string, packId: string | null) {
  return apiRequest<unknown>(`/api/partners/${id}/pack`, {
    method: "PATCH",
    body: { packId },
  });
}
