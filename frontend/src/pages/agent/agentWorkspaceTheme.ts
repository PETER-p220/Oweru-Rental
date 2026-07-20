/** Shared light workspace layout (matches DashboardLayout + agent pages). */
export const agentWorkspace = {
  pageBg: '#F1F5F9',
  headerBg: '#1E293B',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#94A3B8',
  textSub: '#64748B',
  gold: '#C89128',
  link: '#2563eb',
  maxContent: '1280px',
} as const;

export const agentHeaderInnerStyle = {
  maxWidth: agentWorkspace.maxContent,
  margin: '0 auto',
  padding: '52px 40px 44px',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: '20px',
  flexWrap: 'wrap' as const,
};

export const agentEyebrowStyle = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: agentWorkspace.gold,
  marginBottom: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  background: 'rgba(200,145,40,0.10)',
  border: '1px solid rgba(200,145,40,0.28)',
  padding: '4px 12px',
};

export const agentTitleStyle = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: 'clamp(20px,3.5vw,28px)',
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: '-0.02em',
  color: '#FFFFFF',
  margin: 0,
};

export const agentSubtitleStyle = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: '13px',
  fontWeight: 400,
  color: agentWorkspace.textMuted,
  margin: '8px 0 0',
};

export const statCardStyle = (accent: string) => ({
  background: agentWorkspace.cardBg,
  border: `1px solid ${agentWorkspace.border}`,
  borderRadius: '12px',
  padding: '20px',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  accentBar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: accent,
  },
});

export const lightThStyle = {
  padding: '12px',
  textAlign: 'left' as const,
  color: agentWorkspace.textSub,
  fontWeight: 600,
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};

export const lightTdStyle = {
  padding: '12px',
  borderBottom: `1px solid ${agentWorkspace.border}`,
  verticalAlign: 'top' as const,
  color: agentWorkspace.text,
};
