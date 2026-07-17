export const PAYMENT_DURATION_OPTIONS = [
  { value: 1, label: '1 month (monthly)' },
  { value: 3, label: '3 months (quarterly)' },
  { value: 6, label: '6 months (semi-annual)' },
  { value: 12, label: '12 months (annual)' },
] as const;

export function formatPaymentDuration(months?: number | null): string {
  const m = months ?? 1;
  const option = PAYMENT_DURATION_OPTIONS.find(o => o.value === m);
  if (option) return option.label;
  return `${m} month${m === 1 ? '' : 's'}`;
}

export function formatPaymentPeriodLabel(months?: number | null): string {
  const m = months ?? 1;
  if (m === 1) return 'per month';
  return `for ${m} months`;
}

export function periodRentTotal(monthlyRent: number, months?: number | null): number {
  return monthlyRent * (months ?? 1);
}
