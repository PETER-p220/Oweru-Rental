import { useState, useEffect } from 'react';
import {
  Search, Download, Eye, ChevronDown, ChevronUp,
  Calendar, User, CheckCircle, XCircle, Clock, AlertCircle,
  RefreshCw, ShieldCheck, FileText, Camera,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss,
  btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle, accentBtn,
} from './adminTheme';

type VerificationRequest = {
  id: number;
  user_id: number;
  type: string;
  status: string;
  documents: Array<{ type: string; url: string; verified: boolean }>;
  notes: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  user?: { name: string; email: string; phone: string; user_type: string };
};

const VerificationManagement = () => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy]           = useState('created_at');
  const [sortOrder, setSortOrder]     = useState<'asc' | 'desc'>('desc');

  useEffect(() => { loadVerificationRequests(); }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;
      const response = await Api.getVerificationRequests(filters);
      setVerificationRequests(response.data || []);
    } catch { setVerificationRequests([]); }
    finally { setLoading(false); }
  };

  const formatDate = (d: string) => d
    ? new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  const formatTimeAgo = (d: string) => {
    if (!d) return 'N/A';
    const ms = Date.now() - new Date(d).getTime();
    const h = Math.floor(ms / 3600000);
    const days = Math.floor(h / 24);
    if (days > 0) return `${days}d ago`;
    if (h > 0) return `${h}h ago`;
    return 'Just now';
  };

  const statusColor = (s: string) =>
    s === 'approved' ? C.green : s === 'pending' ? C.amber : s === 'rejected' ? C.red : s === 'in_review' ? C.blue : C.textMuted;

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'approved') return <CheckCircle size={14} />;
    if (status === 'pending')  return <Clock size={14} />;
    if (status === 'rejected') return <XCircle size={14} />;
    if (status === 'in_review') return <Eye size={14} />;
    return <AlertCircle size={14} />;
  };

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'identity') return <User size={14} />;
    return <ShieldCheck size={14} />;
  };

  const typeLabel = (type: string) => ({
    identity: 'Identity Verification',
    property: 'Property Ownership',
    agent:    'Agent License',
    business: 'Business Registration',
  }[type] ?? type);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const filteredRequests = [...verificationRequests]
    .sort((a: any, b: any) => {
      const mod = sortOrder === 'asc' ? 1 : -1;
      return a[sortBy] < b[sortBy] ? -mod : a[sortBy] > b[sortBy] ? mod : 0;
    })
    .filter(r =>
      (!searchTerm ||
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || r.status === statusFilter) &&
      (typeFilter === 'all' || r.type === typeFilter)
    );

  const handleApprove = async (id: number) => {
    try { await (Api as any).updateVerificationStatus?.(id, 'approved'); loadVerificationRequests(); setShowDetails(false); }
    catch { console.error('Approve failed'); }
  };

  const handleReject = async (id: number, reason: string) => {
    try { await (Api as any).updateVerificationStatus?.(id, 'rejected', reason); loadVerificationRequests(); setShowDetails(false); }
    catch { console.error('Reject failed'); }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'User', 'Type', 'Status', 'Documents', 'Created', 'Updated'],
      ...filteredRequests.map(r => [r.id, r.user?.name ?? 'N/A', r.type, r.status, r.documents?.length ?? 0, r.created_at, r.updated_at]),
    ].map(row => row.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `verification-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  /* ── stat counts ── */
  const counts = {
    pending:   filteredRequests.filter(r => r.status === 'pending').length,
    approved:  filteredRequests.filter(r => r.status === 'approved').length,
    rejected:  filteredRequests.filter(r => r.status === 'rejected').length,
    in_review: filteredRequests.filter(r => r.status === 'in_review').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        .vm-action-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .vm-row { border-bottom: 1px solid ${C.border}; transition: background .18s; }
        .vm-row:hover { background: ${C.goldBg}; }
        .vm-row:last-child { border-bottom: none; }
        .vm-sort-th { cursor: pointer; user-select: none; }
        .vm-sort-th:hover { color: ${C.gold} !important; }
      `}</style>
      <div style={pageInner}>

      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, color: '#fff' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · Verification</div>
            <h1 style={{ ...body, fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 6px', fontWeight: 800 }}>
              Verification Management
            </h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight, margin: 0 }}>
              Manage and review user verification requests
            </p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExport} className="vm-action-btn" style={accentBtn(C.green)}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={loadVerificationRequests} className="vm-action-btn" style={accentBtn(C.blue)}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Pending',   count: counts.pending,   color: C.amber, Icon: Clock        },
          { label: 'Approved',  count: counts.approved,  color: C.green,  Icon: CheckCircle  },
          { label: 'Rejected',  count: counts.rejected,  color: C.red,    Icon: XCircle      },
          { label: 'In Review', count: counts.in_review, color: C.blue,   Icon: Eye          },
        ].map(({ label, count, color, Icon }) => (
          <div key={label} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
            {/* gold top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '12px 12px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div style={{ ...body, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 4 }}>{label}</div>
                <div style={{ ...body, fontSize: 26, color: C.text, lineHeight: 1 }}>{count}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
            <input
              type="text"
              placeholder="Search by name, email or type…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input"
              style={{ ...inputCss, paddingLeft: 38 }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input" style={{ ...inputCss, width: 'auto', minWidth: 130 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="admin-input" style={{ ...inputCss, width: 'auto', minWidth: 130 }}>
            <option value="all">All Types</option>
            <option value="identity">Identity</option>
            <option value="property">Property</option>
            <option value="agent">Agent</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {/* Gold accent line */}
        <div style={{ height: 2, background: C.gold }} />
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.slate100 }}>
                {[
                  { label: 'ID',      field: 'id',         sortable: true  },
                  { label: 'User',    field: 'user',       sortable: false },
                  { label: 'Type',    field: 'type',       sortable: false },
                  { label: 'Status',  field: 'status',     sortable: false },
                  { label: 'Docs',    field: 'documents',  sortable: false },
                  { label: 'Created', field: 'created_at', sortable: true  },
                  { label: 'Action',  field: '',           sortable: false },
                ].map(col => (
                  <th
                    key={col.label}
                    className={col.sortable ? 'vm-sort-th' : ''}
                    onClick={col.sortable ? () => handleSort(col.field) : undefined}
                    style={{
                      ...body,
                      padding: '12px 14px',
                      textAlign: 'left',
                      color: sortBy === col.field ? C.gold : C.textMuted,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.sortable && sortBy === col.field && (
                        sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...body, padding: '48px 20px', textAlign: 'center', color: C.textMuted }}>
                    <Search size={32} style={{ color: C.gold, opacity: 0.4, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                    No verification requests found
                  </td>
                </tr>
              ) : filteredRequests.map(request => (
                <tr key={request.id} className="vm-row">
                  {/* ID */}
                  <td style={{ ...body, padding: '13px 14px', color: C.textMuted, fontSize: 13 }}>
                    <span style={{ fontFamily: 'monospace', color: C.gold }}>#{request.id}</span>
                  </td>

                  {/* User */}
                  <td style={{ ...body, padding: '13px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{request.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{request.user?.email || 'N/A'}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1, textTransform: 'capitalize', letterSpacing: '0.06em' }}>{request.user?.user_type || ''}</div>
                  </td>

                  {/* Type */}
                  <td style={{ ...body, padding: '13px 14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldBg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: C.gold }}>
                      <TypeIcon type={request.type} />
                      {typeLabel(request.type)}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ ...body, padding: '13px 14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${statusColor(request.status)}15`, border: `1px solid ${statusColor(request.status)}30`, borderRadius: 4, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: statusColor(request.status), textTransform: 'capitalize' }}>
                      <StatusIcon status={request.status} />
                      {request.status.replace('_', ' ')}
                    </div>
                  </td>

                  {/* Docs */}
                  <td style={{ ...body, padding: '13px 14px', color: C.textMuted, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} style={{ color: C.gold }} />
                      {request.documents?.length || 0} file{(request.documents?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </td>

                  {/* Created */}
                  <td style={{ ...body, padding: '13px 14px' }}>
                    <div style={{ fontSize: 13, color: C.text }}>{formatDate(request.created_at)}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{formatTimeAgo(request.created_at)}</div>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '13px 14px' }}>
                    <button
                      onClick={() => { setSelectedRequest(request); setShowDetails(true); }}
                      className="vm-action-btn"
                      style={{ ...accentBtn(C.blue), padding: '7px 12px', fontSize: 12 }}
                      title="View Details"
                    >
                      <Eye size={13} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Details Modal ── */}
      {showDetails && selectedRequest && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDetails(false); }}
        >
          <div style={{ ...card, maxWidth: 760, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', padding: 0 }}>
            {/* Gold top accent */}
            <div style={{ height: 3, background: C.gold, borderRadius: '12px 12px 0 0' }} />

            <div style={{ padding: '28px 28px 24px' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <div className="section-tag" style={{ marginBottom: 8 }}>Request #{selectedRequest.id}</div>
                  <h2 style={{ ...body, fontSize: 22, color: C.text, margin: 0 }}>
                    Verification Details
                  </h2>
                </div>
                <button onClick={() => setShowDetails(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 6 }}>
                  <XCircle size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: 24 }}>

                {/* Two-column summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Request info */}
                  <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px' }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 14 }}>Request Info</div>
                    {[
                      { label: 'Type',    value: typeLabel(selectedRequest.type) },
                      { label: 'Status',  value: selectedRequest.status.replace('_', ' '), color: statusColor(selectedRequest.status) },
                      { label: 'Created', value: formatDate(selectedRequest.created_at) },
                      { label: 'Updated', value: formatDate(selectedRequest.updated_at) },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid rgba(200,145,40,0.07)` }}>
                        <span style={{ ...body, fontSize: 12, color: C.textMuted }}>{label}</span>
                        <span style={{ ...body, fontSize: 12, fontWeight: 600, color: color ?? C.text, textTransform: 'capitalize' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* User info */}
                  <div style={{ background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px' }}>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 14 }}>User Info</div>
                    {[
                      { label: 'Name',      value: selectedRequest.user?.name      || 'N/A' },
                      { label: 'Email',     value: selectedRequest.user?.email     || 'N/A' },
                      { label: 'Phone',     value: selectedRequest.user?.phone     || 'N/A' },
                      { label: 'User Type', value: selectedRequest.user?.user_type || 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid rgba(200,145,40,0.07)` }}>
                        <span style={{ ...body, fontSize: 12, color: C.textMuted }}>{label}</span>
                        <span style={{ ...body, fontSize: 12, fontWeight: 600, color: C.text, textTransform: 'capitalize', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Submitted Documents</div>
                  {(!selectedRequest.documents || selectedRequest.documents.length === 0) ? (
                    <div style={{ ...body, fontSize: 13, color: C.textMuted, padding: '16px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, textAlign: 'center' }}>No documents submitted</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedRequest.documents.map((doc, i) => (
                        <div key={i} style={{ padding: '12px 14px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, background: `${C.blue}18`, border: `1px solid ${C.blue}30`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Camera size={16} style={{ color: C.blue }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...body, fontSize: 13, fontWeight: 600, color: C.text }}>
                              {doc.type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div style={{ ...body, fontSize: 11, marginTop: 2, color: doc.verified ? C.green : C.amber }}>
                              {doc.verified ? '✓ Verified' : '⏳ Pending verification'}
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(doc.url, '_blank')}
                            className="vm-action-btn"
                            style={{ ...accentBtn(C.blue), padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
                          >
                            <Eye size={12} /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'User Notes',  value: selectedRequest.notes       || 'No notes provided'  },
                    { label: 'Admin Notes', value: selectedRequest.admin_notes || 'No admin notes'      },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 6 }}>{label}</div>
                      <div style={{ ...body, fontSize: 13, color: C.text, padding: '10px 12px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 6, lineHeight: 1.6 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Review actions — only for pending */}
                {selectedRequest.status === 'pending' && (
                  <div>
                    <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 14 }}>Review Actions</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="vm-action-btn"
                        style={{ ...accentBtn(C.green), padding: '13px', fontSize: 13, fontWeight: 700 }}
                      >
                        <CheckCircle size={15} /> Approve Request
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) handleReject(selectedRequest.id, reason);
                        }}
                        className="vm-action-btn"
                        style={{ ...accentBtn(C.red), padding: '13px', fontSize: 13, fontWeight: 700 }}
                      >
                        <XCircle size={15} /> Reject Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default VerificationManagement;