import type { CSSProperties } from 'react';

// ─── Oweru Brand Color Palette — Dark Theme ───────────────────────────────────
// Source: Oweru Brand Book & Guidelines
// Primary Navy: #0F172A | Brand Gold: #C89128 | Off-white: #F8F8F9

// Base styles
export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  color: '#F8F8F9',
  backgroundColor: '#0F172A',   // Oweru navy900 — brand dark
  padding: '16px',
  minHeight: '100vh',
};

export const panelStyle: CSSProperties = {
  background: '#141F35',         // navy800 — slightly lighter dark surface
  border: '1px solid rgba(200, 145, 40, 0.15)',  // subtle gold border
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.30)',
};

export const sectionTitleStyle: CSSProperties = {
  color: '#C89128',              // Oweru brand gold
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontWeight: 700,
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: 'clamp(24px, 5vw, 34px)',
  lineHeight: 1.1,
  margin: 0,
  color: '#F8F8F9',
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

export const descriptionStyle: CSSProperties = {
  color: '#9AAABF',
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
  padding: '18px',
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: `1px solid ${accent}28`,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
});

export const statLabelStyle: CSSProperties = {
  color: '#6888BC',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

export const statValueStyle: CSSProperties = {
  fontSize: 'clamp(24px, 4vw, 30px)',
  marginTop: '8px',
  fontWeight: 700,
  color: '#C89128',              // gold for key metrics
  letterSpacing: '-0.02em',
};

export const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: '14px',
  border: '1px solid rgba(200, 145, 40, 0.12)',
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '13px 16px',
  fontSize: '11px',
  color: '#6888BC',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  borderBottom: '1px solid rgba(200, 145, 40, 0.10)',
  background: 'rgba(15, 23, 42, 0.60)',
};

export const tdStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  verticalAlign: 'top',
  fontSize: '13px',
  color: '#C9D1DF',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1.5px solid rgba(200, 145, 40, 0.20)',
  borderRadius: '10px',
  color: '#F8F8F9',
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

export const buttonStyle = (variant: 'primary' | 'ghost' = 'primary'): CSSProperties => ({
  padding: '10px 16px',
  borderRadius: '10px',
  border: variant === 'primary'
    ? '1px solid #C89128'
    : '1px solid rgba(255, 255, 255, 0.10)',
  background: variant === 'primary'
    ? '#C89128'                  // Oweru brand gold CTA
    : 'rgba(255, 255, 255, 0.04)',
  color: variant === 'primary'
    ? '#0F172A'                  // dark navy text on gold button
    : '#F8F8F9',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '13px',
  whiteSpace: 'nowrap',
  boxShadow: variant === 'primary' ? '0 2px 12px rgba(200, 145, 40, 0.25)' : 'none',
});

// ─── Mobile Cards ─────────────────────────────────────────────────────────────

export const mobileTableContainer: CSSProperties = { display: 'none' };

export const mobileCard: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(200, 145, 40, 0.12)',
  borderRadius: '14px',
  padding: '16px',
  marginBottom: '12px',
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
  color: '#F8F8F9',
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

export const mobileCardSection: CSSProperties = { marginBottom: '12px' };

export const mobileCardLabel: CSSProperties = {
  fontSize: '11px',
  color: '#6888BC',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  marginBottom: '4px',
};

export const mobileCardValue: CSSProperties = {
  fontSize: '14px',
  color: '#C9D1DF',
};

export const mobileCardActions: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

export const mobileMediaQuery = '@media (max-width: 768px)';

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