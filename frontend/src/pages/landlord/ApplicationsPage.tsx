import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './landlordPageStyles';

// ── Design tokens — 1:1 with landlordPageStyles / MyProperties
const C = {
  pageBg:    '#F1F5F9',
  headerBg:  '#1E293B',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate500:  '#64748B',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  goldBg:    'rgba(200,145,40,0.08)',
  green:     '#16A34A', greenBg: '#DCFCE7',
  amber:     '#D97706', amberBg: '#FEF3C7',
  red:       '#DC2626', redBg:   '#FFE4E6',
  blue:      '#2563EB', blueBg:  '#DBEAFE',
};

const getStatusColor = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'approved': return { color: C.green, bg: C.greenBg };
    case 'pending':  return { color: C.amber, bg: C.amberBg };
    case 'rejected': return { color: C.red,   bg: C.redBg   };
    default:         return { color: C.textMuted, bg: C.slate100 };
  }
};

interface OwnerApplication {
  id: number;
  status?: string;
  created_at?: string;
  message?: string;
  rejection_reason?: string;
  user?: { first_name?: string; last_name?: string; email?: string; phone?: string; };
  property?: { id: number; title?: string; location?: string; price?: number | string; };
}

const ApplicationsPage = () => {
  const navigate = useNavigate();

  const [applications,     setApplications]     = useState<OwnerApplication[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [success,          setSuccess]          = useState('');
  const [busyId,           setBusyId]           = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});

  const loadApplications = async () => {
    try {
      setLoading(true); setError('');
      const response = await Api.getOwnerApplications();
      setApplications(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load applications.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadApplications();
    const hash = window.location.hash;
    if (hash) {
      const el = document.getElementById(`app-${hash.replace('#', '')}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const stats = useMemo(() => ({
    total:    applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }), [applications]);

  const handleApprove = async (id: number) => {
    try {
      setBusyId(id); setError(''); setSuccess('');
      await Api.approveApplication(id);
      await loadApplications();
      const tenantEmail = applications.find(a => a.id === id)?.user?.email;
      if (tenantEmail) {
        await Api.notifyTenantApproval(id, tenantEmail);
        setSuccess(`Application approved and tenant notified at ${tenantEmail}`);
      } else {
        setSuccess('Application approved. The tenant record has been created.');
      }
      setTimeout(() => { navigate('/landlord/tenants'); setTimeout(() => window.location.reload(), 500); }, 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to approve application.');
    } finally { setBusyId(null); }
  };

  const handleReject = async (id: number) => {
    const reason = rejectionReasons[id]?.trim();
    if (!reason) { setError('Add a rejection reason before rejecting.'); return; }
    try {
      setBusyId(id); setError(''); setSuccess('');
      await Api.rejectApplication(id, reason);
      await loadApplications();
      setSuccess('Application rejected successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reject application.');
    } finally { setBusyId(null); }
  };

  const inputCss: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    background: C.slate100, border: `1.5px solid ${C.border}`,
    color: C.text, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  };

  const statCards = [
    { label: 'Total',    value: stats.total,    color: C.text,  bg: C.slate100 },
    { label: 'Pending',  value: stats.pending,  color: C.amber, bg: C.amberBg  },
    { label: 'Approved', value: stats.approved, color: C.green, bg: C.greenBg  },
    { label: 'Rejected', value: stats.rejected, color: C.red,   bg: C.redBg    },
  ];

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } tr.app-row:hover td { background: #f8fafc; } .act-input:focus { border-color: ${C.gold} !important; outline: none; }`}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── Slate-800 Header ── */}
        <div style={{ background: C.headerBg, borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
            Landlord Workspace
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Applications
          </h1>
          <p style={{ margin: 0, color: C.textLight, fontSize: '14px', lineHeight: 1.6 }}>
            Review property applications and take approve or reject actions directly from your dashboard.
          </p>

          {/* Stat cards inside header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '20px' }}>
            {statCards.map(({ label, value, color, bg }) => (
              <div key={label} style={{ padding: '16px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: C.red, fontSize: '13px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div style={{ background: C.greenBg, border: `1px solid rgba(22,163,74,0.22)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: C.green }}>
            <CheckCircle size={15} />
            <span style={{ flex: 1 }}>{success}</span>
            {success.includes('created') && (
              <button onClick={() => navigate('/landlord/tenants')}
                style={{ padding: '5px 14px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.green, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                View Tenants →
              </button>
            )}
          </div>
        )}

        {/* ── Table Panel ── */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '56px 28px', color: C.textMuted }}>
              <div style={{ width: 18, height: 18, border: `2.5px solid ${C.border}`, borderTop: `2.5px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading applications…
            </div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 24px', color: C.textMuted }}>
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: C.slate100, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Users size={28} style={{ color: C.textMuted }} />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>No applications yet</div>
              <div style={{ fontSize: '13px', color: C.textSub }}>Applications from tenants will appear here.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr>
                    {['Applicant', 'Property', 'Applied', 'Status', 'Message', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '13px 18px', fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, color: C.slate500, borderBottom: `1px solid ${C.border}`, background: C.slate100 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const { color, bg } = getStatusColor(app.status);
                    return (
                      <tr key={app.id} id={`app-${app.id}`} className="app-row" style={{ transition: 'background 0.15s' }}>

                        {/* Applicant */}
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>
                            {app.user?.first_name} {app.user?.last_name}
                          </div>
                          <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '3px' }}>{app.user?.email || '—'}</div>
                          <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '2px' }}>{app.user?.phone || '—'}</div>
                        </td>

                        {/* Property */}
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: C.text }}>{app.property?.title || 'Untitled property'}</div>
                          <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '3px' }}>{app.property?.location || '—'}</div>
                          <div style={{ color: C.gold, fontSize: '13px', fontWeight: 700, marginTop: '3px' }}>{formatCurrency(app.property?.price)}</div>
                        </td>

                        {/* Applied date */}
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', color: C.textMuted, fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatDate(app.created_at)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: bg, border: `1px solid ${color}30`, color, fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                            {app.status || 'unknown'}
                          </span>
                          {app.rejection_reason && (
                            <div style={{ color: C.red, fontSize: '12px', marginTop: '8px', maxWidth: '200px', lineHeight: 1.5 }}>
                              {app.rejection_reason}
                            </div>
                          )}
                        </td>

                        {/* Message */}
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          <div style={{ maxWidth: '240px', color: C.textSub, fontSize: '13px', lineHeight: 1.6 }}>
                            {app.message || <span style={{ color: C.textMuted, fontStyle: 'italic' }}>No message provided.</span>}
                          </div>
                          <div style={{ marginTop: 10 }}>
                            {app.rent_payment_status === 'paid' ? (
                              <div style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Rent paid</div>
                            ) : (
                              <div style={{ fontSize: 12, color: C.amber, fontWeight: 700 }}>
                                Rent: {(app.rent_payment_status ?? 'pending')}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                          {app.status === 'pending' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                              <button
                                disabled={busyId === app.id}
                                onClick={() => handleApprove(app.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 16px', background: C.green, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: busyId === app.id ? 'not-allowed' : 'pointer', opacity: busyId === app.id ? 0.6 : 1, boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}>
                                {busyId === app.id ? '…' : <><CheckCircle size={13} /> Approve</>}
                              </button>
                              <input
                                className="act-input"
                                style={inputCss}
                                placeholder="Rejection reason…"
                                value={rejectionReasons[app.id] || ''}
                                onChange={e => setRejectionReasons(c => ({ ...c, [app.id]: e.target.value }))}
                              />
                              <button
                                disabled={busyId === app.id}
                                onClick={() => handleReject(app.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 16px', background: C.redBg, color: C.red, border: `1px solid rgba(220,38,38,0.28)`, borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: busyId === app.id ? 'not-allowed' : 'pointer', opacity: busyId === app.id ? 0.6 : 1 }}>
                                {busyId === app.id ? '…' : <><XCircle size={13} /> Reject</>}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: C.slate100, borderRadius: '8px', color: C.textMuted, fontSize: '12px', fontWeight: 500 }}>
                              <FileText size={12} /> No action needed
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;