import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Calendar, Download, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle,
} from './tenantPageStyles';

const StatCard = ({ label, value, icon: Icon, accent = false }: { label: string; value: string; icon: any; accent?: boolean }) => (
  <div style={{
    padding: '22px',
    borderRadius: '16px',
    background: accent
      ? `linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)`
      : 'rgba(15,23,42,0.5)',
    border: accent ? `1px solid rgba(245,158,11,0.3)` : '1px solid rgba(148,163,184,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }}>
    <div style={{
      position: 'absolute', top: -20, right: -20,
      width: 80, height: 80, borderRadius: '50%',
      background: accent ? 'rgba(245,158,11,0.08)' : 'rgba(148,163,184,0.04)',
    }} />
    <div style={{
      width: 36, height: 36, borderRadius: '10px',
      background: accent ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.08)',
      border: accent ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(148,163,184,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: accent ? palette.amber : palette.muted,
    }}>
      <Icon size={16} />
    </div>
    <div>
      <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.muted, marginBottom: '6px', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: accent ? palette.amber : palette.cream, letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  </div>
);

const PaymentHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [paymentsRes, summaryRes] = await Promise.all([
          Api.getPaymentHistory(),
          Api.getPaymentSummary(),
        ]);
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
        setSummary(summaryRes.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load payment history.');
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header panel */}
      <section style={{ ...panelStyle, borderRadius: '20px' }}>
        {/* Decorative amber line */}
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)`, borderRadius: '1px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Payment History</h1>
            <p style={descriptionStyle}>Completed and pending payment records from your tenant account.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '28px' }}>
          <StatCard label="Total Paid" value={formatCurrency(summary.total_paid)} icon={TrendingUp} accent />
          <StatCard label="Pending" value={String(summary.pending_payments ?? 0)} icon={Clock} />
          <StatCard label="This Month" value={formatCurrency(summary.this_month)} icon={Calendar} />
        </div>
      </section>

      {/* Table panel */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading payment history...
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <Calendar size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', marginBottom: '6px' }}>No payment records found</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Your payment history will appear here once transactions are made.</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Date', 'Description', 'Amount', 'Status', 'Receipt'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((item) => (
                  <tr key={item.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ color: palette.muted, fontSize: '13px' }}>{formatDate(item.paid_at || item.created_at)}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{item.description || item.type || 'Payment'}</div>
                      {item.property?.title && <div style={{ color: palette.muted, fontSize: '12px', marginTop: '3px' }}>{item.property.title}</div>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: palette.amber, letterSpacing: '-0.3px' }}>{formatCurrency(item.amount)}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span>
                    </td>
                    <td style={tdStyle}>
                      {item.status === 'completed' ? (
                        <button
                          style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => Api.downloadReceipt(item.id).catch(() => {})}
                        >
                          <Download size={12} /> Receipt
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PaymentHistory;