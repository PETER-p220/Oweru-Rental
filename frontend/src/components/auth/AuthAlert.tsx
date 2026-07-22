import { Link } from 'react-router-dom';
import { AlertCircle, Info, LogIn } from 'lucide-react';
import type { AuthAlertVariant } from '../utils/authErrors';

const GOLD = '#C89128';

type AuthAlertProps = {
  variant: AuthAlertVariant;
  title: string;
  messages: string[];
  emailForLogin?: string;
  onDismiss?: () => void;
};

const styles: Record<
  AuthAlertVariant,
  { bg: string; border: string; icon: string; title: string; text: string }
> = {
  error: {
    bg: '#FFF1F2',
    border: 'rgba(220,38,38,0.22)',
    icon: '#DC2626',
    title: '#991B1B',
    text: '#B91C1C',
  },
  info: {
    bg: '#EFF6FF',
    border: 'rgba(37,99,235,0.22)',
    icon: '#2563EB',
    title: '#1E40AF',
    text: '#1D4ED8',
  },
  exists: {
    bg: '#FFFBEB',
    border: 'rgba(200,145,40,0.35)',
    icon: GOLD,
    title: '#92400E',
    text: '#78350F',
  },
};

export default function AuthAlert({
  variant,
  title,
  messages,
  emailForLogin,
}: AuthAlertProps) {
  const s = styles[variant];
  const Icon = variant === 'info' ? Info : AlertCircle;
  const loginHref = emailForLogin
    ? `/login?email=${encodeURIComponent(emailForLogin)}`
    : '/login';

  return (
    <div
      role="alert"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon size={18} style={{ color: s.icon, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: s.title,
              marginBottom: messages.length ? 6 : 0,
            }}
          >
            {title}
          </div>
          {messages.map((line) => (
            <p
              key={line}
              style={{
                margin: '0 0 4px',
                fontSize: 13,
                lineHeight: 1.5,
                color: s.text,
              }}
            >
              {line}
            </p>
          ))}
          {variant === 'exists' && (
            <Link
              to={loginHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                padding: '8px 14px',
                background: '#0F172A',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <LogIn size={14} />
              Sign in instead
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
