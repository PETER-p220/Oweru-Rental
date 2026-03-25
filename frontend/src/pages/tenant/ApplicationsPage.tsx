import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Api from '../../services/api';
import { descriptionStyle, formatCurrency, formatDate, getStatusColor, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './tenantPageStyles';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  property?: { title?: string; location?: string; price?: number | string };
}

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');

  // Handle property application
  useEffect(() => {
    if (propertyId) {
      handleApplyForProperty(propertyId);
    }
  }, [propertyId]);

  const handleApplyForProperty = async (propertyId: string) => {
    try {
      await Api.createApplication({
        property_id: parseInt(propertyId),
        message: 'I am interested in this property'
      });
      // Show success message or redirect
      alert('Application submitted successfully!');
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      alert('Failed to submit application. Please try again.');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getTenantApplications();
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => applications.filter((item) => {
    const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  }), [applications, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>My Applications</h1>
        <p style={descriptionStyle}>Track live applications submitted from your tenant account.</p>
        <div style={{ marginTop: '18px', maxWidth: '360px' }}>
          <input style={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications" />
        </div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading applications...</div> : filtered.length === 0 ? <div style={{ color: '#9f9587' }}>No applications found.</div> : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}><thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Price</th><th style={thStyle}>Status</th><th style={thStyle}>Message</th><th style={thStyle}>Applied</th></tr></thead>
            <tbody>{filtered.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}><div>{item.property?.title || 'Untitled property'}</div><div style={{ color: '#9f9587', marginTop: '4px' }}>{item.property?.location || 'No location'}</div></td>
                <td style={tdStyle}>{formatCurrency(item.property?.price)}</td>
                <td style={tdStyle}><span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span></td>
                <td style={tdStyle}>{item.message || 'No message'}</td>
                <td style={tdStyle}>{formatDate(item.created_at)}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ApplicationsPage;
