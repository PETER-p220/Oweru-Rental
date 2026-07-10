/** Normalize payment status from API responses (handles nested/unwrapped shapes). */
export type PaymentPollStatus = 'paid' | 'failed' | 'pending';

export function parsePaymentStatus(data: Record<string, unknown> | null | undefined): PaymentPollStatus {
  if (!data) return 'pending';

  if (data.rent_paid === true || data.site_visit_paid === true) {
    return 'paid';
  }

  const raw =
    data.status ??
    data.payment_status ??
    data.rent_payment_status ??
    '';

  const normalized = String(raw).toLowerCase();

  if (['paid', 'completed', 'successful'].includes(normalized)) {
    return 'paid';
  }
  if (['failed', 'cancelled', 'canceled', 'error', 'declined'].includes(normalized)) {
    return 'failed';
  }
  return 'pending';
}

export function paymentConfirmationMessage(
  type: 'site_visit' | 'rent' | 'monthly',
  status: PaymentPollStatus,
): string {
  if (status === 'paid') {
    return type === 'site_visit'
      ? 'Site visit fee confirmed! The agent will contact you to schedule a visit.'
      : type === 'rent'
        ? 'Rent payment confirmed! You can now proceed with your contract.'
        : 'Payment confirmed! Your rent has been received.';
  }
  if (status === 'failed') {
    return 'Payment was not completed. Please try again.';
  }
  return 'USSD prompt sent. Waiting for confirmation on your phone...';
}
