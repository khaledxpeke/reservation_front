/**
 * Production images should be **URLs you store in the API** (e.g. `https://res.cloudinary.com/...`
 * after upload via the Cloudinary widget on Profil / Admin catégories).
 *
 * When a URL is missing, we fall back to **Lorem Picsum** (https://picsum.photos) — free, no key.
 * Seeded URLs stay stable for the same id/slug so placeholders don’t flicker on reload.
 */
const PICSUM = "https://picsum.photos";

/** Lorem Picsum seeded image (same seed → same photo). */
export function picsumFromSeed(seed: string, width: number, height: number): string {
  const safe = seed.slice(0, 120).replace(/\s+/g, "-");
  return `${PICSUM}/seed/${encodeURIComponent(safe)}/${width}/${height}`;
}

function seeded(seed: string, width: number, height: number): string {
  return picsumFromSeed(seed, width, height);
}

export function partnerHeroUrl(partner: {
  id: string;
  coverImage: string | null;
  logo: string | null;
}): string {
  if (partner.coverImage) return partner.coverImage;
  if (partner.logo) return partner.logo;
  return seeded(`partner-hero-${partner.id}`, 1200, 675);
}

export function partnerLogoUrl(partner: { id: string; logo: string | null }): string {
  if (partner.logo) return partner.logo;
  return seeded(`partner-logo-${partner.id}`, 384, 384);
}

export function categoryImageUrl(category: {
  id: string;
  slug: string;
  imageUrl: string | null;
}): string {
  if (category.imageUrl) return category.imageUrl;
  return seeded(`category-${category.slug}`, 800, 500);
}

export function subCategoryImageUrl(sub: { id: string; imageUrl: string | null }): string {
  if (sub.imageUrl) return sub.imageUrl;
  return picsumFromSeed(`subcategory-${sub.id}`, 400, 300);
}
