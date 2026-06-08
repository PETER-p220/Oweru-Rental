import { useEffect, useState } from 'react';
import Api from '../../services/api';

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'TZS 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(num);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const PayoutHistory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getPayoutHistory();
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load payout history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh', padding: '0' }}>
      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Agent Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Payout History</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>
              Paid commission payouts from the backend.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#38bdf8' }} />
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Payouts</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>
            {items.length}
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#22c55e' }} />
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Total Paid</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>
            {formatCurrency(items.reduce((sum, item) => sum + Number(item.amount || 0), 0))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px' }}>
          {error && <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px 16px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paid At</th></tr></thead>
              <tbody>
                {loading ? <tr><td style={{ padding: '12px', color: '#64748B' }} colSpan={3}>Loading payouts...</td></tr> : items.length === 0 ? <tr><td style={{ padding: '12px', color: '#64748B' }} colSpan={3}>No paid payouts found.</td></tr> : items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{item.property?.title || 'Commission payout'}</td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{formatCurrency(item.amount)}</td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{formatDate(item.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutHistory;
