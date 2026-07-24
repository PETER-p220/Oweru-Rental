import type { UserRole } from '../components/DashboardLayout';

export function getDashboardRole(user: {
  userType?: string;
  user_type?: string;
  role?: string;
} | null | undefined): UserRole {
  const role = user?.userType || user?.user_type || user?.role || 'tenant';
  return role as UserRole;
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

/** Default tenant path for pre-login redirects */
export function getBnbPropertyPathForLogin(propertyId: number | string): string {
  return `/dashboard/tenant/bnb-property/${propertyId}`;
}
