import { useEffect, useState } from 'react';
import Api from '../../services/api';
import {
  descriptionStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingStyle,
  metricCardStyle,
  metricGridStyle,
  pageStyle,
  panelStyle,
  sectionTitleStyle,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
} from './landlordPageStyles';

interface PaymentItem {
  id: number;
  amount?: number | string;
  status?: string;
  created_at?: string;
  due_date?: string;
  property?: { title?: string; location?: string };
  tenant?: { user?: { first_name?: string; last_name?: string; email?: string } };
}

interface RentStats {
  total_collected?: number;
  this_month?: number;
  pending_payments?: number;
  collection_rate?: number;
}

const RentCollectionPage = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<RentStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [paymentsResponse, statsResponse] = await Promise.all([
          Api.getRentCollection(),
          Api.getRentCollectionStats(),
        ]);
        setPayments(Array.isArray(paymentsResponse.data) ? paymentsResponse.data : []);
        setStats(statsResponse.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load rent collection data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Rent Collection</h1>
        <p style={descriptionStyle}>
          Track live payment records and collection stats from the owner payment endpoints.
        </p>

        <div style={{ ...metricGridStyle, marginTop: '22px' }}>
          <div style={metricCardStyle}>
            <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total collected</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(stats.total_collected)}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>This month</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(stats.this_month)}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Pending payments</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{stats.pending_payments ?? 0}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Collection rate</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{Number(stats.collection_rate ?? 0).toFixed(1)}%</div>
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ marginBottom: '16px', color: '#e07070' }}>{error}</div>}
        {loading ? (
          <div style={{ color: '#9f9587' }}>Loading rent collection data...</div>
        ) : payments.length === 0 ? (
          <div style={{ color: '#9f9587' }}>No rent payments found yet.</div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Due</th>
                  <th style={thStyle}>Recorded</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={tdStyle}>
                      <div>{payment.tenant?.user?.first_name} {payment.tenant?.user?.last_name}</div>
                      <div style={{ color: '#9f9587', marginTop: '4px' }}>{payment.tenant?.user?.email || 'No email'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{payment.property?.title || 'Untitled property'}</div>
                      <div style={{ color: '#9f9587', marginTop: '4px' }}>{payment.property?.location || 'No location'}</div>
                    </td>
                    <td style={tdStyle}>{formatCurrency(payment.amount)}</td>
                    <td style={tdStyle}>{formatDate(payment.due_date)}</td>
                    <td style={tdStyle}>{formatDate(payment.created_at)}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(payment.status))}>{payment.status || 'unknown'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RentCollectionPage;
