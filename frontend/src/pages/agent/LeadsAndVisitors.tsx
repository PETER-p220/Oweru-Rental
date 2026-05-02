import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';
import { 
  buttonStyle, 
  descriptionStyle, 
  formatDate, 
  headingStyle, 
  inputStyle, 
  pageStyle, 
  panelStyle, 
  sectionTitleStyle, 
  statCardStyle, 
  statGridStyle, 
  statLabelStyle, 
  statValueStyle, 
  tableStyle, 
  tableWrapStyle, 
  tdStyle, 
  thStyle,
  mobileTableContainer,
  mobileCard,
  mobileCardHeader,
  mobileCardTitle,
  mobileCardStatus,
  mobileCardSection,
  mobileCardLabel,
  mobileCardValue,
  mobileCardActions,
  mobileMediaQuery
} from './agentPageStyles';

const LeadsAndVisitors = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading leads data...');
        
        const [leadsRes, statsRes] = await Promise.all([Api.getLeads(), Api.getLeadStats()]);
        
        console.log('📊 Leads API Response:', leadsRes);
        console.log('📈 Stats API Response:', statsRes);
        
        // Handle different response structures
        const leadsData = leadsRes.data || leadsRes || [];
        const statsData = statsRes.data || statsRes || {};
        
        console.log('📋 Processed leads:', leadsData);
        console.log('📊 Processed stats:', statsData);
        
        // If no leads, show sample leads for demonstration
        const finalLeads = Array.isArray(leadsData) && leadsData.length > 0 ? leadsData : [
          {
            id: 'sample-1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+255 712 345 678',
            status: 'new',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            property: {
              id: 1,
              title: 'Modern Apartment in Dar es Salaam',
              location: 'Dar es Salaam'
            }
          },
          {
            id: 'sample-2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '+255 765 432 109',
            status: 'contacted',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            property: {
              id: 2,
              title: 'Cozy House in Arusha',
              location: 'Arusha'
            }
          }
        ];
        
        setLeads(finalLeads);
        setStats(statsData);
      } catch (err: any) {
        console.error('❌ Error loading leads:', err);
        setError(err?.response?.data?.message || err?.message || 'Unable to load leads.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => leads.filter((item) => `${item.name || ''} ${item.email || ''} ${item.property?.title || ''}`.toLowerCase().includes(search.toLowerCase())), [leads, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Leads & Visitors</h1>
        <p style={descriptionStyle}>Track your latest lead conversions here. Expanded visitor summaries are currently in development.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Total Leads</div><div style={statValueStyle}>{stats?.total_leads || 0}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>New Today</div><div style={statValueStyle}>{stats?.new_leads || 0}</div></div>
          <div style={statCardStyle('#f59e0b')}><div style={statLabelStyle}>Converted</div><div style={statValueStyle}>{stats?.converted_leads || 0}</div></div>
          <div style={statCardStyle('#fb7185')}><div style={statLabelStyle}>Conversion Rate</div><div style={statValueStyle}>{Number(stats?.conversion_rate || 0).toFixed(1)}%</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        <input style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }} placeholder="Search leads" value={search} onChange={(e) => setSearch(e.target.value)} />
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        
        {/* Desktop Table */}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Lead</th><th style={thStyle}>Property</th><th style={thStyle}>Status</th><th style={thStyle}>Created</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={4}>Loading leads...</td></tr> : filtered.length === 0 ? <tr><td style={tdStyle} colSpan={4}>No leads found.</td></tr> : filtered.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>
                    <div>{item.name || item.user?.first_name || 'Lead'}</div>
                    <div style={{ color: '#cbd5e1', marginTop: '4px' }}>{item.email}</div>
                    {item.phone && <div style={{ color: '#cbd5e1', marginTop: '4px' }}>{item.phone}</div>}
                  </td>
                  <td style={tdStyle}>
                    <div>{item.property?.title || 'General interest'}</div>
                    {item.property?.id && <div style={{ marginTop: '8px' }}><Link to={`/property/${item.property.id}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>Open property</Link></div>}
                  </td>
                  <td style={tdStyle}>{item.status || 'new'}</td>
                  <td style={tdStyle}>
                    <div>{formatDate(item.created_at)}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {item.email && <a href={`mailto:${item.email}`} style={{ ...buttonStyle('ghost'), textDecoration: 'none', padding: '8px 12px' }}>Email</a>}
                      {item.phone && <a href={`tel:${item.phone}`} style={{ ...buttonStyle('ghost'), textDecoration: 'none', padding: '8px 12px' }}>Call</a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div style={{ ...mobileTableContainer, marginTop: '20px' }}>
          {loading ? (
            <div style={mobileCard}>
              <div style={mobileCardValue}>Loading leads...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={mobileCard}>
              <div style={mobileCardValue}>No leads found.</div>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} style={mobileCard}>
                <div style={mobileCardHeader}>
                  <div>
                    <h3 style={mobileCardTitle}>{item.name || item.user?.first_name || 'Lead'}</h3>
                    <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '2px' }}>{item.email}</div>
                    {item.phone && <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '2px' }}>{item.phone}</div>}
                  </div>
                  <div style={{
                    ...mobileCardStatus,
                    background: item.status === 'new' ? '#22c55e' : 
                               item.status === 'contacted' ? '#38bdf8' : 
                               item.status === 'interested' ? '#f59e0b' : 
                               item.status === 'converted' ? '#10b981' : '#ef4444',
                    color: '#fff'
                  }}>
                    {item.status || 'new'}
                  </div>
                </div>

                {item.property && (
                  <div style={mobileCardSection}>
                    <div style={mobileCardLabel}>Property</div>
                    <div style={mobileCardValue}>{item.property.title}</div>
                    {item.property.id && (
                      <div style={{ marginTop: '6px' }}>
                        <Link to={`/property/${item.property.id}`} style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px' }}>
                          View Property
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div style={mobileCardSection}>
                  <div style={mobileCardLabel}>Created</div>
                  <div style={mobileCardValue}>{formatDate(item.created_at)}</div>
                </div>

                <div style={mobileCardActions}>
                  {item.email && (
                    <a href={`mailto:${item.email}`} style={{ ...buttonStyle('ghost'), textDecoration: 'none', flex: 1, textAlign: 'center' }}>
                      Email
                    </a>
                  )}
                  {item.phone && (
                    <a href={`tel:${item.phone}`} style={{ ...buttonStyle('ghost'), textDecoration: 'none', flex: 1, textAlign: 'center' }}>
                      Call
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CSS for responsive layout */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="overflowX: auto"] {
            display: none;
          }
          div[style*="display: none"] {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LeadsAndVisitors;
