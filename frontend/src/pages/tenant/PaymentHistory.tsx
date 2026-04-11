import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Calendar, Download, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './tenantPageStyles';

/* ─── Oweru Brand Tokens ─── */
const B = {
  navy900:  '#0F172A',
  navy800:  '#162035',
  navy700:  '#1E2D4A',
  gold:     '#C89128',
  goldLt:   '#D4A843',
  goldDim:  'rgba(200,145,40,0.12)',
  cream:    '#F8F8F9',
  slate:    '#94A3B8',
  border:   'rgba(200,145,40,0.18)',
  borderF:  'rgba(200,145,40,0.08)',
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, accent = false }: {
  label: string; value: string; icon: any; accent?: boolean;
}) => (
  <div style={{
    padding: '22px 20px',
    background: accent ? B.goldDim : B.navy700,
    border: `1px solid ${accent ? B.border : B.borderF}`,
    display: 'flex', flexDirection: 'column' as const, gap: 12,
    position: 'relative' as const, overflow: 'hidden' as const,
    fontFamily: "'Jost', sans-serif",
  }}>
    {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: B.gold }} />}
    <div style={{
      width: 36, height: 36,
      background: accent ? 'rgba(200,145,40,0.2)' : B.navy800,
      border: `1px solid ${accent ? B.border : B.borderF}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: accent ? B.gold : B.slate,
    }}>
      <Icon size={16} />
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.slate, marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent ? B.gold : B.cream, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  </div>
);

/* ─── Status Badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    paid: B.gold, completed: B.gold, pending: '#f59e0b',
    failed: '#ef4444', cancelled: '#ef4444',
  };
  const color = colorMap[status] ?? B.slate;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: "'Jost', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   PAYMENT HISTORY COMPONENT
───────────────────────────────────────────────────────────── */
const PaymentHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary]   = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

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
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .ph-panel {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          padding: 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .ph-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: ${B.gold};
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }

        .ph-tag::before { content: ''; width: 20px; height: 1px; background: ${B.gold}; }

        table.ph-table { width: 100%; border-collapse: collapse; }
        table.ph-table thead th {
          font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: ${B.gold};
          padding: 10px 16px; text-align: left;
          border-bottom: 1px solid ${B.border};
          background: ${B.navy900};
        }
        table.ph-table tbody td {
          padding: 14px 16px; font-size: 14px;
          border-bottom: 1px solid ${B.borderF};
          color: ${B.cream}; vertical-align: middle;
        }
        table.ph-table tbody tr:last-child td { border-bottom: none; }
        table.ph-table tbody tr:hover td { background: rgba(200,145,40,0.03); }

        .ph-receipt-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: ${B.goldDim}; color: ${B.gold};
          padding: 6px 12px;
          font-family: 'Jost', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid ${B.border}; cursor: pointer;
          transition: all 0.2s;
        }
        .ph-receipt-btn:hover { background: rgba(200,145,40,0.2); border-color: rgba(200,145,40,0.4); }
      `}</style>

      {/* ── Header Panel ── */}
      <div className="ph-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: B.gold }} />

        <div className="ph-tag">Tenant Workspace</div>
        <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: B.cream, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Payment History
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, color: B.slate, margin: 0 }}>
          Completed and pending payment records from your tenant account.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, marginTop: 28, background: B.border, border: `1px solid ${B.border}` }}>
          <StatCard label="Total Paid"  value={formatCurrency(summary.total_paid)}   icon={TrendingUp} accent />
          <StatCard label="Pending"     value={String(summary.pending_payments ?? 0)} icon={Clock} />
          <StatCard label="This Month"  value={formatCurrency(summary.this_month)}    icon={Calendar} />
        </div>
      </div>

      {/* ── Table Panel ── */}
      <div className="ph-panel">
        <div className="ph-tag">Transaction Records</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          Payment History
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: B.slate, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${B.border}`, borderTopColor: B.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading payment history…
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: B.slate }}>
            <Calendar size={40} style={{ color: B.gold, opacity: 0.3, margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: B.cream, marginBottom: 6 }}>No payment records found</div>
            <div style={{ fontSize: 13, fontWeight: 300 }}>Your payment history will appear here once transactions are made.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: `1px solid ${B.border}` }}>
            <table className="ph-table">
              <thead>
                <tr>
                  {['Date', 'Description', 'Amount', 'Status', 'Receipt'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 300, color: B.slate }}>
                        {formatDate(item.due_date || item.created_at)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: B.cream }}>{item.description || item.type || 'Payment'}</div>
                      {item.property?.title && (
                        <div style={{ fontSize: 12, fontWeight: 300, color: B.slate, marginTop: 3 }}>{item.property.title}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: B.gold, letterSpacing: '-0.02em' }}>
                        {formatCurrency(item.amount)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.status || 'unknown'} />
                    </td>
                    <td>
                      {item.status === 'completed' || item.status === 'paid' ? (
                        <button
                          className="ph-receipt-btn"
                          onClick={() => Api.downloadReceipt(item.id).catch(() => {})}
                        >
                          <Download size={11} /> Receipt
                        </button>
                      ) : (
                        <span style={{ color: B.slate, fontSize: 13 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;