import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, statCardStyle, statGridStyle, statLabelStyle, statValueStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const MyListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getMyListings();
        setListings(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load listings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => listings.filter((item) => `${item.title} ${item.location}`.toLowerCase().includes(search.toLowerCase())), [listings, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>My Listings</h1>
        <p style={descriptionStyle}>Live listings assigned to your agent account.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}><div style={statLabelStyle}>Total</div><div style={statValueStyle}>{listings.length}</div></div>
          <div style={statCardStyle('#22c55e')}><div style={statLabelStyle}>Available</div><div style={statValueStyle}>{listings.filter((item) => item.available).length}</div></div>
          <div style={statCardStyle('#f59e0b')}><div style={statLabelStyle}>With Owners</div><div style={statValueStyle}>{listings.filter((item) => item.owner).length}</div></div>
        </div>
      </section>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, maxWidth: '340px' }} placeholder="Search listings" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Link to="/dashboard/agent/listings/add" style={{ ...buttonStyle('primary'), textDecoration: 'none' }}>Add Listing</Link>
        </div>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Property</th><th style={thStyle}>Owner</th><th style={thStyle}>Price</th><th style={thStyle}>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={4}>Loading listings...</td></tr> : filtered.length === 0 ? <tr><td style={tdStyle} colSpan={4}>No listings found.</td></tr> : filtered.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}><div>{item.title}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{item.location}</div></td>
                  <td style={tdStyle}>{item.owner?.first_name} {item.owner?.last_name}</td>
                  <td style={tdStyle}>{formatCurrency(item.price)}</td>
                  <td style={tdStyle}>{item.available ? 'Available' : 'Occupied'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MyListings;
