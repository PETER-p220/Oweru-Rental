import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { headingStyle, descriptionStyle, pageStyle, panelStyle, sectionTitleStyle, metricGridStyle, metricCardStyle } from './tenantPageStyles';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getTenantAnalytics();
        setAnalytics(res.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load analytics.');
      } finally { setLoading(false); }
    })();
  }, []);

  const statuses = analytics.applications_by_status || {};

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Analytics</h1>
        <p style={descriptionStyle}>Tenant application and payment metrics from the Laravel analytics endpoint.</p>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading analytics...</div> : (
          <div style={metricGridStyle}>
            <div style={metricCardStyle}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Pending</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{statuses.pending ?? 0}</div></div>
            <div style={metricCardStyle}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Approved</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{statuses.approved ?? 0}</div></div>
            <div style={metricCardStyle}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Rejected</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{statuses.rejected ?? 0}</div></div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsPage;
