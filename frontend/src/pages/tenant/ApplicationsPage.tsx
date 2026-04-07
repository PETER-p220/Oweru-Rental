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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
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
    <div style={{ ...pageStyle, padding: '0', backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <section style={{ ...panelStyle, borderBottom: `1px solid ${palette.borderSoft || '#1f1f1f'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: palette.amber }} />
              Tenant Workspace
            </div>
            <h1 style={{ ...headingStyle, fontSize: '28px', letterSpacing: '-0.02em' }}>My Applications</h1>
            <p style={{ ...descriptionStyle, maxWidth: '460px' }}>
              Track the status of all your rental applications in one place.
            </p>
          </div>

          {/* Status Overview */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  background: `${getStatusColor(status)}15`,
                  border: `1px solid ${getStatusColor(status)}30`,
                  color: getStatusColor(status),
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{status}</span>
                <span
                  style={{
                    background: `${getStatusColor(status)}25`,
                    color: getStatusColor(status),
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '28px', maxWidth: '420px', position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: palette.muted,
            }}
          />
          <input
            style={{
              ...inputStyle,
              paddingLeft: '52px',
              paddingRight: '20px',
              borderRadius: '12px',
              height: '48px',
              fontSize: '15px',
              border: `1px solid ${palette.borderSoft || '#333'}`,
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by property, location, or message..."
          />
        </div>
      </section>

      {/* Content Section */}
      <section style={{ ...panelStyle, paddingTop: '32px' }}>
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#f87171',
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              fontSize: '14.5px',
            }}
          >
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: palette.muted, padding: '80px 0' }}>
            <div
              style={{
                width: 20,
                height: 20,
                border: `3px solid ${palette.amber}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            Loading your applications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: palette.muted }}>
            <ClipboardList size={56} style={{ opacity: 0.25, margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', marginBottom: '8px', color: '#ddd' }}>No applications found</div>
            <div style={{ fontSize: '14.5px', maxWidth: '320px', margin: '0 auto' }}>
              You haven't submitted any applications yet. Start browsing properties to apply.
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Property', 'Price', 'Status', 'Message', 'Applied'].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      style={{ transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{item.property?.title || 'Untitled Property'}</div>
                        <div style={{ color: palette.muted, fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={13} /> {item.property?.location || 'No location provided'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: palette.amber, fontSize: '15.5px' }}>
                          {formatCurrency(item.property?.price)}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={statusPillStyle(getStatusColor(item.status))}>
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '240px' }}>
                        <div style={{ color: palette.muted, fontSize: '13.5px', lineHeight: '1.4' }}>
                          {item.message || '—'}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: palette.muted, fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div style={mobileTableContainer}>
              {filtered.map((item) => (
                <div key={item.id} style={{ ...mobileCard, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <div style={mobileCardHeader}>
                    <div style={{ flex: 1 }}>
                      <div style={mobileCardTitle}>{item.property?.title || 'Untitled Property'}</div>
                      <div style={{ color: palette.muted, fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} /> {item.property?.location || 'No location'}
                      </div>
                    </div>
                    <div style={{ fontSize: '19px', fontWeight: 700, color: palette.amber }}>
                      {formatCurrency(item.property?.price)}
                    </div>
                  </div>

                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Status</div>
                    <div style={mobileCardValue}>
                      <span style={statusPillStyle(getStatusColor(item.status))}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Message</div>
                    <div style={mobileCardValue}>{item.message || 'No message provided'}</div>
                  </div>

                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Applied on</div>
                    <div style={mobileCardValue}>{formatDate(item.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          div[style*="overflowX: auto"] { display: none !important; }
          div[style*="display: none"] { display: block !important; }
        }

        table {
          border-collapse: separate;
          border-spacing: 0;
        }

        th, td {
          transition: all 0.15s ease;
        }
      `}</style>
    </div>
  );
};

export default ApplicationsPage;