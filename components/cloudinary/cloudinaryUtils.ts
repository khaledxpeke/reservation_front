import type { CloudinaryUploadWidgetResults } from "@cloudinary-util/types";

/** Extract HTTPS URL after a successful Cloudinary widget upload. */
export function secureUrlFromWidgetResult(results: CloudinaryUploadWidgetResults): string | null {
  const info = results.info;
  if (!info || typeof info === "string") return null;
  const url = (info as { secure_url?: string }).secure_url;
  return typeof url === "string" ? url : null;
}

export function isCloudinaryConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() &&
    !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim()
  );
}
