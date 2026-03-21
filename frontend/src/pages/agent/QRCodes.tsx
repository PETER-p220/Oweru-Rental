import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const QRCodes = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>QR Codes</h1>
        <p style={descriptionStyle}>QR records generated per listing from the agent QR endpoint.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Listings</div><div style={statValueStyle}>{items.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Generated</div><div style={statValueStyle}>{items.filter((item) => item.qr).length}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>QR URL</th><th style={thStyle}>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={3}>Loading QR codes...</td></tr> : items.length === 0 ? <tr><td style={tdStyle} colSpan={3}>No QR-ready listings found.</td></tr> : items.map((item) => (
                <tr key={item.property.id}>
                  <td style={tdStyle}>{item.property.title}</td>
                  <td style={tdStyle}>{item.qr?.url || 'Unavailable'}</td>
                  <td style={tdStyle}>{item.qr ? 'Ready' : 'Unavailable'}</td>
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
