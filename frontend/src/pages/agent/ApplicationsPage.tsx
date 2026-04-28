import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { descriptionStyle, formatCurrency, formatDate, headingStyle, pageStyle, panelStyle, sectionTitleStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './agentPageStyles';

const ApplicationsPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getAgentApplications();
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (applicationId: number) => {
    try {
      setActionLoading(applicationId);
      await Api.approveAgentApplication(applicationId);
      
      // Update the local state
      setItems(items.map(item => 
        item.id === applicationId 
          ? { ...item, status: 'approved' }
          : item
      ));
      
      alert('Application approved successfully! Tenant can now proceed with rent payments.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to approve application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      setActionLoading(applicationId);
      await Api.rejectAgentApplication(applicationId, rejectReason);
      
      // Update the local state
      setItems(items.map(item => 
        item.id === applicationId 
          ? { ...item, status: 'rejected', rejection_reason: rejectReason }
          : item
      ));
      
      setShowRejectModal(null);
      setRejectReason('');
      alert('Application rejected successfully.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject application.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#059669';
      case 'rejected': return '#dc2626';
      case 'pending': return '#d97706';
      default: return '#64748b';
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      backgroundColor: `${color}15`,
      color: color,
      border: `1px solid ${color}30`,
    };
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Applications</h1>
        <p style={descriptionStyle}>Applications submitted for properties assigned to you.</p>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        
        {/* Desktop Table View */}
        <div style={tableWrapStyle}>
          <table style={tableStyle} className="desktop-table">
            <thead><tr><th style={thStyle}>Applicant</th><th style={thStyle}>Property</th><th style={thStyle}>Status</th><th style={thStyle}>Payment</th><th style={thStyle}>Date</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td style={tdStyle} colSpan={6}>Loading applications...</td></tr> : items.length === 0 ? <tr><td style={tdStyle} colSpan={6}>No applications found.</td></tr> : items.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>
                    <div>{item.user?.first_name} {item.user?.last_name}</div>
                    <div style={{ color: '#8ea0b5', marginTop: '4px', fontSize: '12px' }}>{item.user?.email}</div>
                    <div style={{ color: '#8ea0b5', marginTop: '2px', fontSize: '12px' }}>{item.user?.phone}</div>
                  </td>
                  <td style={tdStyle}>
                    <div>{item.property?.title}</div>
                    <div style={{ color: '#8ea0b5', marginTop: '4px', fontSize: '12px' }}>{formatCurrency(item.property?.price)}/month</div>
                    <div style={{ color: '#8ea0b5', marginTop: '2px', fontSize: '12px' }}>{item.property?.location}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={getStatusBadge(item.status)}>
                      {item.status}
                    </span>
                    {item.rejection_reason && (
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                        {item.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...getStatusBadge(item.payment_status === 'paid' ? 'approved' : 'pending'),
                      fontSize: '10px',
                    }}>
                      {item.payment_status || 'pending'}
                    </span>
                    {item.payment_status === 'paid' && (
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                        ✓ Site visit paid
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{formatDate(item.created_at)}</td>
                  <td style={tdStyle}>
                    {item.status === 'pending' && item.payment_status === 'paid' ? (
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoading === item.id}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoading === item.id ? 0.6 : 1,
                          }}
                        >
                          {actionLoading === item.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(item.id)}
                          disabled={actionLoading === item.id}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoading === item.id ? 0.6 : 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : item.status === 'pending' && item.payment_status !== 'paid' ? (
                      <div style={{ fontSize: '11px', color: '#d97706' }}>
                        Awaiting payment
                      </div>
                    ) : item.status === 'approved' ? (
                      <div style={{ fontSize: '11px', color: '#059669' }}>
                        ✓ Approved
                      </div>
                    ) : item.status === 'rejected' ? (
                      <div style={{ fontSize: '11px', color: '#dc2626' }}>
                        ✗ Rejected
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="mobile-cards" style={{ display: 'none' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8ea0b5' }}>Loading applications...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8ea0b5' }}>No applications found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  {/* Applicant Info */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#f1f5f9', marginBottom: '4px' }}>
                      {item.user?.first_name} {item.user?.last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8ea0b5', marginBottom: '2px' }}>{item.user?.email}</div>
                    <div style={{ fontSize: '12px', color: '#8ea0b5' }}>{item.user?.phone}</div>
                  </div>

                  {/* Property Info */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#f1f5f9', marginBottom: '4px' }}>{item.property?.title}</div>
                    <div style={{ fontSize: '12px', color: '#8ea0b5', marginBottom: '2px' }}>{formatCurrency(item.property?.price)}/month</div>
                    <div style={{ fontSize: '12px', color: '#8ea0b5' }}>{item.property?.location}</div>
                  </div>

                  {/* Status & Payment */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={getStatusBadge(item.status)}>
                      {item.status}
                    </span>
                    <span style={{
                      ...getStatusBadge(item.payment_status === 'paid' ? 'approved' : 'pending'),
                      fontSize: '10px',
                    }}>
                      {item.payment_status || 'pending'}
                    </span>
                  </div>

                  {/* Rejection Reason */}
                  {item.rejection_reason && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '8px' }}>
                      {item.rejection_reason}
                    </div>
                  )}

                  {/* Date */}
                  <div style={{ fontSize: '11px', color: '#8ea0b5', marginBottom: '12px' }}>
                    {formatDate(item.created_at)}
                  </div>

                  {/* Actions */}
                  <div>
                    {item.status === 'pending' && item.payment_status === 'paid' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoading === item.id}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoading === item.id ? 0.6 : 1,
                            flex: 1,
                          }}
                        >
                          {actionLoading === item.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(item.id)}
                          disabled={actionLoading === item.id}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoading === item.id ? 0.6 : 1,
                            flex: 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : item.status === 'pending' && item.payment_status !== 'paid' ? (
                      <div style={{ fontSize: '11px', color: '#d97706' }}>
                        Awaiting payment
                      </div>
                    ) : item.status === 'approved' ? (
                      <div style={{ fontSize: '11px', color: '#059669' }}>
                        ✓ Approved
                      </div>
                    ) : item.status === 'rejected' ? (
                      <div style={{ fontSize: '11px', color: '#dc2626' }}>
                        ✗ Rejected
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
            }}>
              <h3 style={{ marginBottom: '16px' }}>Reject Application</h3>
              <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                Please provide a reason for rejecting this application.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={actionLoading === showRejectModal || !rejectReason.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading === showRejectModal || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === showRejectModal || !rejectReason.trim() ? 0.6 : 1,
                  }}
                >
                  {actionLoading === showRejectModal ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mobile Responsiveness CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ApplicationsPage;
