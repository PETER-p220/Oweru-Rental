import { useState, useEffect } from 'react';
import {
  HomeWork, People, CheckCircle, AttachMoney,
  Percent, AccountBalanceWallet, TrendingUp, PersonAdd,
  BarChart, RefreshCw,
} from 'lucide-react';
import Api from '../../services/api';

// ── Design tokens — 1:1 with landlord_analytics.dart kSlate* system
const C = {
  pageBg:    '#F1F5F9',   // kPageBg / kSlate100
  headerBg:  '#1E293B',   // kHeaderBg / kSlate800
  cardBg:    '#FFFFFF',   // kCardBg
  border:    '#E2E8F0',   // kBorder / kSlate200
  text:      '#0F172A',   // kSlate900
  textSub:   '#475569',   // kSlate600
  textMuted: '#94A3B8',   // kSlate400
  textLight: '#CBD5E1',   // kSlate300
  slate100:  '#F1F5F9',
  slate500:  '#64748B',
  slate800:  '#1E293B',
  // Gold — CTA buttons only
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  // Semantic (matches Flutter kSuccess / kInfo / kWarning / kDanger)
  green:     '#16A34A', greenBg:  '#DCFCE7',
  blue:      '#2563EB', blueBg:   '#DBEAFE',
  amber:     '#D97706', amberBg:  '#FEF3C7',
  red:       '#DC2626', redBg:    '#FFE4E6',
};

const fmt = (v: any): string => {
  if (v == null) return 'TZS 0';
  const n = typeof v === 'number' ? v : parseFloat(v) || 0;
  if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(1)}K`;
  return `TZS ${n.toFixed(0)}`;
};

interface MetricDef {
  label: string;
  getValue: (p: any, f: any, t: any) => string;
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  accent: string;
  bg: string;
}

// Matches _metricLabels / _metricAccents / _metricBgs in the Dart file
const METRICS: MetricDef[] = [
  { label: 'Total Properties', getValue: (p) => `${p.total_properties ?? 0}`,                               icon: (pr) => <HomeIcon {...pr} />,    accent: C.slate800, bg: C.slate100 },
  { label: 'Occupied',         getValue: (p) => `${p.occupied_properties ?? 0}`,                            icon: (pr) => <PeopleIcon {...pr} />,  accent: C.green,    bg: C.greenBg  },
  { label: 'Available',        getValue: (p) => `${p.available_properties ?? 0}`,                           icon: (pr) => <CheckIcon {...pr} />,   accent: C.blue,     bg: C.blueBg   },
  { label: 'Average Rent',     getValue: (p) => fmt(p.avg_rent),                                            icon: (pr) => <MoneyIcon {...pr} />,   accent: C.amber,    bg: C.amberBg  },
  { label: 'Occupancy Rate',   getValue: (p) => `${parseFloat(p.occupancy_rate ?? 0).toFixed(1)}%`,         icon: (pr) => <PctIcon {...pr} />,     accent: C.slate800, bg: C.slate100 },
  { label: 'Total Revenue',    getValue: (_p, f) => fmt(f.total_revenue),                                   icon: (pr) => <WalletIcon {...pr} />,  accent: C.green,    bg: C.greenBg  },
  { label: 'Monthly Revenue',  getValue: (_p, f) => fmt(f.monthly_revenue),                                 icon: (pr) => <TrendIcon {...pr} />,   accent: C.blue,     bg: C.blueBg   },
  { label: 'Total Tenants',    getValue: (_p, _f, t) => `${t.total_tenants ?? 0}`,                         icon: (pr) => <PeopleIcon {...pr} />,  accent: C.slate800, bg: C.slate100 },
  { label: 'New Tenants',      getValue: (_p, _f, t) => `${t.new_tenants_this_month ?? 0}`,                icon: (pr) => <PersonAddIcon {...pr} />,accent: C.green,    bg: C.greenBg  },
];

// Minimal icon wrappers (lucide doesn't have 1:1 names for all Flutter icons)
const HomeIcon       = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const PeopleIcon     = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const CheckIcon      = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const MoneyIcon      = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const PctIcon        = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const WalletIcon     = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;
const TrendIcon      = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const PersonAddIcon  = ({ size, style }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;

const LandlordAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true); setError('');
      const res = await Api.getOwnerAnalytics();
      setAnalytics(res.data || {});
    } catch { setError('Unable to load analytics.'); }
    finally { setLoading(false); }
  };

  const pp = analytics.property_performance ?? {};
  const fm = analytics.financial_metrics    ?? {};
  const tm = analytics.tenant_metrics       ?? {};

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Slate-800 header (matches _slateHeader in Dart) */}
      <div style={{ background: C.headerBg, padding: '24px 24px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
                Landlord Workspace
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Analytics
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                Performance metrics for your portfolio
              </p>
            </div>
            <button onClick={loadAnalytics} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

        {/* Error */}
        {error && (
          <div style={{ background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: 10, padding: '13px 16px', marginBottom: 20, color: C.red, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.slate800}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          /* ── Metric grid (matches 2-col SliverGrid in Dart) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 110,
                }}>
                  {/* Icon badge (matches _MetricCard in Dart) */}
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={16} style={{ color: m.accent }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.slate800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4 }}>
                      {m.getValue(pp, fm, tm)}
                    </div>
                    <div style={{ fontSize: 11, color: C.slate500, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {m.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandlordAnalytics;