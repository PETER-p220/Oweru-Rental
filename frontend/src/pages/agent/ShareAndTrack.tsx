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

const LinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
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

const POLL_INTERVAL_MS = 15_000;

// ── Component ─────────────────────────────────────────────────────────────────

const ShareAndTrack = () => {
  const [links, setLinks]             = useState<TrackingLink[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copied, setCopied]           = useState<Record<number, boolean>>({});

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
      if (!silent) {
        setError(err?.response?.data?.message || 'Unable to load tracking links.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLinksRef.current = () => fetchLinks(true);
  }, [fetchLinks]);

  useEffect(() => {
    fetchLinks(false);
    const interval = setInterval(() => { fetchLinksRef.current?.(); }, POLL_INTERVAL_MS);
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

  const handleCopy = async (item: TrackingLink) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(item.tracking_url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = item.tracking_url;
        textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setLinks((prev) =>
        prev.map((l) => l.id === item.id ? { ...l, shares: l.shares + 1 } : l)
      );
      await Api.recordShare(item.id);
      fetchLinks(true);

      setCopied((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [item.id]: false })), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const handleWhatsApp = async (item: TrackingLink) => {
    setLinks((prev) =>
      prev.map((l) => l.id === item.id ? { ...l, shares: l.shares + 1 } : l)
    );
    await Api.recordShare(item.id);
    fetchLinks(true);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out this property: ${item.tracking_url}`)}`,
      '_blank'
    );
  };

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Share & Track</h1>
        <p style={descriptionStyle}>
          Tracking links for your listings. Clicks are counted automatically.
          Copy or WhatsApp to share — each share is recorded.
          Counts refresh every {POLL_INTERVAL_MS / 1000}s.
        </p>
        <div style={{ ...statGridStyle, marginTop: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Links</div>
            <div style={statValueStyle}>{links.length}</div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Clicks</div>
            <div style={statValueStyle}>{totalClicks}</div>
          </div>
          <div style={statCardStyle('#f59e0b')}>
            <div style={statLabelStyle}>Shares</div>
            <div style={statValueStyle}>{totalShares}</div>
          </div>
        </div>
      </section>

      {/* ── Cards ── */}
      <section style={panelStyle}>
        {/* Search + refresh row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: '14px' }}
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => fetchLinks(true)}
            disabled={refreshing}
            title="Refresh"
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: 500,
              color: refreshing ? '#6b7280' : '#38bdf8',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshIcon spinning={refreshing} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 12px' }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {error && <div style={{ color: '#f87171', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

        {/* Card list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '14px' }}>
            Loading tracking links…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '14px' }}>
            No tracking links found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              >
                {/* Property title */}
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '6px' }}>
                  {item.title}
                </div>

                {/* Tracking URL */}
                <a
                  href={item.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(() => fetchLinks(true), 2000)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}
                  title={item.tracking_url}
                >
                  <LinkIcon />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.tracking_url}
                  </span>
                </a>

                {/* Stats row */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#38bdf8',
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: '6px',
                    padding: '3px 10px',
                  }}>
                    {item.clicks || 0} clicks
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#f59e0b',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '6px',
                    padding: '3px 10px',
                  }}>
                    {item.shares || 0} shares
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopy(item)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: copied[item.id] ? '#22c55e' : '#c9a84c',
                      background: copied[item.id] ? 'rgba(34,197,94,0.08)' : 'rgba(201,168,76,0.08)',
                      border: `1px solid ${copied[item.id] ? 'rgba(34,197,94,0.25)' : 'rgba(201,168,76,0.25)'}`,
                      borderRadius: '8px',
                      padding: '9px 0',
                      cursor: 'pointer',
                    }}
                  >
                    {copied[item.id] ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                  </button>

                  <button
                    onClick={() => handleWhatsApp(item)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#25d366',
                      background: 'rgba(37,211,102,0.08)',
                      border: '1px solid rgba(37,211,102,0.25)',
                      borderRadius: '8px',
                      padding: '9px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <WaIcon /> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ShareAndTrack;