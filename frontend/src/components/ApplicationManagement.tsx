import React, { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle, XCircle, MessageSquare, User, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface ApplicationItem {
  id: number;
  user: { name: string; email: string; phone?: string };
  status: 'pending' | 'approved' | 'rejected';
  offered_rent: number;
  message?: string;
  applied_at: string;
  landlord_notes?: string;
}

interface ApplicationManagementProps {
  applications: ApplicationItem[];
  propertyTitle: string;
  isLoading?: boolean;
  onApprove: (applicationId: number) => Promise<void>;
  onReject: (applicationId: number, reason: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .app-stats-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
    .app-stats-grid > div { padding: 12px 8px !important; }
    .app-stats-num { font-size: 20px !important; }
    .app-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .app-header-row button { align-self: flex-end; }
    .app-card-meta { flex-direction: column !important; gap: 6px !important; }
    .app-contact-grid { grid-template-columns: 1fr !important; }
  }
`;

const ApplicationCardOwner: React.FC<{
  application: ApplicationItem;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}> = ({ application, onApprove, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    try {
      await onApprove(application.id);
      setSuccess(true);
      setTimeout(() => { setIsExpanded(false); setSuccess(false); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application');
    } finally { setIsApproving(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { setError('Please provide a reason for rejection'); return; }
    setIsRejecting(true);
    setError(null);
    try {
      await onReject(application.id, rejectionReason);
      setSuccess(true);
      setTimeout(() => { setIsExpanded(false); setSuccess(false); setRejectionReason(''); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application');
    } finally { setIsRejecting(false); }
  };

  const statusStyles: Record<string, React.CSSProperties> = {
    approved: { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
    rejected: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    pending:  { background: '#ffedd5', color: '#92400e', border: '1px solid #fcd34d' },
  };

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Card header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '14px 16px', background: 'none',
          border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={16} color="#6b7280" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', lineHeight: 1.2 }}>
                  {application.user.name}
                </div>
                <div style={{
                  fontSize: 12, color: '#6b7280',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {application.user.email}
                </div>
              </div>
            </div>
            {/* Meta row */}
            <div className="app-card-meta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#374151' }}>
                <DollarSign size={13} color="#6b7280" />
                <span style={{ fontWeight: 600 }}>
                  Tsh {application.offered_rent.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280' }}>
                <Calendar size={12} />
                {new Date(application.applied_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          {/* Right: status + chevron */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              ...statusStyles[application.status],
            }}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
            {isExpanded
              ? <ChevronUp size={16} color="#9ca3af" />
              : <ChevronDown size={16} color="#9ca3af" />
            }
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 16px' }}>
          {application.message && (
            <div style={{
              background: '#eff6ff', borderRadius: 8, padding: '10px 12px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MessageSquare size={14} color="#3b82f6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>Tenant's Message</span>
              </div>
              <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>
                {application.message}
              </p>
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 12px', marginBottom: 12,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '10px 12px', marginBottom: 12,
              display: 'flex', gap: 8,
            }}>
              <CheckCircle size={16} color="#16a34a" />
              <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>Action completed!</p>
            </div>
          )}

          {/* Contact info */}
          <div className="app-contact-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10, background: '#f9fafb',
            borderRadius: 8, padding: '10px 12px', marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
              <div style={{ fontSize: 12, color: '#374151', wordBreak: 'break-all' }}>{application.user.email}</div>
            </div>
            {application.user.phone && (
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</div>
                <div style={{ fontSize: 12, color: '#374151' }}>{application.user.phone}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          {application.status === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                style={{
                  width: '100%', padding: '12px',
                  background: isApproving || isRejecting ? '#d1fae5' : '#16a34a',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, cursor: isApproving || isRejecting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isApproving
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Approving...</>
                  : <><CheckCircle size={16} /> Approve Application</>
                }
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required to reject)..."
                  rows={2}
                  disabled={isRejecting}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #e5e7eb', borderRadius: 8,
                    fontSize: 13, resize: 'vertical', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    background: isRejecting ? '#f9fafb' : '#fff',
                  }}
                />
                <button
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  style={{
                    width: '100%', padding: '11px',
                    background: 'transparent',
                    color: '#dc2626', border: '1px solid #fca5a5',
                    borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: isApproving || isRejecting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isRejecting
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Rejecting...</>
                    : <><XCircle size={16} /> Reject</>
                  }
                </button>
              </div>
            </div>
          )}

          {application.status === 'approved' && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
                ✓ Application approved. Tenant will proceed with payment.
              </p>
            </div>
          )}

          {application.status === 'rejected' && (
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>Application rejected.</p>
              {application.landlord_notes && (
                <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>
                  Reason: {application.landlord_notes}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ApplicationManagement: React.FC<ApplicationManagementProps> = ({
  applications, propertyTitle, isLoading = false, onApprove, onReject, onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await onRefresh?.(); } finally { setRefreshing(false); }
  };

  const pendingCount  = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  if (isLoading) {
    return (
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
        padding: '48px 24px', display: 'flex', justifyContent: 'center',
      }}>
        <Loader2 size={24} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{MOBILE_STYLES}</style>

      {/* Header */}
      <div className="app-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
            Applications for {propertyTitle}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Manage rental applications from interested tenants
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '8px 14px', background: '#f9fafb',
            border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 13, cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, color: '#374151',
          }}
        >
          {refreshing && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          Refresh
        </button>
      </div>

      {/* Stats — always 3 cols */}
      <div className="app-stats-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
      }}>
        {[
          { count: pendingCount,  label: 'Pending',  bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
          { count: approvedCount, label: 'Approved', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
          { count: rejectedCount, label: 'Rejected', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
        ].map(({ count, label, bg, border, text }) => (
          <div key={label} style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: 10, padding: '14px 12px', textAlign: 'center',
          }}>
            <div className="app-stats-num" style={{ fontSize: 26, fontWeight: 800, color: text, lineHeight: 1 }}>
              {count}
            </div>
            <div style={{ fontSize: 12, color: text, marginTop: 4, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Application cards */}
      {applications.length === 0 ? (
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            No applications yet. Share your property to get started!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {applications.map(application => (
            <ApplicationCardOwner
              key={application.id}
              application={application}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;