import { apiRequest } from "@/lib/api/client";

export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: "available" | "booked";
}

export interface AvailableSlotsResult {
  date: string;
  dayOfWeek: string;
  slots: TimeSlot[];
}

export interface AvailableSlotsParams {
  resourceId: string;
  date: string;
  durationMin: number;
}

export function getAvailableSlots(params: AvailableSlotsParams) {
  return apiRequest<AvailableSlotsResult>("/api/slots/available", {
    query: {
      resourceId: params.resourceId,
      date: params.date,
      durationMin: params.durationMin,
    },
  });
}
