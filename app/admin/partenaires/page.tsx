"use client";

import { useCallback } from "react";
import { listPartnersAdmin, verifyPartner, assignPackToPartner, type PartnerListItem } from "@/lib/api/partners";
import { listPacks, type Pack } from "@/lib/api/packs";
import { useApi, useMutation } from "@/hooks/useApi";
import { Alert, Button, PageHeader, Select } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";

interface Data {
  partners: PartnerListItem[];
  packs: Pack[];
}

export default function AdminPartnersPage() {
  const fetcher = useCallback(async (): Promise<Data> => {
    const [p, pk] = await Promise.all([listPartnersAdmin({ limit: 100 }), listPacks()]);
    return { partners: p.items, packs: pk };
  }, []);

  const { data, loading, error, reload } = useApi<Data>(fetcher);
  const verifyMut = useMutation(verifyPartner);
  const packMut = useMutation(assignPackToPartner);

  const onVerify = async (id: string, isVerified: boolean) => {
    const ok = await verifyMut.execute(id, isVerified);
    if (ok !== null) reload();
  };

  const onPack = async (id: string, packId: string) => {
    const ok = await packMut.execute(id, packId === "" ? null : packId);
    if (ok !== null) reload();
  };

  return (
    <div>
      <PageHeader title="Partenaires" />
      {(error || verifyMut.error || packMut.error) && (
        <div className="mt-4"><Alert>{error || verifyMut.error || packMut.error}</Alert></div>
      )}
      {loading || !data ? (
        <PageSpinner />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Ville</th>
                <th className="py-2 pr-4">Vérifié</th>
                <th className="py-2 pr-4">Pack</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.partners.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-3 pr-4">{p.name}</td>
                  <td className="py-3 pr-4">{p.city}</td>
                  <td className="py-3 pr-4">{p.isVerified ? "oui" : "non"}</td>
                  <td className="py-3 pr-4">
                    <Select
                      key={`${p.id}-${p.pack?.id ?? "none"}`}
                      className="max-w-[220px] text-xs"
                      defaultValue={p.pack?.id ?? ""}
                      onChange={(e) => void onPack(p.id, e.target.value)}
                    >
                      <option value="">Aucun pack</option>
                      {data.packs.map((pk) => <option key={pk.id} value={pk.id}>{pk.name}</option>)}
                    </Select>
                  </td>
                  <td className="py-3">
                    <Button variant="ghost" onClick={() => void onVerify(p.id, !p.isVerified)}>
                      {p.isVerified ? "Retirer la vérif." : "Vérifier"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
