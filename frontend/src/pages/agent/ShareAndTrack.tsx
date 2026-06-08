import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Api from '../../services/api';

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: spinning ? 'spin 1s linear infinite' : 'none', display:'block' }}>
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const WaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.572a.75.75 0 00.916.916l5.714-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.376-.217-3.894 1.005 1.005-3.894-.217-.376A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);
const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrackingLink {
  id: number; title: string; tracking_url: string;
  clicks: number; shares: number; created_at: string;
}
const POLL_INTERVAL_MS = 15_000;

// ── Component ─────────────────────────────────────────────────────────────────
const ShareAndTrack = () => {
  const [links, setLinks]           = useState<TrackingLink[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copied, setCopied]         = useState<Record<number, boolean>>({});
  const fetchLinksRef = useRef<() => Promise<void>>(() => fetchLinks(true));

  const fetchLinks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      const res = await Api.getTrackingLinks();
      setLinks(Array.isArray(res.data) ? res.data : []);
      setLastUpdated(new Date()); setError('');
    } catch (err: any) {
      if (!silent) setError(err?.response?.data?.message || 'Unable to load tracking links.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLinksRef.current = () => fetchLinks(true); }, [fetchLinks]);
  useEffect(() => {
    fetchLinks(false);
    const interval = setInterval(() => { fetchLinksRef.current?.(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchLinks]);

  const filtered = useMemo(
    () => links.filter(item => `${item.title} ${item.tracking_url}`.toLowerCase().includes(search.toLowerCase())),
    [links, search]
  );

  const totalClicks = links.reduce((s, i) => s + Number(i.clicks || 0), 0);
  const totalShares = links.reduce((s, i) => s + Number(i.shares || 0), 0);

  const handleCopy = async (item: TrackingLink) => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(item.tracking_url);
      else {
        const ta = document.createElement('textarea');
        ta.value = item.tracking_url;
        ta.style.cssText = 'position:fixed;left:-999999px;top:-999999px';
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setLinks(prev => prev.map(l => l.id === item.id ? { ...l, shares: l.shares + 1 } : l));
      await Api.recordShare(item.id);
      fetchLinks(true);
      setCopied(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [item.id]: false })), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleWhatsApp = async (item: TrackingLink) => {
    setLinks(prev => prev.map(l => l.id === item.id ? { ...l, shares: l.shares + 1 } : l));
    await Api.recordShare(item.id);
    fetchLinks(true);
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this property: ${item.tracking_url}`)}`, '_blank');
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh', padding: '0' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;}
        :root{
          --gold:#C89128;--gold-lt:#D4A843;--gold-dim:rgba(200,145,40,0.12);
          --slate-800:#1E293B;--slate-700:#334155;--slate-600:#475569;
          --cream:#F8F8F9;--slate:#94A3B8;--border:#E2E8F0;
          --success:#10b981;--danger:#ef4444;
          --sans:'DM Sans',system-ui,sans-serif;
        }
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

        .sat-header{
          background:var(--slate-800);
          border-bottom:1px solid var(--border);padding:52px 40px 44px;
        }
        .sat-eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);background:var(--gold-dim);border:1px solid rgba(200,145,40,0.28);padding:4px 12px;margin-bottom:10px;}
        .sat-title{font-family:var(--sans);font-size:clamp(20px,3.5vw,28px);font-weight:800;color:#FFFFFF;margin:0 0 8px;letter-spacing:-.02em;}
        .sat-desc{font-family:var(--sans);font-size:13px;color:var(--slate);font-weight:400;line-height:1.65;max-width:540px;margin-bottom:24px;}

        .sat-stats{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;max-width:1280px;margin:24px auto 0;}
        .sat-stat{background:#FFFFFF;border:1px solid var(--border);border-radius:12px;padding:20px;position:relative;overflow:hidden;}
        .sat-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
        .sat-stat:nth-child(1)::before{background:var(--gold);}
        .sat-stat:nth-child(2)::before{background:var(--success);}
        .sat-stat:nth-child(3)::before{background:#f59e0b;}
        .sat-stat-label{font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--slate);margin-bottom:8px;}
        .sat-stat-val{font-family:var(--sans);font-size:28px;font-weight:800;color:#0F172A;letter-spacing:-.02em;}

        .sat-body{max-width:1280px;margin:24px auto 0;padding:0 40px 40px;}

        .sat-toolbar{display:flex;gap:8px;margin-bottom:20px;align-items:center;}
        .sat-search{flex:1;min-width:0;display:flex;align-items:center;background:#FFFFFF;border:1px solid var(--border);border-radius:8px;overflow:hidden;transition:border-color .18s;}
        .sat-search:focus-within{border-color:var(--gold);}
        .sat-search-ico{padding:0 12px;color:var(--slate);display:flex;align-items:center;flex-shrink:0;}
        .sat-search-inp{flex:1;background:transparent;border:none;outline:none;color:#0F172A;font-family:var(--sans);font-size:14px;padding:10px 10px 10px 0;}
        .sat-search-inp::placeholder{color:rgba(148,163,184,.5);}
        .sat-refresh{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:12px;font-weight:600;border-radius:8px;padding:9px 14px;cursor:pointer;white-space:nowrap;transition:all .18s;flex-shrink:0;}
        .sat-refresh:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
        .sat-refresh:disabled{cursor:not-allowed;opacity:.5;}

        .sat-meta{font-family:var(--sans);font-size:11px;color:var(--slate);margin-bottom:16px;display:flex;align-items:center;gap:6px;}
        .sat-meta-dot{width:6px;height:6px;border-radius:50%;background:var(--success);animation:blink 2s infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

        .sat-error{background:rgba(220,38,68,.08);border:1px solid rgba(220,38,68,.25);border-left:3px solid var(--danger);border-radius:8px;padding:12px 16px;font-family:var(--sans);font-size:14px;color:#dc2626;margin-bottom:16px;}

        .sat-empty{text-align:center;padding:56px 24px;color:var(--slate);font-family:var(--sans);font-size:14px;}
        .sat-empty-ico{width:52px;height:52px;border-radius:14px;background:var(--gold-dim);border:1px solid rgba(200,145,40,0.28);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--gold);}

        .sat-table-container{background:#FFFFFF;border:1px solid var(--border);border-radius:12px;overflow:hidden;}
        .sat-table{width:100%;border-collapse:collapse;font-family:var(--sans);}
        .sat-table thead{background:#F8FAFC;border-bottom:1px solid var(--border);}
        .sat-table th{padding:12px;text-align:left;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#64748B;border-bottom:1px solid var(--border);}
        .sat-table th:first-child{padding-left:20px;width:40px;}
        .sat-table th:last-child{padding-right:20px;text-align:center;width:180px;}
        .sat-table tbody tr{border-bottom:1px solid var(--border);transition:background-color .2s;}
        .sat-table tbody tr:hover{background:#F8FAFC;}
        .sat-table td{padding:12px;color:#0F172A;font-size:13px;vertical-align:middle;}
        .sat-table td:first-child{padding-left:20px;}
        .sat-table td:last-child{padding-right:20px;text-align:center;}

        .sat-td-num{width:40px;text-align:center;}
        .sat-td-num-inner{width:28px;height:28px;border-radius:8px;background:var(--gold-dim);border:1px solid rgba(200,145,40,0.28);display:flex;align-items:center;justify-content:center;font-family:var(--sans);font-size:11px;font-weight:600;color:var(--gold);margin:0 auto;}

        .sat-td-property{font-family:var(--sans);font-size:13px;font-weight:500;color:#0F172A;letter-spacing:-.01em;line-height:1.3;max-width:300px;}

        .sat-td-url{font-family:var(--sans);font-size:11px;color:#2563eb;}
        .sat-td-url a{display:flex;align-items:center;gap:6px;color:#2563eb;text-decoration:none;overflow:hidden;}
        .sat-td-url a span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
        .sat-td-url a:hover{color:#1d4ed8;}

        .sat-td-stats{display:flex;gap:8px;align-items:center;}
        .sat-badge{display:inline-flex;align-items:center;gap:4px;font-family:var(--sans);font-size:11px;font-weight:600;border-radius:20px;padding:3px 10px;border:1px solid;}
        .sat-badge-clicks{color:#0ea5e9;background:rgba(14,165,233,.08);border-color:rgba(14,165,233,.2);}
        .sat-badge-shares{color:#f59e0b;background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.2);}
        .sat-date{font-family:var(--sans);font-size:11px;color:var(--slate);margin-left:auto;white-space:nowrap;}

        .sat-td-actions{display:flex;gap:8px;justify-content:center;}
        .sat-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:var(--sans);font-size:11px;font-weight:600;border-radius:7px;padding:6px 12px;cursor:pointer;transition:all .18s;border:1px solid;white-space:nowrap;}
        .sat-btn-copy{color:var(--gold);background:var(--gold-dim);border-color:rgba(200,145,40,.3);}
        .sat-btn-copy:hover{background:rgba(200,145,40,.2);border-color:var(--gold);}
        .sat-btn-copied{color:#16a34a;background:rgba(22,163,74,.08);border-color:rgba(22,163,74,.2);}
        .sat-btn-wa{color:#25d366;background:rgba(37,211,102,.08);border-color:rgba(37,211,102,.25);}
        .sat-btn-wa:hover{background:rgba(37,211,102,.15);border-color:rgba(37,211,102,.5);}

        @media(max-width:768px){
          .sat-table-container{overflow-x:auto;}
          .sat-table{min-width:600px;}
          .sat-table th,.sat-table td{padding:10px 12px;font-size:12px;}
          .sat-td-property{max-width:200px;font-size:13px;}
          .sat-td-url a span{max-width:120px;}
          .sat-btn{font-size:10px;padding:5px 8px;}
          .sat-header{padding:40px 24px 32px;}
          .sat-body{padding:0 24px 24px;}
        }

        @media(max-width:600px){
          .sat-stats{grid-template-columns:1fr 1fr;}
          .sat-stats .sat-stat:last-child{grid-column:1/-1;}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="sat-header">
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="sat-eyebrow">Agent Workspace</div>
          <h1 className="sat-title">Share & Track</h1>
          <p className="sat-desc">
            Tracking links for your listings. Clicks are recorded automatically when someone opens your link.
            Copy or share via WhatsApp — every share is counted. Auto-refreshes every {POLL_INTERVAL_MS / 1000}s.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="sat-stats">
        <div className="sat-stat">
          <div className="sat-stat-label">Total Links</div>
          <div className="sat-stat-val">{links.length}</div>
        </div>
        <div className="sat-stat">
          <div className="sat-stat-label">Total Clicks</div>
          <div className="sat-stat-val">{totalClicks}</div>
        </div>
        <div className="sat-stat">
          <div className="sat-stat-label">Total Shares</div>
          <div className="sat-stat-val">{totalShares}</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="sat-body">
        {/* Toolbar */}
        <div className="sat-toolbar">
          <div className="sat-search">
            <span className="sat-search-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input className="sat-search-inp" placeholder="Search properties…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => fetchLinks(true)} disabled={refreshing} className="sat-refresh"
            style={{ color: refreshing ? '#94A3B8' : '#C89128', background: 'rgba(200,145,40,0.12)', border: '1px solid rgba(200,145,40,0.25)' }}>
            <RefreshIcon spinning={refreshing} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="sat-meta">
            <span className="sat-meta-dot" />
            Live · last updated at {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {error && <div className="sat-error">{error}</div>}

        {/* Table */}
        {loading ? (
          <div className="sat-table-container">
            <table className="sat-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Property</th>
                  <th>Tracking URL</th>
                  <th>Stats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[0,1,2].map(i => (
                  <tr key={i}>
                    <td className="sat-td-num">
                      <div className="sat-td-num-inner">...</div>
                    </td>
                    <td>
                      <div style={{ height:14, width:'60%', borderRadius:4, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                    </td>
                    <td className="sat-td-url">
                      <div style={{ height:11, width:'75%', borderRadius:4, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                    </td>
                    <td className="sat-td-stats">
                      <div style={{ display:'flex', gap:8 }}>
                        <div style={{ width:50, height:20, borderRadius:20, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                        <div style={{ width:50, height:20, borderRadius:20, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                      </div>
                    </td>
                    <td className="sat-td-actions">
                      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                        <div style={{ width:60, height:28, borderRadius:7, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                        <div style={{ width:60, height:28, borderRadius:7, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sat-empty">
            <div className="sat-empty-ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
              No tracking links found
            </div>
            <div>
              {search ? 'Try a different search term.' : 'Tracking links will appear here once your listings are live.'}
            </div>
          </div>
        ) : (
          <div className="sat-table-container">
            <table className="sat-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Property</th>
                  <th>Tracking URL</th>
                  <th>Stats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} style={{ animation: `fadeUp 0.3s ease both`, animationDelay: `${idx * 0.05}s` }}>
                    <td className="sat-td-num">
                      <div className="sat-td-num-inner">{idx + 1}</div>
                    </td>
                    <td>
                      <div className="sat-td-property">{item.title}</div>
                    </td>
                    <td className="sat-td-url">
                      <a href={item.tracking_url} target="_blank" rel="noopener noreferrer"
                        onClick={() => setTimeout(() => fetchLinks(true), 2000)}
                        title={item.tracking_url}>
                        <LinkIcon />
                        <span>{item.tracking_url}</span>
                      </a>
                    </td>
                    <td className="sat-td-stats">
                      <span className="sat-badge sat-badge-clicks">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {item.clicks || 0}
                      </span>
                      <span className="sat-badge sat-badge-shares">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="18" cy="5" r="3"/>
                          <circle cx="6" cy="12" r="3"/>
                          <circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        {item.shares || 0}
                      </span>
                      <span className="sat-date">
                        {new Date(item.created_at).toLocaleDateString('en-TZ', { day:'numeric', month:'short' })}
                      </span>
                    </td>
                    <td className="sat-td-actions">
                      <button onClick={() => handleCopy(item)} className={`sat-btn ${copied[item.id] ? 'sat-btn-copied' : 'sat-btn-copy'}`}>
                        {copied[item.id] ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                      </button>
                      <button onClick={() => handleWhatsApp(item)} className="sat-btn sat-btn-wa">
                        <WaIcon /> WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareAndTrack;