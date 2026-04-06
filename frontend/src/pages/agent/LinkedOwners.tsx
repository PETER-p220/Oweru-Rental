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

interface LinkedOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  properties_count: number;
  landlord_names: string[];
  landlord_phones: string[];
  has_landlord_info: boolean;
}

// ── Small helpers ──────────────────────────────────────────────────────────────

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

  const filtered = useMemo(
    () =>
      owners.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return [...(item.landlord_names || []), ...(item.landlord_phones || [])]
          .join(' ')
          .toLowerCase()
          .includes(q);
      }),
    [owners, search]
  );

  const totalProperties = owners.reduce((sum, item) => sum + Number(item.properties_count || 0), 0);
  const withInfo = owners.filter((o) => o.has_landlord_info).length;

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Linked Owners</h1>
        <p style={descriptionStyle}>Landlord contact details saved against your listings.</p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Total Linked</div>
            <div style={statValueStyle}>{owners.length}</div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Properties</div>
            <div style={statValueStyle}>{totalProperties}</div>
          </div>
          <div style={statCardStyle('#a78bfa')}>
            <div style={statLabelStyle}>With Contact Info</div>
            <div style={statValueStyle}>{withInfo}</div>
          </div>
        </div>
      </section>

      {/* ── Table ── */}
      <section style={panelStyle}>
        <input
          style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }}
          placeholder="Search landlord name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Landlord Name</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Properties</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={tdStyle} colSpan={4}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td style={tdStyle} colSpan={4}>No landlord info found.</td></tr>
              ) : (
                filtered.flatMap((item) => {
                  const names  = item.landlord_names?.length  ? item.landlord_names  : [null];
                  const phones = item.landlord_phones?.length ? item.landlord_phones : [null];
                  const rowCount = Math.max(names.length, phones.length);

                  return Array.from({ length: rowCount }, (_, i) => {
                    const name    = names[i]  ?? null;
                    const phone   = phones[i] ?? null;
                    const isFirst = i === 0;

                    return (
                      <tr key={`${item.id}-${i}`}>

                        {/* Landlord name */}
                        <td style={tdStyle}>
                          {name
                            ? <span style={{ fontSize: '13px' }}>{name}</span>
                            : <NoBadge />}
                        </td>

                        {/* Landlord phone — tappable */}
                        <td style={tdStyle}>
                          {phone ? (
                            <a
                              href={`tel:${phone}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                fontSize: '13px', color: '#38bdf8', textDecoration: 'none',
                              }}
                            >
                              <PhoneIcon />
                              {phone}
                            </a>
                          ) : <NoBadge />}
                        </td>

                        {/* Properties count — first row of this owner only */}
                        <td style={tdStyle}>
                          {isFirst && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '12px', fontWeight: 500,
                              color: '#22c55e',
                              background: 'rgba(34,197,94,0.08)',
                              border: '1px solid rgba(34,197,94,0.2)',
                              borderRadius: '4px', padding: '2px 10px',
                            }}>
                              {item.properties_count || 0}
                            </span>
                          )}
                        </td>

                        {/* Actions — first row only, only when phone exists */}
                        <td style={tdStyle}>
                          {isFirst ? (
                            phone ? (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {/* Call */}
                                <a
                                  href={`tel:${phone}`}
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

                                {/* WhatsApp */}
                                <a
                                  href={`https://wa.me/${phone.replace(/\D/g, '')}`}
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
                            ) : <NoBadge />
                          ) : null}
                        </td>

                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LinkedOwners;