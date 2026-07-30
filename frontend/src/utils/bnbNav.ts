import type { UserRole } from '../components/DashboardLayout';

export function getDashboardRole(user: {
  userType?: string;
  user_type?: string;
  role?: string;
} | null | undefined): UserRole {
  const role = user?.userType || user?.user_type || user?.role || 'tenant';
  return role as UserRole;
}

/** Public property detail URL (no login required) */
export function getPublicBnbPropertyPath(propertyId: number | string): string {
  return `/bnb/${propertyId}`;
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

/** After login, return here (public property page) */
export function getBnbPropertyPathForLogin(propertyId: number | string): string {
  return getPublicBnbPropertyPath(propertyId);
}

/** After login, send the user to their role dashboard (or a safe redirect). */
export function resolvePostLoginDestination(
  user: Parameters<typeof getDashboardRole>[0],
  redirect: string | null,
): string {
  if (redirect && !redirect.startsWith('/dashboard/')) {
    return redirect;
  }
  const role = getDashboardRole(user);
  return resolveDashboardRedirect(redirect, role) || `/dashboard/${role}`;
}
