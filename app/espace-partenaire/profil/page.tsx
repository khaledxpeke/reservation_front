"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { setStoredUser } from "@/lib/api/client";
import { getApiErrorHint, getApiErrorMessage } from "@/lib/api/errors";
import { getPartner, updatePartner, type PartnerProfile } from "@/lib/api/partners";
import { Alert, FormField, Input } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";
import { CloudinaryUploadButton } from "@/components/cloudinary/CloudinaryUploadButton";
import { isCloudinaryConfigured } from "@/components/cloudinary/cloudinaryUtils";
import { partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";
import { IMAGE_URL_MAX_LENGTH } from "@/lib/validation";

const AUTOSAVE_MS = 650;

function serializeFields(fields: {
  name: string;
  city: string;
  phone: string;
  address: string;
  logo: string | null;
  coverImage: string | null;
}) {
  return JSON.stringify({
    name: fields.name,
    city: fields.city,
    phone: fields.phone,
    address: fields.address.trim() || undefined,
    logo: fields.logo,
    coverImage: fields.coverImage,
  });
}

export default function PartnerProfilPage() {
  const { user, setUser } = useAuth();
  const partnerId = user?.partner?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const lastPersistedRef = useRef<string | null>(null);
  const savedClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    setError(null);
    setErrorHint(null);
    try {
      const p = await getPartner(partnerId);
      setProfile(p);
      setName(p.name);
      setCity(p.city);
      setPhone(p.phone);
      setAddress(p.address ?? "");
      setLogo(p.logo);
      setCoverImage(p.coverImage);
      lastPersistedRef.current = serializeFields({
        name: p.name,
        city: p.city,
        phone: p.phone,
        address: p.address ?? "",
        logo: p.logo,
        coverImage: p.coverImage,
      });
    } catch (e) {
      setError(getApiErrorMessage(e, "Chargement impossible."));
      setErrorHint(getApiErrorHint(e));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pushAuthPartner = useCallback(
    (updated: PartnerProfile) => {
      if (!user?.partner) return;
      const next = {
        ...user,
        partner: {
          ...user.partner,
          name: updated.name,
          city: updated.city,
          phone: updated.phone,
          address: updated.address,
          logo: updated.logo,
          coverImage: updated.coverImage,
        },
      };
      setUser(next);
      setStoredUser(JSON.stringify(next));
    },
    [setUser, user],
  );

  useEffect(() => {
    if (!partnerId || loading || !profile || lastPersistedRef.current === null) return;

    const key = serializeFields({ name, city, phone, address, logo, coverImage });
    if (key === lastPersistedRef.current) return;

    setSaveState("saving");
    const t = window.setTimeout(() => {
      void (async () => {
        const payload = { name, city, phone, address, logo, coverImage };
        const nextKey = serializeFields(payload);
        if (nextKey === lastPersistedRef.current) {
          setSaveState("idle");
          return;
        }

        setError(null);
        setErrorHint(null);
        try {
          const updated = await updatePartner(partnerId, {
            name: payload.name,
            city: payload.city,
            phone: payload.phone,
            address: payload.address.trim() || undefined,
            logo: payload.logo,
            coverImage: payload.coverImage,
          });
          setProfile(updated);
          lastPersistedRef.current = serializeFields({
            name: updated.name,
            city: updated.city,
            phone: updated.phone,
            address: updated.address ?? "",
            logo: updated.logo,
            coverImage: updated.coverImage,
          });
          pushAuthPartner(updated);
          setSaveState("saved");
          if (savedClearRef.current) clearTimeout(savedClearRef.current);
          savedClearRef.current = setTimeout(() => setSaveState("idle"), 2200);
        } catch (err) {
          setSaveState("idle");
          setError(getApiErrorMessage(err, "Enregistrement impossible."));
          setErrorHint(getApiErrorHint(err));
        }
      })();
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(t);
  }, [partnerId, loading, profile, name, city, phone, address, logo, coverImage, pushAuthPartner]);

  useEffect(() => {
    return () => {
      if (savedClearRef.current) clearTimeout(savedClearRef.current);
    };
  }, []);

  if (!partnerId) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-medium text-zinc-900">Profil</h1>
        <Alert hint="Reconnectez-vous puis réessayez.">Session invalide.</Alert>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-[40vh] flex-col gap-6">
        <h1 className="text-lg font-medium text-zinc-900">Profil</h1>
        <div className="flex flex-1 items-center justify-center py-20">
          <PageSpinner />
        </div>
      </div>
    );
  }

  const preview = {
    id: profile.id,
    logo,
    coverImage,
  };

  const saveHint =
    saveState === "saving"
      ? "Enregistrement…"
      : saveState === "saved"
        ? "Enregistré"
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-lg font-medium tracking-tight text-zinc-900">Profil club</h1>
        {saveHint && (
          <span
            className={`text-xs ${saveState === "saving" ? "text-zinc-400" : "text-zinc-500"}`}
            aria-live="polite"
          >
            {saveHint}
          </span>
        )}
      </header>

      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
          {errorHint ? <span className="mt-1 block text-xs text-rose-500">{errorHint}</span> : null}
        </p>
      )}

      {!isCloudinaryConfigured() && (
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900">
            Upload via Cloudinary (optionnel)
          </summary>
          <p className="mt-2 max-w-lg leading-relaxed">
            Compte{" "}
            <a href="https://cloudinary.com/users/register_free" className="text-zinc-800 underline" target="_blank" rel="noreferrer">
              Cloudinary
            </a>
            , preset unsigned, variables{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] text-zinc-700">NEXT_PUBLIC_CLOUDINARY_*</code> — ou
            collez une URL https.
          </p>
        </details>
      )}

      {/* Aperçu — léger, sans carte lourde */}
      <div className="flex h-[4.75rem] overflow-hidden rounded-xl bg-zinc-100/80 ring-1 ring-zinc-200/60">
        <div className="relative h-full w-36 shrink-0 sm:w-40">
          <Image src={partnerHeroUrl(preview)} alt="" fill className="object-cover" sizes="160px" priority />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
            <Image
              src={partnerLogoUrl({ id: profile.id, logo })}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">{name || "Club"}</p>
            <p className="truncate text-xs text-zinc-500">{[city, phone].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
        <div className="space-y-5">
          <FormField label="Logo">
            <div className="flex gap-2">
              <Input
                size="sm"
                type="url"
                placeholder="https://…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={logo ?? ""}
                onChange={(e) => setLogo(e.target.value || null)}
                className="min-w-0 flex-1 border-zinc-200/90 bg-white"
              />
              <CloudinaryUploadButton label="" onUploaded={(url) => setLogo(url)} />
            </div>
          </FormField>
          <FormField label="Bannière">
            <div className="flex gap-2">
              <Input
                size="sm"
                type="url"
                placeholder="https://…"
                maxLength={IMAGE_URL_MAX_LENGTH}
                value={coverImage ?? ""}
                onChange={(e) => setCoverImage(e.target.value || null)}
                className="min-w-0 flex-1 border-zinc-200/90 bg-white"
              />
              <CloudinaryUploadButton label="" onUploaded={(url) => setCoverImage(url)} />
            </div>
          </FormField>
          <p className="text-[11px] text-zinc-400">URL https, max. {IMAGE_URL_MAX_LENGTH} caractères</p>
        </div>

        <div className="space-y-5 sm:border-l sm:border-zinc-100 sm:pl-12">
          <FormField label="Nom du club">
            <Input
              size="sm"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-zinc-200/90 bg-white"
            />
          </FormField>
          <FormField label="Ville">
            <Input
              size="sm"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border-zinc-200/90 bg-white"
            />
          </FormField>
          <FormField label="Téléphone">
            <Input
              size="sm"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-zinc-200/90 bg-white"
            />
          </FormField>
          <FormField label="Adresse">
            <Input
              size="sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border-zinc-200/90 bg-white"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
