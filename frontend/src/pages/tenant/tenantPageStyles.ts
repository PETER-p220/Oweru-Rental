import type { CSSProperties } from 'react';

export const palette = {
  amber:        '#f59e0b',
  amberDim:     '#d97706',
  amberGlow:    'rgba(245,158,11,0.12)',
  amberBorder:  'rgba(245,158,11,0.22)',
  green:        '#34d399',
  red:          '#f87171',
  blue:         '#60a5fa',
  purple:       '#a78bfa',
  cream:        '#f1ede6',
  muted:        '#94a3b8',
  mutedDark:    '#64748b',

  /* Slate palette */
  slate900:     '#0f172a',
  slate800:     '#1e293b',
  slate750:     '#243044',
  slate700:     '#334155',
  slate600:     '#475569',
  slate500:     '#64748b',

  /* Glass / overlay */
  glass:        'rgba(30,41,59,0.85)',
  glassLight:   'rgba(51,65,85,0.5)',
  overlay:      'rgba(15,23,42,0.7)',

  border:       'rgba(245,158,11,0.14)',
  borderSoft:   'rgba(148,163,184,0.1)',
  borderFaint:  'rgba(148,163,184,0.06)',
} as const;

/* ─── Page wrapper ─── */
export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '20px',
  background: palette.slate900,
  color: palette.cream,
  minHeight: '100vh',
  fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
};

/* ─── Panel ─── */
export const panelStyle: CSSProperties = {
  background: `linear-gradient(145deg, ${palette.slate750} 0%, ${palette.slate800} 100%)`,
  border: `1px solid ${palette.borderSoft}`,
  borderRadius: '20px',
  padding: '32px',
  color: palette.cream,
  boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

/* ─── Typography ─── */
export const sectionTitleStyle: CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: palette.amber,
  marginBottom: '8px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export const headingStyle: CSSProperties = {
  fontSize: '28px',
  lineHeight: 1.1,
  margin: 0,
  fontWeight: 700,
  letterSpacing: '-0.5px',
  color: palette.cream,
};

export const descriptionStyle: CSSProperties = {
  color: palette.muted,
  fontSize: '14px',
  lineHeight: 1.7,
  margin: '6px 0 0',
};

/* ─── Metric cards ─── */
export const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
};

export const metricCardStyle: CSSProperties = {
  padding: '20px',
  borderRadius: '14px',
  background: palette.glassLight,
  border: `1px solid ${palette.borderFaint}`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

/* ─── Table ─── */
export const tableWrapStyle: CSSProperties = { overflowX: 'auto' };

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '680px',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: '10px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: palette.mutedDark,
  borderBottom: `1px solid ${palette.borderFaint}`,
  fontWeight: 600,
};

export const tdStyle: CSSProperties = {
  padding: '14px',
  borderBottom: `1px solid rgba(148,163,184,0.05)`,
  verticalAlign: 'top',
  color: palette.cream,
  fontSize: '14px',
};

/* ─── Inputs ─── */
export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  background: 'rgba(15,23,42,0.6)',
  border: `1px solid ${palette.borderSoft}`,
  color: palette.cream,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '120px',
  resize: 'vertical' as const,
};

/* ─── Buttons ─── */
export const buttonStyle = (tone: 'primary' | 'secondary' | 'danger' = 'secondary'): CSSProperties => {
  const map = {
    primary:   { color: palette.slate900,  bg: palette.amber,                  border: palette.amberDim,               hover: '#fff' },
    secondary: { color: palette.cream,     bg: 'rgba(148,163,184,0.08)',        border: 'rgba(148,163,184,0.15)',        hover: palette.cream },
    danger:    { color: '#fca5a5',         bg: 'rgba(248,113,113,0.1)',         border: 'rgba(248,113,113,0.2)',         hover: '#fff' },
  } as const;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    background: map[tone].bg,
    border: `1px solid ${map[tone].border}`,
    color: map[tone].color,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
  };
};

/* ─── Status pills ─── */
export const statusPillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '999px',
  background: `${color}18`,
  border: `1px solid ${color}35`,
  color,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
});

/* ─── Helpers ─── */
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
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getStatusColor = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'approved': case 'active': case 'completed': case 'paid': case 'read':
      return palette.green;
    case 'pending': case 'processing': case 'unread':
      return palette.amber;
    case 'rejected': case 'failed': case 'overdue':
      return palette.red;
    default:
      return palette.blue;
  }
};