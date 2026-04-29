import { apiRequest } from "@/lib/api/client";
import type {
  AuthUser,
  CustomerProfile,
  Gender,
  Paginated,
} from "@/lib/api/types";
import type { ReservationStatus } from "@/lib/api/reservations";

export interface UpdateCustomerProfileBody {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  /** YYYY-MM-DD */
  dob?: string;
  phone?: string;
  region?: string | null;
}

export interface CustomerReservation {
  id: string;
  reference: string;
  resourceId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  date: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  createdAt: string;
  resource?: {
    id: string;
    name: string;
    partner: {
      id: string;
      name: string;
      city: string;
      governorate: string | null;
      logo: string | null;
    };
  };
}

export interface ListMyReservationsParams {
  page?: number;
  limit?: number;
  status?: ReservationStatus;
  scope?: "upcoming" | "past" | "all";
}

export function getMyAccount() {
  return apiRequest<AuthUser>("/api/customers/me");
}

export function updateMyProfile(body: UpdateCustomerProfileBody) {
  return apiRequest<CustomerProfile>("/api/customers/me", {
    method: "PATCH",
    body,
  });
}

export function listMyReservations(params: ListMyReservationsParams = {}) {
  return apiRequest<Paginated<CustomerReservation>>(
    "/api/customers/me/reservations",
    {
      query: params as Record<string, string | number | undefined>,
    },
  );
}

export function cancelMyReservation(id: string) {
  return apiRequest<CustomerReservation>(
    `/api/customers/me/reservations/${id}/cancel`,
    { method: "PATCH" },
  );
}
