import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle, UserPlus } from 'lucide-react';
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
  palette,
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
  application_id?: number;
}

const MyTenants = () => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');
      const response = await Api.getMyTenants();
      
      // Debug: Log the entire response
      console.log('=== TENANTS API RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Data type:', typeof response.data);
      console.log('Is array?', Array.isArray(response.data));
      console.log('Data length:', response.data?.length);
      console.log('===============================');
      
      setTenants(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('=== TENANTS API ERROR ===');
      console.error('Error:', err);
      console.error('Response:', err?.response);
      console.error('Response data:', err?.response?.data);
      console.error('========================');
      setError(err?.response?.data?.message || 'Unable to load tenants.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 30 seconds to get latest tenant data
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={sectionTitleStyle}>Landlord Workspace</div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '9px 16px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'flex-start',
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Create tenants from approved applications button */}
          {tenants.length === 0 && (
            <button
              onClick={async () => {
                try {
                  const response = await Api.createTenantFromApprovedApplication();
                  console.log('Created tenants:', response);
                  alert(`Created ${response.data.tenants_created?.length || 0} tenant records from approved applications!`);
                  loadData();
                } catch (err: any) {
                  console.error('Failed to create tenants:', err);
                  alert('Failed to create tenants: ' + (err?.response?.data?.message || 'Unknown error'));
                }
              }}
              style={{
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                alignSelf: 'flex-start',
              }}
            >
              <UserPlus size={14} />
              Create Tenants from Approved Apps
            </button>
          )}
        </div>
        <h1 style={headingStyle}>My Tenants</h1>
        <p style={descriptionStyle}>
          Active tenant records loaded from the owner tenants endpoint, with contract dates and rent amounts connected to your live system data.
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
                    <td style={tdStyle}>
                      <Link 
                        to={`/tenant/application-status?id=${tenant.application_id}`}
                        style={{ 
                          color: 'var(--accent-color)', 
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        View Application Status
                      </Link>
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
