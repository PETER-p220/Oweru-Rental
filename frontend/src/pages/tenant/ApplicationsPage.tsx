import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileCheck, Search, MapPin, AlertCircle, ClipboardList, Clock } from 'lucide-react';
import Api from '../../services/api';
import {
  descriptionStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingStyle,
  inputStyle,
  pageStyle,
  palette,
  panelStyle,
  sectionTitleStyle,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
  mobileTableContainer,
  mobileCard,
  mobileCardHeader,
  mobileCardTitle,
  mobileCardSection,
  mobileCardLabel,
  mobileCardValue,
  mobileCardActions,
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
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [searchParams]                  = useSearchParams();
  const propertyId                      = searchParams.get('property');

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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return applications.filter((item) => {
      const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [applications, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      const s = a.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [applications]);

  return (
    <div style={{ ...pageStyle, padding: '0', backgroundColor: '#f8fafc' }}>

      {/* ── Header ── */}
      <section style={{
        ...panelStyle,
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,45,110,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{
              ...sectionTitleStyle,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eff6ff',
              padding: '4px 12px',
              borderRadius: '100px',
              marginBottom: '12px',
            }}>
              <FileCheck size={12} />
              Tenant Workspace
            </div>
            <h1 style={{ ...headingStyle, fontSize: '26px', letterSpacing: '-0.02em' }}>My Applications</h1>
            <p style={{ ...descriptionStyle, maxWidth: '460px', marginTop: '6px' }}>
              Track the status of all your rental applications in one place.
            </p>
          </div>

          {/* Status summary pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  background: `${getStatusColor(status)}12`,
                  border: `1px solid ${getStatusColor(status)}28`,
                  color: getStatusColor(status),
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{status}</span>
                <span style={{
                  background: `${getStatusColor(status)}20`,
                  color: getStatusColor(status),
                  borderRadius: '100px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: '24px', maxWidth: '420px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            style={{
              ...inputStyle,
              paddingLeft: '42px',
              paddingRight: '16px',
              borderRadius: '8px',
              height: '44px',
              fontSize: '14px',
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              color: '#1e293b',
              outline: 'none',
              width: '100%',
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by property, location, or message..."
            onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
            onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </section>

      {/* ── Content ── */}
      <section style={{ ...panelStyle, margin: '20px', borderRadius: '14px' }}>
        {/* Error */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#dc2626',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '24px',
            fontSize: '14px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#64748b', padding: '80px 0' }}>
            <div style={{
              width: 20,
              height: 20,
              border: '2.5px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading your applications…</span>
          </div>

        ) : filtered.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <div style={{ width: 64, height: 64, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ClipboardList size={28} style={{ color: '#2563eb' }} />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>No applications found</div>
            <div style={{ fontSize: '14px', maxWidth: '300px', margin: '0 auto', lineHeight: 1.6 }}>
              You haven't submitted any applications yet. Start browsing properties to apply.
            </div>
          </div>

        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Property', 'Price', 'Status', 'Message', 'Applied'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                          {item.property?.title || 'Untitled Property'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          {item.property?.location || 'No location provided'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '15px' }}>
                          {formatCurrency(item.property?.price)}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={statusPillStyle(getStatusColor(item.status))}>
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '220px' }}>
                        <div style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                          {item.message || '—'}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} />
                          {formatDate(item.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div style={mobileTableContainer}>
              {filtered.map((item) => (
                <div key={item.id} style={{
                  ...mobileCard,
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(15,45,110,0.06)',
                }}>
                  <div style={mobileCardHeader}>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...mobileCardTitle, color: '#0f172a' }}>
                        {item.property?.title || 'Untitled Property'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {item.property?.location || 'No location'}
                      </div>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#2563eb' }}>
                      {formatCurrency(item.property?.price)}
                    </div>
                  </div>

                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Status</div>
                    <span style={statusPillStyle(getStatusColor(item.status))}>
                      {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                    </span>
                  </div>

                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Message</div>
                    <div style={{ ...mobileCardValue, color: '#64748b' }}>{item.message || 'No message provided'}</div>
                  </div>

                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Applied on</div>
                    <div style={{ ...mobileCardValue, display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                      <Clock size={12} />
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          div[style*="overflowX: auto"] { display: none !important; }
          div[style*="display: none"]   { display: block !important; }
        }

        table { border-collapse: separate; border-spacing: 0; }
        th, td { transition: all 0.15s ease; }
      `}</style>
    </div>
  );
};

export default ApplicationsPage;