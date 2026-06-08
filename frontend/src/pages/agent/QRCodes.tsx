import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Api from '../../services/api';

// ── Component ─────────────────────────────────────────────────────────────────
const QRCodes = () => {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [qrCodes, setQrCodes]   = useState<Record<number, string>>({});
  const [copied, setCopied]     = useState<Record<number, boolean>>({});

  const generateQRCode = async (propertyId: number) => {
    try {
      const url = `https://rental.oweru.com/property/${propertyId}?agent=8`;
      const qr  = await QRCode.toDataURL(url, {
        color: { dark: '#C89128', light: '#0F172A' },
        width: 220, margin: 2,
      });
      setQrCodes(prev => ({ ...prev, [propertyId]: qr }));
    } catch (err) { console.error('QR generation failed:', err); }
  };

  const downloadQR = (propertyId: number, title: string) => {
    const qr = qrCodes[propertyId];
    if (!qr) return;
    const a  = document.createElement('a');
    a.href   = qr;
    a.download = `oweru-qr-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${propertyId}.png`;
    a.click();
  };

  const copyUrl = async (propertyId: number) => {
    const url = `https://rental.oweru.com/property/${propertyId}?agent=8`;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
      else {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.cssText = 'position:fixed;left:-999999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(prev => ({ ...prev, [propertyId]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [propertyId]: false })), 2000);
    } catch { /* unavailable */ }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const listingsRes = await Api.getMyListings();
        const listings    = Array.isArray(listingsRes.data) ? listingsRes.data : [];
        const qrResults   = await Promise.all(listings.map(async (item) => {
          try {
            const qrRes = await Api.generateQRCode(item.id);
            return { property: item, qr: qrRes.data };
          } catch { return { property: item, qr: null }; }
        }));
        setItems(qrResults);
        for (const item of qrResults) if (item.property) await generateQRCode(item.property.id);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load QR codes.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const readyCount = items.filter(i => i.qr).length;

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
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

        .qr-header{
          background:var(--slate-800);
          border-bottom:1px solid var(--border);padding:52px 40px 44px;
        }
        .qr-eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);background:var(--gold-dim);border:1px solid rgba(200,145,40,0.28);padding:4px 12px;margin-bottom:10px;}
        .qr-title{font-family:var(--sans);font-size:clamp(20px,3.5vw,28px);font-weight:800;color:#FFFFFF;margin:0 0 8px;letter-spacing:-.02em;}
        .qr-desc{font-family:var(--sans);font-size:13px;color:var(--slate);font-weight:400;line-height:1.65;max-width:540px;margin-bottom:24px;}

        .qr-stats{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;max-width:1280px;margin:24px auto 0;}
        .qr-stat{background:#FFFFFF;border:1px solid var(--border);border-radius:12px;padding:20px;position:relative;overflow:hidden;}
        .qr-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
        .qr-stat:nth-child(1)::before{background:#38bdf8;}
        .qr-stat:nth-child(2)::before{background:#22c55e;}
        .qr-stat-label{font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--slate);margin-bottom:8px;}
        .qr-stat-val{font-family:var(--sans);font-size:28px;font-weight:800;color:#0F172A;letter-spacing:-.02em;}

        .qr-body{max-width:1280px;margin:24px auto 0;padding:0 40px 40px;}

        .qr-error{background:rgba(220,38,68,.08);border:1px solid rgba(220,38,68,.25);border-left:3px solid var(--danger);border-radius:8px;padding:12px 16px;font-family:var(--sans);font-size:14px;color:#dc2626;margin-bottom:20px;}

        .qr-empty{text-align:center;padding:64px 24px;color:var(--slate);}
        .qr-empty-ico{width:56px;height:56px;border-radius:16px;background:var(--gold-dim);border:1px solid rgba(200,145,40,0.28);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;color:var(--gold);}
        .qr-empty-title{font-family:var(--sans);font-size:22px;font-weight:800;color:#0F172A;margin-bottom:6px;}

        .qr-table-container{background:#FFFFFF;border:1px solid var(--border);border-radius:12px;overflow:hidden;}
        .qr-table{width:100%;border-collapse:collapse;font-family:var(--sans);}
        .qr-table thead{background:#F8FAFC;border-bottom:1px solid var(--border);}
        .qr-table th{padding:12px;text-align:left;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#64748B;border-bottom:1px solid var(--border);}
        .qr-table th:first-child{padding-left:20px;}
        .qr-table th:last-child{padding-right:20px;text-align:center;}
        .qr-table tbody tr{border-bottom:1px solid var(--border);transition:background-color .2s;}
        .qr-table tbody tr:hover{background:#F8FAFC;}
        .qr-table td{padding:12px;color:#0F172A;font-size:13px;vertical-align:middle;}
        .qr-table td:first-child{padding-left:20px;}
        .qr-table td:last-child{padding-right:20px;text-align:center;}

        .qr-td-property{font-family:var(--sans);font-size:13px;font-weight:500;color:#0F172A;line-height:1.3;}
        .qr-td-location{display:flex;align-items:center;gap:4px;font-family:var(--sans);font-size:12px;color:var(--slate);margin-top:4px;}

        .qr-td-qr{width:80px;text-align:center;}
        .qr-td-qr img{width:48px;height:48px;border-radius:8px;background:white;padding:4px;object-fit:contain;}
        .qr-td-qr .placeholder{width:48px;height:48px;border-radius:8px;background:#F1F5F9;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--slate);font-size:10px;margin:0 auto;}

        .qr-td-status{text-align:center;}
        .qr-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:20px;}
        .qr-status.ready{background:rgba(16,185,129,.08);color:#16a34a;border:1px solid rgba(16,185,129,.2);}
        .qr-status.unavail{background:rgba(239,68,68,.08);color:#dc2626;border:1px solid rgba(239,68,68,.2);}
        .qr-status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
        .qr-status.ready .qr-status-dot{background:#16a34a;}
        .qr-status.unavail .qr-status-dot{background:#dc2626;}

        .qr-td-url{font-family:var(--sans);font-size:11px;color:#2563eb;}
        .qr-td-url a{display:flex;align-items:center;gap:6px;color:#2563eb;text-decoration:none;overflow:hidden;}
        .qr-td-url a span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
        .qr-td-url a:hover{color:#1d4ed8;}

        .qr-td-actions{display:flex;gap:8px;justify-content:center;}
        .qr-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:var(--sans);font-size:11px;font-weight:600;border-radius:7px;padding:6px 12px;cursor:pointer;transition:all .18s;border:1px solid;white-space:nowrap;}
        .qr-btn-dl{background:var(--gold);border-color:var(--gold);color:#FFFFFF;}
        .qr-btn-dl:hover{background:var(--gold-lt);border-color:var(--gold-lt);box-shadow:0 2px 8px rgba(200,145,40,.3);}
        .qr-btn-copy{background:transparent;border-color:var(--border);color:var(--slate);}
        .qr-btn-copy:hover{border-color:var(--gold);color:var(--gold);}
        .qr-btn-copied{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.2);color:#16a34a;}

        @media(max-width:768px){
          .qr-table-container{overflow-x:auto;}
          .qr-table{min-width:600px;}
          .qr-table th,.qr-table td{padding:10px 12px;font-size:12px;}
          .qr-td-qr img,.qr-td-qr .placeholder{width:40px;height:40px;}
          .qr-td-url a span{max-width:120px;}
          .qr-btn{font-size:10px;padding:5px 8px;}
          .qr-header{padding:40px 24px 32px;}
          .qr-body{padding:0 24px 24px;}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="qr-header">
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="qr-eyebrow">Agent Workspace</div>
          <h1 className="qr-title">QR Codes</h1>
          <p className="qr-desc">
            Unique QR codes for each of your listings. Scan to open the property page instantly.
            Download for print marketing — flyers, banners, business cards.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="qr-stats">
        <div className="qr-stat">
          <div className="qr-stat-label">Listings</div>
          <div className="qr-stat-val">{items.length}</div>
        </div>
        <div className="qr-stat">
          <div className="qr-stat-label">Ready</div>
          <div className="qr-stat-val">{readyCount}</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="qr-body">
        {error && <div className="qr-error">{error}</div>}

        {loading ? (
          <div className="qr-table-container">
            <table className="qr-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>QR Code</th>
                  <th>Status</th>
                  <th>Tracking URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[0,1,2,3].map(i => (
                  <tr key={i}>
                    <td>
                      <div style={{ height:14, width:'75%', borderRadius:4, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', marginBottom:4 }} />
                      <div style={{ height:11, width:'50%', borderRadius:4, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                    </td>
                    <td className="qr-td-qr">
                      <div className="placeholder">...</div>
                    </td>
                    <td className="qr-td-status">
                      <div className="qr-status unavail">
                        <span className="qr-status-dot" />
                        Loading
                      </div>
                    </td>
                    <td className="qr-td-url">
                      <div style={{ height:11, width:'60%', borderRadius:4, background:'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                    </td>
                    <td className="qr-td-actions">
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
        ) : items.length === 0 ? (
          <div className="qr-empty">
            <div className="qr-empty-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx=".5"/>
                <rect x="18" y="14" width="3" height="3" rx=".5"/><rect x="14" y="18" width="3" height="3" rx=".5"/>
                <rect x="18" y="18" width="3" height="3" rx=".5"/>
              </svg>
            </div>
            <div className="qr-empty-title">No QR Codes Yet</div>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: '#94A3B8' }}>
              QR codes will appear here once your listings are active.
            </p>
          </div>
        ) : (
          <div className="qr-table-container">
            <table className="qr-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>QR Code</th>
                  <th>Status</th>
                  <th>Tracking URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const pid   = item.property.id;
                  const url   = `https://rental.oweru.com/property/${pid}?agent=8`;
                  const hasQR = !!qrCodes[pid];

                  return (
                    <tr key={pid} style={{ animation: `fadeUp 0.3s ease both`, animationDelay: `${idx * 0.05}s` }}>
                      <td>
                        <div className="qr-td-property">{item.property.title}</div>
                        {(item.property.location || item.property.address) && (
                          <div className="qr-td-location">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C89128" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {item.property.location || item.property.address}
                          </div>
                        )}
                      </td>
                      <td className="qr-td-qr">
                        {hasQR ? (
                          <img src={qrCodes[pid]} alt={`QR for ${item.property.title}`} loading="lazy" width="200" height="200" />
                        ) : (
                          <div className="placeholder">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="7" height="7" rx="1"/>
                              <rect x="14" y="3" width="7" height="7" rx="1"/>
                              <rect x="3" y="14" width="7" height="7" rx="1"/>
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="qr-td-status">
                        <span className={`qr-status ${item.qr ? 'ready' : 'unavail'}`}>
                          <span className="qr-status-dot" />
                          {item.qr ? 'Ready' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="qr-td-url">
                        <a href={url} target="_blank" rel="noopener noreferrer" title={url}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                          </svg>
                          <span>{url}</span>
                        </a>
                      </td>
                      <td className="qr-td-actions">
                        {hasQR ? (
                          <>
                            <button onClick={() => downloadQR(pid, item.property.title)} className="qr-btn qr-btn-dl">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              Download
                            </button>
                            <button onClick={() => copyUrl(pid)} className={`qr-btn ${copied[pid] ? 'qr-btn-copied' : 'qr-btn-copy'}`}>
                              {copied[pid] ? (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodes;