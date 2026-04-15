import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface MarketplacePartnerItem {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string;
  governorate: string | null;
  address: string | null;
  category: { id: string; name: string; slug: string; imageUrl: string | null };
  resources: { id: string; name: string; capacity: number; subCategoryId: string | null; price: unknown }[];
  _count: { resources: number };
}

export interface MarketplaceSearchParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  subCategoryId?: string;
  governorate?: string;
  city?: string;
  search?: string;
}

export function searchPartners(params: MarketplaceSearchParams) {
  return apiRequest<Paginated<MarketplacePartnerItem>>("/api/marketplace/search", {
    query: params as Record<string, string | number | undefined>,
  });
}

export interface CourtOfferRow {
  partnerId: string;
  partnerName: string;
  resourceId: string;
  resourceName: string;
  city: string;
  governorate: string | null;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  price: number;
  originalPrice?: number;
  offerTitle?: string;
  durationMin: number;
}

export interface CourtSlotsParams {
  categoryId?: string;
  subCategoryId?: string;
  governorate?: string;
  city?: string;
  date: string;
  durationMin?: number;
  timeBand?: "morning" | "afternoon" | "evening" | "all";
}

export function searchCourtSlots(params: CourtSlotsParams) {
  return apiRequest<{ items: CourtOfferRow[] }>("/api/marketplace/court-slots", {
    query: { ...params } as Record<string, string | number | undefined>,
  });
}

export interface PublicPartner {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string;
  phone: string;
  address: string | null;
  /** Seeded rich text: description + keyFeatures for club pages */
  settings?: {
    description?: string;
    keyFeatures?: string[];
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    subCategories: { id: string; name: string; defaultDurationMin: number }[];
  };
  resources: {
    id: string;
    name: string;
    capacity: number;
    price?: unknown;
    bookingUnit: "MINUTES" | "HOURS" | "DAYS";
    subCategoryId?: string | null;
    subCategory?: { id: string; defaultDurationMin: number } | null;
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
