import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface MarketplacePartnerItem {
  id: string;
  name: string;
  logo: string | null;
  city: string;
  address: string | null;
  category: { id: string; name: string; slug: string };
  resources: { id: string; name: string; capacity: number }[];
  _count: { resources: number };
}

export interface MarketplaceSearchParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  subCategoryId?: string;
  city?: string;
  search?: string;
}

export function searchPartners(params: MarketplaceSearchParams) {
  return apiRequest<Paginated<MarketplacePartnerItem>>("/api/marketplace/search", {
    query: params as Record<string, string | number | undefined>,
  });
}

export interface PublicPartner {
  id: string;
  name: string;
  logo: string | null;
  city: string;
  phone: string;
  address: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    subCategories: { id: string; name: string; defaultDurationMin: number }[];
  };
  resources: {
    id: string;
    name: string;
    capacity: number;
    availabilities: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      slotIntervalMin: number;
    }[];
  }[];
  offers: {
    id: string;
    title: string;
    description: string | null;
    discountPercent: number;
    validFrom: string;
    validUntil: string;
  }[];
}

export function getPublicPartner(id: string) {
  return apiRequest<PublicPartner>(`/api/marketplace/partners/${id}`);
}
