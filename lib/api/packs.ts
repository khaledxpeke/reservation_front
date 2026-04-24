import { apiRequest } from "@/lib/api/client";

export interface Pack {
  id: string;
  name: string;
  maxResources: number;
  features: string[];
  priceMonthly: number;
}

export function listPacks() {
  return apiRequest<Pack[]>("/api/packs");
}

export interface CreatePackBody {
  name: string;
  maxResources: number;
  features?: string[];
  priceMonthly: number;
}

export function createPack(body: CreatePackBody) {
  return apiRequest<Pack>("/api/packs", { method: "POST", body });
}

export function updatePack(id: string, body: Partial<CreatePackBody>) {
  return apiRequest<Pack>(`/api/packs/${id}`, { method: "PATCH", body });
}

export function deletePack(id: string) {
  return apiRequest<{ message: string }>(`/api/packs/${id}`, { method: "DELETE" });
}
