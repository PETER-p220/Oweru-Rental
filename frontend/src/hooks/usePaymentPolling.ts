import { useEffect, useRef } from 'react';
import { parsePaymentStatus, type PaymentPollStatus } from '../utils/paymentStatus';

export type PaymentPollCallbacks = {
  onPaid: (message?: string) => void;
  onFailed: (message?: string) => void;
  onTimeout?: (message: string) => void;
};

type PollFn = () => Promise<{ data?: Record<string, unknown>; message?: string }>;

/**
 * Poll a payment status endpoint until paid, failed, or timeout.
 * Used for site visit, rent, and monthly payments.
 */
export function usePaymentPolling(
  active: boolean,
  orderId: string,
  pollFn: PollFn,
  callbacks: PaymentPollCallbacks,
  options?: { intervalMs?: number; maxAttempts?: number },
) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!active || !orderId) return;

    const intervalMs = options?.intervalMs ?? 3000;
    const maxAttempts = options?.maxAttempts ?? 40;
    let attempts = 0;
    let settled = false;

    const finish = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const poll = async () => {
      if (settled) return;
      attempts += 1;

      try {
        const res = await pollFn();
        const status: PaymentPollStatus = parsePaymentStatus(res.data);
        const message = typeof res.data?.message === 'string'
          ? res.data.message
          : res.message;

        if (status === 'paid') {
          settled = true;
          finish();
          callbacksRef.current.onPaid(message);
          return;
        }
        if (status === 'failed') {
          settled = true;
          finish();
          callbacksRef.current.onFailed(message);
          return;
        }
        if (attempts >= maxAttempts) {
          callbacksRef.current.onTimeout?.(
            'Payment is taking longer than expected. Check back shortly or contact support if you were charged.',
          );
        }
      } catch {
        if (attempts >= maxAttempts) {
          callbacksRef.current.onTimeout?.(
            'Unable to verify payment right now. If you approved on your phone, refresh the page shortly.',
          );
        }
      }
    };

    poll();
    pollRef.current = setInterval(poll, intervalMs);

    return finish;
  }, [active, orderId, pollFn, options?.intervalMs, options?.maxAttempts]);
}
