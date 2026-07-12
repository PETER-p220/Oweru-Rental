import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';

interface PropertyEntry {
  id: number;
  title: string;
  location: string;
  landlord_name: string | null;
  landlord_phone: string | null;
}

interface LinkedOwner {
  id: number;
  properties_count: number;
  properties_list: PropertyEntry[];
  has_landlord_info: boolean;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const NoBadge = () => (
  <span style={{
    display: 'inline-block', 
    fontSize: '11px', 
    color: '#8a8070',
    background: 'rgba(138,128,112,0.08)', 
    border: '1px solid rgba(138,128,112,0.18)',
    borderRadius: '4px', 
    padding: '2px 8px', 
    fontStyle: 'italic',
  }}>
    Not set
  </span>
);

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.572a.75.75 0 00.916.916l5.714-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.376-.217-3.894 1.005 1.005-3.894-.217-.376A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────

const LinkedOwners = () => {
  const [owners, setOwners] = useState<LinkedOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getLinkedOwners();
        setOwners(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load linked owners.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allRows = useMemo(
    () =>
      owners.flatMap((owner) =>
        (owner.properties_list || []).map((prop) => ({ owner, prop }))
      ),
    [owners]
  );

  const filteredRows = useMemo(() => {
    if (!search) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(({ prop }) =>
      `${prop.title} ${prop.location} ${prop.landlord_name ?? ''} ${prop.landlord_phone ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [allRows, search]);

  const totalWithInfo = owners.length;
  const totalProps = allRows.length;

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
        .lo-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) {
          .lo-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        .lo-desktop-table { display: block; }
        .lo-mobile-cards { display: none; }
        @media (max-width: 768px) {
          .lo-desktop-table { display: none !important; }
          .lo-mobile-cards { display: block !important; }
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
              Linked Owners
            </h1>
            <p style={{ 
              fontSize: '13px', 
              fontWeight: 400, 
              color: '#94A3B8', 
              margin: '8px 0 0' 
            }}>
              Properties where landlord contact details have been recorded.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 20px' }}>
        <div className="lo-stat-grid">
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#38bdf8' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Owners</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {totalWithInfo}
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#22c55e' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Properties with Info</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {totalProps}
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#C89128' }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Showing</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {filteredRows.length}
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
          <input
            style={{ 
              width: '100%', 
              maxWidth: '340px', 
              padding: '10px 14px', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontFamily: "'DM Sans', system-ui, sans-serif", 
              marginBottom: '16px', 
              outline: 'none' 
            }}
            placeholder="Search property, location, landlord name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
          <div className="lo-desktop-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Landlord Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Landlord Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading...</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      No properties with landlord info found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ prop }) => (
                    <tr key={prop.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{prop.title}</span>
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <span style={{
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '12px', 
                          color: '#94A3B8',
                        }}>
                          <PinIcon />
                          {prop.location || '—'}
                        </span>
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {prop.landlord_name ? (
                          <span style={{ fontSize: '13px' }}>{prop.landlord_name}</span>
                        ) : (
                          <NoBadge />
                        )}
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {prop.landlord_phone ? (
                          <a
                            href={`tel:${prop.landlord_phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '13px',
                              color: '#2563eb',
                              textDecoration: 'none',
                            }}
                          >
                            <PhoneIcon />
                            {prop.landlord_phone}
                          </a>
                        ) : (
                          <NoBadge />
                        )}
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {prop.landlord_phone ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <a
                              href={`tel:${prop.landlord_phone}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#16a34a',
                                background: 'rgba(22,163,74,0.08)',
                                border: '1px solid rgba(22,163,74,0.2)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                textDecoration: 'none',
                              }}
                            >
                              <PhoneIcon /> Call
                            </a>
                            <a
                              href={`https://wa.me/${prop.landlord_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#25d366',
                                background: 'rgba(37,211,102,0.08)',
                                border: '1px solid rgba(37,211,102,0.2)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                textDecoration: 'none',
                              }}
                            >
                              <WaIcon /> WhatsApp
                            </a>
                          </div>
                        ) : (
                          <NoBadge />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lo-mobile-cards">
            {loading ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B' }}>Loading...</div>
            ) : filteredRows.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748B' }}>No properties with landlord info found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredRows.map(({ prop }) => (
                  <div key={prop.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{prop.title}</div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#94A3B8',
                      marginBottom: '10px',
                    }}>
                      <PinIcon />
                      {prop.location || '—'}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>Landlord</div>
                        {prop.landlord_name ? (
                          <span style={{ fontSize: '13px' }}>{prop.landlord_name}</span>
                        ) : (
                          <NoBadge />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>Phone</div>
                        {prop.landlord_phone ? (
                          <a href={`tel:${prop.landlord_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
                            <PhoneIcon />
                            {prop.landlord_phone}
                          </a>
                        ) : (
                          <NoBadge />
                        )}
                      </div>
                    </div>

                    {prop.landlord_phone && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={`tel:${prop.landlord_phone}`}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#16a34a',
                            background: 'rgba(22,163,74,0.08)',
                            border: '1px solid rgba(22,163,74,0.2)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            textDecoration: 'none',
                          }}
                        >
                          <PhoneIcon /> Call
                        </a>
                        <a
                          href={`https://wa.me/${prop.landlord_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#25d366',
                            background: 'rgba(37,211,102,0.08)',
                            border: '1px solid rgba(37,211,102,0.2)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            textDecoration: 'none',
                          }}
                        >
                          <WaIcon /> WhatsApp
                        </a>
                      </div>
                    )}
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

export default LinkedOwners;