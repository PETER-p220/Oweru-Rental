import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Api from '../../services/api';
import {
  descriptionStyle,
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
} from './agentPageStyles';

// ── Inline icon components ────────────────────────────────────────────────────

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}
  >
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.572a.75.75 0 00.916.916l5.714-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.376-.217-3.894 1.005 1.005-3.894-.217-.376A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrackingLink {
  id: number;
  title: string;
  tracking_url: string;
  clicks: number;
  shares: number;
  created_at: string;
}

// How often (ms) to silently refresh click/share counts in the background
const POLL_INTERVAL_MS = 15_000;

// ── Component ─────────────────────────────────────────────────────────────────

const ShareAndTrack = () => {
  const [links, setLinks]           = useState<TrackingLink[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Track which row just had its link copied: id → true | undefined
  const [copied, setCopied]         = useState<Record<number, boolean>>({});

  // Keep a ref so the polling interval can always call the latest fetchLinks
  const fetchLinksRef = useRef<() => Promise<void>>(() => fetchLinks(true));

  const fetchLinks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await Api.getTrackingLinks();
      setLinks(Array.isArray(res.data) ? res.data : []);
      setLastUpdated(new Date());
      setError('');
    } catch (err: any) {
      // Only surface errors on the initial (non-silent) load
      if (!silent) {
        setError(err?.response?.data?.message || 'Unable to load tracking links.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Store latest fetchLinks in ref for the interval to use
  useEffect(() => {
    fetchLinksRef.current = () => fetchLinks(true);
  }, [fetchLinks]);

  // Initial load + polling
  useEffect(() => {
    fetchLinks(false);

    const interval = setInterval(() => {
      fetchLinksRef.current?.();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchLinks]);

  const filtered = useMemo(
    () => links.filter((item) =>
      `${item.title} ${item.tracking_url}`.toLowerCase().includes(search.toLowerCase())
    ),
    [links, search]
  );

  const totalClicks = links.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const totalShares = links.reduce((sum, item) => sum + Number(item.shares || 0), 0);

  // Copy link to clipboard, record the share, then immediately refresh counts
  const handleCopy = async (item: TrackingLink) => {
    try {
      await navigator.clipboard.writeText(item.tracking_url);

      // Optimistically increment shares in local state
      setLinks((prev) =>
        prev.map((l) => l.id === item.id ? { ...l, shares: l.shares + 1 } : l)
      );

      // Record on server, then pull fresh counts right away
      await Api.recordShare(item.id);
      fetchLinks(true);   // silent refresh — updates real click count too

      // Show checkmark feedback for 2 s
      setCopied((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [item.id]: false })), 2000);
    } catch {
      // Clipboard not available — just show the URL selected
    }
  };

  // Share via WhatsApp, record the share, then refresh counts
  const handleWhatsApp = async (item: TrackingLink) => {
    setLinks((prev) =>
      prev.map((l) => l.id === item.id ? { ...l, shares: l.shares + 1 } : l)
    );
    await Api.recordShare(item.id);
    fetchLinks(true);   // silent refresh
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out this property: ${item.tracking_url}`)}`,
      '_blank'
    );
  };

  // Manual refresh button handler
  const handleManualRefresh = () => fetchLinks(true);

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Share & Track</h1>
        <p style={descriptionStyle}>
          Tracking links for your listings. Every click on the link is counted automatically.
          Use Copy or WhatsApp to share — each share is recorded too.
          Counts refresh every {POLL_INTERVAL_MS / 1000} seconds automatically.
        </p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Links</div>
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
        {/* Search + refresh row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, maxWidth: '340px' }}
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh counts"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 500,
              color: refreshing ? '#6b7280' : '#38bdf8',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: '6px', padding: '6px 12px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshIcon spinning={refreshing} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          {/* Last-updated timestamp */}
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}

        {/* Spin keyframe injected once */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Tracking URL</th>
                <th style={thStyle}>Clicks</th>
                <th style={thStyle}>Shares</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={tdStyle} colSpan={5}>Loading tracking links…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td style={tdStyle} colSpan={5}>No tracking links found.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>

                    {/* Property title */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</span>
                    </td>

                    {/* Tracking URL — truncated, opens in new tab */}
                    <td style={tdStyle}>
                      <a
                        href={item.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '12px',
                          color: '#38bdf8',
                          textDecoration: 'none',
                          display: 'block',
                          maxWidth: '260px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.tracking_url}
                        // After opening the link (which triggers a backend click increment),
                        // schedule a refresh so the count updates shortly after
                        onClick={() => setTimeout(() => fetchLinks(true), 2000)}
                      >
                        {item.tracking_url}
                      </a>
                    </td>

                    {/* Click count */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '12px', fontWeight: 500,
                        color: '#38bdf8',
                        background: 'rgba(56,189,248,0.08)',
                        border: '1px solid rgba(56,189,248,0.2)',
                        borderRadius: '4px', padding: '2px 10px',
                      }}>
                        {item.clicks || 0}
                      </span>
                    </td>

                    {/* Share count */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '12px', fontWeight: 500,
                        color: '#f59e0b',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '4px', padding: '2px 10px',
                      }}>
                        {item.shares || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Copy link */}
                        <button
                          onClick={() => handleCopy(item)}
                          title="Copy link"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontWeight: 500,
                            color: copied[item.id] ? '#22c55e' : '#c9a84c',
                            background: copied[item.id] ? 'rgba(34,197,94,0.08)' : 'rgba(201,168,76,0.08)',
                            border: `1px solid ${copied[item.id] ? 'rgba(34,197,94,0.2)' : 'rgba(201,168,76,0.2)'}`,
                            borderRadius: '6px', padding: '6px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {copied[item.id] ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                        </button>

                        {/* WhatsApp share */}
                        <button
                          onClick={() => handleWhatsApp(item)}
                          title="Share via WhatsApp"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontWeight: 500,
                            color: '#25d366',
                            background: 'rgba(37,211,102,0.08)',
                            border: '1px solid rgba(37,211,102,0.2)',
                            borderRadius: '6px', padding: '6px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          <WaIcon /> WhatsApp
                        </button>
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