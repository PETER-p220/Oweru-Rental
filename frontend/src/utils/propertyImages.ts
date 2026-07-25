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

/** Build a public storage URL for a property video path. */
export function resolvePropertyVideoUrl(path: string | null | undefined): string {
  if (!path || !String(path).trim()) return '';
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/storage/')) return `${STORAGE_BASE}${p}`;
  if (p.startsWith('storage/')) return `${STORAGE_BASE}/${p}`;
  if (p.startsWith('/')) return `${STORAGE_BASE}${p}`;
  return `${STORAGE_BASE}/storage/${p}`;
}

export type PropertyMediaItem = { type: 'image' | 'video'; url: string };

function parseVideosField(videos: unknown): unknown[] {
  if (!videos) return [];
  if (typeof videos === 'string') {
    try {
      const parsed = JSON.parse(videos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return videos.trim() ? [videos] : [];
    }
  }
  return Array.isArray(videos) ? videos : [];
}

function pathFromVideoEntry(entry: unknown): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry.trim();
  if (typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    const path = row.video_path ?? row.path ?? row.url ?? row.src ?? row.video ?? '';
    return String(path).trim();
  }
  return '';
}

/** All resolved video URLs for a property row. */
export function getPropertyVideos(property: Record<string, unknown> | null | undefined): string[] {
  if (!property) return [];
  return parseVideosField(property.videos)
    .map((entry) => resolvePropertyVideoUrl(pathFromVideoEntry(entry)))
    .filter(Boolean);
}

/** Whether a property has at least one uploaded video. */
export function propertyHasVideos(property: Record<string, unknown> | null | undefined): boolean {
  if (!property) return false;
  if (property.has_videos === true || property.has_videos === 1) return true;
  return getPropertyVideos(property).length > 0;
}

/** All resolved image URLs for gallery/detail views. */
export function getPropertyImageUrls(property: Record<string, unknown> | null | undefined): string[] {
  if (!property) return [];

  const urls: string[] = [];
  const seen = new Set<string>();

  const push = (path: string) => {
    if (!path) return;
    const url = resolvePropertyImageUrl(path);
    if (url === PROPERTY_IMAGE_PLACEHOLDER || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  for (const src of [property.property_images, property.propertyImages]) {
    if (!Array.isArray(src)) continue;
    for (const row of src) {
      push(pathFromImageEntry(row));
    }
  }

  for (const entry of parseImagesField(property.images)) {
    push(pathFromImageEntry(entry));
  }

  return urls;
}

/** Combined image + video items for property detail galleries. */
export function buildPropertyMediaGallery(property: Record<string, unknown> | null | undefined): PropertyMediaItem[] {
  const images = getPropertyImageUrls(property).map((url) => ({ type: 'image' as const, url }));
  const videos = getPropertyVideos(property).map((url) => ({ type: 'video' as const, url }));
  return [...images, ...videos];
}

function parseImagesField(images: unknown): unknown[] {
  if (!images) return [];
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return images.trim() ? [images] : [];
    }
  }
  return Array.isArray(images) ? images : [];
}

function pathFromImageEntry(entry: unknown): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry.trim();
  if (typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    const path = row.image_path ?? row.path ?? row.url ?? row.src ?? row.image ?? '';
    return String(path).trim();
  }
  return '';
}

/** Best thumbnail for list cards — supports residential, commercial, and BnB shapes. */
export function getPropertyThumbnail(property: Record<string, unknown> | null | undefined): string {
  if (!property) return PROPERTY_IMAGE_PLACEHOLDER;

  const direct =
    property.thumbnail ??
    property.cover_image ??
    property.image ??
    property.main_image;
  if (direct) return resolvePropertyImageUrl(String(direct));

  const si = property.property_images;
  if (Array.isArray(si) && si.length > 0) {
    const row = (si as Array<Record<string, unknown>>).find((i) => i.is_primary) ?? si[0];
    const path = pathFromImageEntry(row);
    if (path) return resolvePropertyImageUrl(path);
  }

  const ci = property.propertyImages;
  if (Array.isArray(ci) && ci.length > 0) {
    const row = (ci as Array<Record<string, unknown>>).find((i) => i.is_primary) ?? ci[0];
    const path = pathFromImageEntry(row);
    if (path) return resolvePropertyImageUrl(path);
  }

  const imgs = parseImagesField(property.images);
  if (imgs.length > 0) {
    const primary = imgs.find((entry) => {
      if (entry && typeof entry === 'object') {
        return (entry as Record<string, unknown>).is_primary === true
          || (entry as Record<string, unknown>).is_primary === 1;
      }
      return false;
    }) ?? imgs[0];
    const path = pathFromImageEntry(primary);
    if (path) return resolvePropertyImageUrl(path);
  }

  return PROPERTY_IMAGE_PLACEHOLDER;
}

/** Normalize a BnB property row from any public API shape. */
export function normalizeBnbProperty(raw: Record<string, unknown>): Record<string, unknown> {
  const images = parseImagesField(raw.images).map((entry) => {
    const path = pathFromImageEntry(entry);
    return path ? resolvePropertyImageUrl(path) : '';
  }).filter(Boolean);

  const thumbnail = raw.thumbnail
    ? resolvePropertyImageUrl(String(raw.thumbnail))
    : (images[0] || getPropertyThumbnail(raw));

  return {
    ...raw,
    images: images.length > 0 ? images : parseImagesField(raw.images),
    thumbnail,
  };
}

export function getStorageOrigin(): string {
  return STORAGE_BASE;
}

/** Must match Laravel: images.* => image|mimes:jpeg,png,jpg,gif */
export const PROPERTY_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif']);
const ALLOWED_EXT = /\.(jpe?g|png|gif)$/i;

export function isAllowedPropertyImage(file: File): boolean {
  if (ALLOWED_MIME.has(file.type)) return true;
  return ALLOWED_EXT.test(file.name);
}

export const PROPERTY_IMAGE_TYPE_ERROR =
  'Only JPG, PNG, or GIF images are allowed (WebP/HEIC are not supported).';
