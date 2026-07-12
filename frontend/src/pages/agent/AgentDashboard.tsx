import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';
import { descriptionStyle, formatCurrency, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

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
          Api.getAgentDashboard(), Api.getMyListings(), Api.getLeads(),
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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh', padding: '0' }}>
      <style>{`
        .agent-two-col {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
        }

        .agent-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .agent-two-col {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .agent-stat-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Agent Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Agent Dashboard</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>
              Your dashboard reads from the Laravel agent endpoints so listings, leads, and commissions stay aligned with the backend.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 40px 0' }}>
        <div className="agent-stat-grid">
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#2563eb' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Listings</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>{loading ? '—' : stats?.total_listings || 0}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#16a34a' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Active Listings</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>{loading ? '—' : stats?.active_listings || 0}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#d97706' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Leads</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>{loading ? '—' : stats?.total_leads || 0}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#7c3aed' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Commissions</div>
            <div style={{ fontSize: 'clamp(16px,3vw,28px)', fontWeight: 800, color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>{loading ? '—' : formatCurrency(stats?.total_commissions)}</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 40px' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        </div>
      )}

      {/* Listings + Leads */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 40px', padding: '0 20px' }}>
        <div className="agent-two-col">
          {/* Recent Listings */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Recent Listings</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Owner</th><th style={thStyle}>Price</th></tr></thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr><td style={{ ...tdStyle, color: '#94a3b8', fontStyle: 'italic' }} colSpan={3}>No listings yet.</td></tr>
                  ) : listings.map((item) => (
                    <tr key={item.id}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{item.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>{item.location}</div>
                      </td>
                      <td style={tdStyle}><div style={{ color: '#475569' }}>{item.owner?.first_name} {item.owner?.last_name}</div></td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#2563eb' }}>{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <Link to="/dashboard/agent/my-listings" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>View all listings →</Link>
            </div>
          </div>

          {/* Recent Leads */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Recent Leads</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Lead</th><th style={thStyle}>Source</th><th style={thStyle}>Status</th></tr></thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td style={{ ...tdStyle, color: '#94a3b8', fontStyle: 'italic' }} colSpan={3}>No leads yet.</td></tr>
                  ) : leads.map((item) => (
                    <tr key={item.id}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{item.name || item.user?.first_name || 'Lead'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>{item.email}</div>
                      </td>
                      <td style={{ ...tdStyle, color: '#475569', textTransform: 'capitalize' }}>{item.source || 'website'}</td>
                      <td style={tdStyle}><StatusBadge status={item.status || 'new'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <Link to="/dashboard/agent/leads" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>View all leads →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    new: { bg: '#eff6ff', color: '#2563eb' }, active: { bg: '#f0fdf4', color: '#16a34a' },
    approved: { bg: '#f0fdf4', color: '#16a34a' }, completed: { bg: '#f0fdf4', color: '#16a34a' },
    pending: { bg: '#fffbeb', color: '#d97706' }, processing: { bg: '#fffbeb', color: '#d97706' },
    rejected: { bg: '#fef2f2', color: '#dc2626' }, cancelled: { bg: '#fef2f2', color: '#dc2626' },
    failed: { bg: '#fef2f2', color: '#dc2626' },
  };
  const s = map[status.toLowerCase()] ?? { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color }}>
      {status}
    </span>
  );
};

export default AgentDashboard;