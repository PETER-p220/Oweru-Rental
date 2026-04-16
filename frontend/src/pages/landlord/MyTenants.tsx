import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle, UserPlus, Users } from 'lucide-react';
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
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [creatingTenants, setCreatingTenants] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const response = await Api.getMyTenants();

      console.log('=== TENANTS API RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Is array?', Array.isArray(response.data));
      console.log('Data length:', response.data?.length);
      console.log('==============================');

      setTenants(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Tenants API error:', err);
      setError(err?.response?.data?.message || 'Unable to load tenants.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateFromApproved = async () => {
    try {
      setCreatingTenants(true);
      setError('');
      setSuccess('');
      const response = await Api.createTenantFromApprovedApplication();
      const count = response.data.tenants_created?.length ?? 0;
      setSuccess(`Created ${count} tenant record${count !== 1 ? 's' : ''} from approved applications.`);
      await loadData(true);
    } catch (err: any) {
      console.error('Failed to create tenants:', err);
      setError(err?.response?.data?.message || 'Failed to create tenants from approved applications.');
    } finally {
      setCreatingTenants(false);
    }
  };

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

      {/* ── Header panel ── */}
      <section style={panelStyle}>
        {/* Top row: title + action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={sectionTitleStyle}>Landlord Workspace</div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Always show "Create Tenants" button — not gated on tenants.length === 0 */}
            <button
              onClick={handleCreateFromApproved}
              disabled={creatingTenants}
              style={{
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                cursor: creatingTenants ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: creatingTenants ? 0.7 : 1,
              }}
            >
              <UserPlus size={14} />
              {creatingTenants ? 'Creating…' : 'Sync from Approved Apps'}
            </button>

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
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <h1 style={headingStyle}>My Tenants</h1>
        <p style={descriptionStyle}>
          Active tenant records connected to your approved applications, with contract dates and rent amounts from your live system.
        </p>

        <div style={{ ...metricGridStyle, marginTop: '22px' }}>
          <div style={metricCardStyle}>
            <div style={{ color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Active tenants
            </div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{tenants.length}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ color: 'var(--accent-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Search
            </div>
            <input
              style={{ ...inputStyle, marginTop: '8px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants or properties"
            />
          </div>
        </div>
      </section>

      {/* ── Table panel ── */}
      <section style={panelStyle}>

        {/* Error alert */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.18)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Success alert */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: '#16a34a',
            background: 'rgba(22, 163, 74, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.22)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
          }}>
            {success}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', padding: '40px 0' }}>
            <div style={{
              width: 16, height: 16,
              border: '2px solid var(--accent-color)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            Loading tenants…
          </div>
        ) : tenants.length === 0 ? (
          /* ── Empty state: guide the landlord to sync ── */
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No tenants found</div>
            <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '24px' }}>
              If you have approved applications, click <strong>Sync from Approved Apps</strong> above to generate tenant records automatically.
            </div>
            <button
              onClick={handleCreateFromApproved}
              disabled={creatingTenants}
              style={{
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: creatingTenants ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <UserPlus size={16} />
              {creatingTenants ? 'Creating…' : 'Sync from Approved Apps'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>No tenants matched your search.</div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {/* 6 headers to match 6 <td> columns */}
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Contract Dates</th>
                  <th style={thStyle}>Rent</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Application</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant) => (
                  <tr
                    key={tenant.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>
                        {tenant.user?.first_name} {tenant.user?.last_name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '13px' }}>
                        {tenant.user?.email || 'No email'}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '13px' }}>
                        {tenant.user?.phone || 'No phone'}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div>{tenant.property?.title || 'Untitled property'}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '13px' }}>
                        {tenant.property?.location || 'No location'}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px' }}>
                        {formatDate(tenant.contract?.start_date)} → {formatDate(tenant.contract?.end_date)}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
                        {formatCurrency(tenant.contract?.rent_amount)}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(tenant.contract?.status))}>
                        {tenant.contract?.status || 'unknown'}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {tenant.application_id ? (
                        <Link
                          to={`/landlord/applications`}
                          style={{
                            color: 'var(--accent-color)',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          View Application →
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MyTenants;