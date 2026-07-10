const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_BASE = API_BASE.replace(/\/api\/?$/, '');

export const PROPERTY_IMAGE_PLACEHOLDER =
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23E2E8F0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='14' fill='%2394A3B8'%3ENo Image%3C/text%3E%3C/svg%3E`;

/** Build a public storage URL for a relative image path. */
export function resolvePropertyImageUrl(path: string | null | undefined): string {
  if (!path || !String(path).trim()) return PROPERTY_IMAGE_PLACEHOLDER;
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/storage/')) return `${STORAGE_BASE}${p}`;
  if (p.startsWith('storage/')) return `${STORAGE_BASE}/${p}`;
  if (p.startsWith('/')) return `${STORAGE_BASE}${p}`;
  return `${STORAGE_BASE}/storage/${p}`;
}

/** Best thumbnail for list cards — prefers API `thumbnail`, then primary relation image. */
export function getPropertyThumbnail(property: Record<string, unknown> | null | undefined): string {
  if (!property) return PROPERTY_IMAGE_PLACEHOLDER;

  if (property.thumbnail) {
    return resolvePropertyImageUrl(String(property.thumbnail));
  }

  const si = property.property_images;
  if (Array.isArray(si) && si.length > 0) {
    const row = (si as Array<Record<string, unknown>>).find((i) => i.is_primary) ?? si[0];
    const path = (row as Record<string, unknown>)?.image_path ?? (row as Record<string, unknown>)?.url;
    if (path) return resolvePropertyImageUrl(String(path));
  }

  const ci = property.propertyImages;
  if (Array.isArray(ci) && ci.length > 0) {
    const row = (ci as Array<Record<string, unknown>>).find((i) => i.is_primary) ?? ci[0];
    const path = (row as Record<string, unknown>)?.image_path ?? (row as Record<string, unknown>)?.url;
    if (path) return resolvePropertyImageUrl(String(path));
  }

  const imgs = property.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    const path = typeof first === 'string' ? first : (first as Record<string, unknown>)?.image_path ?? (first as Record<string, unknown>)?.url;
    if (path) return resolvePropertyImageUrl(String(path));
  }

  return PROPERTY_IMAGE_PLACEHOLDER;
}

export function getStorageOrigin(): string {
  return STORAGE_BASE;
}
