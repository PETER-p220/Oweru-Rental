import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const LinkedOwners = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getLinkedOwners();
        setOwners(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load linked owners.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => owners.filter((item) => `${item.first_name || ''} ${item.last_name || ''} ${item.email || ''}`.toLowerCase().includes(search.toLowerCase())), [owners, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Linked Owners</h1>
        <p style={descriptionStyle}>Landlords already connected to your listings.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Owners</div><div style={statValueStyle}>{owners.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Properties</div><div style={statValueStyle}>{owners.reduce((sum, item) => sum + Number(item.properties_count || 0), 0)}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        <input style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }} placeholder="Search owners" value={search} onChange={(e) => setSearch(e.target.value)} />
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Owner</th><th style={thStyle}>Email</th><th style={thStyle}>Properties</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={4}>Loading owners...</td></tr> : filtered.length === 0 ? <tr><td style={tdStyle} colSpan={4}>No linked owners found.</td></tr> : filtered.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.first_name} {item.last_name}</td>
                  <td style={tdStyle}>{item.email}</td>
                  <td style={tdStyle}>{item.properties_count || 0}</td>
                  <td style={tdStyle}>
                    <a href={`mailto:${item.email}`} style={{ ...buttonStyle('ghost'), textDecoration: 'none', padding: '8px 12px' }}>Email owner</a>
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

export default LinkedOwners;
