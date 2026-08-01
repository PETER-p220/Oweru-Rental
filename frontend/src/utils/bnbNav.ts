import type { UserRole } from '../components/DashboardLayout';

export function getDashboardRole(user: {
  userType?: string;
  user_type?: string;
  role?: string;
} | null | undefined): UserRole {
  const role = user?.userType || user?.user_type || user?.role || 'tenant';
  return role as UserRole;
}

/** Roles whose dashboard includes a bnb-property detail route in App.tsx */
const DASHBOARD_BNB_DETAIL_ROLES: UserRole[] = ['tenant', 'bnb_owner'];

export function hasDashboardBnbDetail(
  user: Parameters<typeof getDashboardRole>[0] | null | undefined,
): boolean {
  if (!user) return false;
  return DASHBOARD_BNB_DETAIL_ROLES.includes(getDashboardRole(user));
}

/** Public property detail URL (no login required) */
export function getPublicBnbPropertyPath(propertyId: number | string): string {
  return `/bnb/${propertyId}`;
}

/** Dashboard path when signed in; public path for guests and roles without bnb-property route */
export function resolveBnbPropertyPath(
  user: Parameters<typeof getDashboardRole>[0] | null | undefined,
  propertyId: number | string,
  isAuthenticated = !!user,
): string {
  if (isAuthenticated && hasDashboardBnbDetail(user)) {
    return getBnbPropertyPath(user, propertyId);
  }
  return getPublicBnbPropertyPath(propertyId);
}

export function getBrowseBnbPath(user: Parameters<typeof getDashboardRole>[0]): string {
  return `/dashboard/${getDashboardRole(user)}/browse-bnb-stays`;
}

export function getBnbPropertyPath(
  user: Parameters<typeof getDashboardRole>[0],
  propertyId: number | string,
): string {
  return `/dashboard/${getDashboardRole(user)}/bnb-property/${propertyId}`;
}

export function getMyStaysPath(user: Parameters<typeof getDashboardRole>[0]): string {
  return `/dashboard/${getDashboardRole(user)}/bnb-stays`;
}

export function getBnbPaymentReturnPath(user: Parameters<typeof getDashboardRole>[0]): string {
  return `/dashboard/${getDashboardRole(user)}/bnb-payment-return`;
}

/** Rewrite login redirect to the signed-in user's dashboard role */
export function resolveDashboardRedirect(
  redirect: string | null,
  userType: string,
): string | null {
  if (!redirect || !redirect.startsWith('/dashboard/')) return redirect;
  return redirect.replace(/^\/dashboard\/[^/]+/, `/dashboard/${userType}`);
}

/** Pre-login redirect target (rewritten to dashboard after sign-in) */
export function getBnbPropertyPathForLogin(propertyId: number | string): string {
  return getPublicBnbPropertyPath(propertyId);
}

/** After login, send the user to their role dashboard (or a safe redirect). */
export function resolvePostLoginDestination(
  user: Parameters<typeof getDashboardRole>[0],
  redirect: string | null,
): string {
  if (redirect) {
    const publicBnb = redirect.match(/^\/bnb\/(\d+)\/?$/);
    if (publicBnb) {
      return resolveBnbPropertyPath(user, publicBnb[1], true);
    }
    if (!redirect.startsWith('/dashboard/')) {
      return redirect;
    }
  }
  const role = getDashboardRole(user);
  return resolveDashboardRedirect(redirect, role) || `/dashboard/${role}`;
}

export interface BnbBookingDraft {
  booking: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    check_in: string;
    check_out: string;
    guest_count: number;
    special_requests: string;
  };
  resumePayment?: boolean;
}

export function bnbBookingDraftKey(propertyId: number | string): string {
  return `bnb_booking_draft_${propertyId}`;
}

export function saveBnbBookingDraft(propertyId: number | string, draft: BnbBookingDraft): void {
  try {
    sessionStorage.setItem(bnbBookingDraftKey(propertyId), JSON.stringify(draft));
  } catch {
    /* ignore quota errors */
  }
}

export function loadBnbBookingDraft(propertyId: number | string): BnbBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(bnbBookingDraftKey(propertyId));
    if (!raw) return null;
    return JSON.parse(raw) as BnbBookingDraft;
  } catch {
    return null;
  }
}

export function clearBnbBookingDraft(propertyId: number | string): void {
  sessionStorage.removeItem(bnbBookingDraftKey(propertyId));
}
