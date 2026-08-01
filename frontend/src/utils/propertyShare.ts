const DEFAULT_ORIGIN = 'https://rental.oweru.com';

export function buildPropertyShareUrl(
  propertyId: number | string,
  agentId?: number | string | null,
): string {
  const base = typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN;
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
