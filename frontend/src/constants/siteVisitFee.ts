/** Temporary test amount (production default was 20,000). Keep in sync with SITE_VISIT_FEE in backend .env */
export const SITE_VISIT_FEE = 200;

export const formatSiteVisitFee = (amount = SITE_VISIT_FEE) =>
  `TZS ${new Intl.NumberFormat('en-TZ').format(amount)}`;
