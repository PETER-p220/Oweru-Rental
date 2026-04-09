import type { CSSProperties } from 'react';

export const palette = {
  gold: '#2563eb',
  green: '#16a34a',
  red: '#dc2626',
  blue: '#3b82f6',
  amber: '#f59e0b',
  cream: '#ffffff',
  muted: '#64748b',
  panel: 'rgba(15,23,42,0.96)',
  panelAlt: 'rgba(255,255,255,0.025)',
  border: 'rgba(59,130,246,0.14)',
  borderSoft: 'rgba(59,130,246,0.10)',
} as const;

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  backgroundColor: '#1e293b', // slate-800
  color: '#e8e4dc',
};

export const panelStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)', // slate-700 to slate-800
  border: `1px solid ${palette.border}`,
  borderRadius: '24px',
  padding: '28px',
  color: palette.cream,
  boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: palette.gold,
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: '30px',
  lineHeight: 1.1,
  margin: 0,
};

export const descriptionStyle: CSSProperties = {
  color: palette.muted,
  fontSize: '15px',
  lineHeight: 1.7,
  margin: 0,
};

export const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
};

export const metricCardStyle: CSSProperties = {
  padding: '18px',
  borderRadius: '18px',
  background: palette.panelAlt,
  border: `1px solid ${palette.borderSoft}`,
};

export const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '760px',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 12px',
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: palette.muted,
  borderBottom: `1px solid ${palette.borderSoft}`,
};

export const tdStyle: CSSProperties = {
  padding: '16px 12px',
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
  verticalAlign: 'top',
  color: palette.cream,
  fontSize: '14px',
};

export const buttonStyle = (tone: 'primary' | 'secondary' | 'danger' = 'secondary'): CSSProperties => {
  const map = {
    primary: { color: palette.gold, bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.22)' },
    secondary: { color: palette.cream, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
    danger: { color: palette.red, bg: 'rgba(224,112,112,0.12)', border: 'rgba(224,112,112,0.22)' },
  } as const;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '999px',
    background: map[tone].bg,
    border: `1px solid ${map[tone].border}`,
    color: map[tone].color,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  };
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: palette.cream,
  fontSize: '14px',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '120px',
  resize: 'vertical',
};

export const statusPillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '999px',
  background: `${color}16`,
  border: `1px solid ${color}2f`,
  color,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
});

export const formatCurrency = (amount?: number | string | null) => {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
};

export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getStatusColor = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
      return palette.green;
    case 'pending':
      return palette.blue600;
    case 'rejected':
    case 'failed':
    case 'cancelled':
      return palette.red;
    default:
      return palette.blue;
  }
};
