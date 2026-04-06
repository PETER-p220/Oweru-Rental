import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { descriptionStyle, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const ShareAndTrack = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getTrackingLinks();
        setLinks(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load tracking links.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => links.filter((item) => `${item.title} ${item.tracking_url}`.toLowerCase().includes(search.toLowerCase())), [links, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Share & Track</h1>
        <p style={descriptionStyle}>Tracking links generated from your current listings.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Links</div><div style={statValueStyle}>{links.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Clicks</div><div style={statValueStyle}>{links.reduce((sum, item) => sum + Number(item.clicks || 0), 0)}</div></div>
          <div style={statCardStyle('#f59e0b')}><div style={statLabelStyle}>Shares</div><div style={statValueStyle}>{links.reduce((sum, item) => sum + Number(item.shares || 0), 0)}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        <input style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }} placeholder="Search tracking links" value={search} onChange={(e) => setSearch(e.target.value)} />
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Tracking URL</th><th style={thStyle}>Clicks</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={3}>Loading tracking links...</td></tr> : filtered.length === 0 ? <tr><td style={tdStyle} colSpan={3}>No tracking links found.</td></tr> : filtered.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.title}</td>
                  <td style={tdStyle}>{item.tracking_url}</td>
                  <td style={tdStyle}>{item.clicks || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ShareAndTrack;
