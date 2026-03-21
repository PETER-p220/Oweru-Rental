import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor, headingStyle, pageStyle, panelStyle, sectionTitleStyle, selectStyle, statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './tenantPageStyles';

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const nextPending = useMemo(() => payments.find((item) => item.status === 'pending') || null, [payments]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Rent Payments</h1>
        <p style={descriptionStyle}>Current payment obligations and available payment methods from the tenant API.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '22px' }}>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Total paid</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(stats.total_paid)}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Pending</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{stats.pending_payments ?? 0}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>This month</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(stats.this_month)}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading payments...</div> : (
          <>
            {nextPending && methods.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ color: '#9f9587' }}>Pay next pending charge: {formatCurrency(nextPending.amount)}</div>
                <select style={{ ...selectStyle, maxWidth: '240px' }} value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
                  {methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                </select>
                <button style={buttonStyle('primary')} onClick={() => Api.makePayment(nextPending.id, { paymentMethodId: selectedMethod }).then(load)}>Pay now</button>
              </div>
            )}
            {payments.length === 0 ? <div style={{ color: '#9f9587' }}>No payments found.</div> : (
              <div style={tableWrapStyle}>
                <table style={tableStyle}><thead><tr><th style={thStyle}>Description</th><th style={thStyle}>Amount</th><th style={thStyle}>Due</th><th style={thStyle}>Property</th><th style={thStyle}>Status</th></tr></thead>
                <tbody>{payments.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.description || item.type || 'Payment'}</td>
                    <td style={tdStyle}>{formatCurrency(item.amount)}</td>
                    <td style={tdStyle}>{formatDate(item.due_date || item.created_at)}</td>
                    <td style={tdStyle}>{item.property?.title || '—'}</td>
                    <td style={tdStyle}><span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span></td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Payments;
