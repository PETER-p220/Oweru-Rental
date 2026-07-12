import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'TZS 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(num);
};

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

  const filtered = useMemo(() => 
    listings.filter((item) => 
      `${item.title || ''} ${item.location || ''}`.toLowerCase().includes(search.toLowerCase())
    ), 
    [listings, search]
  );

  return (
    <div style={{ 
      fontFamily: "'DM Sans', system-ui, sans-serif", 
      background: '#F1F5F9', 
      color: '#0F172A', 
      minHeight: '100vh', 
      padding: '0' 
    }}>
      {/* Responsive helpers */}
      <style>{`
        .ml-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) {
          .ml-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        .ml-desktop-table { display: block; }
        .ml-mobile-cards { display: none; }
        @media (max-width: 768px) {
          .ml-desktop-table { display: none !important; }
          .ml-mobile-cards { display: block !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '52px 40px 44px', 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          gap: '20px', 
          flexWrap: 'wrap' 
        }}>
          <div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              letterSpacing: '0.22em', 
              textTransform: 'uppercase', 
              color: '#C89128', 
              marginBottom: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'rgba(200,145,40,0.10)', 
              border: '1px solid rgba(200,145,40,0.28)', 
              padding: '4px 12px' 
            }}>
              Agent Workspace
            </div>
            <h1 style={{ 
              fontSize: 'clamp(20px,3.5vw,28px)', 
              fontWeight: 800, 
              lineHeight: 1.15, 
              letterSpacing: '-0.02em', 
              color: '#FFFFFF', 
              margin: 0 
            }}>
              My Listings
            </h1>
            <p style={{ 
              fontSize: '13px', 
              fontWeight: 400, 
              color: '#94A3B8', 
              margin: '8px 0 0' 
            }}>
              Live listings assigned to your agent account.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 20px' }}>
        <div className="ml-stat-grid">
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#38bdf8' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Total</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {listings.length}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#22c55e' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Available</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {listings.filter((item) => item.available).length}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#f59e0b' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>With Owners</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {listings.filter((item) => item.owner).length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '24px auto 40px', 
        background: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: '12px', 
        overflow: 'hidden' 
      }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input 
              style={{ 
                width: '100%', 
                maxWidth: '340px', 
                padding: '10px 14px', 
                border: '1px solid #E2E8F0', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontFamily: "'DM Sans', system-ui, sans-serif", 
                outline: 'none' 
              }} 
              placeholder="Search listings..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link 
              to="/dashboard/agent/listings/add" 
              style={{ 
                padding: '10px 20px', 
                background: '#C89128', 
                border: 'none', 
                borderRadius: '8px', 
                color: '#FFFFFF', 
                fontSize: '13px', 
                fontWeight: 600, 
                textDecoration: 'none', 
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Add Listing
            </Link>
          </div>

          {error && (
            <div style={{ 
              color: '#dc2626', 
              marginBottom: '16px', 
              padding: '12px 16px', 
              background: 'rgba(220,38,38,0.08)', 
              border: '1px solid rgba(220,38,38,0.25)', 
              borderRadius: '8px', 
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          {/* Desktop table */}
          <div className="ml-desktop-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Owner</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading listings...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No listings found.</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ color: '#94A3B8', marginTop: '4px', fontSize: '13px' }}>{item.location}</div>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {item.owner?.first_name} {item.owner?.last_name}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {formatCurrency(item.price)}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <span style={{ 
                          color: item.available ? '#16a34a' : '#dc2626',
                          fontWeight: 500 
                        }}>
                          {item.available ? 'Available' : 'Occupied'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="ml-mobile-cards">
            {loading ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B' }}>Loading listings...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B' }}>No listings found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((item) => (
                  <div key={item.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{item.title}</div>
                        <div style={{ color: '#94A3B8', marginTop: '2px', fontSize: '12px' }}>{item.location}</div>
                      </div>
                      <span style={{
                        color: item.available ? '#16a34a' : '#dc2626',
                        fontWeight: 600,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.available ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>Owner</div>
                        <div style={{ fontSize: '13px', color: '#0F172A' }}>{item.owner?.first_name} {item.owner?.last_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>Price</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyListings;