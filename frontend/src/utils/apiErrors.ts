/** Normalize API / network errors into user-facing messages. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;

  const row = err as {
    response?: { data?: { message?: string; error?: string }; status?: number };
    message?: string;
  };

  const data = row.response?.data;
  const apiMessage = data?.message ?? data?.error;
  if (apiMessage) return apiMessage;

  const status = row.response?.status;

  if (status === 401) return 'Your session expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to view this data.';
  if (status === 404) return 'The requested data was not found.';
  if (status === 422) return fallback;
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 500) return 'Something went wrong on the server. Please try again.';
  if (status === 502 || status === 503 || status === 504) {
    return 'The server is temporarily unavailable. Please try again shortly.';
  }

  // status 0 = fetch threw (SSL, CORS, offline) — only then mention connection
  if (status === 0) {
    return 'Could not connect to the API. If other pages work, use Try again — the request may have been interrupted.';
  }

  if (status && status >= 400) return fallback;

  const msg = row.message ?? '';
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return 'Could not connect to the API. Please try again.';
  }

  return fallback;
}

export function rejectedReason(result: PromiseSettledResult<unknown>): unknown {
  return result.status === 'rejected' ? result.reason : null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const TOKEN_KEY = 'token';

/** Retry an async action when the first attempt fails (handles auth / timing races). */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; delayMs?: number },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const delayMs = options?.delayMs ?? 350;
  let lastError: unknown;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1 && localStorage.getItem(TOKEN_KEY)) {
        await sleep(delayMs * (i + 1));
      }
    }
  }

  throw lastError;
}
