import type React from 'react';

/** Shared white + slate admin design tokens (matches landlord pages) */
export const C = {
  pageBg:    '#F1F5F9',
  headerBg:  '#1E293B',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  goldBg:    'rgba(200,145,40,0.08)',
  goldBorder:'rgba(200,145,40,0.28)',
  green:     '#16A34A', greenBg: '#DCFCE7',
  blue:      '#2563EB', blueBg:  '#DBEAFE',
  amber:     '#D97706', amberBg: '#FEF3C7',
  red:       '#DC2626', redBg:   '#FFE4E6',
  purple:    '#8b5cf6', purpleBg:'#EDE9FE',
} as const;

export const body: React.CSSProperties = {
  fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
};

export const pageWrap: React.CSSProperties = {
  backgroundColor: C.pageBg,
  minHeight: '100vh',
  padding: '24px',
  ...body,
};

export const pageInner: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
};

export const card: React.CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: '20px 22px',
  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
};

export const inputCss: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  background: C.cardBg,
  border: `1.5px solid ${C.border}`,
  color: C.text,
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};

export const selectCss: React.CSSProperties = {
  ...inputCss,
  cursor: 'pointer',
  minWidth: 140,
};

export const labelCss: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 700,
  fontSize: 13,
  color: C.text,
  fontFamily: 'DM Sans, sans-serif',
};

export const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 18px',
  background: C.gold,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: C.goldGlow,
  fontFamily: 'DM Sans, sans-serif',
};

export const btnGhost: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 16px',
  background: C.cardBg,
  color: C.textSub,
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
};

export const statCard: React.CSSProperties = {
  backgroundColor: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '16px 18px',
  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
};

/** Inject once per page for responsive admin layouts */
export const ADMIN_CSS = `
  @keyframes admin-spin { to { transform: rotate(360deg); } }
  @keyframes admin-shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
  .admin-input:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(200,145,40,0.12); }
  .admin-card-hover:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.10) !important; transform: translateY(-2px); }
  .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .admin-table-wrap table { min-width: 640px; }
  select option { background: #fff; color: ${C.text}; }
  @media (max-width: 900px) {
    .admin-grid-2 { grid-template-columns: 1fr !important; }
    .admin-grid-3 { grid-template-columns: 1fr 1fr !important; }
    .admin-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .admin-bottom-grid { grid-template-columns: 1fr !important; }
    .admin-reports-grid { grid-template-columns: 1fr !important; }
    .admin-header-row { flex-direction: column !important; align-items: stretch !important; }
    .admin-header-actions { width: 100%; justify-content: flex-start !important; }
  }
  @media (max-width: 640px) {
    .admin-page { padding: 16px !important; }
    .admin-grid-3 { grid-template-columns: 1fr !important; }
    .admin-grid-4 { grid-template-columns: 1fr !important; }
    .admin-stats-row { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .admin-hide-mobile { display: none !important; }
    .admin-modal { width: 100% !important; max-height: 95vh !important; border-radius: 12px !important; }
  }
  @media (max-width: 480px) {
    .admin-stats-row { grid-template-columns: 1fr !important; }
  }
`;

export const adminHeaderStyle: React.CSSProperties = {
  background: C.headerBg,
  borderRadius: 14,
  padding: '22px 26px',
  marginBottom: 20,
  color: '#fff',
};

export const labelStyle: React.CSSProperties = {
  ...labelCss,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.textMuted,
  marginBottom: 2,
};

export const innerRow: React.CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 20,
  transition: 'all 0.2s',
};

export const pill = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 9px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  fontFamily: 'DM Sans, sans-serif',
});

export const ghostBtn = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 14px',
  backgroundColor: `${color}10`,
  border: `1px solid ${color}25`,
  color,
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.18s',
  fontFamily: 'DM Sans, sans-serif',
});

export const accentBtn = (color: string): React.CSSProperties => ({
  ...ghostBtn(color),
  padding: '10px 16px',
  fontSize: 13,
});
