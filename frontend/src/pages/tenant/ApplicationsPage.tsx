import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileCheck, Search, MapPin, AlertCircle, ClipboardList } from 'lucide-react';
import Api from '../../services/api';
import {
  descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
  statusPillStyle, tableStyle, tableWrapStyle, tdStyle, thStyle,
} from './tenantPageStyles';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  property?: { title?: string; location?: string; price?: number | string };
}

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');
  const [search, setSearch]    = useState('');
  const [searchParams]         = useSearchParams();
  const propertyId = searchParams.get('property');

  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
  }, [propertyId]);

  const handleApplyForProperty = async (id: string) => {
    try {
      if (!id || isNaN(parseInt(id))) throw new Error('Invalid property ID');
      await Api.createApplication({
        property_id: parseInt(id),
        message: 'I am interested in this property and would like to schedule a viewing.',
      });
      alert('Application submitted successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      const res = await Api.getTenantApplications();
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to submit application.');
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

  const filtered = useMemo(() =>
    applications.filter((item) => {
      const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    }), [applications, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(a => { const s = a.status || 'unknown'; counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [applications]);

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>My Applications</h1>
            <p style={descriptionStyle}>Track live applications submitted from your tenant account.</p>
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} style={{
                padding: '6px 14px', borderRadius: '999px',
                background: `${getStatusColor(status)}12`,
                border: `1px solid ${getStatusColor(status)}28`,
                color: getStatusColor(status),
                fontSize: '12px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ textTransform: 'capitalize', letterSpacing: '0.05em' }}>{status}</span>
                <span style={{ background: `${getStatusColor(status)}25`, borderRadius: '999px', padding: '1px 6px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: '20px', maxWidth: '360px', position: 'relative' as const }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: palette.muted }} />
          <input
            style={{ ...inputStyle, paddingLeft: '36px', borderRadius: '12px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications…"
          />
        </div>
      </section>

      {/* Table */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading applications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.muted }}>
            <ClipboardList size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', marginBottom: '6px' }}>No applications found</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Browse properties and apply to get started.</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>{['Property', 'Price', 'Status', 'Message', 'Applied'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{item.property?.title || 'Untitled property'}</div>
                      <div style={{ color: palette.muted, fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} /> {item.property?.location || 'No location'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: palette.amber }}>{formatCurrency(item.property?.price)}</div>
                    </td>
                    <td style={tdStyle}><span style={statusPillStyle(getStatusColor(item.status))}>{item.status || 'unknown'}</span></td>
                    <td style={{ ...tdStyle, maxWidth: '200px' }}>
                      <div style={{ color: palette.muted, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {item.message || 'No message'}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: palette.muted, fontSize: '13px', whiteSpace: 'nowrap' as const }}>{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ApplicationsPage;