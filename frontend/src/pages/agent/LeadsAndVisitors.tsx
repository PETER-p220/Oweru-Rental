import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatDate, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

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
        const [leadsRes, statsRes] = await Promise.all([Api.getLeads(), Api.getLeadStats()]);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        setStats(statsRes.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load leads.');
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
      </section>
    </div>
  );
};

export default LeadsAndVisitors;
