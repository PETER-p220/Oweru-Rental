import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './tenantPageStyles';

const PaymentHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [paymentsRes, summaryRes] = await Promise.all([Api.getPaymentHistory(), Api.getPaymentSummary()]);
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
        setSummary(summaryRes.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load payment history.');
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Payment History</h1>
        <p style={descriptionStyle}>Completed and pending payment records from your tenant account.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '22px' }}>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Total paid</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(summary.total_paid)}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Pending</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{summary.pending_payments ?? 0}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>This month</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(summary.this_month)}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading payment history...</div> : payments.length === 0 ? <div style={{ color: '#9f9587' }}>No payment records found.</div> : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}><thead><tr><th style={thStyle}>Date</th><th style={thStyle}>Description</th><th style={thStyle}>Amount</th><th style={thStyle}>Status</th><th style={thStyle}>Receipt</th></tr></thead>
            <tbody>{payments.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{formatDate(item.paid_at || item.created_at)}</td>
                <td style={tdStyle}>{item.description || item.type || 'Payment'}</td>
                <td style={tdStyle}>{formatCurrency(item.amount)}</td>
                <td style={tdStyle}><span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span></td>
                <td style={tdStyle}>{item.status === 'completed' ? <button style={buttonStyle('secondary')} onClick={() => Api.downloadReceipt(item.id).catch(() => {})}>Download</button> : '—'}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PaymentHistory;
