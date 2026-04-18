import type { CSSProperties } from 'react';

// ─── Oweru Brand Color Palette ────────────────────────────────────────────────
// Source: Oweru Brand Book & Guidelines
// Navy #0F172A | Gold #C89128 | Gold-light #D4A84B | Off-white #F8F8F9

export const palette = {
  // Brand primaries
  navy900:     '#0F172A',
  navy800:     '#141F35',
  navy700:     '#1A2A47',
  navy600:     '#1E3358',
  navy400:     '#3D5E96',

  // Brand gold
  gold:        '#C89128',
  goldLight:   '#D4A84B',
  goldPale:    '#E8CC8A',
  goldFaint:   'rgba(200, 145, 40, 0.10)',
  goldBorder:  'rgba(200, 145, 40, 0.25)',
  goldGlow:    'rgba(200, 145, 40, 0.18)',

  // Neutrals
  offWhite:    '#F8F8F9',
  white:       '#FFFFFF',
  gray100:     '#F1F3F6',
  gray200:     '#E4E8EF',
  gray300:     '#C9D1DF',
  gray400:     '#9AAABF',
  gray500:     '#6B7E99',
  gray600:     '#4A5C73',
  gray700:     '#2E3D52',

  // Semantic
  green:       '#16a34a',
  red:         '#dc2626',
  amber:       '#b45309',

  // Legacy aliases (keep for backward compat in inline refs)
  cream:       '#F8F8F9',
  muted:       '#9AAABF',
  border:      'rgba(200, 145, 40, 0.15)',
  borderSoft:  'rgba(200, 145, 40, 0.10)',
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  backgroundColor: palette.navy900,
  color: palette.offWhite,
  minHeight: '100vh',
};

export const panelStyle: CSSProperties = {
  background: `linear-gradient(160deg, ${palette.navy800} 0%, ${palette.navy900} 100%)`,
  border: `1px solid ${palette.border}`,
  borderRadius: '20px',
  padding: '28px',
  color: palette.offWhite,
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const sectionTitleStyle: CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: palette.gold,           // Oweru brand gold
  fontWeight: 700,
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: 'clamp(24px, 4vw, 32px)',
  lineHeight: 1.1,
  margin: 0,
  fontWeight: 700,
  color: palette.offWhite,
  letterSpacing: '-0.02em',
};

export const descriptionStyle: CSSProperties = {
  color: palette.muted,
  fontSize: '15px',
  lineHeight: 1.7,
  margin: 0,
};

// ─── Metric cards ─────────────────────────────────────────────────────────────

export const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
};

export const metricCardStyle: CSSProperties = {
  padding: '18px',
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: `1px solid ${palette.borderSoft}`,
};

// ─── Table ────────────────────────────────────────────────────────────────────

export const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: '12px',
  border: `1px solid ${palette.borderSoft}`,
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '760px',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '13px 14px',
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: palette.gray500,
  borderBottom: `1px solid ${palette.borderSoft}`,
  background: 'rgba(15, 23, 42, 0.50)',
};

export const tdStyle: CSSProperties = {
  padding: '16px 14px',
  borderBottom: `1px solid rgba(255, 255, 255, 0.04)`,
  verticalAlign: 'top',
  color: palette.offWhite,
  fontSize: '14px',
};

// ─── Buttons ──────────────────────────────────────────────────────────────────

export const buttonStyle = (tone: 'primary' | 'secondary' | 'danger' = 'secondary'): CSSProperties => {
  const map = {
    primary: {
      color:  palette.navy900,      // dark navy text on gold button
      bg:     palette.gold,
      border: palette.gold,
      shadow: `0 2px 10px ${palette.goldGlow}`,
    },
    secondary: {
      color:  palette.offWhite,
      bg:     'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.14)',
      shadow: 'none',
    },
    danger: {
      color:  palette.red,
      bg:     'rgba(220, 38, 38, 0.10)',
      border: 'rgba(220, 38, 38, 0.28)',
      shadow: 'none',
    },
  } as const;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    background: map[tone].bg,
    border: `1px solid ${map[tone].border}`,
    color: map[tone].color,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: map[tone].shadow,
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
  };
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: `1.5px solid ${palette.borderSoft}`,
  color: palette.offWhite,
  fontSize: '14px',
  outline: 'none',
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

// ─── Status pill ──────────────────────────────────────────────────────────────

export const statusPillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: '100px',
  background: `${color}18`,
  border: `1px solid ${color}35`,
  color,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
});

// ─── Status color helper ──────────────────────────────────────────────────────

export const getStatusColor = (status?: string | null): string => {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
      return palette.green;
    case 'pending':
    case 'processing':
      return palette.amber;
    case 'rejected':
    case 'failed':
    case 'cancelled':
      return palette.red;
    default:
      return palette.gray400;
  }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (amount?: number | string | null): string => {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
};

export const formatDate = (value?: string | null): string => {
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ---------------------------------------------------------------------------
// Mobile responsive styles
// ---------------------------------------------------------------------------

export const mobileTableContainer: CSSProperties = { display: 'none' };

export const mobileCard: CSSProperties = {
  background: palette.navy800,
  border: `1px solid ${palette.borderSoft}`,
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '12px',
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
};

export const mobileCardHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
  gap: '8px',
};

export const mobileCardTitle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: palette.cream,
  margin: 0,
};

export const mobileCardStatus: CSSProperties = {
  padding: '3px 9px',
  borderRadius: '100px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.04em',
};

export const mobileCardSection: CSSProperties = { marginBottom: '10px' };

export const mobileCardLabel: CSSProperties = {
  fontSize: '11px',
  color: palette.gray400,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '3px',
};

export const mobileCardValue: CSSProperties = {
  fontSize: '14px',
  color: palette.cream,
};

export const mobileCardActions: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

export const mobileMediaQuery = '@media (max-width: 768px)';