import type { CSSProperties } from 'react';

// Color palette for consistent theming
export const palette = {
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.35)',
  cream: '#e8e4dc',
  muted: '#9aa4b2',
  mutedDark: '#8ea0b5',
  slate900: '#03131d',
  slate800: '#1e293b',
  slate700: '#334155',
  borderSoft: 'rgba(255,255,255,0.08)',
  borderFaint: 'rgba(255,255,255,0.06)',
};

export const pageStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
  color: '#e8e4dc',
  backgroundColor: '#1e293b', // slate-800
  padding: '16px',
  minHeight: '100vh',
};

export const panelStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', // slate-700 to slate-800
  border: `1px solid ${palette.borderSoft}`,
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
};

export const sectionTitleStyle: CSSProperties = {
  color: palette.amber,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  marginBottom: '10px',
};

export const headingStyle: CSSProperties = {
  fontSize: 'clamp(24px, 5vw, 34px)', // Responsive font size
  lineHeight: 1.1,
  margin: 0,
};

export const descriptionStyle: CSSProperties = {
  color: '#9aa4b2',
  fontSize: 'clamp(14px, 3vw, 15px)', // Responsive font size
  lineHeight: 1.7,
  maxWidth: '70ch',
};

export const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', // Smaller minimum for mobile
  gap: '14px',
};

export const statCardStyle = (accent: string): CSSProperties => ({
  padding: '18px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.02)',
  border: `1px solid ${accent}22`,
});

export const statLabelStyle: CSSProperties = {
  color: palette.mutedDark,
  fontSize: '11px', // Smaller for mobile
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

export const statValueStyle: CSSProperties = {
  fontSize: 'clamp(24px, 4vw, 30px)', // Responsive font size
  marginTop: '8px',
};

export const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: '16px',
  border: `1px solid ${palette.borderFaint}`,
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

export const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: '11px', // Smaller for mobile
  color: palette.mutedDark,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  borderBottom: `1px solid ${palette.borderFaint}`,
};

export const tdStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid rgba(148,163,184,0.05)`,
  verticalAlign: 'top',
  fontSize: '13px', // Smaller for mobile
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${palette.borderSoft}`,
  borderRadius: '12px',
  color: palette.cream,
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
      border: `1px solid ${palette.amberDim}`,
      background: palette.amber,
      color: palette.slate900,
    },
    ghost: {
      border: `1px solid ${palette.borderSoft}`,
      background: 'rgba(255,255,255,0.03)',
      color: palette.cream,
    },
    secondary: {
      border: `1px solid ${palette.borderSoft}`,
      background: 'rgba(255,255,255,0.08)',
      color: palette.cream,
    },
    danger: {
      border: `1px solid rgba(239,68,68,0.35)`,
      background: '#ef4444',
      color: palette.cream,
    },
  };

  const style = variants[variant] || variants.primary;

  return {
    padding: '10px 14px', // Smaller padding for mobile
    borderRadius: '12px',
    border: style.border,
    background: style.background,
    color: style.color,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px', // Smaller for mobile
    whiteSpace: 'nowrap',
  };
};

// Mobile-specific styles
export const mobileTableContainer: CSSProperties = {
  display: 'none', // Hidden by default
};

export const mobileCard: CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: `1px solid ${palette.borderFaint}`,
  borderRadius: '16px',
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
  fontSize: '16px',
  fontWeight: '600',
  color: palette.cream,
  margin: 0,
};

export const mobileCardStatus: CSSProperties = {
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '11px',
  textTransform: 'uppercase',
  fontWeight: '600',
};

export const mobileCardSection: CSSProperties = {
  marginBottom: '12px',
};

export const mobileCardLabel: CSSProperties = {
  fontSize: '11px',
  color: palette.mutedDark,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '4px',
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

// Media query helper
export const mobileMediaQuery = '@media (max-width: 768px)';

// Status color helper for payments and applications
export const getStatusColor = (status?: string | null | undefined): string => {
  if (!status) return palette.muted;
  
  switch (status.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'active':
      return palette.amber;
    case 'pending':
    case 'processing':
      return palette.amber;
    case 'failed':
    case 'rejected':
    case 'cancelled':
      return '#ef4444'; // red
    case 'refunded':
      return '#8b5cf6'; // purple
    default:
      return palette.muted;
  }
};

// Status pill style helper
export const statusPillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  background: `${color}15`,
  border: `1px solid ${color}40`,
  color: color,
});

export const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(Number(value || 0));

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
};
