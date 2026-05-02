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
    <div style={{ background: '#0F172A', minHeight: '100vh', padding: '0 0 40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,300;0,400;0,600;1,300&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        :root{
          --gold:#C89128;--gold-lt:#D4A843;--gold-dim:rgba(200,145,40,0.12);
          --navy-900:#0F172A;--navy-800:#162035;--navy-700:#1E2D4A;
          --cream:#F8F8F9;--slate:#94A3B8;--border:rgba(200,145,40,0.18);
          --success:#10b981;--danger:#ef4444;
          --sans:'Jost',sans-serif;--serif:'Playfair Display',Georgia,serif;
        }
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes qr-reveal{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}

        .qr-header{
          background:linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%);
          border-bottom:1px solid var(--border);padding:40px 24px 32px;
        }
        .qr-eyebrow{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);background:var(--gold-dim);border:1px solid var(--border);padding:4px 12px;margin-bottom:14px;}
        .qr-title{font-family:var(--serif);font-size:clamp(24px,4vw,36px);font-weight:300;color:var(--cream);margin:0 0 8px;letter-spacing:-.02em;}
        .qr-title em{font-style:italic;color:var(--gold);}
        .qr-desc{font-family:var(--sans);font-size:13px;color:var(--slate);font-weight:300;line-height:1.65;max-width:540px;margin-bottom:24px;}

        .qr-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:340px;}
        .qr-stat{background:var(--navy-800);border:1px solid var(--border);border-radius:12px;padding:16px 18px;position:relative;overflow:hidden;}
        .qr-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
        .qr-stat:nth-child(1)::before{background:var(--gold);}
        .qr-stat:nth-child(2)::before{background:var(--success);}
        .qr-stat-label{font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--slate);margin-bottom:8px;}
        .qr-stat-val{font-family:var(--serif);font-size:28px;font-weight:300;color:var(--cream);}

        .qr-body{max-width:800px;margin:0 auto;padding:28px 16px;}

        .qr-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-left:3px solid var(--danger);border-radius:8px;padding:12px 16px;font-family:var(--sans);font-size:13px;color:var(--danger);margin-bottom:20px;}

        .qr-empty{text-align:center;padding:64px 24px;color:var(--slate);}
        .qr-empty-ico{width:56px;height:56px;border-radius:16px;background:var(--gold-dim);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;color:var(--gold);}
        .qr-empty-title{font-family:var(--serif);font-size:22px;font-weight:300;color:var(--cream);margin-bottom:6px;}

        .qr-table-container{background:var(--navy-800);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
        .qr-table{width:100%;border-collapse:collapse;font-family:var(--sans);}
        .qr-table thead{background:linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%);border-bottom:2px solid var(--border);}
        .qr-table th{padding:14px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);border-bottom:1px solid var(--border);}
        .qr-table th:first-child{padding-left:20px;}
        .qr-table th:last-child{padding-right:20px;text-align:center;}
        .qr-table tbody tr{border-bottom:1px solid rgba(200,145,40,.08);transition:background-color .2s;}
        .qr-table tbody tr:hover{background:rgba(200,145,40,.04);}
        .qr-table td{padding:12px 16px;color:var(--cream);font-size:13px;vertical-align:middle;}
        .qr-table td:first-child{padding-left:20px;}
        .qr-table td:last-child{padding-right:20px;text-align:center;}

        .qr-td-property{font-family:var(--serif);font-size:14px;font-weight:400;color:var(--cream);line-height:1.3;}
        .qr-td-location{display:flex;align-items:center;gap:5px;font-family:var(--sans);font-size:12px;color:var(--slate);margin-top:2px;}

        .qr-td-qr{width:80px;text-align:center;}
        .qr-td-qr img{width:48px;height:48px;border-radius:8px;background:white;padding:4px;object-fit:contain;}
        .qr-td-qr .placeholder{width:48px;height:48px;border-radius:8px;background:var(--navy-700);border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--slate);font-size:10px;margin:0 auto;}

        .qr-td-status{text-align:center;}
        .qr-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:20px;}
        .qr-status.ready{background:rgba(16,185,129,.12);color:var(--success);border:1px solid rgba(16,185,129,.25);}
        .qr-status.unavail{background:rgba(239,68,68,.1);color:var(--danger);border:1px solid rgba(239,68,68,.2);}
        .qr-status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
        .qr-status.ready .qr-status-dot{background:var(--success);}
        .qr-status.unavail .qr-status-dot{background:var(--danger);}

        .qr-td-url{font-family:var(--monospace,monospace);font-size:11px;color:var(--gold);}
        .qr-td-url a{display:flex;align-items:center;gap:6px;color:var(--gold);text-decoration:none;overflow:hidden;}
        .qr-td-url a span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
        .qr-td-url a:hover{color:var(--gold-lt);}

        .qr-td-actions{display:flex;gap:8px;justify-content:center;}
        .qr-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:var(--sans);font-size:11px;font-weight:600;border-radius:7px;padding:6px 12px;cursor:pointer;transition:all .18s;border:1px solid;white-space:nowrap;}
        .qr-btn-dl{background:var(--gold);border-color:var(--gold);color:var(--navy-900);}
        .qr-btn-dl:hover{background:var(--gold-lt);border-color:var(--gold-lt);box-shadow:0 2px 8px rgba(200,145,40,.3);}
        .qr-btn-copy{background:transparent;border-color:var(--border);color:var(--slate);}
        .qr-btn-copy:hover{border-color:var(--gold);color:var(--gold);}
        .qr-btn-copied{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.3);color:var(--success);}

        @media(max-width:768px){
          .qr-table-container{overflow-x:auto;}
          .qr-table{min-width:600px;}
          .qr-table th,.qr-table td{padding:10px 12px;font-size:12px;}
          .qr-td-qr img,.qr-td-qr .placeholder{width:40px;height:40px;}
          .qr-td-url a span{max-width:120px;}
          .qr-btn{font-size:10px;padding:5px 8px;}
        }
      `}</style>

      {/* ── Header ── */}
      <div className="qr-header">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="qr-eyebrow">Agent Workspace</div>
          <h1 className="qr-title">QR <em>Codes</em></h1>
          <p className="qr-desc">
            Unique QR codes for each of your listings. Scan to open the property page instantly.
            Download for print marketing — flyers, banners, business cards.
          </p>
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
                      <div style={{ height:14, width:'75%', borderRadius:4, background:'linear-gradient(90deg,#1E2D4A 25%,#243350 50%,#1E2D4A 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', marginBottom:4 }} />
                      <div style={{ height:11, width:'50%', borderRadius:4, background:'linear-gradient(90deg,#1E2D4A 25%,#243350 50%,#1E2D4A 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
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
                      <div style={{ height:11, width:'60%', borderRadius:4, background:'linear-gradient(90deg,#1E2D4A 25%,#243350 50%,#1E2D4A 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                    </td>
                    <td className="qr-td-actions">
                      <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                        <div style={{ width:60, height:28, borderRadius:7, background:'linear-gradient(90deg,#1E2D4A 25%,#243350 50%,#1E2D4A 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                        <div style={{ width:60, height:28, borderRadius:7, background:'linear-gradient(90deg,#1E2D4A 25%,#243350 50%,#1E2D4A 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
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
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, color: '#94A3B8' }}>
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
                          <span style={{ color: 'var(--slate)', fontSize: '11px' }}>—</span>
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