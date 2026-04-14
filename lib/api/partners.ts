import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface PartnerListItem {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string;
  phone: string;
  address: string | null;
  isVerified: boolean;
  category?: { id: string; name: string; slug: string };
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

export interface CreatePartnerBody {
  email: string;
  password: string;
  name: string;
  city: string;
  phone: string;
  address?: string;
  categoryId: string;
  logo?: string | null;
  coverImage?: string | null;
  packId?: string | null;
  isVerified?: boolean;
}

export function createPartner(body: CreatePartnerBody) {
  return apiRequest<PartnerListItem>("/api/partners", { method: "POST", body });
}

export function deletePartner(id: string) {
  return apiRequest<{ message: string }>(`/api/partners/${id}`, { method: "DELETE" });
}

/** Partner detail as returned by GET /api/partners/:id (authenticated). */
export interface PartnerProfile {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string;
  phone: string;
  address: string | null;
  isVerified: boolean;
  category: { id: string; name: string; slug: string };
  pack: { id: string; name: string; maxResources: number } | null;
  user: { id: string; email: string; status: string };
  resources: { id: string; name: string; capacity: number; isActive: boolean }[];
}

export function getPartner(id: string) {
  return apiRequest<PartnerProfile>(`/api/partners/${id}`);
}

export interface UpdatePartnerBody {
  name?: string;
  logo?: string | null;
  coverImage?: string | null;
  city?: string;
  phone?: string;
  address?: string;
  categoryId?: string;
}

export function updatePartner(id: string, body: UpdatePartnerBody) {
  return apiRequest<PartnerProfile>(`/api/partners/${id}`, { method: "PATCH", body });
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
