import { apiRequest } from "@/lib/api/client";

export interface Resource {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  partnerId: string;
  categoryType: "SPACE" | "SERVICE" | "ITEM";
  bookingUnit: "MINUTES" | "HOURS" | "DAYS";
  minBookingDuration: number | null;
  maxBookingDuration: number | null;
  bufferTimeMin: number;
  price: number | null;
}

export interface CreateResourceBody {
  name: string;
  capacity?: number;
  categoryType?: "SPACE" | "SERVICE" | "ITEM";
  bookingUnit?: "MINUTES" | "HOURS" | "DAYS";
  minBookingDuration?: number | null;
  maxBookingDuration?: number | null;
  bufferTimeMin?: number;
  price?: number;
}

export function listResources() {
  return apiRequest<Resource[]>("/api/resources");
}

export function createResource(body: CreateResourceBody) {
  return apiRequest<Resource>("/api/resources", { method: "POST", body });
}

export interface UpdateResourceBody {
  name?: string;
  capacity?: number;
  isActive?: boolean;
  categoryType?: "SPACE" | "SERVICE" | "ITEM";
  bookingUnit?: "MINUTES" | "HOURS" | "DAYS";
  minBookingDuration?: number | null;
  maxBookingDuration?: number | null;
  bufferTimeMin?: number;
  price?: number | null;
}

export function updateResource(id: string, body: UpdateResourceBody) {
  return apiRequest<Resource>(`/api/resources/${id}`, { method: "PATCH", body });
}

export function deleteResource(id: string) {
  return apiRequest<{ message: string }>(`/api/resources/${id}`, { method: "DELETE" });
}
