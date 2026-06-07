import type { CSSProperties } from 'react';

// ─── Oweru Brand Color Palette ────────────────────────────────────────────────
// Source: Oweru Brand Book & Guidelines
export const palette = {
  // White & Slate Backgrounds
  white:      '#FFFFFF',
  slate50:    '#F8FAFC',
  slate100:   '#F1F5F9',
  slate200:   '#E2E8F0',
  slate300:   '#CBD5E1',
  slate400:   '#94A3B8',
  slate500:   '#64748B',
  slate600:   '#475569',
  slate700:   '#334155',
  slate800:   '#1E293B',
  slate900:   '#0F172A',

  // Brand Gold
  gold:       '#C89128',   // HEX #C89128 — primary brand gold
  goldLight:  '#D4A84B',   // lighter gold tint
  goldPale:   '#E8CC8A',
  goldFaint:  'rgba(200, 145, 40, 0.10)',  // rgba keeps transparency for use as bg tint

  // Legacy names for compatibility
  offWhite:   '#F8FAFC',   // slate50
  gray100:    '#F1F5F9',   // slate100
  gray200:    '#E2E8F0',   // slate200
  gray300:    '#CBD5E1',   // slate300
  gray400:    '#94A3B8',   // slate400
  gray500:    '#64748B',   // slate500
  gray600:    '#475569',   // slate600
  gray700:    '#334155',   // slate700
  gray800:    '#1E293B',   // slate800
  gray900:    '#0F172A',   // slate900

  // Semantic status
  green:       '#16a34a',
  red:         '#dc2626',
  amber:       '#b45309',
  violet:      '#7c3aed',

  // Border helpers
  borderSoft:  'rgba(15, 23, 42, 0.10)',
  borderFaint: 'rgba(15, 23, 42, 0.06)',
  goldBorder:  'rgba(200, 145, 40, 0.25)',
  goldGlow:    'rgba(200, 145, 40, 0.12)',
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  color: palette.slate900,
  backgroundColor: palette.slate50,
  padding: '16px',
  minHeight: '100vh',
};

export const panelStyle: CSSProperties = {
  background: palette.white,
  border: `1px solid ${palette.gray200}`,
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.07), 0 4px 16px rgba(15, 23, 42, 0.05)',
  position: 'relative',   // required for absolute gold accent bar in page headers
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const sectionTitleStyle: CSSProperties = {
  color: palette.gold,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontWeight: 700,
  marginBottom: '10px',
  display: 'flex',        // allows dot + text pattern used across pages
  alignItems: 'center',
  gap: '6px',
};

export const headingStyle: CSSProperties = {
  fontSize: 'clamp(22px, 5vw, 32px)',
  lineHeight: 1.15,
  margin: 0,
  color: palette.slate900,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

export const descriptionStyle: CSSProperties = {
  color: palette.gray500,
  fontSize: 'clamp(14px, 3vw, 15px)',
  lineHeight: 1.7,
  maxWidth: '70ch',
  marginTop: '6px',
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
  color: palette.slate900,
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
  whiteSpace: 'nowrap',
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
  background: palette.white,
  border: `1.5px solid ${palette.gray200}`,
  borderRadius: '8px',
  color: palette.slate900,
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
      color: palette.slate900,
    },
    danger: {
      border:     `1px solid rgba(220, 38, 38, 0.30)`,
      background: 'rgba(220, 38, 38, 0.08)',   // soft tint — consistent with other pages
      color:      palette.red,
    },
  };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
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
  color: palette.slate900,
  margin: 0,
};

export const mobileCardStatus: CSSProperties = {
  padding: '3px 9px',
  borderRadius: '100px',
  fontSize: '11px',
  textTransform: 'uppercase',
  fontWeight: 700,
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
      return palette.green;
    case 'pending':
    case 'processing':
      return palette.amber;
    case 'failed':
    case 'rejected':
    case 'cancelled':
      return palette.red;
    case 'signed':
      return palette.gold;
    case 'refunded':
      return palette.violet;
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