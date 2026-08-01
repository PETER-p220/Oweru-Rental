/** Normalize API / network errors into user-facing messages. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;

  const row = err as {
    response?: { data?: { message?: string }; status?: number };
    message?: string;
  };

  const status = row.response?.status;
  if (status === 0 || status === undefined && !row.response?.data) {
    const msg = row.message ?? '';
    if (/failed to fetch|network|load failed|cert|ssl/i.test(msg)) {
      return 'Unable to reach the server. Check your internet connection and try again.';
    }
    return 'Unable to reach the server. Check your internet connection and try again.';
  }

  if (status === 401) return 'Your session expired. Please sign in again.';
  if (status === 403) return row.response?.data?.message || 'You do not have permission to view this data.';
  if (status === 503) return 'The server is temporarily unavailable. Please try again shortly.';

  return row.response?.data?.message || fallback;
}

export function rejectedReason(result: PromiseSettledResult<unknown>): unknown {
  return result.status === 'rejected' ? result.reason : null;
}
