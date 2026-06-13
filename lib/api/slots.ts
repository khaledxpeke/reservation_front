import { apiRequest } from "@/lib/api/client";
import { omitPastSlotsForVenueToday } from "@/lib/slotPastWallTime";

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

export async function getAvailableSlots(params: AvailableSlotsParams) {
  const res = await apiRequest<AvailableSlotsResult>("/api/slots/available", {
    query: {
      resourceId: params.resourceId,
      date: params.date,
      durationMin: params.durationMin,
    },
  });
  res.slots = omitPastSlotsForVenueToday(res.slots, params.date);
  return res;
}
