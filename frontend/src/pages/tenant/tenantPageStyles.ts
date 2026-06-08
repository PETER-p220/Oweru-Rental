import type { CSSProperties } from 'react';

// ─── Oweru Design System — Tenant Pages ───────────────────────────────────────
// Mirrors landlord_dashboard.dart kSlate* tokens exactly.
//
//  kPageBg   = slate100  #F1F5F9   — page / outer background
//  kHeaderBg = slate800  #1E293B   — top header panels
//  kCardBg   = white     #FFFFFF   — every card surface
//  kBorder   = slate200  #E2E8F0   — borders & dividers
//  Gold      = #C89128             — CTA buttons & accent text ONLY
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  // ── Slate scale (1:1 with Flutter kSlate*)
  white:      '#FFFFFF',    // kCardBg
  slate50:    '#F8FAFC',
  slate100:   '#F1F5F9',    // kPageBg
  slate200:   '#E2E8F0',    // kBorder
  slate300:   '#CBD5E1',
  slate400:   '#94A3B8',    // text-muted / icons
  slate500:   '#64748B',    // text-secondary
  slate600:   '#475569',
  slate700:   '#334155',
  slate800:   '#1E293B',    // kHeaderBg
  slate900:   '#0F172A',    // primary text

  // ── Gold (CTA & accent ONLY — never backgrounds)
  gold:       '#C89128',
  goldLight:  '#D4A84B',
  goldPale:   '#E8CC8A',
  goldFaint:  'rgba(200,145,40,0.10)',
  goldBorder: 'rgba(200,145,40,0.28)',
  goldGlow:   'rgba(200,145,40,0.12)',

  // ── Semantic — matches Flutter kSuccess / kInfo / kWarning / kDanger
  green:      '#16A34A',  greenBg:  '#DCFCE7',
  blue:       '#2563EB',  blueBg:   '#DBEAFE',
  amber:      '#D97706',  amberBg:  '#FEF3C7',
  red:        '#DC2626',  redBg:    '#FFE4E6',
  violet:     '#7C3AED',

  // ── Legacy aliases (keep for backward compat)
  offWhite:   '#F8FAFC',
  gray100:    '#F1F5F9',
  gray200:    '#E2E8F0',
  gray300:    '#CBD5E1',
  gray400:    '#94A3B8',
  gray500:    '#64748B',
  gray600:    '#475569',
  gray700:    '#334155',
  gray800:    '#1E293B',
  gray900:    '#0F172A',

  // ── Border helpers
  borderSoft:  'rgba(15,23,42,0.08)',
  borderFaint: 'rgba(15,23,42,0.05)',
} as const;

// ─── Page wrapper ─────────────────────────────────────────────────────────────
// kPageBg (kSlate100) — matches Scaffold(backgroundColor: kPageBg)
export const pageStyle: CSSProperties = {
  display:         'grid',
  gap:             '20px',
  color:           palette.slate900,
  backgroundColor: palette.slate100,
  padding:         '20px',
  minHeight:       '100vh',
};

// ─── Panel / Card ─────────────────────────────────────────────────────────────
// kCardBg (white) with kBorder — matches Container(color:kCardBg, border:kBorder)
export const panelStyle: CSSProperties = {
  background:   palette.white,
  border:       `1px solid ${palette.slate200}`,
  borderRadius: '14px',
  padding:      '22px 24px',
  boxShadow:    '0 1px 3px rgba(15,23,42,0.06)',
  position:     'relative',
};

// ─── Slate header panel ───────────────────────────────────────────────────────
// kHeaderBg (slate800) — matches Container(color:kSlate800) section headers
export const headerPanelStyle: CSSProperties = {
  background:   palette.slate800,
  borderRadius: '14px',
  padding:      '24px 28px',
  color:        palette.white,
};

// ─── Typography ───────────────────────────────────────────────────────────────

// Section label (muted uppercase) — matches _sectionLabel() kSlate800 color
export const sectionTitleStyle: CSSProperties = {
  color:         palette.gold,          // gold eyebrow label
  fontSize:      '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.20em',
  fontWeight:    700,
  marginBottom:  '8px',
  display:       'flex',
  alignItems:    'center',
  gap:           '6px',
};

export const headingStyle: CSSProperties = {
  fontSize:      'clamp(20px, 4vw, 28px)',
  lineHeight:    1.15,
  margin:        0,
  color:         palette.slate900,
  fontWeight:    800,
  letterSpacing: '-0.02em',
};

// Heading on dark header panels
export const headingLightStyle: CSSProperties = {
  ...headingStyle,
  color: palette.white,
};

export const descriptionStyle: CSSProperties = {
  color:     palette.slate500,
  fontSize:  '14px',
  lineHeight: 1.65,
  maxWidth:  '70ch',
  marginTop: '6px',
};

export const descriptionLightStyle: CSSProperties = {
  ...descriptionStyle,
  color: palette.slate400,
};

// ─── Stats ────────────────────────────────────────────────────────────────────
// Matches _StatCard2 in Dart: white card, kBorder, colored icon badge

export const statGridStyle: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap:                 '12px',
};

export const statCardStyle = (accent: string): CSSProperties => ({
  padding:      '18px 20px',
  borderRadius: '12px',
  background:   palette.white,
  border:       `1px solid ${palette.slate200}`,
  boxShadow:    '0 1px 3px rgba(15,23,42,0.05)',
  display:      'flex',
  alignItems:   'center',
  gap:          '14px',
});

export const statLabelStyle: CSSProperties = {
  color:         palette.slate400,
  fontSize:      '11px',
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

export const statValueStyle: CSSProperties = {
  fontSize:      'clamp(20px,4vw,26px)',
  marginTop:     '4px',
  fontWeight:    800,
  color:         palette.slate900,
  letterSpacing: '-0.02em',
};

// ─── Table ────────────────────────────────────────────────────────────────────

export const tableWrapStyle: CSSProperties = {
  overflowX:    'auto',
  borderRadius: '10px',
  border:       `1px solid ${palette.slate200}`,
};

export const tableStyle: CSSProperties = {
  width:          '100%',
  borderCollapse: 'collapse',
  minWidth:       '600px',
};

// Table header — kSlate100 bg, kSlate500 text (matches thStyle in landlordPageStyles)
export const thStyle: CSSProperties = {
  textAlign:     'left',
  padding:       '12px 16px',
  fontSize:      '11px',
  color:         palette.slate500,
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.10em',
  borderBottom:  `1px solid ${palette.slate200}`,
  background:    palette.slate100,
  whiteSpace:    'nowrap',
};

export const tdStyle: CSSProperties = {
  padding:       '14px 16px',
  borderBottom:  `1px solid ${palette.slate200}`,
  verticalAlign: 'top',
  fontSize:      '13px',
  color:         palette.slate700,
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const inputStyle: CSSProperties = {
  width:        '100%',
  padding:      '10px 14px',
  background:   palette.white,
  border:       `1.5px solid ${palette.slate200}`,
  borderRadius: '8px',
  color:        palette.slate900,
  outline:      'none',
  fontSize:     '14px',
  fontFamily:   'DM Sans, sans-serif',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '130px',
  resize:    'vertical',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

// ─── Buttons ──────────────────────────────────────────────────────────────────
// primary   → gold bg, white text  (CTA — matches gold button in Dart)
// slate     → slate-800 bg, white  (matches _SmallButton filled=true)
// secondary → white bg, slate border (matches _SmallButton filled=false)
// danger    → red tint

export const buttonStyle = (
  variant: 'primary' | 'slate' | 'secondary' | 'danger' = 'primary'
): CSSProperties => {
  const v = {
    primary:   { bg: palette.gold,     border: palette.gold,     color: '#FFFFFF',         shadow: `0 4px 14px rgba(200,145,40,0.26)` },
    slate:     { bg: palette.slate800, border: palette.slate800, color: '#FFFFFF',         shadow: 'none' },
    secondary: { bg: palette.white,    border: palette.slate200, color: palette.slate700,  shadow: 'none' },
    danger:    { bg: '#FFE4E6',        border: 'rgba(220,38,38,0.28)', color: palette.red, shadow: 'none' },
  }[variant];

  return {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '6px',
    padding:        '10px 18px',
    borderRadius:   '8px',
    border:         `1px solid ${v.border}`,
    background:     v.bg,
    color:          v.color,
    cursor:         'pointer',
    fontWeight:     700,
    fontSize:       '13px',
    whiteSpace:     'nowrap',
    letterSpacing:  '0.02em',
    boxShadow:      v.shadow,
  };
};

// ─── Mobile Cards ─────────────────────────────────────────────────────────────

export const mobileTableContainer: CSSProperties = { display: 'none' };

export const mobileCard: CSSProperties = {
  background:   palette.white,
  border:       `1px solid ${palette.slate200}`,
  borderRadius: '12px',
  padding:      '16px',
  marginBottom: '10px',
  boxShadow:    '0 1px 3px rgba(15,23,42,0.05)',
};

export const mobileCardHeader: CSSProperties = {
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'flex-start',
  marginBottom:   '12px',
  flexWrap:       'wrap',
  gap:            '8px',
};

export const mobileCardTitle: CSSProperties = {
  fontSize:   '15px',
  fontWeight: 700,
  color:      palette.slate900,
  margin:     0,
};

export const mobileCardStatus: CSSProperties = {
  padding:      '3px 9px',
  borderRadius: '999px',
  fontSize:     '11px',
  textTransform:'uppercase',
  fontWeight:   700,
  letterSpacing:'0.04em',
};

export const mobileCardSection: CSSProperties = { marginBottom: '10px' };

export const mobileCardLabel: CSSProperties = {
  fontSize:      '11px',
  color:         palette.slate400,
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom:  '3px',
};

export const mobileCardValue: CSSProperties = {
  fontSize: '13px',
  color:    palette.slate700,
};

export const mobileCardActions: CSSProperties = {
  display:  'flex',
  gap:      '8px',
  flexWrap: 'wrap',
};

export const mobileMediaQuery = '@media (max-width: 768px)';

// ─── Status ───────────────────────────────────────────────────────────────────

export const getStatusColor = (status?: string | null): string => {
  switch ((status || '').toLowerCase()) {
    case 'completed': case 'approved': case 'active': case 'available':
      return palette.green;
    case 'pending': case 'processing':
      return palette.amber;
    case 'failed': case 'rejected': case 'cancelled':
      return palette.red;
    case 'signed':
      return palette.gold;
    case 'rented': case 'occupied':
      return palette.blue;
    case 'refunded':
      return palette.violet;
    default:
      return palette.slate400;
  }
};

export const statusPillStyle = (color: string): CSSProperties => ({
  display:       'inline-flex',
  alignItems:    'center',
  gap:           '5px',
  padding:       '3px 10px',
  borderRadius:  '999px',
  fontSize:      '11px',
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background:    `${color}18`,
  border:        `1px solid ${color}35`,
  color,
});

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat('en-TZ', {
    style:               'currency',
    currency:            'TZS',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? 'N/A'
    : d.toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
};