import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { descriptionStyle, formatCurrency, formatDate, headingStyle, pageStyle, panelStyle, sectionTitleStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const ApplicationsPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getAgentApplications();
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
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
        <h1 style={headingStyle}>Applications</h1>
        <p style={descriptionStyle}>Applications submitted for properties assigned to you.</p>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Applicant</th><th style={thStyle}>Property</th><th style={thStyle}>Status</th><th style={thStyle}>Date</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={4}>Loading applications...</td></tr> : items.length === 0 ? <tr><td style={tdStyle} colSpan={4}>No applications found.</td></tr> : items.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}><div>{item.user?.first_name} {item.user?.last_name}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{item.user?.email}</div></td>
                  <td style={tdStyle}><div>{item.property?.title}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{formatCurrency(item.property?.price)}</div></td>
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

export default ApplicationsPage;
