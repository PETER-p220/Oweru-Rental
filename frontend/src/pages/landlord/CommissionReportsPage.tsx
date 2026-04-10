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

interface CommissionItem {
  id: number;
  amount?: number | string;
  status?: string;
  created_at?: string;
  property?: { title?: string };
  agent?: { first_name?: string; last_name?: string; email?: string };
}

const CommissionReportsPage = () => {
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await Api.getCommissionReports();
        setCommissions(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load commission reports.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const total = commissions.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Commission Reports</h1>
        <p style={descriptionStyle}>
          Review live commission payouts tied to your properties from the owner commission reports endpoint.
        </p>

        <div style={{ ...metricGridStyle, marginTop: '22px' }}>
          <div style={metricCardStyle}>
            <div style={{ color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Commission records</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{commissions.length}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total commissions</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(total)}</div>
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading commission reports...</div>
        ) : commissions.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No commission records found.</div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Agent</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>
                      <div>{item.agent?.first_name} {item.agent?.last_name}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{item.agent?.email || 'No email'}</div>
                    </td>
                    <td style={tdStyle}>{item.property?.title || 'Untitled property'}</td>
                    <td style={tdStyle}>{formatCurrency(item.amount)}</td>
                    <td style={tdStyle}>{formatDate(item.created_at)}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span>
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

export default CommissionReportsPage;
