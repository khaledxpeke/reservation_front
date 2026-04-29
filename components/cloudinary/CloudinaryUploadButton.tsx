"use client";

import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "@cloudinary-util/types";
import { Button } from "@/components/ui/Button";
import { isCloudinaryConfigured, secureUrlFromWidgetResult } from "./cloudinaryUtils";

type Props = {
  onUploaded: (secureUrl: string) => void;
  /** Text label. Pass an empty string or omit to render an icon-only button. */
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
};

const UploadIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
    />
  </svg>
);

/**
 * Uploads to your Cloudinary account (free tier OK). Create an **unsigned** upload preset
 * in the Cloudinary console, then set env vars (see .env.local.example).
 *
 * When `label` is empty / omitted, renders a compact icon-only button.
 */
export function CloudinaryUploadButton({
  onUploaded,
  label = "",
  variant = "secondary",
}: Props) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!isCloudinaryConfigured() || !cloudName || !preset) {
    return null;
  }

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    const url = secureUrlFromWidgetResult(results);
    if (url) onUploaded(url);
  };

  const isIconOnly = !label;

  return (
    <CldUploadWidget uploadPreset={preset} onSuccess={handleSuccess}>
      {({ open }) =>
        isIconOnly ? (
          <button
            type="button"
            onClick={() => open()}
            title="Uploader une image"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-400 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
          >
            <UploadIcon />
          </button>
        ) : (
          <Button type="button" variant={variant} onClick={() => open()}>
            <UploadIcon />
            {label}
          </Button>
        )
      }
    </CldUploadWidget>
  );
}
