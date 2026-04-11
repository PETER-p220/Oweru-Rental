import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Api from '../../services/api';
import {
  buttonStyle,
  descriptionStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingStyle,
  inputStyle,
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

interface OwnerApplication {
  id: number;
  status?: string;
  created_at?: string;
  message?: string;
  rejection_reason?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  property?: {
    id: number;
    title?: string;
    location?: string;
    price?: number | string;
  };
}

const ApplicationsPage = () => {
  const navigate = useNavigate();

  const [applications, setApplications]         = useState<OwnerApplication[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [success, setSuccess]                   = useState('');   // ← separate success state
  const [busyId, setBusyId]                     = useState<number | null>(null);
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

  useEffect(() => { loadApplications(); }, []);

  const stats = useMemo(() => ({
    total:    applications.length,
    pending:  applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }), [applications]);

  const handleApprove = async (id: number) => {
    try {
      setBusyId(id);
      setError(''); setSuccess('');

      await Api.approveApplication(id);

      // Reload the applications list so the status updates in the table
      await loadApplications();

      // Show a proper success message — NOT using setError for this
      setSuccess('Application approved. The tenant record has been created.');

      // After 1.8 s navigate to the tenants page so the user can see the new tenant
      setTimeout(() => navigate('/landlord/tenants'), 1800);

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to approve application.');
    } finally { setBusyId(null); }
  };

  const handleReject = async (id: number) => {
    const reason = rejectionReasons[id]?.trim();
    if (!reason) {
      setError('Add a rejection reason before rejecting an application.');
      return;
    }
    try {
      setBusyId(id);
      setError(''); setSuccess('');
      await Api.rejectApplication(id, reason);
      await loadApplications();
      setSuccess('Application rejected successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reject application.');
    } finally { setBusyId(null); }
  };

  const statCards = [
    { label: 'Total',    value: stats.total,    accent: palette.gold  },
    { label: 'Pending',  value: stats.pending,  accent: palette.amber },
    { label: 'Approved', value: stats.approved, accent: palette.green },
    { label: 'Rejected', value: stats.rejected, accent: palette.red   },
  ];

  return (
    <div style={pageStyle}>

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 28, right: 28, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />

        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block' }} />
          Landlord Workspace
        </div>
        <h1 style={headingStyle}>Applications</h1>
        <p style={{ ...descriptionStyle, marginTop: 6 }}>
          Review live property applications and take approve or reject actions directly from your landlord dashboard.
        </p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginTop: '24px' }}>
          {statCards.map(({ label, value, accent }) => (
            <div key={label} style={{
              padding: '18px 20px', borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${accent}25`,
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <div style={{ color: palette.gray400, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                {label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Table ── */}
      <section style={{ ...panelStyle }}>

        {/* Error alert — red, for actual errors only */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: palette.red,
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.18)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Success alert — green, for approve / reject confirmations */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: palette.green,
            background: 'rgba(22, 163, 74, 0.08)',
            border: '1px solid rgba(22, 163, 74, 0.22)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px',
          }}>
            <CheckCircle size={16} />
            <span style={{ flex: 1 }}>{success}</span>
            {/* Quick-nav button so user doesn't have to wait for the auto-redirect */}
            {success.includes('created') && (
              <button
                style={{ ...buttonStyle('secondary'), padding: '4px 14px', fontSize: '12px' }}
                onClick={() => navigate('/landlord/tenants')}
              >
                View Tenants →
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading applications…
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.gray400 }}>
            <Users size={48} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px', fontWeight: 600 }}>No applications yet</div>
            <div style={{ fontSize: '13px', opacity: 0.7, marginTop: 4 }}>Applications from tenants will appear here.</div>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Applicant', 'Property', 'Status', 'Message', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Applicant */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: palette.offWhite }}>
                        {application.user?.first_name} {application.user?.last_name}
                      </div>
                      <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '13px' }}>
                        {application.user?.email || 'No email'}
                      </div>
                      <div style={{ color: palette.gray400, marginTop: '2px', fontSize: '13px' }}>
                        {application.user?.phone || 'No phone'}
                      </div>
                    </td>

                    {/* Property */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{application.property?.title || 'Untitled property'}</div>
                      <div style={{ color: palette.gray400, marginTop: '4px', fontSize: '13px' }}>
                        {application.property?.location || 'No location'}
                      </div>
                      <div style={{ color: palette.gold, marginTop: '4px', fontSize: '13px', fontWeight: 600 }}>
                        {formatCurrency(application.property?.price)}
                      </div>
                      <div style={{ color: palette.gray500, marginTop: '4px', fontSize: '12px' }}>
                        Applied {formatDate(application.created_at)}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(application.status))}>
                        {application.status || 'unknown'}
                      </span>
                      {application.rejection_reason && (
                        <div style={{ color: palette.red, marginTop: '8px', maxWidth: '220px', fontSize: '13px', lineHeight: 1.5 }}>
                          {application.rejection_reason}
                        </div>
                      )}
                    </td>

                    {/* Message */}
                    <td style={tdStyle}>
                      <div style={{ maxWidth: '280px', color: palette.gray400, lineHeight: 1.6, fontSize: '13px' }}>
                        {application.message || 'No application message provided.'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: '8px', minWidth: '220px' }}>
                        {application.status === 'pending' ? (
                          <>
                            <button
                              style={buttonStyle('primary')}
                              disabled={busyId === application.id}
                              onClick={() => handleApprove(application.id)}
                            >
                              {busyId === application.id ? 'Working…' : '✓ Approve'}
                            </button>
                            <input
                              style={inputStyle}
                              placeholder="Rejection reason…"
                              value={rejectionReasons[application.id] || ''}
                              onChange={(e) => setRejectionReasons(c => ({ ...c, [application.id]: e.target.value }))}
                            />
                            <button
                              style={buttonStyle('danger')}
                              disabled={busyId === application.id}
                              onClick={() => handleReject(application.id)}
                            >
                              {busyId === application.id ? 'Working…' : '✕ Reject'}
                            </button>
                          </>
                        ) : (
                          <div style={{ color: palette.gray500, fontSize: '13px' }}>No further action needed.</div>
                        )}
                      </div>
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

export default ApplicationsPage;