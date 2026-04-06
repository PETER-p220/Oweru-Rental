import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { descriptionStyle, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const ShareAndTrack = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  const filtered = useMemo(() => 
    links.filter((item) => 
      `${item.title} ${item.tracking_url} ${item.property?.location || ''}`.toLowerCase().includes(search.toLowerCase())
    ), 
    [links, search]
  );

  const totalClicks = useMemo(() => 
    links.reduce((sum, item) => sum + Number(item.clicks || 0), 0)
  , [links]);

  const totalShares = useMemo(() => 
    links.reduce((sum, item) => sum + Number(item.shares || 0), 0)
  , [links]);

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const trackShare = async (propertyId: number) => {
    try {
      await Api.trackShare(propertyId);
      // Refresh data to update share counts
      const res = await Api.getTrackingLinks();
      setLinks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to track share:', err);
    }
  };

  const debugProperty = async (propertyId: number) => {
    try {
      const result = await Api.debugProperty(propertyId);
      alert(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Debug failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Share & Track</h1>
        <p style={descriptionStyle}>Generate tracking links and QR codes for your property listings.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Properties</div>
            <div style={statValueStyle}>{links.length}</div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Total Clicks</div>
            <div style={statValueStyle}>{totalClicks}</div>
          </div>
          <div style={statCardStyle('#f59e0b')}>
            <div style={statLabelStyle}>Total Shares</div>
            <div style={statValueStyle}>{totalShares}</div>
          </div>
        </div>
      </section>

      {/* ── Table ── */}
      <section style={panelStyle}>
        <input 
          style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }} 
          placeholder="Search by property title or location..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Tracking URL</th>
                <th style={thStyle}>Performance</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={tdStyle} colSpan={5}>Loading tracking links...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={5}>
                    {search ? 'No tracking links found matching your search.' : 'No tracking links found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    {/* Property Title */}
                    <td style={tdStyle}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          Added {formatDate(item.created_at)}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={tdStyle}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', color: '#8ea0b5',
                      }}>
                        📍 {item.property?.location || '—'}
                      </span>
                    </td>

                    {/* Tracking URL */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#374151', 
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          maxWidth: '200px'
                        }}>
                          {item.tracking_url}
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.tracking_url, item.id)}
                          style={{
                            fontSize: '10px',
                            padding: '4px 8px',
                            background: copiedId === item.id ? '#22c55e' : '#f3f4f6',
                            color: copiedId === item.id ? 'white' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {copiedId === item.id ? '✓ Copied' : '� Copy URL'}
                        </button>
                      </div>
                    </td>

                    {/* Performance */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>👁️</span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>
                            {item.clicks || 0}
                          </span>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>clicks</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>🔗</span>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>
                            {item.shares || 0}
                          </span>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>shares</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={item.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        >
                          🔗 Open Tracking Link
                        </a>
                        <button
                          onClick={() => debugProperty(item.id)}
                          style={{
                            fontSize: '10px',
                            padding: '6px 12px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          🔍 Debug Property
                        </button>
                        <button
                          onClick={() => trackShare(item.id)}
                          style={{
                            fontSize: '10px',
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          📊 Log Share
                        </button>
                        <a
                          href={item.qr_code_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        >
                          � View QR Code
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ShareAndTrack;
