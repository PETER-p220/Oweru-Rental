import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, palette } from './landlordPageStyles';

// ── Token shorthand — 1:1 with Flutter kSlate* / kCardBg / kHeaderBg
const C = {
  pageBg:   palette.pageBg,    // #F1F5F9 kSlate100
  headerBg: palette.slate800,  // #1E293B kHeaderBg
  cardBg:   palette.white,     // #FFFFFF kCardBg
  border:   palette.slate200,  // #E2E8F0 kBorder
  text:     palette.slate900,
  textSub:  palette.slate600,
  textMuted:palette.slate400,
  textLight:palette.slate300,  // on dark bg
  slate100: palette.slate100,
  slate200: palette.slate200,
  slate500: palette.slate500,
  slate800: palette.slate800,
  green:    palette.green,     greenBg: palette.greenBg,
  blue:     palette.blue,      blueBg:  palette.blueBg,
  amber:    palette.amber,     amberBg: palette.amberBg,
  red:      palette.red,       redBg:   palette.redBg,
};

interface AnalyticsPayload {
  property_performance?: {
    total_properties?: number;
    occupied_properties?: number;
    available_properties?: number;
    avg_rent?: number;
    occupancy_rate?: number;
  };
  financial_metrics?: {
    total_revenue?: number;
    monthly_revenue?: number;
    total_commissions?: number;
  };
  tenant_metrics?: {
    total_tenants?: number;
    new_tenants_this_month?: number;
  };
}

// Matches _metricLabels / _metricAccents / _metricBgs in landlord_analytics.dart exactly
interface MetricDef {
  label: string;
  getValue: (a: AnalyticsPayload) => string;
  accent: string;
  bg: string;
}

const METRICS: MetricDef[] = [
  { label: 'Total Properties',       getValue: a => `${a.property_performance?.total_properties    ?? 0}`,                                      accent: C.slate800, bg: C.slate100 },
  { label: 'Occupied',               getValue: a => `${a.property_performance?.occupied_properties  ?? 0}`,                                      accent: C.green,    bg: C.greenBg  },
  { label: 'Available',              getValue: a => `${a.property_performance?.available_properties ?? 0}`,                                      accent: C.blue,     bg: C.blueBg   },
  { label: 'Average Rent',           getValue: a => formatCurrency(a.property_performance?.avg_rent),                                            accent: C.amber,    bg: C.amberBg  },
  { label: 'Occupancy Rate',         getValue: a => `${Number(a.property_performance?.occupancy_rate ?? 0).toFixed(1)}%`,                        accent: C.slate800, bg: C.slate100 },
  { label: 'Total Revenue',          getValue: a => formatCurrency(a.financial_metrics?.total_revenue),                                          accent: C.green,    bg: C.greenBg  },
  { label: 'Monthly Revenue',        getValue: a => formatCurrency(a.financial_metrics?.monthly_revenue),                                        accent: C.blue,     bg: C.blueBg   },
  { label: 'Total Tenants',          getValue: a => `${a.tenant_metrics?.total_tenants           ?? 0}`,                                         accent: C.slate800, bg: C.slate100 },
  { label: 'New Tenants This Month', getValue: a => `${a.tenant_metrics?.new_tenants_this_month  ?? 0}`,                                         accent: C.green,    bg: C.greenBg  },
];

// Minimal SVG icons matching Flutter _metricIcons order
const ICONS: React.FC<{ color: string }>[] = [
  // home_work_outlined
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  // people_outline
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  // check_circle_outline
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  // attach_money
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  // percent
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  // account_balance_wallet
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  // trending_up
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  // people_outline (reused)
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  // person_add
  ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
];

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsPayload>({});
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      setError('');
      const res = await Api.getOwnerAnalytics();
      setAnalytics(res.data || {});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load analytics.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ══ Slate-800 header — matches _slateHeader() in landlord_analytics.dart ══ */}
      <div style={{ background: C.headerBg, padding: '24px 24px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
              Landlord Workspace
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Analytics
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
              Performance metrics for your portfolio
            </p>
          </div>
          <button onClick={() => loadData(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ Page body ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: 10, padding: '13px 16px', marginBottom: 20, color: C.red, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
            {/* kSlate800 spinner — matches CircularProgressIndicator(color: kSlate800) */}
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.slate800}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          /*
           * ══ Metric grid — matches SliverGrid with childAspectRatio: 1.2 in Dart ══
           * Each card: kCardBg (white), kBorder border, colored icon badge
           * Matches _MetricCard widget exactly
           */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
            {METRICS.map((m, idx) => {
              const Icon = ICONS[idx];
              return (
                <div key={m.label} style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 108,
                }}>
                  {/* Icon badge — matches Container(width:28,height:28,color:item.bg) */}
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexShrink: 0 }}>
                    <Icon color={m.accent} />
                  </div>
                  <div>
                    {/* Value — matches TextStyle(color:kSlate800, fontSize:20, fontWeight:w800) */}
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.slate800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.getValue(analytics)}
                    </div>
                    {/* Label — matches TextStyle(color:kSlate500, fontSize:10) */}
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

export default AnalyticsPage;