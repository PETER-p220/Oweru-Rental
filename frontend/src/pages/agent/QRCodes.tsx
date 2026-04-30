import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Api from '../../services/api';
import {
  descriptionStyle,
  headingStyle,
  sectionTitleStyle,
  statCardStyle,
  statGridStyle,
  statLabelStyle,
  statValueStyle,
} from './agentPageStyles';

// ── Mobile-first styles ───────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  minHeight: '100vh',
  padding: '12px',
  boxSizing: 'border-box',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#334155',
  border: '1px solid #475569',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
};

// ── Component ─────────────────────────────────────────────────────────────────

const QRCodes = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});

  const generateQRCode = async (propertyId: number) => {
    try {
      const trackingUrl = `https://rental.oweru.com/property/${propertyId}?agent=8`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        color: { dark: '#f8fafc', light: '#1e293b' },
        width: 200,
        margin: 1,
      });
      setQrCodes(prev => ({ ...prev, [propertyId]: qrDataUrl }));
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const downloadQR = (propertyId: number, propertyTitle: string) => {
    const qrDataUrl = qrCodes[propertyId];
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${propertyTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${propertyId}.png`;
    a.click();
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const listingsRes = await Api.getMyListings();
        const listings = Array.isArray(listingsRes.data) ? listingsRes.data : [];

        const qrResults = await Promise.all(listings.map(async (item) => {
          try {
            const qrRes = await Api.generateQRCode(item.id);
            return { property: item, qr: qrRes.data };
          } catch {
            return { property: item, qr: null };
          }
        }));

        setItems(qrResults);

        for (const item of qrResults) {
          if (item.property) {
            await generateQRCode(item.property.id);
          }
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load QR codes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>QR Codes</h1>
        <p style={{ ...descriptionStyle, color: '#94a3b8' }}>
          QR records generated per listing from the agent QR endpoint.
        </p>
        <div style={{ ...statGridStyle, marginTop: '16px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Listings</div>
            <div style={statValueStyle}>{items.length}</div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Generated</div>
            <div style={statValueStyle}>{items.filter((item) => item.qr).length}</div>
          </div>
        </div>
      </section>

      {/* ── Card list ── */}
      <section style={panelStyle}>
        {error && <div style={{ color: '#f87171', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '14px' }}>
            Loading QR codes…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '14px' }}>
            No QR-ready listings found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => (
              <div
                key={item.property.id}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                {/* Top row: QR image + property info */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* QR image */}
                  <div style={{ flexShrink: 0 }}>
                    {qrCodes[item.property.id] ? (
                      <img
                        src={qrCodes[item.property.id]}
                        alt={`QR for ${item.property.title}`}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '6px',
                          border: '1px solid #475569',
                          background: '#f8fafc',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '6px',
                        border: '1px solid #475569',
                        background: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '11px',
                      }}>
                        No QR
                      </div>
                    )}
                  </div>

                  {/* Property details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#f8fafc',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.property.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      {item.property.location || item.property.address}
                    </div>
                    {/* Status badge */}
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: item.qr ? '#166534' : '#7f1d1d',
                      color: item.qr ? '#86efac' : '#fca5a5',
                    }}>
                      {item.qr ? 'Ready' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {qrCodes[item.property.id] && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    borderTop: '1px solid #334155',
                    paddingTop: '12px',
                  }}>
                    <button
                      onClick={() => downloadQR(item.property.id, item.property.title)}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        backgroundColor: '#3b82f6',
                        color: '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://rental.oweru.com/property/${item.property.id}?agent=8`
                        );
                        alert('Tracking URL copied!');
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                      }}
                    >
                      Copy URL
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default QRCodes;