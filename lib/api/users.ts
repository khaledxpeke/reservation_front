import { apiRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: "SUPER_ADMIN" | "PARTNER";
  status?: "ACTIVE" | "BLOCKED";
  search?: string;
}

export function listUsers(params: ListUsersParams = {}) {
  return apiRequest<Paginated<UserRow>>("/api/users", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function updateUserStatus(id: string, status: "ACTIVE" | "BLOCKED") {
  return apiRequest<UserRow>(`/api/users/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function deleteUser(id: string) {
  return apiRequest<{ message: string }>(`/api/users/${id}`, { method: "DELETE" });
}
