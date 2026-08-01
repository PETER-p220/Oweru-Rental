const DEFAULT_ORIGIN = 'https://rental.oweru.com';

/** Origin used for share preview links (same host as API). */
function getShareOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return DEFAULT_ORIGIN;
}

/**
 * Share preview URL — crawled by WhatsApp with og:image for property photo preview.
 * Redirects humans to the SPA property page.
 */
export function buildPropertyShareUrl(
  propertyId: number | string,
  agentId?: number | string | null,
): string {
  const base = getShareOrigin();
  const q = agentId != null && `${agentId}`.trim() !== '' ? `?agent=${agentId}` : '';
  return `${base}/api/public/share/property/${propertyId}${q}`;
}

/** Direct SPA link (no rich preview) — for copy/open in browser. */
export function buildPropertyPageUrl(
  propertyId: number | string,
  agentId?: number | string | null,
): string {
  const base = getShareOrigin();
  const q = agentId != null && `${agentId}`.trim() !== '' ? `?agent=${agentId}` : '';
  return `${base}/property/${propertyId}${q}`;
}

export function buildPropertyShareMessage(title: string, url: string): string {
  const name = title?.trim() || 'this property';
  return `Check out this property on Oweru: ${name}\n${url}`;
}

export function openWhatsAppShare(message: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
