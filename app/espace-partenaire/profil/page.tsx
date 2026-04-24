"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { setStoredUser } from "@/lib/api/client";
import { getApiErrorHint, getApiErrorMessage } from "@/lib/api/errors";
import { getPartner, updatePartner, type PartnerProfile } from "@/lib/api/partners";
import { Alert, Button, Card, FormField, Input, PageHeader } from "@/components/ui";
import { PageSpinner } from "@/components/ui/Spinner";
import { CloudinaryUploadButton } from "@/components/cloudinary/CloudinaryUploadButton";
import { isCloudinaryConfigured } from "@/components/cloudinary/cloudinaryUtils";
import { partnerHeroUrl, partnerLogoUrl } from "@/lib/imageUrls";
import { IMAGE_URL_MAX_LENGTH } from "@/lib/validation";

export default function PartnerProfilPage() {
  const { user, setUser } = useAuth();
  const partnerId = user?.partner?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

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

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return;
    setSaving(true);
    setError(null);
    setErrorHint(null);
    try {
      const updated = await updatePartner(partnerId, {
        name,
        city,
        phone,
        address: address.trim() || undefined,
        logo,
        coverImage,
      });
      setProfile(updated);
      if (user?.partner) {
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
      }
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Enregistrement impossible."));
      setErrorHint(getApiErrorHint(err));
    } finally {
      setSaving(false);
    }
  };

  if (!partnerId) {
    return (
      <div>
        <PageHeader title="Profil" />
        <Alert hint="Reconnectez-vous puis réessayez.">Session invalide.</Alert>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profil club" description="Logo, bannière et coordonnées affichés sur la place de marché." />
        <Card className="flex min-h-64 items-center justify-center">
          <PageSpinner />
        </Card>
      </div>
    );
  }

  const preview = {
    id: profile.id,
    logo,
    coverImage,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil club"
        description="Les images sont hébergées sur Cloudinary (recommandé) : uploadez, puis l’URL est enregistrée ici. Sinon collez une URL https."
      />

      {!isCloudinaryConfigured() && (
        <div>
          <Alert variant="info">
            Pour uploader depuis l’interface : créez un compte{" "}
            <a href="https://cloudinary.com/users/register_free" className="underline" target="_blank" rel="noreferrer">
              Cloudinary (gratuit)
            </a>
            , ajoutez un preset de téléchargement <strong>unsigned</strong>, puis définissez{" "}
            <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> et{" "}
            <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> dans{" "}
            <code className="rounded bg-zinc-100 px-1">.env.local</code>. Vous pouvez toujours coller une URL d’image
            manuellement.
          </Alert>
        </div>
      )}

      {success && (
        <div>
          <Alert variant="success">Modifications enregistrées avec succès.</Alert>
        </div>
      )}
      {error && (
        <div>
          <Alert hint={errorHint}>{error}</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="overflow-hidden p-0">
          <div className="relative h-40 bg-zinc-100">
            <Image
              src={partnerHeroUrl(preview)}
              alt="Aperçu bannière"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-2 left-2 h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-white shadow">
              <Image
                src={partnerLogoUrl({ id: profile.id, logo })}
                alt="Aperçu logo"
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-1 p-4">
            <p className="text-sm font-semibold text-zinc-900">{name}</p>
            <p className="text-xs text-zinc-500">Aperçu public sur la place de marché et la fiche club.</p>
          </div>
        </Card>

        <form onSubmit={(e) => void onSave(e)} className="space-y-5">
          <Card className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Images du club</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Utilisez des URL HTTPS courtes. Limite: {IMAGE_URL_MAX_LENGTH} caractères.
              </p>
            </div>

            <FormField label="Logo (URL https)">
              <div className="flex flex-wrap gap-2">
                <Input
                  type="url"
                  placeholder="https://res.cloudinary.com/…"
                  maxLength={IMAGE_URL_MAX_LENGTH}
                  value={logo ?? ""}
                  onChange={(e) => setLogo(e.target.value || null)}
                  className="min-w-0 flex-1"
                />
                <CloudinaryUploadButton
                  label="Uploader"
                  onUploaded={(url) => setLogo(url)}
                />
              </div>
            </FormField>

            <FormField label="Bannière (URL https)">
              <div className="flex flex-wrap gap-2">
                <Input
                  type="url"
                  placeholder="https://res.cloudinary.com/…"
                  maxLength={IMAGE_URL_MAX_LENGTH}
                  value={coverImage ?? ""}
                  onChange={(e) => setCoverImage(e.target.value || null)}
                  className="min-w-0 flex-1"
                />
                <CloudinaryUploadButton
                  label="Uploader"
                  onUploaded={(url) => setCoverImage(url)}
                />
              </div>
            </FormField>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Coordonnées</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Ces informations aident les joueurs à identifier et contacter votre club.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nom du club">
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Ville">
                <Input required value={city} onChange={(e) => setCity(e.target.value)} />
              </FormField>
              <FormField label="Téléphone">
                <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <FormField label="Adresse">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Enregistrer
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
