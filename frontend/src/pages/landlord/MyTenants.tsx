import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle,
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
}

const MyTenants = () => {
  const [tenants, setTenants]     = useState<TenantItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');
      const response = await Api.getMyTenants();
      setTenants(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load tenants.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => { loadData(); }, []);

  // Re-fetch whenever the browser tab regains focus — this fires when the
  // user navigates here from ApplicationsPage after approving a tenant.
  useEffect(() => {
    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Also re-fetch on the visibilitychange event (covers tab switches / router navigation)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadData(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
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
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [search, tenants]);

  return (
    <div style={pageStyle}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 28, right: 28, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block' }} />
              Landlord Workspace
            </div>
            <h1 style={headingStyle}>My Tenants</h1>
            <p style={{ ...descriptionStyle, marginTop: 6 }}>
              Active tenant records with contract dates and rent amounts from your live system.
            </p>
          </div>

          {/* Manual refresh — does NOT hard-reload the page */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              ...buttonStyle('secondary'),
              alignSelf: 'flex-start',
              padding: '9px 16px',
              gap: '8px',
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Metrics + search */}
        <div style={{ ...metricGridStyle, marginTop: '22px' }}>
          <div style={metricCardStyle}>
            <div style={{ color: palette.gold, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
              Active tenants
            </div>
            <div style={{ fontSize: '30px', marginTop: '8px', fontWeight: 700, color: palette.offWhite, letterSpacing: '-0.02em' }}>
              {tenants.length}
            </div>
          </div>

          <div style={metricCardStyle}>
            <div style={{ color: palette.gold, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: '8px' }}>
              Search
            </div>
            <input
              style={inputStyle}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants or properties…"
            />
          </div>
        </div>
      </section>

      {/* ── Table ── */}
      <section style={{ ...panelStyle }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: palette.red, background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading tenants…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.gray400 }}>
            <Users size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {search ? 'No tenants matched your search.' : 'No tenants yet.'}
            </div>
            {!search && (
              <div style={{ fontSize: '13px', opacity: 0.7, marginTop: 4 }}>
                Approve an application to create a tenant record.
              </div>
            )}
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Tenant', 'Property', 'Contract', 'Rent', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant) => (
                  <tr
                    key={tenant.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Tenant */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: palette.offWhite }}>
                        {tenant.user?.first_name} {tenant.user?.last_name}
                      </div>
                      <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '13px' }}>
                        {tenant.user?.email || 'No email'}
                      </div>
                      <div style={{ color: palette.gray400, marginTop: '2px', fontSize: '13px' }}>
                        {tenant.user?.phone || 'No phone'}
                      </div>
                    </td>

                    {/* Property */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{tenant.property?.title || 'Untitled property'}</div>
                      <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '13px' }}>
                        {tenant.property?.location || 'No location'}
                      </div>
                    </td>

                    {/* Contract dates */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px' }}>
                        {formatDate(tenant.contract?.start_date)} → {formatDate(tenant.contract?.end_date)}
                      </div>
                    </td>

                    {/* Rent */}
                    <td style={{ ...tdStyle, color: palette.gold, fontWeight: 600 }}>
                      {formatCurrency(tenant.contract?.rent_amount)}
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(tenant.contract?.status))}>
                        {tenant.contract?.status || 'unknown'}
                      </span>
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