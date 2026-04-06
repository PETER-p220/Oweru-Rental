import { useEffect, useMemo, useState } from 'react';
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
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
} from './agentPageStyles';

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
    display: 'inline-block', fontSize: '11px', color: '#8a8070',
    background: 'rgba(138,128,112,0.08)', border: '1px solid rgba(138,128,112,0.18)',
    borderRadius: '4px', padding: '2px 8px', fontStyle: 'italic',
  }}>Not set</span>
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

  // Flatten all property rows across all owners for easy filtering + rendering
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
  const totalProps    = allRows.length;

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Linked Owners</h1>
        <p style={descriptionStyle}>
          Properties where landlord contact details have been recorded.
        </p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Owners</div>
            <div style={statValueStyle}>{totalWithInfo}</div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Properties with Info</div>
            <div style={statValueStyle}>{totalProps}</div>
          </div>
          <div style={statCardStyle('#a78bfa')}>
            <div style={statLabelStyle}>Showing</div>
            <div style={statValueStyle}>{filteredRows.length}</div>
          </div>
        </div>
      </section>

      {/* ── Table ── */}
      <section style={panelStyle}>
        <input
          style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }}
          placeholder="Search property, location, landlord name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Property</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Landlord Name</th>
                <th style={thStyle}>Landlord Phone</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={tdStyle} colSpan={5}>Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={5}>
                    No properties with landlord info found.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ prop }) => (
                  <tr key={prop.id}>

                    {/* Property title */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>
                        {prop.title}
                      </span>
                    </td>

                    {/* Location */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', color: '#8ea0b5',
                      }}>
                        <PinIcon />
                        {prop.location || '—'}
                      </span>
                    </td>

                    {/* Landlord name */}
                    <td style={tdStyle}>
                      {prop.landlord_name
                        ? <span style={{ fontSize: '13px' }}>{prop.landlord_name}</span>
                        : <NoBadge />}
                    </td>

                    {/* Landlord phone — tappable */}
                    <td style={tdStyle}>
                      {prop.landlord_phone ? (
                        <a
                          href={`tel:${prop.landlord_phone}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '13px', color: '#38bdf8', textDecoration: 'none',
                          }}
                        >
                          <PhoneIcon />
                          {prop.landlord_phone}
                        </a>
                      ) : <NoBadge />}
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      {prop.landlord_phone ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a
                            href={`tel:${prop.landlord_phone}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              fontSize: '12px', fontWeight: 500,
                              color: '#22c55e',
                              background: 'rgba(34,197,94,0.08)',
                              border: '1px solid rgba(34,197,94,0.2)',
                              borderRadius: '6px', padding: '6px 12px',
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
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              fontSize: '12px', fontWeight: 500,
                              color: '#25d366',
                              background: 'rgba(37,211,102,0.08)',
                              border: '1px solid rgba(37,211,102,0.2)',
                              borderRadius: '6px', padding: '6px 12px',
                              textDecoration: 'none',
                            }}
                          >
                            <WaIcon /> WhatsApp
                          </a>
                        </div>
                      ) : <NoBadge />}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LinkedOwners;