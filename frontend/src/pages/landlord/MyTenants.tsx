import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import {
  descriptionStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingStyle,
  inputStyle,
  metricCardStyle,
  metricGridStyle,
  pageStyle,
  panelStyle,
  sectionTitleStyle,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
} from './landlordPageStyles';

interface TenantItem {
  id: number;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  property?: {
    title?: string;
    location?: string;
  };
  contract?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    rent_amount?: number | string;
  };
}

const MyTenants = () => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await Api.getMyTenants();
        setTenants(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load tenants.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tenants;

    return tenants.filter((tenant) => {
      const haystack = [
        tenant.user?.first_name,
        tenant.user?.last_name,
        tenant.user?.email,
        tenant.property?.title,
        tenant.property?.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, tenants]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>My Tenants</h1>
        <p style={descriptionStyle}>
          Active tenant records loaded from the owner tenants endpoint, with contract dates and rent amounts connected to your live Laravel data.
        </p>

        <div style={{ ...metricGridStyle, marginTop: '22px' }}>
          <div style={metricCardStyle}>
            <div style={{ color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Active tenants</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{tenants.length}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Search</div>
            <input style={{ ...inputStyle, marginTop: '8px' }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tenants or properties" />
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ marginBottom: '16px', color: 'var(--accent-color)' }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading tenants...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No tenants matched your search.</div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Contract</th>
                  <th style={thStyle}>Rent</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant) => (
                  <tr key={tenant.id}>
                    <td style={tdStyle}>
                      <div>{tenant.user?.first_name} {tenant.user?.last_name}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{tenant.user?.email || 'No email'}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{tenant.user?.phone || 'No phone'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{tenant.property?.title || 'Untitled property'}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{tenant.property?.location || 'No location'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{formatDate(tenant.contract?.start_date)} to {formatDate(tenant.contract?.end_date)}</div>
                    </td>
                    <td style={tdStyle}>{formatCurrency(tenant.contract?.rent_amount)}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(tenant.contract?.status))}>{tenant.contract?.status || 'unknown'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyTenants;
