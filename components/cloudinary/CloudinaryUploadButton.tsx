"use client";

import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "@cloudinary-util/types";
import { Button } from "@/components/ui/Button";
import { isCloudinaryConfigured, secureUrlFromWidgetResult } from "./cloudinaryUtils";

type Props = {
  onUploaded: (secureUrl: string) => void;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
};

/**
 * Uploads to your Cloudinary account (free tier OK). Create an **unsigned** upload preset
 * in the Cloudinary console, then set env vars (see .env.local.example).
 */
export function CloudinaryUploadButton({ onUploaded, label, variant = "secondary" }: Props) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!isCloudinaryConfigured() || !cloudName || !preset) {
    return null;
  }

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    const url = secureUrlFromWidgetResult(results);
    if (url) onUploaded(url);
  };

  return (
    <CldUploadWidget uploadPreset={preset} onSuccess={handleSuccess}>
      {({ open }) => (
        <Button type="button" variant={variant} onClick={() => open()}>
          {label}
        </Button>
      )}
    </CldUploadWidget>
  );
}
