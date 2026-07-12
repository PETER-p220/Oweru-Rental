import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Calendar, Download, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './tenantPageStyles';

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, accent = false }: {
  label: string; value: string; icon: any; accent?: boolean;
}) => (
  <div className={`stat-card${accent ? ' accent' : ''}`}>
    <div className="stat-card-icon"><Icon size={16} /></div>
    <div className="stat-card-body">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  </div>
);

/* ─── Status badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    paid:      { color: '#166534', bg: '#DCFCE7', border: '#BBF7D0' },
    completed: { color: '#166534', bg: '#DCFCE7', border: '#BBF7D0' },
    pending:   { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
    failed:    { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
    cancelled: { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
  };
  const s = map[status] ?? { color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
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
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .ph-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .ph-header-inner { max-width: 1280px; margin: 0 auto; padding: 40px 40px 32px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .ph-eyebrow { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 5px 12px; border-radius: 20px; }
        .ph-heading { font-family: 'Inter', sans-serif; font-size: clamp(22px, 3.4vw, 30px); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #0F172A; margin: 0; }
        .ph-tagline { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; color: #64748B; margin: 8px 0 0; }

        /* ── Stat cards — always one row, shrink on mobile ── */
        .stats-row { max-width: 1280px; margin: 0 auto; padding: 24px 40px 0; display: flex; gap: 14px; }
        .stat-card { flex: 1; min-width: 0; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .stat-card.accent { background: #0F172A; border-color: #0F172A; }
        .stat-card-icon { width: 34px; height: 34px; border-radius: 9px; background: #F1F5F9; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0; }
        .stat-card.accent .stat-card-icon { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.18); color: #FFFFFF; }
        .stat-card-body { min-width: 0; }
        .stat-card-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-card.accent .stat-card-label { color: rgba(255,255,255,0.6); }
        .stat-card-value { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-card.accent .stat-card-value { color: #FFFFFF; }

        .ph-panel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }

        .ph-tag {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #64748B;
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ph-tag::before { content: ''; width: 20px; height: 1px; background: #CBD5E1; }

        .ph-table-scroll { overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 10px; }
        table.ph-table { width: 100%; min-width: 640px; border-collapse: collapse; }
        table.ph-table thead th {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: #64748B;
          padding: 12px 16px; text-align: left;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
          white-space: nowrap;
        }
        table.ph-table thead th:first-child { border-top-left-radius: 10px; }
        table.ph-table thead th:last-child { border-top-right-radius: 10px; }
        table.ph-table tbody td {
          padding: 14px 16px; font-size: 13.5px;
          border-bottom: 1px solid #F1F5F9;
          color: #0F172A; vertical-align: middle;
        }
        table.ph-table tbody tr:last-child td { border-bottom: none; }
        table.ph-table tbody tr:hover td { background: #F8FAFC; }

        .ph-receipt-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #F1F5F9; color: #0F172A;
          padding: 6px 12px;
          border-radius: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: 1px solid #E2E8F0; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .ph-receipt-btn:hover { background: #E2E8F0; border-color: #CBD5E1; }

        @media (max-width: 900px) {
          .ph-header-inner { padding: 32px 24px 26px; }
          .stats-row { padding: 20px 24px 0; }
          .ph-panel { margin-left: 24px; margin-right: 24px; width: auto; }
        }

        @media (max-width: 640px) {
          .ph-header-inner { padding: 22px 16px 18px; }
          .ph-heading { font-size: 21px; }
          .ph-tagline { font-size: 12.5px; }

          /* Force a single, compact row of stat cards on mobile */
          .stats-row { padding: 16px 12px 0; gap: 8px; }
          .stat-card { flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px 10px; border-radius: 10px; }
          .stat-card-icon { width: 26px; height: 26px; border-radius: 7px; }
          .stat-card-icon svg { width: 13px; height: 13px; }
          .stat-card-label { font-size: 8.5px; letter-spacing: 0.06em; margin-bottom: 2px; }
          .stat-card-value { font-size: 15px; }

          .ph-panel { margin-left: 12px; margin-right: 12px; padding: 18px; border-radius: 12px; }
        }

        @media (max-width: 380px) {
          .stat-card-value { font-size: 13px; }
          .stat-card-label { font-size: 8px; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="ph-header">
        <div className="ph-header-inner">
          <div>
            <div className="ph-eyebrow">Tenant Workspace</div>
            <h1 className="ph-heading">Payment History</h1>
            <p className="ph-tagline">Completed and pending payment records from your tenant account.</p>
          </div>
        </div>
      </div>

      {/* ── Stats — always one horizontal row ── */}
      <div className="stats-row">
        <StatCard label="Total Paid"  value={formatCurrency(summary.total_paid)}   icon={TrendingUp} accent />
        <StatCard label="Pending"     value={String(summary.pending_payments ?? 0)} icon={Clock} />
        <StatCard label="This Month"  value={formatCurrency(summary.this_month)}    icon={Calendar} />
      </div>

      {/* ── Table Panel ── */}
      <div className="ph-panel" style={{ maxWidth: '1280px', margin: '24px auto 0' }}>
        <div className="ph-tag">Payment Records</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          Payment History
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading payment history…
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748B' }}>
            <Calendar size={40} style={{ color: '#94A3B8', margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>No payment records found</div>
            <div style={{ fontSize: 13, fontWeight: 400 }}>Your payment history will appear here once transactions are made.</div>
          </div>
        ) : (
          <div className="ph-table-scroll">
            <table className="ph-table">
              <thead>
                <tr>
                  {['Date', 'Description', 'Reference', 'Amount', 'Status', 'Receipt'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 400, color: '#64748B' }}>
                        {formatDate(item.paid_at || item.due_date || item.created_at)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.description || item.type || 'Payment'}</div>
                      {item.property?.title && (
                        <div style={{ fontSize: 12, fontWeight: 400, color: '#64748B', marginTop: 3 }}>{item.property.title}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'ui-monospace, monospace' }}>
                        {item.reference || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
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
                        <span style={{ color: '#94A3B8', fontSize: 13 }}>—</span>
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