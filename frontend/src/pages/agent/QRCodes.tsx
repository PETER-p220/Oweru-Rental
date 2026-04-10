import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Api from '../../services/api';
import { 
  buttonStyle, 
  descriptionStyle, 
  headingStyle, 
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
  mobileTableContainer,
  mobileCard,
  mobileCardHeader,
  mobileCardTitle,
  mobileCardSection,
  mobileCardLabel,
  mobileCardValue,
  mobileCardActions
} from './agentPageStyles';

// Custom styles for slate-800 background
const slate800PageStyle = {
  ...pageStyle,
  backgroundColor: '#1e293b', // slate-800
  color: '#f8fafc', // slate-50 for text
};

const slate800PanelStyle = {
  ...panelStyle,
  backgroundColor: '#334155', // slate-700
  borderColor: '#475569', // slate-600
};

const slate800TdStyle = {
  ...tdStyle,
  color: '#f8fafc', // slate-50
  borderColor: '#475569', // slate-600
};

const QRCodes = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});

  // Generate QR code for a property
  const generateQRCode = async (propertyId: number, propertyTitle: string) => {
    try {
      // Create tracking URL for the property
      const trackingUrl = `http://rental.oweru.com/property/${propertyId}?agent=8`; // You might want to get the actual agent ID
      
      // Generate QR code data URL with slate-800 theme
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        color: { dark: 'var(--slate-50)', light: 'var(--slate-800)' }, // slate-50 on slate-800
        width: 200,
        margin: 1,
      });
      
      setQrCodes(prev => ({ ...prev, [propertyId]: qrDataUrl }));
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  // Download QR code
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
        
        // Generate QR codes for all listings
        const qrResults = await Promise.all(listings.map(async (item) => {
          try {
            const qrRes = await Api.generateQRCode(item.id);
            return { property: item, qr: qrRes.data };
          } catch {
            return { property: item, qr: null };
          }
        }));
        
        setItems(qrResults);
        
        // Generate QR codes for display
        for (const item of qrResults) {
          if (item.property) {
            await generateQRCode(item.property.id, item.property.title);
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
    <div style={slate800PageStyle}>
      <section style={slate800PanelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>QR Codes</h1>
        <p style={descriptionStyle}>QR records generated per listing from the agent QR endpoint.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Listings</div><div style={statValueStyle}>{items.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Generated</div><div style={statValueStyle}>{items.filter((item) => item.qr).length}</div></div>
        </div>
      </section>
      <section style={slate800PanelStyle}>
        {error && <div style={{ color: '#f87171', marginBottom: '16px' }}>{error}</div>}
        <div style={{ ...tableWrapStyle, backgroundColor: '#334155' }}>
          <table style={{ ...tableStyle, backgroundColor: '#334155' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, backgroundColor: '#475569', color: '#f8fafc' }}>Property</th>
                <th style={{ ...thStyle, backgroundColor: '#475569', color: '#f8fafc' }}>QR Code</th>
                <th style={{ ...thStyle, backgroundColor: '#475569', color: '#f8fafc' }}>Status</th>
                <th style={{ ...thStyle, backgroundColor: '#475569', color: '#f8fafc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={{ ...slate800TdStyle, textAlign: 'center' }} colSpan={4}>Loading QR codes...</td></tr>
              ) : items.length === 0 ? (
                <tr><td style={{ ...slate800TdStyle, textAlign: 'center' }} colSpan={4}>No QR-ready listings found.</td></tr>
              ) : items.map((item) => (
                <tr key={item.property.id}>
                  <td style={slate800TdStyle}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '4px', color: '#f8fafc' }}>{item.property.title}</div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{item.property.location || item.property.address}</div>
                    </div>
                  </td>
                  <td style={slate800TdStyle}>
                    {qrCodes[item.property.id] ? (
                      <img 
                        src={qrCodes[item.property.id]} 
                        alt={`QR Code for ${item.property.title}`}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          border: '1px solid #475569',
                          borderRadius: '4px',
                          background: '#f8fafc'
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#475569',
                        color: '#94a3b8',
                        fontSize: '12px'
                      }}>
                        No QR
                      </div>
                    )}
                  </td>
                  <td style={slate800TdStyle}>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: item.qr ? '#22c55e' : '#ef4444',
                      color: '#f8fafc'
                    }}>
                      {item.qr ? 'Ready' : 'Unavailable'}
                    </span>
                  </td>
                  <td style={slate800TdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {qrCodes[item.property.id] && (
                        <>
                          <button
                            onClick={() => downloadQR(item.property.id, item.property.title)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid #3b82f6',
                              borderRadius: '4px',
                              backgroundColor: '#3b82f6',
                              color: '#f8fafc',
                              cursor: 'pointer'
                            }}
                          >
                            Download
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`http://rental.oweru.com/property/${item.property.id}?agent=8`);
                              alert('Tracking URL copied to clipboard!');
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid #6b7280',
                              borderRadius: '4px',
                              backgroundColor: '#6b7280',
                              color: '#f8fafc',
                              cursor: 'pointer'
                            }}
                          >
                            Copy URL
                          </button>
                        </>
                      )}
                    </div>
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

export default QRCodes;
