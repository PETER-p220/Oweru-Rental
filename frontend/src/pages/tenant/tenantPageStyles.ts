import type { CSSProperties } from 'react';

// Color palette for consistent theming
export const palette = {
  blue600:    '#2563eb',
  blue500:    '#3b82f6',
  blue400:    '#60a5fa',
  blue300:    '#93c5fd',
  blue200:    '#bfdbfe',
  blue100:    '#dbeafe',
  blue50:     '#eff6ff',
  blueDim:    'rgba(37,99,235,0.25)',
  white:      '#ffffff',
  gray900:    '#0f172a',
  gray800:    '#1e293b',
  gray700:    '#334155',
  gray600:    '#475569',
  gray500:    '#64748b',
  gray400:    '#94a3b8',
  gray300:    '#cbd5e1',
  gray200:    '#e2e8f0',
  gray100:    '#f1f5f9',
  gray50:     '#f8fafc',
  borderSoft: 'rgba(15,45,110,0.10)',
  borderFaint:'rgba(15,45,110,0.06)',
};

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  color: palette.gray800,
  backgroundColor: palette.gray50,
  padding: '16px',
  minHeight: '100vh',
};

export const panelStyle: CSSProperties = {
  background: palette.white,
  border: `1px solid ${palette.gray200}`,
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(15,45,110,0.08), 0 1px 2px rgba(15,45,110,0.06)',
};

export const sectionTitleStyle: CSSProperties = {
  color: palette.blue600,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontWeight: 600,
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: 'clamp(22px, 5vw, 32px)',
  lineHeight: 1.15,
  margin: 0,
  color: palette.gray900,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

export const descriptionStyle: CSSProperties = {
  color: palette.gray500,
  fontSize: 'clamp(14px, 3vw, 15px)',
  lineHeight: 1.7,
  maxWidth: '70ch',
};

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
  boxShadow: '0 1px 3px rgba(15,45,110,0.06)',
});

export const statLabelStyle: CSSProperties = {
  color: palette.gray400,
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

export const statValueStyle: CSSProperties = {
  fontSize: 'clamp(22px, 4vw, 28px)',
  marginTop: '8px',
  fontWeight: 700,
  color: palette.blue600,
  letterSpacing: '-0.02em',
};

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
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: `1px solid ${palette.gray200}`,
  background: palette.gray50,
};

export const tdStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid ${palette.gray100}`,
  verticalAlign: 'top',
  fontSize: '14px',
  color: palette.gray700,
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: palette.gray50,
  border: `1.5px solid ${palette.gray200}`,
  borderRadius: '8px',
  color: palette.gray800,
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

export const buttonStyle = (variant: 'primary' | 'ghost' | 'secondary' | 'danger' = 'primary'): CSSProperties => {
  const variants = {
    primary: {
      border: `1px solid transparent`,
      background: palette.blue600,
      color: palette.white,
    },
    ghost: {
      border: `1.5px solid ${palette.gray200}`,
      background: 'transparent',
      color: palette.gray700,
    },
    secondary: {
      border: `1.5px solid ${palette.blue200}`,
      background: palette.blue50,
      color: palette.blue600,
    },
    danger: {
      border: `1px solid rgba(239,68,68,0.3)`,
      background: '#ef4444',
      color: palette.white,
    },
  };

  const style = variants[variant] || variants.primary;

  return {
    padding: '10px 16px',
    borderRadius: '8px',
    border: style.border,
    background: style.background,
    color: style.color,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    whiteSpace: 'nowrap',
    boxShadow: variant === 'primary' ? '0 1px 3px rgba(37,99,235,0.25)' : 'none',
  };
};

// Mobile-specific styles
export const mobileTableContainer: CSSProperties = {
  display: 'none',
};

export const mobileCard: CSSProperties = {
  background: palette.white,
  border: `1px solid ${palette.gray200}`,
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '10px',
  boxShadow: '0 1px 3px rgba(15,45,110,0.06)',
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
  color: palette.gray900,
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

export const mobileCardSection: CSSProperties = {
  marginBottom: '10px',
};

export const mobileCardLabel: CSSProperties = {
  fontSize: '11px',
  color: palette.gray400,
  fontWeight: 600,
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

// Media query helper
export const mobileMediaQuery = '@media (max-width: 768px)';

// Status color helper for payments and applications
export const getStatusColor = (status?: string | null | undefined): string => {
  if (!status) return palette.gray400;

  switch (status.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'active':
      return '#16a34a';   // green-600
    case 'pending':
    case 'processing':
      return '#d97706';   // amber-600
    case 'failed':
    case 'rejected':
    case 'cancelled':
      return '#dc2626';   // red-600
    case 'refunded':
      return '#7c3aed';   // violet-600
    default:
      return palette.gray400;
  }
};

// Status pill style helper
export const statusPillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '100px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  background: `${color}14`,
  border: `1px solid ${color}30`,
  color: color,
});

export const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(Number(value || 0));

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
};