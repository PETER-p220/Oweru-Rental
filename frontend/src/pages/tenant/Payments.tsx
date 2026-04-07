import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Clock, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  selectStyle, statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle,
  mobileTableContainer, mobileCard, mobileCardHeader, mobileCardTitle,
  mobileCardSection, mobileCardLabel, mobileCardValue, mobileCardActions,
} from './tenantPageStyles';

const Payments = () => {
  const [payments, setPayments]   = useState<any[]>([]);
  const [methods, setMethods]     = useState<any[]>([]);
  const [stats, setStats]         = useState<any>({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const load = async () => {
    try {
      setLoading(true);
      const [paymentsRes, methodsRes, statsRes] = await Promise.all([
        Api.getMyPayments(), Api.getPaymentMethods(), Api.getPaymentStats(),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);
      setStats(statsRes.data || {});
      setSelectedMethod((methodsRes.data?.[0]?.id || '').toString());
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payments.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const nextPending = useMemo(() => payments.find((p) => p.status === 'pending') || null, [payments]);

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
          Tenant Workspace
        </div>
        <h1 style={headingStyle}>Rent Payments</h1>
        <p style={descriptionStyle}>Current payment obligations and available payment methods.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '28px' }}>
          {[
            { label: 'Total Paid',  value: formatCurrency(stats.total_paid),      icon: TrendingUp, accent: true },
            { label: 'Pending',     value: stats.pending_payments ?? 0,            icon: Clock },
            { label: 'This Month',  value: formatCurrency(stats.this_month),       icon: Calendar },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} style={{
              padding: '20px', borderRadius: '14px',
              background: accent ? 'rgba(245,158,11,0.1)' : 'rgba(15,23,42,0.5)',
              border: accent ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(148,163,184,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.muted, fontWeight: 600 }}>{label}</span>
                <Icon size={14} style={{ color: accent ? palette.amber : palette.muted }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: accent ? palette.amber : palette.cream, letterSpacing: '-0.5px' }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pay next + table */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading payments...
          </div>
        ) : (
          <>
            {nextPending && methods.length > 0 && (
              <div style={{
                display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
                padding: '16px 20px', borderRadius: '14px', marginBottom: '24px',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
              }}>
                <CreditCard size={16} style={{ color: palette.amber }} />
                <span style={{ color: palette.cream, fontSize: '14px', fontWeight: 500 }}>
                  Next payment due: <span style={{ color: palette.amber }}>{formatCurrency(nextPending.amount)}</span>
                </span>
                <select
                  style={{ ...selectStyle, maxWidth: '220px', padding: '8px 12px', borderRadius: '10px' }}
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                >
                  {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button
                  style={{ ...buttonStyle('primary'), padding: '9px 20px', borderRadius: '10px' }}
                  onClick={() => Api.makePayment(nextPending.id, { paymentMethodId: selectedMethod }).then(load)}
                >
                  Pay Now
                </button>
              </div>
            )}

            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
                <CreditCard size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: '16px' }}>No payments found</div>
              </div>
            ) : (
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>{['Description', 'Amount', 'Due Date', 'Property', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {payments.map((item) => (
                      <tr key={item.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={tdStyle}><div style={{ fontWeight: 500 }}>{item.description || item.type || 'Payment'}</div></td>
                        <td style={tdStyle}><div style={{ fontWeight: 700, color: palette.amber }}>{formatCurrency(item.amount)}</div></td>
                        <td style={tdStyle}><div style={{ color: palette.muted, fontSize: '13px' }}>{formatDate(item.due_date || item.created_at)}</div></td>
                        <td style={tdStyle}>{item.property?.title || '—'}</td>
                        <td style={tdStyle}><span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Payments;