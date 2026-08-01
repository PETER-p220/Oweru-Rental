import { resolveBnbPropertyPath } from './bnbNav';

export type ListingKind = 'rental' | 'bnb';

/** Detect short-stay / BnB rows from public API payloads. */
export function isBnbListing(property: Record<string, unknown> | null | undefined): boolean {
  if (!property) return false;
  if (property.listing_type === 'bnb') return true;
  const type = String(property.type ?? '').toLowerCase();
  if (type.includes('bnb') || type.includes('short')) return true;
  if (property.max_guests != null && property.min_stay != null) return true;
  return false;
}

export function resolvePropertyDetailPath(
  property: Record<string, unknown>,
  options?: { user?: { userType?: string; user_type?: string; role?: string } | null; isAuthenticated?: boolean },
): string {
  const id = property.id;
  if (id == null) return '/properties';

  if (isBnbListing(property)) {
    return resolveBnbPropertyPath(options?.user, id, options?.isAuthenticated);
  }

  return `/property/${id}`;
}

export function listingKind(property: Record<string, unknown> | null | undefined): ListingKind {
  return isBnbListing(property) ? 'bnb' : 'rental';
}
