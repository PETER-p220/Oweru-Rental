import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { descriptionStyle, formatCurrency, formatDate, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

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
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Payout History</h1>
        <p style={descriptionStyle}>Paid commission payouts from the backend.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Payouts</div><div style={statValueStyle}>{items.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Total Paid</div><div style={statValueStyle}>{formatCurrency(items.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Amount</th><th style={thStyle}>Paid At</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={3}>Loading payouts...</td></tr> : items.length === 0 ? <tr><td style={tdStyle} colSpan={3}>No paid payouts found.</td></tr> : items.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.property?.title || 'Commission payout'}</td>
                  <td style={tdStyle}>{formatCurrency(item.amount)}</td>
                  <td style={tdStyle}>{formatDate(item.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PayoutHistory;
