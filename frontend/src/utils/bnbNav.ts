import type { UserRole } from '../components/DashboardLayout';

export function getBrowseBnbPath(user: Parameters<typeof getDashboardRole>[0]): string {
  return `/dashboard/${getDashboardRole(user)}/browse-bnb-stays`;
}

/** @deprecated Use getBrowseBnbPath(user) from dashboard nav */
export const BNB_BROWSE_PATH = '/#bnb';

export function getDashboardRole(user: {
  userType?: string;
  user_type?: string;
  role?: string;
} | null | undefined): UserRole {
  const role = user?.userType || user?.user_type || user?.role || 'tenant';
  return role as UserRole;
}

export function getMyStaysPath(user: Parameters<typeof getDashboardRole>[0]): string {
  return `/dashboard/${getDashboardRole(user)}/bnb-stays`;
}
