/**
 * Site visit fee shown in the UI. Set VITE_SITE_VISIT_FEE in frontend/.env to match backend SITE_VISIT_FEE.
 * Default 200 (test). Production example: VITE_SITE_VISIT_FEE=20000
 */
const parsed = Number(import.meta.env.VITE_SITE_VISIT_FEE);
export const SITE_VISIT_FEE =
  Number.isFinite(parsed) && parsed > 0 ? parsed : 200;

export const formatSiteVisitFee = (amount = SITE_VISIT_FEE) =>
  `TZS ${new Intl.NumberFormat('en-TZ').format(amount)}`;
