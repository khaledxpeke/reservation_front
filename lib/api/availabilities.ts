import { apiRequest } from "@/lib/api/client";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface AvailabilityEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotIntervalMin?: number;
}

export interface AvailabilityRow extends AvailabilityEntry {
  id?: string;
  resourceId?: string;
}

export function getAvailabilities(resourceId: string) {
  return apiRequest<AvailabilityRow[]>(`/api/availabilities/resource/${resourceId}`);
}

export function setAvailabilities(resourceId: string, availabilities: AvailabilityEntry[]) {
  return apiRequest<unknown>(`/api/availabilities/resource/${resourceId}`, {
    method: "PUT",
    body: { availabilities },
  });
}
