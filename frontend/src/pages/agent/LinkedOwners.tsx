import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import {
  buttonStyle,
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
        const searchText = search.toLowerCase();
        const ownerInfo =
          `${item.first_name || ''} ${item.last_name || ''} ${item.email || ''} ${item.phone || ''}`.toLowerCase();
        const landlordInfo = [...(item.landlord_names || []), ...(item.landlord_phones || [])]
          .join(' ')
          .toLowerCase();
        return ownerInfo.includes(searchText) || landlordInfo.includes(searchText);
      }),
    [owners, search]
  );

  const totalProperties = owners.reduce((sum, item) => sum + Number(item.properties_count || 0), 0);
  const ownersWithLandlordInfo = owners.filter((o) => o.has_landlord_info).length;

  return (
    <div style={pageStyle}>
      {/* Header */}
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Linked Owners</h1>
        <p style={descriptionStyle}>
          Landlords already connected to your listings and their contact information.
        </p>
        <div style={{ ...statGridStyle, marginTop: '22px' }}>
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Owners</div>
            <div style={statValueStyle}>{owners.length}</div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Properties</div>
            <div style={statValueStyle}>{totalProperties}</div>
          </div>
          <div style={statCardStyle('#a78bfa')}>
            <div style={statLabelStyle}>With Landlord Info</div>
            <div style={statValueStyle}>{ownersWithLandlordInfo}</div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section style={panelStyle}>
        <input
          style={{ ...inputStyle, maxWidth: '340px', marginBottom: '16px' }}
          placeholder="Search by name, email, phone, or landlord info..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Owner Phone</th>
                <th style={thStyle}>Landlord Name(s)</th>
                <th style={thStyle}>Landlord Phone(s)</th>
                <th style={thStyle}>Properties</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={tdStyle} colSpan={7}>
                    Loading owners...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={7}>
                    No linked owners found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    {/* Owner name */}
                    <td style={tdStyle}>
                      {item.first_name} {item.last_name}
                    </td>

                    {/* Email */}
                    <td style={tdStyle}>{item.email}</td>

                    {/* Owner's own phone */}
                    <td style={tdStyle}>{item.phone || '—'}</td>

                    {/* Landlord names from properties */}
                    <td style={tdStyle}>
                      {item.has_landlord_info && item.landlord_names.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {item.landlord_names.map((name, i) => (
                            <span key={i} style={{ fontSize: '13px' }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#8a8070', fontStyle: 'italic', fontSize: '13px' }}>
                          —
                        </span>
                      )}
                    </td>

                    {/* Landlord phones from properties */}
                    <td style={tdStyle}>
                      {item.has_landlord_info && item.landlord_phones.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {item.landlord_phones.map((phone, i) => (
                            <a
                              key={i}
                              href={`tel:${phone}`}
                              style={{ fontSize: '13px', color: '#38bdf8', textDecoration: 'none' }}
                            >
                              {phone}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#8a8070', fontStyle: 'italic', fontSize: '13px' }}>
                          —
                        </span>
                      )}
                    </td>

                    {/* Property count */}
                    <td style={tdStyle}>{item.properties_count || 0}</td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <a
                        href={`mailto:${item.email}`}
                        style={{
                          ...buttonStyle('ghost'),
                          textDecoration: 'none',
                          padding: '8px 12px',
                        }}
                      >
                        Email owner
                      </a>
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