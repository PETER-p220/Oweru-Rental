import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../services/api';
import { descriptionStyle, formatCurrency, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agent/agentPageStyles';

const AgentDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [dashboardRes, listingsRes, leadsRes] = await Promise.all([
          Api.getAgentDashboard(),
          Api.getMyListings(),
          Api.getLeads(),
        ]);
        setStats(dashboardRes.data || {});
        setListings(Array.isArray(listingsRes.data) ? listingsRes.data.slice(0, 5) : []);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data.slice(0, 5) : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load agent dashboard.');
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
        <h1 style={headingStyle}>Overview</h1>
        <p style={descriptionStyle}>Your dashboard now reads from the Laravel agent endpoints so listings, leads, and commissions stay aligned with the backend.</p>
        {error && <div style={{ color: '#e07070', marginTop: '14px' }}>{error}</div>}
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Listings</div><div style={statValueStyle}>{loading ? '...' : stats?.total_listings || 0}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Active Listings</div><div style={statValueStyle}>{loading ? '...' : stats?.active_listings || 0}</div></div>
          <div style={statCardStyle('#f59e0b')}><div style={statLabelStyle}>Leads</div><div style={statValueStyle}>{loading ? '...' : stats?.total_leads || 0}</div></div>
          <div style={statCardStyle('#fb7185')}><div style={statLabelStyle}>Commissions</div><div style={statValueStyle}>{loading ? '...' : formatCurrency(stats?.total_commissions)}</div></div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>Listings</div>
          <h2 style={{ margin: '0 0 14px', fontSize: '24px' }}>Recent Listings</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Owner</th><th style={thStyle}>Price</th></tr></thead>
              <tbody>
                {listings.length === 0 ? <tr><td style={tdStyle} colSpan={3}>No listings yet.</td></tr> : listings.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}><div>{item.title}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{item.location}</div></td>
                    <td style={tdStyle}>{item.owner?.first_name} {item.owner?.last_name}</td>
                    <td style={tdStyle}>{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '14px' }}><Link to="/dashboard/agent/my-listings" style={{ color: '#38bdf8', textDecoration: 'none' }}>Open My Listings</Link></div>
        </div>

        <div style={panelStyle}>
          <div style={sectionTitleStyle}>Pipeline</div>
          <h2 style={{ margin: '0 0 14px', fontSize: '24px' }}>Recent Leads</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Lead</th><th style={thStyle}>Source</th><th style={thStyle}>Status</th></tr></thead>
              <tbody>
                {leads.length === 0 ? <tr><td style={tdStyle} colSpan={3}>No leads yet.</td></tr> : leads.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}><div>{item.name || item.user?.first_name || 'Lead'}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{item.email}</div></td>
                    <td style={tdStyle}>{item.source || 'website'}</td>
                    <td style={tdStyle}>{item.status || 'new'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '14px' }}><Link to="/dashboard/agent/leads" style={{ color: '#38bdf8', textDecoration: 'none' }}>Open Leads & Visitors</Link></div>
        </div>
      </section>
    </div>
  );
};

export default AgentDashboard;
