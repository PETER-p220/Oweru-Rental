import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { descriptionStyle, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

interface TrackingLink {
  id: number;
  title: string;
  tracking_url: string;
  qr_code_url: string;
  shares: number;
  clicks: number;
  created_at: string;
  property: any;
}

const ShareAndTrack = () => {
  const [links, setLinks] = useState<TrackingLink[]>([]);
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
                <th style={thStyle}>QR Code</th>
                <th style={thStyle}>Performance</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={tdStyle} colSpan={6}>Loading tracking links...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={6}>
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
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: copiedId === item.id ? '#22c55e' : '#f3f4f6',
                            color: copiedId === item.id ? 'white' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {copiedId === item.id ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    </td>

                    {/* QR Code */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#6b7280'
                        }}>
                          QR
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.qr_code_url, item.id + 1000)}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy URL
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <a
                          href={item.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        >
                          🔗 Open Link
                        </a>
                        <a
                          href={item.qr_code_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        >
                          📱 View QR
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
