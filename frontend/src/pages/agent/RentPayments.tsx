import { useEffect, useState } from 'react';
import { MapPin, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import Api from '../../services/api';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  tableStyle,
  tdStyle,
  thStyle,
  palette,
} from '../landlord/landlordPageStyles';

const C = {
  pageBg: palette.pageBg,
  headerBg: palette.slate800,
  cardBg: palette.white,
  border: palette.slate200,
  text: palette.slate900,
  textMuted: palette.slate400,
  textLight: palette.slate300,
  slate100: palette.slate100,
  slate200: palette.slate200,
  slate500: palette.slate500,
  slate800: palette.slate800,
  green: palette.green,
  greenBg: palette.greenBg,
  blue: palette.blue,
  blueBg: palette.blueBg,
  amber: palette.amber,
  amberBg: palette.amberBg,
  red: palette.red,
  redBg: palette.redBg,
};

interface PaymentItem {
  id: number;
  amount?: number | string;
  status?: string;
  type?: string;
  created_at?: string;
  due_date?: string;
  property?: { title?: string; location?: string };
  tenant?: { user?: { first_name?: string; last_name?: string; email?: string } };
  tenant_name?: string;
}

interface RentStats {
  total_collected?: number;
  this_month?: number;
  pending_payments?: number;
  collection_rate?: number;
}

const AgentRentPayments = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<RentStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      setError('');
      const [paymentsRes, statsRes] = await Promise.all([
        Api.getAgentRentPayments(),
        Api.getAgentRentPaymentStats(),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setStats(statsRes.data || {});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load rent payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const statCards = [
    { label: 'Total Collected', value: formatCurrency(stats.total_collected), color: C.green, bg: C.greenBg },
    { label: 'This Month', value: formatCurrency(stats.this_month), color: C.blue, bg: C.blueBg },
    { label: 'Pending', value: `${stats.pending_payments ?? 0}`, color: C.amber, bg: C.amberBg },
    { label: 'Collection Rate', value: `${Number(stats.collection_rate ?? 0).toFixed(1)}%`, color: C.slate800, bg: C.slate100 },
  ];

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ background: C.headerBg, padding: '24px 24px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
                Agent Workspace
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Rent Payments
              </h1>
              <p style={{ margin: '5px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                First-month and monthly rent on your linked listings
              </p>
            </div>
            <button onClick={() => loadData(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {statCards.map((s) => (
              <div key={s.label} style={{ minWidth: 130, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Wallet size={13} style={{ color: s.color }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.slate500, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.redBg, border: '1px solid rgba(220,38,38,0.22)', borderRadius: 10, padding: '13px 16px', marginBottom: 18, color: C.red, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.slate800}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <Wallet size={26} style={{ color: C.textMuted, marginBottom: 14 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No rent payments yet</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>When tenants pay first-month or additional months on your listings, records appear here.</div>
          </div>
        ) : (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...tableStyle, minWidth: 720 }}>
                <thead>
                  <tr>
                    {['Tenant', 'Property', 'Type', 'Amount', 'Due', 'Status'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const sc = getStatusColor(payment.status);
                    const tenantName = payment.tenant_name
                      || `${payment.tenant?.user?.first_name || ''} ${payment.tenant?.user?.last_name || ''}`.trim()
                      || 'Tenant';
                    return (
                      <tr key={payment.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{tenantName}</div>
                          <div style={{ color: C.textMuted, marginTop: 3, fontSize: 12 }}>{payment.tenant?.user?.email || '—'}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{payment.property?.title || 'Property'}</div>
                          {payment.property?.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <MapPin size={10} style={{ color: C.textMuted }} />
                              <span style={{ color: C.textMuted, fontSize: 11 }}>{payment.property.location}</span>
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, color: C.slate500, textTransform: 'capitalize' }}>
                            {(payment.type || 'rent').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{formatCurrency(payment.amount)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, color: C.textMuted }}>{formatDate(payment.due_date || payment.created_at)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: `${sc}18`,
                            border: `1px solid ${sc}35`,
                            color: sc,
                          }}>
                            {payment.status}
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

export default AgentRentPayments;
