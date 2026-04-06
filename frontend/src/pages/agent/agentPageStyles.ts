import type { CSSProperties } from 'react';

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  color: '#e8e4dc',
  backgroundColor: '#1e293b', // slate-800 instead of black
};

export const panelStyle: CSSProperties = {
  background: '#334155', // slate-700 instead of black
  border: '1px solid rgba(56,189,248,0.12)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
};

export const sectionTitleStyle: CSSProperties = {
  color: '#38bdf8',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: '34px',
  lineHeight: 1.1,
  margin: 0,
};

export const descriptionStyle: CSSProperties = {
  color: '#9aa4b2',
  fontSize: '15px',
  lineHeight: 1.7,
  maxWidth: '70ch',
};

export const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
};

export const statCardStyle = (accent: string): CSSProperties => ({
  padding: '18px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.02)',
  border: `1px solid ${accent}22`,
});

export const statLabelStyle: CSSProperties = {
  color: '#8ea0b5',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

export const statValueStyle: CSSProperties = {
  fontSize: '30px',
  marginTop: '8px',
};

export const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.06)',
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: '12px',
  color: '#8ea0b5',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

export const tdStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  verticalAlign: 'top',
  fontSize: '14px',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e8e4dc',
  outline: 'none',
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
  padding: '12px 16px',
  borderRadius: '12px',
  border: variant === 'primary' ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.08)',
  background: variant === 'primary' ? '#38bdf8' : 'rgba(255,255,255,0.03)',
  color: variant === 'primary' ? '#03131d' : '#e8e4dc',
  cursor: 'pointer',
  fontWeight: 600,
});

export const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(Number(value || 0));

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
};
