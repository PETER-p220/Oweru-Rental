import type { CSSProperties } from 'react';

// ─── Oweru Design System — matches landlord_dashboard.dart exactly ─────────────
//
//  Page bg    : #F1F5F9  (kSlate100)
//  Header/nav : #1E293B  (kSlate800)
//  Cards      : #FFFFFF  (kWhite)
//  Border     : #E2E8F0  (kSlate200)
//  Text-1     : #0F172A  (kSlate900)
//  Text-2     : #475569  (kSlate600)
//  Text-muted : #94A3B8  (kSlate400)
//  Gold CTA   : #C89128  (buttons & accent links only)
//
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  // ── Slate scale (1:1 with Flutter kSlate*)
  slate50:   '#F8FAFC',
  slate100:  '#F1F5F9',   // kPageBg  — page / outer background
  slate200:  '#E2E8F0',   // kBorder  — card borders, dividers
  slate300:  '#CBD5E1',
  slate400:  '#94A3B8',   // text-muted, icons
  slate500:  '#64748B',
  slate600:  '#475569',   // text-secondary
  slate700:  '#334155',   // drawer active item bg
  slate800:  '#1E293B',   // kHeaderBg — top bars, panel headers
  slate900:  '#0F172A',   // kSlate900 — primary text

  // ── Surfaces
  white:     '#FFFFFF',   // kCardBg  — every card / panel
  pageBg:    '#F1F5F9',   // kPageBg

  // ── Gold (CTA buttons & accent text ONLY — not backgrounds)
  gold:      '#C89128',
  goldLight: '#D4A84B',
  goldPale:  'rgba(200,145,40,0.10)',
  goldBorder:'rgba(200,145,40,0.28)',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.28)',

  // ── Semantic  (matches Flutter kSuccess / kInfo / kWarning / kDanger)
  green:     '#16A34A',   // kSuccess
  greenBg:   '#DCFCE7',   // kSuccessBg
  blue:      '#2563EB',   // kInfo
  blueBg:    '#DBEAFE',   // kInfoBg
  amber:     '#D97706',   // kWarning
  amberBg:   '#FEF3C7',   // kWarningBg
  red:       '#DC2626',   // kDanger
  redBg:     '#FFE4E6',   // kDangerBg

  // ── Legacy aliases (keep so existing imports don't break)
  navy900:   '#0F172A',
  navy800:   '#1E293B',
  offWhite:  '#F8FAFC',
  cream:     '#F8FAFC',
  muted:     '#94A3B8',
  border:    '#E2E8F0',
  borderSoft:'rgba(226,232,240,0.6)',
} as const;

// ─── Page wrapper ─────────────────────────────────────────────────────────────
// Matches: backgroundColor: kPageBg (kSlate100)
export const pageStyle: CSSProperties = {
  display:         'grid',
  gap:             '20px',
  backgroundColor: palette.pageBg,   // #F1F5F9
  color:           palette.slate900,
  minHeight:       '100vh',
  padding:         '24px',
};

// ─── Panel / Card ─────────────────────────────────────────────────────────────
// Matches: Container(color: kWhite, border: Border.all(color: kBorder))
export const panelStyle: CSSProperties = {
  background:   palette.white,
  border:       `1px solid ${palette.slate200}`,
  borderRadius: '14px',
  padding:      '24px',
  color:        palette.slate900,
  boxShadow:    '0 1px 3px rgba(15,23,42,0.06)',
};

// ─── Slate header panel ───────────────────────────────────────────────────────
// Matches: Container(color: kSlate800) used for page/section headers
export const headerPanelStyle: CSSProperties = {
  background:   palette.slate800,
  borderRadius: '14px',
  padding:      '24px 28px',
  color:        palette.white,
};

// ─── Typography ───────────────────────────────────────────────────────────────

// Section label → matches _sectionLabel() — slate-800, 14px, w700
export const sectionTitleStyle: CSSProperties = {
  fontSize:        '11px',
  letterSpacing:   '0.16em',
  textTransform:   'uppercase',
  color:           palette.slate500,   // muted uppercase label, NOT gold
  fontWeight:      700,
  marginBottom:    '10px',
};

// Gold eyebrow (use sparingly — only where Flutter uses gold accent labels)
export const eyebrowStyle: CSSProperties = {
  fontSize:      '11px',
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color:         palette.gold,
  fontWeight:    700,
  marginBottom:  '6px',
};

export const headingStyle: CSSProperties = {
  fontSize:      'clamp(20px, 3.5vw, 28px)',
  lineHeight:    1.15,
  margin:        0,
  fontWeight:    800,
  color:         palette.slate900,
  letterSpacing: '-0.02em',
};

// Heading used inside dark slate headers
export const headingLightStyle: CSSProperties = {
  ...headingStyle,
  color: palette.white,
};

export const descriptionStyle: CSSProperties = {
  color:      palette.slate600,
  fontSize:   '14px',
  lineHeight: 1.65,
  margin:     0,
};

export const descriptionLightStyle: CSSProperties = {
  ...descriptionStyle,
  color: palette.slate400,
};

// ─── Metric / stat cards ──────────────────────────────────────────────────────
// Matches: _StatCard2 — white card, slate border, colored icon badge

export const metricGridStyle: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap:                 '12px',
};

export const metricCardStyle: CSSProperties = {
  padding:      '16px 18px',
  borderRadius: '12px',
  background:   palette.white,
  border:       `1px solid ${palette.slate200}`,
  boxShadow:    '0 1px 2px rgba(15,23,42,0.04)',
};

// ─── Table ────────────────────────────────────────────────────────────────────

export const tableWrapStyle: CSSProperties = {
  overflowX:    'auto',
  borderRadius: '10px',
  border:       `1px solid ${palette.slate200}`,
};

export const tableStyle: CSSProperties = {
  width:           '100%',
  borderCollapse:  'collapse',
  minWidth:        '720px',
};

export const thStyle: CSSProperties = {
  textAlign:     'left',
  padding:       '12px 16px',
  fontSize:      '11px',
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  fontWeight:    700,
  color:         palette.slate500,          // slate-500 header label
  borderBottom:  `1px solid ${palette.slate200}`,
  background:    palette.slate100,          // kSlate100 table header bg
};

export const tdStyle: CSSProperties = {
  padding:       '14px 16px',
  borderBottom:  `1px solid ${palette.slate200}`,
  verticalAlign: 'top',
  color:         palette.slate900,
  fontSize:      '13px',
};

// ─── Buttons ──────────────────────────────────────────────────────────────────
// primary   → gold bg, white text   (gold CTA — "Collect Rent", "Add Property")
// secondary → white bg, slate border (outline — matches _SmallButton filled=false)
// slate     → slate-800 bg, white text (matches _SmallButton filled=true)
// danger    → red tint

export const buttonStyle = (
  tone: 'primary' | 'secondary' | 'slate' | 'danger' = 'secondary'
): CSSProperties => {
  const map = {
    primary: {
      color:  '#FFFFFF',
      bg:     palette.gold,
      border: palette.gold,
      shadow: `0 2px 10px rgba(200,145,40,0.28)`,
    },
    secondary: {
      color:  palette.slate700,
      bg:     palette.white,
      border: palette.slate200,
      shadow: 'none',
    },
    slate: {
      color:  palette.white,
      bg:     palette.slate800,
      border: palette.slate800,
      shadow: 'none',
    },
    danger: {
      color:  palette.red,
      bg:     palette.redBg,
      border: 'rgba(220,38,38,0.28)',
      shadow: 'none',
    },
  } as const;

  return {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    padding:        '10px 18px',
    borderRadius:   '8px',
    background:     map[tone].bg,
    border:         `1px solid ${map[tone].border}`,
    color:          map[tone].color,
    fontSize:       '13px',
    fontWeight:     700,
    cursor:         'pointer',
    boxShadow:      map[tone].shadow,
    whiteSpace:     'nowrap',
    letterSpacing:  '0.02em',
  };
};

// ─── Forms ────────────────────────────────────────────────────────────────────

export const inputStyle: CSSProperties = {
  width:        '100%',
  padding:      '10px 14px',
  borderRadius: '8px',
  background:   palette.white,
  border:       `1.5px solid ${palette.slate200}`,
  color:        palette.slate900,
  fontSize:     '13px',
  outline:      'none',
  fontFamily:   'DM Sans, sans-serif',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor:     'pointer',
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '120px',
  resize:    'vertical',
};

// ─── Status pill ──────────────────────────────────────────────────────────────
// Matches: Container with color bg + rounded border (kSuccessBg, kDangerBg …)

export const statusPillStyle = (color: string): CSSProperties => ({
  display:       'inline-flex',
  alignItems:    'center',
  padding:       '3px 10px',
  borderRadius:  '999px',
  background:    `${color}18`,
  border:        `1px solid ${color}35`,
  color,
  fontSize:      '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontWeight:    700,
});

// ─── Status color helper ──────────────────────────────────────────────────────

export const getStatusColor = (status?: string | null): string => {
  switch ((status || '').toLowerCase()) {
    case 'approved': case 'active': case 'available': case 'completed': case 'paid':
      return palette.green;
    case 'pending': case 'processing':
      return palette.amber;
    case 'rejected': case 'failed': case 'cancelled':
      return palette.red;
    case 'rented': case 'occupied':
      return palette.blue;
    default:
      return palette.slate400;
  }
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (amount?: number | string | null): string => {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-TZ', {
    style:               'currency',
    currency:            'TZS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
};

export const formatDate = (value?: string | null): string => {
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Mobile cards ─────────────────────────────────────────────────────────────

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
  gap:            '8px',
};

export const mobileCardTitle: CSSProperties = {
  fontSize:   '15px',
  fontWeight: 600,
  color:      palette.slate900,
  margin:     0,
};

export const mobileCardStatus: CSSProperties = {
  padding:      '3px 9px',
  borderRadius: '999px',
  fontSize:     '11px',
  fontWeight:   700,
  letterSpacing:'0.04em',
};

export const mobileCardSection: CSSProperties = { marginBottom: '10px' };

export const mobileCardLabel: CSSProperties = {
  fontSize:      '11px',
  color:         palette.slate400,
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom:  '3px',
};

export const mobileCardValue: CSSProperties = {
  fontSize: '13px',
  color:    palette.slate900,
};

export const mobileCardActions: CSSProperties = {
  display:  'flex',
  gap:      '8px',
  flexWrap: 'wrap',
};

export const mobileMediaQuery = '@media (max-width: 768px)';