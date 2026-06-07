import { useEffect, useState } from 'react';
import { MapPin, Wallet, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import Api from '../../services/api';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
  palette,
} from './landlordPageStyles';

// ── Token shorthand — 1:1 with Flutter kSlate* / kCardBg / kHeaderBg
const C = {
  pageBg:   palette.pageBg,    // #F1F5F9 kSlate100
  headerBg: palette.slate800,  // #1E293B kHeaderBg
  cardBg:   palette.white,     // #FFFFFF kCardBg
  border:   palette.slate200,  // #E2E8F0 kBorder
  text:     palette.slate900,  // #0F172A
  textSub:  palette.slate600,  // #475569
  textMuted:palette.slate400,  // #94A3B8
  textLight:palette.slate300,  // #CBD5E1 (text on dark bg)
  slate100: palette.slate100,
  slate200: palette.slate200,
  slate500: palette.slate500,
  slate800: palette.slate800,
  green:    palette.green,     greenBg: palette.greenBg,
  blue:     palette.blue,      blueBg:  palette.blueBg,
  amber:    palette.amber,     amberBg: palette.amberBg,
  red:      palette.red,       redBg:   palette.redBg,
};

interface PaymentItem {
  id: number;
  amount?: number | string;
  status?: string;
  created_at?: string;
  due_date?: string;
  property?: { title?: string; location?: string };
  tenant?: { user?: { first_name?: string; last_name?: string; email?: string } };
}
interface RentStats {
  total_collected?: number;
  this_month?: number;
  pending_payments?: number;
  collection_rate?: number;
}

const RentCollectionPage = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats]       = useState<RentStats>({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      setError('');
      const [paymentsRes, statsRes] = await Promise.all([
        Api.getRentCollection(),
        Api.getRentCollectionStats(),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setStats(statsRes.data || {});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load rent collection data.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  // ── Stat cards (matches _statsRow / _StatCard2 in Dart)
  const statCards = [
    { label: 'Total Collected', value: formatCurrency(stats.total_collected), color: C.green, bg: C.greenBg },
    { label: 'This Month',      value: formatCurrency(stats.this_month),       color: C.blue,  bg: C.blueBg  },
    { label: 'Pending',         value: `${stats.pending_payments ?? 0}`,       color: C.amber, bg: C.amberBg },
    { label: 'Collection Rate', value: `${Number(stats.collection_rate ?? 0).toFixed(1)}%`, color: C.slate800, bg: C.slate100 },
  ];

  const rowHover = (el: HTMLTableRowElement, on: boolean) => {
    el.style.background = on ? C.pageBg : 'transparent';
  };

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background:#fff; color:#0F172A; }`}</style>

      {/* ══ Slate-800 header — matches _slateHeader() in Dart ══ */}
      <div style={{ background: C.headerBg, padding: '24px 24px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
                Landlord Workspace
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Rent Collection
              </h1>
              <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                Track live payment records and collection stats
              </p>
            </div>
            <button onClick={() => loadData(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* Stat cards row — horizontally scrollable, white cards inside dark header */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ minWidth: 130, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', flexShrink: 0, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                {/* Icon badge — matches _StatCard2's Container(color: item.bg) */}
                <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Wallet size={13} style={{ color: s.color }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.slate500, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Page body — slate-100 bg ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: 10, padding: '13px 16px', marginBottom: 18, color: C.red, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.slate800}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>

        ) : payments.length === 0 ? (
          /* Empty state — matches _emptyState() in Dart */
          <div style={{ textAlign: 'center', padding: '64px 24px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.slate200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Wallet size={26} style={{ color: C.textMuted }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No payments found</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Rent payments will appear here.</div>
          </div>

        ) : (
          /* ══ White card wrapping the table — matches kCardBg ══ */
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...tableStyle, minWidth: 720 }}>
                <thead>
                  <tr>
                    {['Tenant', 'Property', 'Amount', 'Due', 'Recorded', 'Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => {
                    const sc = getStatusColor(payment.status);
                    return (
                      <tr
                        key={payment.id}
                        onMouseEnter={e => rowHover(e.currentTarget, true)}
                        onMouseLeave={e => rowHover(e.currentTarget, false)}
                        style={{ transition: 'background 0.12s' }}
                      >
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>
                            {payment.tenant?.user?.first_name} {payment.tenant?.user?.last_name}
                          </div>
                          <div style={{ color: C.textMuted, marginTop: 3, fontSize: 12 }}>
                            {payment.tenant?.user?.email || 'No email'}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>
                            {payment.property?.title || 'Untitled property'}
                          </div>
                          {payment.property?.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <MapPin size={10} style={{ color: C.textMuted, flexShrink: 0 }} />
                              <span style={{ color: C.textMuted, fontSize: 11 }}>{payment.property.location}</span>
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: C.textSub, fontSize: 13 }}>
                          {formatDate(payment.due_date)}
                        </td>
                        <td style={{ ...tdStyle, color: C.textSub, fontSize: 13 }}>
                          {formatDate(payment.created_at)}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px', borderRadius: 999,
                            background: `${sc}18`, border: `1px solid ${sc}35`,
                            color: sc, fontSize: 11, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            {payment.status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentCollectionPage;