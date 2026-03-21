import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, formatDate, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const MyCommissions = () => {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [itemsRes, statsRes] = await Promise.all([Api.getMyCommissions(), Api.getAgentCommissionStats()]);
        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setStats(statsRes.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load commissions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const paidCount = useMemo(() => items.filter((item) => item.status === 'paid').length, [items]);

  const exportCsv = () => {
    const rows = [
      ['Property', 'Amount', 'Status', 'Created At'],
      ...items.map((item) => [
        item.property?.title || 'Property commission',
        String(item.amount ?? 0),
        item.status || '',
        item.created_at || '',
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-commissions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>My Commissions</h1>
        <p style={descriptionStyle}>Commission records now come from the Laravel API instead of static mock data.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Transactions</div><div style={statValueStyle}>{stats?.total_transactions || items.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Paid</div><div style={statValueStyle}>{paidCount}</div></div>
          <div style={statCardStyle('#f59e0b')}><div style={statLabelStyle}>Pending</div><div style={statValueStyle}>{formatCurrency(stats?.pending_commissions)}</div></div>
          <div style={statCardStyle('#fb7185')}><div style={statLabelStyle}>Earned</div><div style={statValueStyle}>{formatCurrency(stats?.total_earned)}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button type="button" onClick={exportCsv} style={buttonStyle('ghost')} disabled={!items.length}>Export CSV</button>
        </div>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Amount</th><th style={thStyle}>Status</th><th style={thStyle}>Date</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={4}>Loading commissions...</td></tr> : items.length === 0 ? <tr><td style={tdStyle} colSpan={4}>No commission records found.</td></tr> : items.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.property?.title || 'Property commission'}</td>
                  <td style={tdStyle}>{formatCurrency(item.amount)}</td>
                  <td style={tdStyle}>{item.status}</td>
                  <td style={tdStyle}>{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MyCommissions;
