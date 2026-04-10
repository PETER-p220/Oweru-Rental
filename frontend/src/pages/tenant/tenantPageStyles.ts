import type { CSSProperties } from 'react';

// ─── Oweru Brand Color Palette ────────────────────────────────────────────────
// Source: Oweru Brand Book & Guidelines
export const palette = {
  // Primary Navy
  navy900:    '#0F172A',   // HEX #0F172A — primary dark background
  navy800:    '#141F35',
  navy700:    '#1A2A47',
  navy600:    '#1E3358',
  navy500:    '#2A4472',
  navy400:    '#3D5E96',
  navy300:    '#6888BC',
  navy200:    '#A0B4D8',
  navy100:    '#D0DAEE',
  navy50:     '#EEF2F8',

  // Brand Gold
  gold:       '#C89128',   // HEX #C89128 — primary brand gold
  goldLight:  '#D4A84B',   // lighter gold tint
  goldPale:   '#E8CC8A',
  goldFaint:  '#F5EDD4',

  // Neutrals
  offWhite:   '#F8F8F9',   // HEX #F8F8F9 — background off-white
  white:      '#FFFFFF',
  gray100:    '#F1F3F6',
  gray200:    '#E4E8EF',
  gray300:    '#C9D1DF',
  gray400:    '#9AAABF',
  gray500:    '#6B7E99',
  gray600:    '#4A5C73',
  gray700:    '#2E3D52',
  gray800:    '#1A2433',
  gray900:    '#0D1520',

  // Semantic
  borderSoft:  'rgba(15, 23, 42, 0.10)',
  borderFaint: 'rgba(15, 23, 42, 0.06)',
  goldBorder:  'rgba(200, 145, 40, 0.25)',
  goldGlow:    'rgba(200, 145, 40, 0.12)',
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  color: palette.navy900,
  backgroundColor: palette.offWhite,
  padding: '16px',
  minHeight: '100vh',
};

export const panelStyle: CSSProperties = {
  background: palette.white,
  border: `1px solid ${palette.gray200}`,
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.07), 0 4px 16px rgba(15, 23, 42, 0.05)',
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const sectionTitleStyle: CSSProperties = {
  color: palette.gold,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontWeight: 700,
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: 'clamp(22px, 5vw, 32px)',
  lineHeight: 1.15,
  margin: 0,
  color: palette.navy900,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

export const descriptionStyle: CSSProperties = {
  color: palette.gray500,
  fontSize: 'clamp(14px, 3vw, 15px)',
  lineHeight: 1.7,
  maxWidth: '70ch',
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '14px',
};

export const statCardStyle = (accent: string): CSSProperties => ({
  padding: '20px',
  borderRadius: '12px',
  background: palette.white,
  border: `1.5px solid ${accent}22`,
  boxShadow: `0 2px 8px rgba(15, 23, 42, 0.06)`,
});

export const statLabelStyle: CSSProperties = {
  color: palette.gray400,
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

export const statValueStyle: CSSProperties = {
  fontSize: 'clamp(22px, 4vw, 28px)',
  marginTop: '8px',
  fontWeight: 700,
  color: palette.navy900,
  letterSpacing: '-0.02em',
};

// ─── Table ────────────────────────────────────────────────────────────────────

export const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: '12px',
  border: `1px solid ${palette.gray200}`,
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: '11px',
  color: palette.gray500,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  borderBottom: `1px solid ${palette.gray200}`,
  background: palette.offWhite,
};

export const tdStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid ${palette.gray100}`,
  verticalAlign: 'top',
  fontSize: '14px',
  color: palette.gray700,
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: palette.offWhite,
  border: `1.5px solid ${palette.gray200}`,
  borderRadius: '8px',
  color: palette.navy900,
  outline: 'none',
  fontSize: '14px',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '130px',
  resize: 'vertical',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
};

// ─── Buttons ──────────────────────────────────────────────────────────────────

export const buttonStyle = (
  variant: 'primary' | 'ghost' | 'secondary' | 'danger' = 'primary'
): CSSProperties => {
  const variants: Record<string, Partial<CSSProperties>> = {
    primary: {
      border: `1px solid ${palette.gold}`,
      background: palette.gold,
      color: palette.white,
      boxShadow: `0 2px 8px ${palette.goldGlow}`,
    },
    ghost: {
      border: `1.5px solid ${palette.gray200}`,
      background: 'transparent',
      color: palette.gray700,
    },
    secondary: {
      border: `1.5px solid ${palette.goldBorder}`,
      background: palette.goldFaint,
      color: palette.navy900,
    },
    danger: {
      border: `1px solid rgba(239, 68, 68, 0.3)`,
      background: '#ef4444',
      color: palette.white,
    },
  };

  return {
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    whiteSpace: 'nowrap',
    ...variants[variant],
  };
};

// ─── Mobile Cards ─────────────────────────────────────────────────────────────

export const mobileTableContainer: CSSProperties = { display: 'none' };

export const mobileCard: CSSProperties = {
  background: palette.white,
  border: `1px solid ${palette.gray200}`,
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '10px',
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
};

export const mobileCardHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
  flexWrap: 'wrap',
  gap: '8px',
};

export const mobileCardTitle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: palette.navy900,
  margin: 0,
};

export const mobileCardStatus: CSSProperties = {
  padding: '3px 9px',
  borderRadius: '100px',
  fontSize: '11px',
  textTransform: 'uppercase',
  fontWeight: 600,
  letterSpacing: '0.04em',
};

export const mobileCardSection: CSSProperties = { marginBottom: '10px' };

export const mobileCardLabel: CSSProperties = {
  fontSize: '11px',
  color: palette.gray400,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '3px',
};

export const mobileCardValue: CSSProperties = {
  fontSize: '14px',
  color: palette.gray700,
};

export const mobileCardActions: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

export const mobileMediaQuery = '@media (max-width: 768px)';

// ─── Status ───────────────────────────────────────────────────────────────────

export const getStatusColor = (status?: string | null | undefined): string => {
  if (!status) return palette.gray400;
  switch (status.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'active':
      return '#16a34a';
    case 'pending':
    case 'processing':
      return '#b45309';  // amber that reads well on white
    case 'failed':
    case 'rejected':
    case 'cancelled':
      return '#dc2626';
    case 'refunded':
      return '#7c3aed';
    default:
      return palette.gray400;
  }
};

export const statusPillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '100px',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  background: `${color}14`,
  border: `1px solid ${color}30`,
  color: color,
});

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'N/A'
    : parsed.toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
};