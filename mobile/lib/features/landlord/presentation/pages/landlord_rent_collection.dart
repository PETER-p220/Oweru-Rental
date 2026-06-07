import { useState, useEffect } from 'react';
import { MapPin, Person, RefreshCw, AlertCircle, Wallet } from 'lucide-react';
import Api from '../../services/api';

// ── Design tokens — 1:1 with landlord_rent_collection.dart kSlate*
const C = {
  pageBg:    '#F1F5F9',   // kPageBg
  headerBg:  '#1E293B',   // kHeaderBg
  cardBg:    '#FFFFFF',   // kCardBg
  border:    '#E2E8F0',   // kBorder
  text:      '#0F172A',   // kSlate900
  textSub:   '#475569',   // kSlate600
  textMuted: '#94A3B8',   // kSlate400
  textLight: '#CBD5E1',   // kSlate300
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate500:  '#64748B',
  slate800:  '#1E293B',
  // Semantic
  green:     '#16A34A', greenBg:  '#DCFCE7',
  blue:      '#2563EB', blueBg:   '#DBEAFE',
  amber:     '#D97706', amberBg:  '#FEF3C7',
  red:       '#DC2626', redBg:    '#FFE4E6',
  // Gold — CTA only
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
};

const fmtCurrency = (v: any): string => {
  if (v == null) return 'TZS 0';
  const n = typeof v === 'number' ? v : parseFloat(v) || 0;
  if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(1)}K`;
  return `TZS ${n.toFixed(0)}`;
};

const fmtDate = (s: string): string => {
  try { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
  catch { return '—'; }
};

const statusMeta = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'paid':
    case 'completed': return { color: C.green,  bg: C.greenBg };
    case 'pending':   return { color: C.amber,  bg: C.amberBg };
    case 'overdue':
    case 'failed':    return { color: C.red,    bg: C.redBg   };
    default:          return { color: C.slate500, bg: C.slate100 };
  }
};

interface Payment {
  id: number;
  amount: any;
  status: string;
  due_date?: string;
  created_at?: string;
  tenant?: { user?: { first_name?: string; last_name?: string; email?: string; }; };
  property?: { title?: string; location?: string; };
}

interface Stats {
  total_collected?: any;
  this_month?: any;
  pending_payments?: number;
  collection_rate?: number;
}

const LandlordRentCollection = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats]       = useState<Stats>({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [paymentsRes, statsRes] = await Promise.all([
        Api.getRentCollection(),
        Api.getRentCollectionStats(),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setStats(statsRes.data || {});
    } catch { setError('Unable to load rent collection data.'); }
    finally { setLoading(false); }
  };

  // Horizontal stat cards — matches _StatCard2 / _statsRow in Dart
  const statItems = [
    { label: 'Total Collected', value: fmtCurrency(stats.total_collected), color: C.green, bg: C.greenBg },
    { label: 'This Month',      value: fmtCurrency(stats.this_month),       color: C.blue,  bg: C.blueBg  },
    { label: 'Pending',         value: `${stats.pending_payments ?? 0}`,    color: C.amber, bg: C.amberBg },
    { label: 'Collection Rate', value: `${parseFloat((stats.collection_rate ?? 0).toString()).toFixed(1)}%`, color: C.slate800, bg: C.slate100 },
  ];

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Slate-800 header (matches _slateHeader in Dart) */}
      <div style={{ background: C.headerBg, padding: '24px 24px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
                Landlord Workspace
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Rent Collection
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                {payments.length} payment{payments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={loadData} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* Horizontal stat cards in header (matches _statsRow pulling cards from header) */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {statItems.map(s => (
              <div key={s.label} style={{ minWidth: 120, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Wallet size={13} style={{ color: s.color }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.slate500, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>

        {/* Error */}
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
          /* Empty state — matches _emptyState in Dart */
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.slate200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Wallet size={26} style={{ color: C.textMuted }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No payments found</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Rent payments will appear here.</div>
          </div>
        ) : (
          /* Payment cards list — matches _PaymentCard in Dart */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payments.map(payment => {
              const user     = payment.tenant?.user ?? {};
              const property = payment.property ?? {};
              const sm       = statusMeta(payment.status);
              const name     = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown tenant';
              const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

              return (
                <div key={payment.id} style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>

                  {/* Tenant row — matches Row with avatar + status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.slate200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.slate500 }}>{initials || '?'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{user.email || 'No email'}</div>
                    </div>
                    {/* Status badge — matches _buildStatusBadge */}
                    <div style={{
                      padding: '3px 8px', borderRadius: 4,
                      background: sm.bg + '30',
                      border: `1px solid ${sm.color}30`,
                      color: sm.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0,
                    }}>
                      {(payment.status || 'unknown').toUpperCase()}
                    </div>
                  </div>

                  {/* Property info — matches Container(color: kSlate100) */}
                  {(property.title || property.location) && (
                    <div style={{ background: C.slate100, borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                      {property.title && (
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: property.location ? 4 : 0 }}>
                          {property.title}
                        </div>
                      )}
                      {property.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={10} style={{ color: C.textMuted, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: C.slate500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details row — matches 3-column Expanded layout in Dart */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Amount',   value: fmtCurrency(payment.amount) },
                      { label: 'Due',      value: fmtDate(payment.due_date || '') },
                      { label: 'Recorded', value: fmtDate(payment.created_at || '') },
                    ].map(col => (
                      <div key={col.label}>
                        <div style={{ fontSize: 9, color: C.slate500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{col.label}</div>
                        <div style={{ fontSize: 12, fontWeight: col.label === 'Amount' ? 700 : 400, color: col.label === 'Amount' ? C.slate800 : C.textSub }}>{col.value}</div>
                      </div>
                    ))}
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

export default LandlordRentCollection;