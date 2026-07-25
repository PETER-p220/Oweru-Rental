const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com',
  'grr.la', 'tempmail.com', 'temp-mail.org', '10minutemail.com', 'yopmail.com',
  'throwaway.email', 'getnada.com', 'maildrop.cc', 'fakeinbox.com', 'trashmail.com',
  'dispostable.com', 'mintemail.com', 'emailondeck.com', 'tempail.com',
  'example.com', 'example.org', 'example.net', 'test.com', 'localhost',
]);

export type EmailValidationResult = { ok: true } | { ok: false; message: string };

export function validateRegistrationEmail(raw: string): EmailValidationResult {
  const email = raw.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: 'Email address is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, message: 'Enter a valid email (e.g. name@gmail.com).' };
  }
  const domain = email.split('@')[1] ?? '';
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      message: 'Use a personal or work email. Temporary addresses are not allowed.',
    };
  }
  return { ok: true };
}

export type AuthAlertVariant = 'error' | 'info' | 'exists';

export type ParsedAuthAlert = {
  variant: AuthAlertVariant;
  title: string;
  messages: string[];
  emailForLogin?: string;
};

export function parseAuthError(err: unknown, fallbackEmail?: string): ParsedAuthAlert {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const emailHint = fallbackEmail?.trim().toLowerCase();

  if (data?.errors && typeof data.errors === 'object') {
    const entries = Object.entries(data.errors as Record<string, string | string[]>);
    const messages: string[] = [];
    let emailTaken = false;

    for (const [field, val] of entries) {
      const list = Array.isArray(val) ? val : [String(val)];
      for (const text of list) {
        messages.push(text);
        if (field === 'email' && /already|taken|registered/i.test(text)) {
          emailTaken = true;
        }
      }
    }

    if (emailTaken) {
      return {
        variant: 'exists',
        title: 'You already have an account',
        messages: ['This email is registered on Oweru. Signing out only ends your session — it does not delete the account. Sign in with this email, or register with a different one.'],
        emailForLogin: emailHint,
      };
    }

    return {
      variant: 'error',
      title: 'Please fix the following',
      messages: messages.length ? messages : ['Validation failed. Check your details and try again.'],
    };
  }

  const message = typeof data?.message === 'string' ? data.message : null;
  if (message && /already registered|login instead/i.test(message)) {
    return {
      variant: 'exists',
      title: 'You already have an account',
      messages: [message.replace(/\.$/, '') + '. Use sign in below.'],
      emailForLogin: emailHint,
    };
  }

  if (message) {
    return { variant: 'error', title: 'Unable to continue', messages: [message] };
  }

  const generic = (err as Error)?.message;
  return {
    variant: 'error',
    title: 'Something went wrong',
    messages: [generic && generic !== '[object Object]' ? generic : 'Please try again in a moment.'],
  };
}

export function parseLoginError(err: unknown): ParsedAuthAlert {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const status = (err as { response?: { status?: number } })?.response?.status;
  const message = typeof data?.message === 'string' ? data.message : '';

  if (status === 401 && /invalid credentials/i.test(message)) {
    return {
      variant: 'error',
      title: 'Sign in failed',
      messages: ['Email or password is incorrect. Please check your details and try again.'],
    };
  }
  if (status === 401 && /user type mismatch/i.test(message)) {
    return {
      variant: 'info',
      title: 'Wrong account type',
      messages: ['Select the role you used when you registered (Tenant, Agent, Landlord, etc.).'],
    };
  }
  if (message) {
    return { variant: 'error', title: 'Sign in failed', messages: [message] };
  }
  return parseAuthError(err);
}
