import { useEffect, useMemo, useState } from 'react';
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
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Api.getOwnerApplications();
      setApplications(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => item.status === 'pending').length,
    approved: applications.filter((item) => item.status === 'approved').length,
    rejected: applications.filter((item) => item.status === 'rejected').length,
  }), [applications]);

  const handleApprove = async (id: number) => {
    try {
      setBusyId(id);
      await Api.approveApplication(id);
      await loadApplications();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to approve application.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = rejectionReasons[id]?.trim();
    if (!reason) {
      setError('Add a rejection reason before rejecting an application.');
      return;
    }

    try {
      setBusyId(id);
      await Api.rejectApplication(id, reason);
      await loadApplications();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reject application.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Applications</h1>
        <p style={descriptionStyle}>
          Review live property applications from the Laravel owner API and take approve or reject actions without leaving the landlord dashboard.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '22px' }}>
          {[
            ['Total', stats.total],
            ['Pending', stats.pending],
            ['Approved', stats.approved],
            ['Rejected', stats.rejected],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ marginBottom: '16px', color: '#e07070' }}>{error}</div>}
        {loading ? (
          <div style={{ color: '#9f9587' }}>Loading applications...</div>
        ) : applications.length === 0 ? (
          <div style={{ color: '#9f9587' }}>No applications found for your properties yet.</div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Applicant</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td style={tdStyle}>
                      <div>{application.user?.first_name} {application.user?.last_name}</div>
                      <div style={{ color: '#9f9587', marginTop: '4px' }}>{application.user?.email || 'No email'}</div>
                      <div style={{ color: '#9f9587', marginTop: '4px' }}>{application.user?.phone || 'No phone'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{application.property?.title || 'Untitled property'}</div>
                      <div style={{ color: '#9f9587', marginTop: '4px' }}>{application.property?.location || 'No location'}</div>
                      <div style={{ color: '#c9a84c', marginTop: '4px' }}>{formatCurrency(application.property?.price)}</div>
                      <div style={{ color: '#9f9587', marginTop: '4px' }}>Applied {formatDate(application.created_at)}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(application.status))}>{application.status || 'unknown'}</span>
                      {application.rejection_reason && (
                        <div style={{ color: '#e07070', marginTop: '8px', maxWidth: '220px' }}>{application.rejection_reason}</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ maxWidth: '280px', color: '#9f9587', lineHeight: 1.6 }}>
                        {application.message || 'No application message provided.'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: '10px', minWidth: '220px' }}>
                        {application.status === 'pending' ? (
                          <>
                            <button style={buttonStyle('primary')} disabled={busyId === application.id} onClick={() => handleApprove(application.id)}>
                              {busyId === application.id ? 'Working...' : 'Approve'}
                            </button>
                            <input
                              style={inputStyle}
                              placeholder="Rejection reason"
                              value={rejectionReasons[application.id] || ''}
                              onChange={(event) => setRejectionReasons((current) => ({ ...current, [application.id]: event.target.value }))}
                            />
                            <button style={buttonStyle('danger')} disabled={busyId === application.id} onClick={() => handleReject(application.id)}>
                              {busyId === application.id ? 'Working...' : 'Reject'}
                            </button>
                          </>
                        ) : (
                          <div style={{ color: '#9f9587' }}>No further action needed.</div>
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
    </div>
  );
};

export default ApplicationsPage;
