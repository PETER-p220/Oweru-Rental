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
      {/* ── Overview panel ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Overview</h1>
        <p style={{ ...descriptionStyle, marginTop: '8px' }}>
          Your dashboard reads from the Laravel agent endpoints so listings, leads, and commissions stay aligned with the backend.
        </p>
        {error && (
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}
        <div style={{ ...statGridStyle, marginTop: '24px' }}>
          <div style={statCardStyle('#2563eb')}>
            <div style={statLabelStyle}>Listings</div>
            <div style={statValueStyle}>{loading ? '—' : stats?.total_listings || 0}</div>
          </div>
          <div style={statCardStyle('#16a34a')}>
            <div style={statLabelStyle}>Active Listings</div>
            <div style={statValueStyle}>{loading ? '—' : stats?.active_listings || 0}</div>
          </div>
          <div style={statCardStyle('#d97706')}>
            <div style={statLabelStyle}>Leads</div>
            <div style={statValueStyle}>{loading ? '—' : stats?.total_leads || 0}</div>
          </div>
          <div style={statCardStyle('#7c3aed')}>
            <div style={statLabelStyle}>Commissions</div>
            <div style={statValueStyle}>{loading ? '—' : formatCurrency(stats?.total_commissions)}</div>
          </div>
        </div>
      </section>

      {/* ── Listings + Leads ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '20px' }}>

        {/* Recent Listings */}
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>Listings</div>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
            Recent Listings
          </h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Owner</th>
                  <th style={thStyle}>Price</th>
                </tr>
              </thead>
              <tbody>
                {listings.length === 0 ? (
                  <tr>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontStyle: 'italic' }} colSpan={3}>
                      No listings yet.
                    </td>
                  </tr>
                ) : listings.map((item) => (
                  <tr key={item.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#1e293b' }}>{item.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>{item.location}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ color: '#475569' }}>{item.owner?.first_name} {item.owner?.last_name}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#2563eb' }}>
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <Link
              to="/dashboard/agent/my-listings"
              style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              View all listings →
            </Link>
          </div>
        </div>

        {/* Recent Leads */}
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>Pipeline</div>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
            Recent Leads
          </h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Lead</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontStyle: 'italic' }} colSpan={3}>
                      No leads yet.
                    </td>
                  </tr>
                ) : leads.map((item) => (
                  <tr key={item.id}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#1e293b' }}>
                        {item.name || item.user?.first_name || 'Lead'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>{item.email}</div>
                    </td>
                    <td style={{ ...tdStyle, color: '#475569', textTransform: 'capitalize' }}>
                      {item.source || 'website'}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={item.status || 'new'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <Link
              to="/dashboard/agent/leads"
              style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              View all leads →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    new:        { bg: '#eff6ff', color: '#2563eb' },
    active:     { bg: '#f0fdf4', color: '#16a34a' },
    approved:   { bg: '#f0fdf4', color: '#16a34a' },
    completed:  { bg: '#f0fdf4', color: '#16a34a' },
    pending:    { bg: '#fffbeb', color: '#d97706' },
    processing: { bg: '#fffbeb', color: '#d97706' },
    rejected:   { bg: '#fef2f2', color: '#dc2626' },
    cancelled:  { bg: '#fef2f2', color: '#dc2626' },
    failed:     { bg: '#fef2f2', color: '#dc2626' },
  };
  const s = map[status.toLowerCase()] ?? { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      background: s.bg,
      color: s.color,
    }}>
      {status}
    </span>
  );
};

export default AgentDashboard;