import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle, UserPlus, Users, Mail, Phone, MapPin, BedDouble, Bath } from 'lucide-react';
import Api from '../../services/api';
import {
  descriptionLightStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingLightStyle,
  inputStyle,
  metricCardStyle,
  metricGridStyle,
  pageStyle,
  panelStyle,
  headerPanelStyle,
  palette,
  eyebrowStyle,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
  buttonStyle,
} from './landlordPageStyles';

// ── Token shorthand matching Flutter kSlate* (unchanged)
const C = {
  pageBg:    '#F1F5F9',
  headerBg:  '#1E293B',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  green:     '#16A34A', greenBg: '#DCFCE7',
  blue:      '#2563EB', blueBg:  '#DBEAFE',
  amber:     '#D97706', amberBg: '#FEF3C7',
  red:       '#DC2626', redBg:   '#FFE4E6',
  slate400:  '#94A3B8',
  slate500:  '#64748B',
  slate600:  '#475569',
  slate700:  '#334155',
  slate800:  '#1E293B',
  slate900:  '#0F172A',
};

interface TenantItem {
  id: number;
  user?: { first_name?: string; last_name?: string; email?: string; phone?: string; };
  property?: { id?: number; title?: string; location?: string; price?: number | string; bedrooms?: number; bathrooms?: number; };
  contract?: { id?: number; status?: string; start_date?: string; end_date?: string; rent_amount?: number | string; };
  digital_contracts?: Array<{ id: number; title: string; status: string; created_at: string; }>;
  application_id?: number;
  application?: { id: number; status: string; created_at: string; };
}

const MyTenants = () => {
  const [tenants, setTenants]             = useState<TenantItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [search, setSearch]               = useState('');
  const [refreshing, setRefreshing]       = useState(false);
  const [creatingTenants, setCreatingTenants] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      setError('');
      const response = await Api.getMyTenants();
      setTenants(Array.isArray(response.data) ? response.data : []);
      if (!silent) setTimeout(() => loadData(true), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load tenants.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const iv = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(iv);
  }, []);

  const handleCreateFromApproved = async () => {
    try {
      setCreatingTenants(true); setError(''); setSuccess('');
      const response = await Api.createTenantFromApprovedApplication();
      const count = response.data.tenants_created?.length ?? 0;
      setSuccess(`Created ${count} tenant record${count !== 1 ? 's' : ''} from approved applications.`);
      await loadData(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create tenants from approved applications.');
    } finally { setCreatingTenants(false); }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter(t =>
      [t.user?.first_name, t.user?.last_name, t.user?.email, t.property?.title, t.property?.location]
        .filter(Boolean).join(' ').toLowerCase().includes(term)
    );
  }, [search, tenants]);

  // ── Shared row-hover style applied via onMouse*
  const rowHover = (el: HTMLTableRowElement, on: boolean) => {
    el.style.background = on ? C.pageBg : 'transparent';
  };

  const rentValue = (tenant: TenantItem) =>
    formatCurrency(tenant.property?.price || tenant.contract?.rent_amount || 0);

  const contractStatusOf = (tenant: TenantItem) =>
    tenant.digital_contracts?.[0]?.status ?? tenant.contract?.status;

  return (
    <div className="tenants-page" style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          select option { background:#fff; color:#0F172A; }

          .tenants-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
          .tenants-header-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }
          .tenants-header-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }

          .tenants-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid ${C.border}; }
          .tenants-cards { display: none; }

          .tenant-card { background: ${C.cardBg}; border: 1px solid ${C.border}; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.05); }
          .tenant-card-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid ${C.pageBg}; }
          .tenant-card-detail { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: ${C.textSub}; margin-top: 5px; }
          .tenant-card-detail svg { color: ${C.textMuted}; flex-shrink: 0; }
          .tenant-card-section { padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid ${C.pageBg}; }
          .tenant-card-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .tenant-card-label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.textMuted}; margin-bottom: 6px; }
          .tenant-card-link { color: ${C.gold}; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; }

          @media (max-width: 900px) {
            .tenants-page { padding: 18px !important; }
          }

          @media (max-width: 780px) {
            .tenants-table-wrap { display: none; }
            .tenants-cards { display: block; }
          }

          @media (max-width: 640px) {
            .tenants-page { padding: 14px !important; }
            .tenants-header-actions { width: 100%; }
            .tenants-header-actions button { flex: 1; justify-content: center; }
          }
        `}</style>

        {/* ════ Slate-800 header panel (matches kHeaderBg) ════ */}
        <section style={{
          background: C.headerBg, borderRadius: '14px',
          padding: '26px 30px', color: '#fff',
        }}>
          {/* Top row */}
          <div className="tenants-header-top">
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
                Landlord Workspace
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                My Tenants
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: C.textLight, lineHeight: 1.6 }}>
                Active tenant records connected to your approved applications, with contract dates and rent amounts.
              </p>
            </div>

            {/* Action buttons */}
           
          </div>

          {/* Stats + search row */}
          <div className="tenants-header-stats">
            {/* Active tenants chip */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', padding: '14px 18px',
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: C.textLight, fontWeight: 700 }}>
                Active Tenants
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginTop: '6px', letterSpacing: '-0.02em' }}>
                {tenants.length}
              </div>
            </div>

            {/* Search */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', padding: '14px 18px',
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: C.textLight, fontWeight: 700, marginBottom: '8px' }}>
                Search
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tenant name, property…"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)',
                  color: '#fff', fontSize: '13px', outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>
          </div>
        </section>

        {/* ════ White card — table panel ════ */}
        <section style={{
          background: C.cardBg, border: `1px solid ${C.border}`,
          borderRadius: '14px', padding: '24px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}>
          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.red, background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: '10px', padding: '13px 16px', marginBottom: '18px', fontSize: '13px' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.green, background: C.greenBg, border: `1px solid rgba(22,163,74,0.24)`, borderRadius: '10px', padding: '13px 16px', marginBottom: '18px', fontSize: '13px' }}>
              {success}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.textMuted, padding: '48px 0' }}>
              <div style={{ width: 18, height: 18, border: `2.5px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading tenants…
            </div>
          ) : tenants.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: C.pageBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={28} style={{ color: C.textMuted }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>No tenants found</div>
             
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ color: C.textMuted, padding: '24px 0', fontSize: '14px' }}>No tenants matched your search.</div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="tenants-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                  <thead>
                    <tr>
                      {['Tenant', 'Property', 'Contract Dates', 'Rent', 'Status', 'Application'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '12px 16px', fontSize: '11px',
                          letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700,
                          color: C.slate500,
                          borderBottom: `1px solid ${C.border}`,
                          background: C.pageBg,  // kSlate100 table header bg
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(tenant => {
                      const contractStatus = contractStatusOf(tenant);
                      const scColor = getStatusColor(contractStatus);

                      return (
                        <tr
                          key={tenant.id}
                          onMouseEnter={e => rowHover(e.currentTarget, true)}
                          onMouseLeave={e => rowHover(e.currentTarget, false)}
                          style={{ transition: 'background 0.12s' }}
                        >
                          {/* Tenant */}
                          <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', fontSize: '13px' }}>
                            <div style={{ fontWeight: 700, color: C.text }}>
                              {tenant.user?.first_name} {tenant.user?.last_name}
                            </div>
                            <div style={{ color: C.textMuted, marginTop: '3px' }}>{tenant.user?.email || 'No email'}</div>
                            <div style={{ color: C.textMuted, marginTop: '2px' }}>{tenant.user?.phone || 'No phone'}</div>
                          </td>

                          {/* Property */}
                          <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', fontSize: '13px' }}>
                            <div style={{ fontWeight: 700, color: C.text }}>{tenant.property?.title || 'Untitled property'}</div>
                            <div style={{ color: C.textMuted, marginTop: '3px' }}>{tenant.property?.location || 'No location'}</div>
                            <div style={{ color: C.gold, marginTop: '3px', fontWeight: 700 }}>
                              {formatCurrency(tenant.property?.price || tenant.contract?.rent_amount)}
                            </div>
                            {(tenant.property?.bedrooms || tenant.property?.bathrooms) && (
                              <div style={{ color: C.textMuted, marginTop: '2px', fontSize: '12px' }}>
                                {tenant.property?.bedrooms && `${tenant.property.bedrooms} bed`}
                                {tenant.property?.bedrooms && tenant.property?.bathrooms && ' · '}
                                {tenant.property?.bathrooms && `${tenant.property.bathrooms} bath`}
                              </div>
                            )}
                          </td>

                          {/* Contract Dates */}
                          <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', fontSize: '13px' }}>
                            {tenant.contract?.start_date && tenant.contract?.end_date ? (
                              <>
                                <div style={{ color: C.text }}>{formatDate(tenant.contract.start_date)} → {formatDate(tenant.contract.end_date)}</div>
                                <div style={{ color: C.textMuted, fontSize: '11px', marginTop: '3px' }}>Traditional Contract</div>
                              </>
                            ) : tenant.digital_contracts?.[0] ? (
                              <>
                                <div style={{ fontWeight: 700, color: C.gold }}>Digital Contract</div>
                                <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '2px' }}>
                                  {tenant.digital_contracts[0].status.replace('_', ' ')}
                                </div>
                                <div style={{ color: C.textMuted, fontSize: '11px', marginTop: '2px' }}>
                                  Created: {formatDate(tenant.digital_contracts[0].created_at)}
                                </div>
                              </>
                            ) : (
                              <span style={{ color: C.textMuted }}>No active contract</span>
                            )}
                          </td>

                          {/* Rent */}
                          <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', fontSize: '13px' }}>
                            <div style={{ color: C.gold, fontWeight: 700 }}>
                              {formatCurrency(tenant.property?.price || tenant.contract?.rent_amount || 0)}
                            </div>
                            {tenant.property?.price && tenant.contract?.rent_amount &&
                              Number(tenant.property.price) !== Number(tenant.contract.rent_amount) && (
                              <div style={{ color: C.textMuted, fontSize: '11px', marginTop: '2px' }}>
                                Contract: {formatCurrency(tenant.contract.rent_amount)}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', fontSize: '13px' }}>
                            {contractStatus ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                padding: '3px 10px', borderRadius: '999px',
                                background: `${scColor}18`, border: `1px solid ${scColor}35`,
                                color: scColor, fontSize: '11px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                              }}>
                                {contractStatus.replace('_', ' ')}
                              </span>
                            ) : (
                              <span style={{ color: C.textMuted, fontSize: '12px' }}>No contract</span>
                            )}
                          </td>

                          {/* Application */}
                          <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', fontSize: '13px' }}>
                            {tenant.application_id ? (
                              <Link
                                to={`/landlord/applications#${tenant.application_id}`}
                                style={{ color: C.gold, textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}
                              >
                                View Application
                                <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '2px', fontWeight: 400 }}>
                                  ID: {tenant.application_id}
                                  {tenant.application?.status && ` · ${tenant.application.status}`}
                                </div>
                              </Link>
                            ) : (
                              <span style={{ color: C.textMuted, fontSize: '12px' }}>No application</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="tenants-cards">
                {filtered.map(tenant => {
                  const contractStatus = contractStatusOf(tenant);
                  const scColor = getStatusColor(contractStatus);

                  return (
                    <div key={tenant.id} className="tenant-card">
                      {/* Tenant + status */}
                      <div className="tenant-card-row">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14.5px', color: C.text }}>
                            {tenant.user?.first_name} {tenant.user?.last_name}
                          </div>
                          <div className="tenant-card-detail"><Mail size={11} />{tenant.user?.email || 'No email'}</div>
                          <div className="tenant-card-detail"><Phone size={11} />{tenant.user?.phone || 'No phone'}</div>
                        </div>
                        {contractStatus ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px', borderRadius: '999px',
                            background: `${scColor}18`, border: `1px solid ${scColor}35`,
                            color: scColor, fontSize: '10.5px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                          }}>
                            {contractStatus.replace('_', ' ')}
                          </span>
                        ) : (
                          <span style={{ color: C.textMuted, fontSize: '11px', whiteSpace: 'nowrap' }}>No contract</span>
                        )}
                      </div>

                      {/* Property */}
                      <div className="tenant-card-section">
                        <div className="tenant-card-label">Property</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>{tenant.property?.title || 'Untitled property'}</div>
                        <div className="tenant-card-detail"><MapPin size={11} />{tenant.property?.location || 'No location'}</div>
                        {(tenant.property?.bedrooms || tenant.property?.bathrooms) && (
                          <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                            {tenant.property?.bedrooms && <div className="tenant-card-detail" style={{ marginTop: 0 }}><BedDouble size={11} />{tenant.property.bedrooms} bed</div>}
                            {tenant.property?.bathrooms && <div className="tenant-card-detail" style={{ marginTop: 0 }}><Bath size={11} />{tenant.property.bathrooms} bath</div>}
                          </div>
                        )}
                        <div style={{ color: C.gold, fontWeight: 700, fontSize: 14, marginTop: 6 }}>{rentValue(tenant)}</div>
                      </div>

                      {/* Contract dates */}
                      <div className="tenant-card-section">
                        <div className="tenant-card-label">Contract</div>
                        {tenant.contract?.start_date && tenant.contract?.end_date ? (
                          <>
                            <div style={{ color: C.text, fontSize: 13 }}>{formatDate(tenant.contract.start_date)} → {formatDate(tenant.contract.end_date)}</div>
                            <div style={{ color: C.textMuted, fontSize: '11px', marginTop: '3px' }}>Traditional Contract</div>
                          </>
                        ) : tenant.digital_contracts?.[0] ? (
                          <>
                            <div style={{ fontWeight: 700, color: C.gold, fontSize: 13 }}>Digital Contract</div>
                            <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '2px' }}>
                              {tenant.digital_contracts[0].status.replace('_', ' ')}
                            </div>
                            <div style={{ color: C.textMuted, fontSize: '11px', marginTop: '2px' }}>
                              Created: {formatDate(tenant.digital_contracts[0].created_at)}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: C.textMuted, fontSize: 13 }}>No active contract</span>
                        )}
                      </div>

                      {/* Application */}
                      <div className="tenant-card-section">
                        <div className="tenant-card-label">Application</div>
                        {tenant.application_id ? (
                          <Link to={`/landlord/applications#${tenant.application_id}`} className="tenant-card-link">
                            View Application
                          </Link>
                        ) : (
                          <span style={{ color: C.textMuted, fontSize: 13 }}>No application</span>
                        )}
                        {tenant.application_id && (
                          <div style={{ color: C.textMuted, fontSize: '11px', marginTop: '2px' }}>
                            ID: {tenant.application_id}
                            {tenant.application?.status && ` · ${tenant.application.status}`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyTenants;