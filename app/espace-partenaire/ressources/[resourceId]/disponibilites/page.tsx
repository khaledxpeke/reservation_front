"use client";

import { useParams } from "next/navigation";
import { ResourceAvailabilityForm } from "@/components/partner/ResourceAvailabilityForm";

export default function DisponibilitesPage() {
  const { resourceId } = useParams() as { resourceId: string };

  return (
    <ResourceAvailabilityForm
      resourceId={resourceId}
      showBackLink
      backHref="/espace-partenaire/ressources"
    />
  );
}
