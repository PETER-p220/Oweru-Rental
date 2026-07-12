import { useEffect, useState } from 'react';
import Api from '../../services/api';

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'TZS 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(num);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

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

  const renderActions = (item: any, size: 'compact' | 'full') => {
    if (item.status === 'pending' && item.payment_status === 'paid') {
      return (
        <div style={{ display: 'flex', gap: '8px', flexDirection: size === 'compact' ? 'column' : 'row' }}>
          <button
            onClick={() => handleApprove(item.id)}
            disabled={actionLoading === item.id}
            style={{
              padding: size === 'compact' ? '6px 12px' : '8px 16px',
              fontSize: size === 'compact' ? '11px' : '12px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
              opacity: actionLoading === item.id ? 0.6 : 1,
              flex: size === 'full' ? 1 : undefined,
            }}
          >
            {actionLoading === item.id ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectModal(item.id)}
            disabled={actionLoading === item.id}
            style={{
              padding: size === 'compact' ? '6px 12px' : '8px 16px',
              fontSize: size === 'compact' ? '11px' : '12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: actionLoading === item.id ? 'not-allowed' : 'pointer',
              opacity: actionLoading === item.id ? 0.6 : 1,
              flex: size === 'full' ? 1 : undefined,
            }}
          >
            Reject
          </button>
        </div>
      );
    }
    if (item.status === 'pending' && item.payment_status !== 'paid') {
      return <div style={{ fontSize: '11px', color: '#d97706' }}>Awaiting payment</div>;
    }
    if (item.status === 'approved') {
      return <div style={{ fontSize: '11px', color: '#059669' }}>✓ Approved</div>;
    }
    if (item.status === 'rejected') {
      return <div style={{ fontSize: '11px', color: '#dc2626' }}>✗ Rejected</div>;
    }
    return null;
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh', padding: '0' }}>
      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Agent Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Applications</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>
              Applications submitted for properties assigned to you.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 40px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px' }}>
          {error && <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px 16px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}
          
          {/* Desktop Table View */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} className="desktop-table">
              <thead><tr><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applicant</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th><th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td style={{ padding: '12px', color: '#64748B' }} colSpan={6}>Loading applications...</td></tr> : items.length === 0 ? <tr><td style={{ padding: '12px', color: '#64748B' }} colSpan={6}>No applications found.</td></tr> : items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      <div>{item.user?.first_name} {item.user?.last_name}</div>
                      <div style={{ color: '#94A3B8', marginTop: '4px', fontSize: '12px' }}>{item.user?.email}</div>
                      <div style={{ color: '#94A3B8', marginTop: '2px', fontSize: '12px' }}>{item.user?.phone}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      <div>{item.property?.title}</div>
                      <div style={{ color: '#94A3B8', marginTop: '4px', fontSize: '12px' }}>{formatCurrency(item.property?.price)}/month</div>
                      <div style={{ color: '#94A3B8', marginTop: '2px', fontSize: '12px' }}>{item.property?.location}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      <span style={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                      {item.rejection_reason && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                          {item.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
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
                    <div style={{ marginTop: 6 }}>
                      {item.rent_payment_status === 'paid' ? (
                        <div style={{ fontSize: '11px', color: '#059669' }}>✓ Rent paid</div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#d97706' }}>
                          Rent: {(item.rent_payment_status ?? 'pending')}
                        </div>
                      )}
                    </div>
                    </td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{formatDate(item.created_at)}</td>
                    <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      {renderActions(item, 'compact')}
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
                    {/* Applicant + Property side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Applicant</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#f1f5f9', marginBottom: '4px' }}>
                          {item.user?.first_name} {item.user?.last_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8ea0b5', marginBottom: '2px' }}>{item.user?.email}</div>
                        <div style={{ fontSize: '12px', color: '#8ea0b5' }}>{item.user?.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Property</div>
                        <div style={{ fontSize: '14px', color: '#f1f5f9', marginBottom: '4px' }}>{item.property?.title}</div>
                        <div style={{ fontSize: '12px', color: '#8ea0b5', marginBottom: '2px' }}>{formatCurrency(item.property?.price)}/month</div>
                        <div style={{ fontSize: '12px', color: '#8ea0b5' }}>{item.property?.location}</div>
                      </div>
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
                      {item.rent_payment_status === 'paid' ? (
                        <span style={getStatusBadge('approved')}>Rent paid</span>
                      ) : (
                        <span style={getStatusBadge('pending')}>Rent: {(item.rent_payment_status ?? 'pending')}</span>
                      )}
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
                    {renderActions(item, 'full')}
                  </div>
                ))}
              </div>
            )}
          </div>
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
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '100%',
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
                  boxSizing: 'border-box',
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
      </div>

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