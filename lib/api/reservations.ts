import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface CreateReservationBody {
  resourceId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
}

export function createReservation(body: CreateReservationBody) {
  // The endpoint accepts both anonymous and authenticated requests. When the
  // visitor is logged in as a CUSTOMER, sending the bearer token lets the
  // backend attach `userId` so the reservation appears in their account.
  return apiRequest<unknown>("/api/reservations", { method: "POST", body });
}

export interface PartnerReservation {
  id: string;
  resourceId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  date: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  status: string;
  resource?: { name: string };
}

export interface ListPartnerReservationsParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  date?: string;
  resourceId?: string;
}

export function listPartnerReservations(params: ListPartnerReservationsParams) {
  return apiRequest<Paginated<PartnerReservation>>("/api/reservations/partner", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function updateReservationStatus(
  id: string,
  status: "CONFIRMED" | "REJECTED" | "CANCELLED",
) {
  return apiRequest<PartnerReservation>(`/api/reservations/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export interface AdminReservationRow extends PartnerReservation {
  resource?: { name: string; partner: { name: string } };
}

export function listReservationsAdmin(params: ListPartnerReservationsParams) {
  return apiRequest<Paginated<AdminReservationRow>>("/api/reservations", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function deleteReservation(id: string) {
  return apiRequest<{ message: string }>(`/api/reservations/${id}`, { method: "DELETE" });
}

export interface AdminReservationStats {
  bookings: { total: number; pending: number; confirmed: number; rejected: number };
  partners: { total: number; verified: number };
  resources: { total: number };
}

export function getAdminReservationStats() {
  return apiRequest<AdminReservationStats>("/api/reservations/admin/stats");
}
