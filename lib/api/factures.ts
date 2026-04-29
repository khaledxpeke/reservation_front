import { apiRequest } from "@/lib/api/client";
import { tokenStorage } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export type FactureStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface FactureRow {
  id: string;
  reference: string;
  reservationId: string;
  partnerId: string;
  reservationTotal: string;
  commissionPercent: string;
  amountDue: string;
  amountPaid: string;
  status: FactureStatus;
  generatedAt: string;
  paidAt: string | null;
  partner: {
    id: string;
    name: string;
    city: string;
    phone: string;
  };
  reservation: {
    id: string;
    reference: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string | null;
    date: string;
    endDate: string | null;
    startTime: string;
    endTime: string;
    resource: { id: string; name: string };
  };
}

export interface EtatReglementResult extends Paginated<FactureRow> {
  totals: {
    totalDue: string;
    totalPaid: string;
    remaining: string;
  };
}

export interface ListFacturesParams {
  page?: number;
  limit?: number;
  partnerId?: string;
  month?: string;
  dateFrom?: string;
  dateTo?: string;
  clientName?: string;
  status?: FactureStatus;
}

export function listEtatReglement(params: ListFacturesParams = {}) {
  return apiRequest<EtatReglementResult>("/api/factures/etat-reglement", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function listPartnerFactures(params: Omit<ListFacturesParams, "partnerId"> = {}) {
  return apiRequest<EtatReglementResult>("/api/factures/partner", {
    query: params as Record<string, string | number | undefined>,
  });
}

export function updateFacturePayment(id: string, amountPaid: number) {
  return apiRequest<FactureRow>(`/api/factures/${id}/payment`, {
    method: "PATCH",
    body: { amountPaid },
  });
}

export async function downloadFacturePdf(id: string, reference: string) {
  const headers: Record<string, string> = {};
  const token = tokenStorage.getAccess();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api/factures/${id}/pdf`, { headers });
  if (!res.ok) throw new Error("Téléchargement de la facture impossible.");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
