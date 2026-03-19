import { useState, useEffect } from 'react';
import {
  Shield, Search, Plus, Edit, Trash2, Eye,
  Calendar, CheckCircle, X, AlertTriangle, Clock,
  User, Home, FileText, ArrowUpDown, Users, Building,
  AlertCircle, UserCheck, Mail, Phone, XCircle,
  ShieldAlert, BadgeCheck, ScanLine,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ───────────────────────────────────────────────── */
interface VerificationRequest {
  id: number;
  user: { id: number; name: string; email: string; phone: string; type: string };
  type: 'identity' | 'email' | 'phone' | 'address' | 'property' | 'document' | 'background';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  documents: { type: string; url: string; fileName: string; fileSize: number; uploadedAt: string }[];
  metadata: {
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    expiresAt?: string;
    notes?: string;
    rejectionReason?: string;
    verificationMethod?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  property?: { id: number; title: string; address: string };
}

interface VerificationTemplate {
  id: number;
  name: string;
  description: string;
  type: 'identity' | 'email' | 'phone' | 'address' | 'property' | 'document' | 'background';
  requiredDocuments: string[];
  autoVerify: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VerificationStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  inReviewRequests: number;
  verificationRate: number;
  avgProcessingTime: number;
  requestsThisMonth: number;
  topVerificationType: string;
  urgentRequests: number;
}

/* ─── Shared style tokens ────────────────────────────────── */
const tk = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark2:  '#0e0e0e',
  cream:  '#e8e4dc',
  muted:  '#7a7060',
  border: 'rgba(201,168,76,0.12)',
  green:  '#10b981',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  red:    '#ef4444',
  purple: '#8b5cf6',
  cyan:   '#06b6d4',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: tk.dark2,
  border: `1px solid ${tk.border}`,
  borderRadius: 10,
};

const innerRow: React.CSSProperties = {
  border: '1px solid rgba(201,168,76,0.07)',
  borderRadius: 8,
  padding: 20,
  transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
  ...body, fontSize: 10, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: tk.muted,
};

const pill = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 9px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color, borderRadius: 999,
  fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

const ghostBtn = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px',
  backgroundColor: `${color}10`,
  border: `1px solid ${color}25`,
  color, borderRadius: 6,
  fontSize: 12, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.18s',
});

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px',
  background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldLt})`,
  border: 'none', color: '#111',
  borderRadius: 6, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.03em',
  boxShadow: `0 3px 14px rgba(201,168,76,0.28)`,
};

const selectStyle: React.CSSProperties = {
  ...body, padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const statusColor = (s: string): string =>
  ({ approved: tk.green, in_review: tk.blue, pending: tk.amber, rejected: tk.red, expired: tk.muted }[s] ?? tk.muted);

const typeColor = (t: string): string =>
  ({ identity: tk.blue, email: tk.green, phone: tk.amber, address: tk.purple, property: tk.red, document: tk.muted, background: tk.cyan }[t] ?? tk.muted);

const priorityColor = (p: string): string =>
  ({ urgent: tk.red, high: tk.amber, medium: tk.blue, low: tk.green }[p] ?? tk.muted);

/* ── Valid lucide-react icon substitutes for removed icons ── */
const getStatusIcon = (status: string) =>
  ({ approved: CheckCircle, in_review: Clock, pending: AlertCircle, rejected: XCircle, expired: AlertTriangle }[status] ?? FileText);

const getTypeIcon = (type: string) =>
  ({ identity: UserCheck, email: Mail, phone: Phone, address: Home, property: Building, document: FileText, background: Shield }[type] ?? FileText);

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const VerificationManagement = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'templates' | 'analytics'>('requests');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [templates, setTemplates] = useState<VerificationTemplate[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { loadVerificationData(); }, [activeTab]);

  const loadVerificationData = async () => {
    try {
      setLoading(true);

      const [requestsRes, statsRes] = await Promise.all([
        Api.getVerificationRequests({
          search: searchTerm,
          type: typeFilter,
          status: statusFilter,
        }),
        Api.getVerificationStats(),
      ]);

      if (requestsRes.data) {
        setRequests(requestsRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
      const mockStats: VerificationStats = {
        totalRequests: 4, pendingRequests: 1, approvedRequests: 1, rejectedRequests: 1, inReviewRequests: 1,
        verificationRate: 75.0, avgProcessingTime: 2.5, requestsThisMonth: 4,
        topVerificationType: 'identity', urgentRequests: 0,
      };

      setRequests(mockRequests);
      setTemplates(mockTemplates);
      setStats(mockStats);
    } catch (e) {
      console.error('Failed to load verification data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (id: number) => {
    setRequests((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: 'approved' as const, metadata: { ...r.metadata, reviewedAt: new Date().toISOString(), reviewedBy: 'Admin' } } : r
    ));
  };

  const handleRejectRequest = (id: number) => {
    const reason = prompt('Rejection reason:') ?? 'Documents not clear';
    setRequests((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: 'rejected' as const, metadata: { ...r.metadata, reviewedAt: new Date().toISOString(), reviewedBy: 'Admin', rejectionReason: reason } } : r
    ));
  };

  const openDetailModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  /* ── Filtered requests ── */
  const filteredRequests = requests.filter((r) =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (typeFilter   === 'all' || r.type   === typeFilter)
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.15)', borderTop: `3px solid ${tk.gold}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: tk.muted, ...body, fontSize: 13 }}>Loading verification data…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        .vm-row:hover { border-color: rgba(201,168,76,0.15) !important; background: rgba(201,168,76,0.015) !important; }
        .vm-btn:hover  { filter: brightness(1.1); transform: translateY(-1px); }
        .vm-btn:active { transform: scale(.97); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Shield size={22} style={{ color: tk.gold }} />
          <h1 style={{ ...serif, fontSize: 26, fontWeight: 600, color: tk.cream, margin: 0, letterSpacing: '-0.02em' }}>
            Verification Management
          </h1>
        </div>
        <p style={{ color: tk.muted, ...body, fontSize: 13, margin: 0 }}>
          Manage user verification requests and security protocols.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',        value: stats.totalRequests,        color: tk.cream },
            { label: 'Pending',      value: stats.pendingRequests,      color: tk.amber },
            { label: 'In Review',    value: stats.inReviewRequests,     color: tk.blue  },
            { label: 'Approved',     value: stats.approvedRequests,     color: tk.green },
            { label: 'Rejected',     value: stats.rejectedRequests,     color: tk.red   },
            { label: 'Success Rate', value: `${stats.verificationRate}%`, color: tk.green },
            { label: 'Avg. Time',    value: `${stats.avgProcessingTime}h`, color: tk.cream },
            { label: 'This Month',   value: stats.requestsThisMonth,    color: tk.gold  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ ...body, fontSize: 18, fontWeight: 700, color, marginBottom: 3, lineHeight: 1.2 }}>{value}</div>
              <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab toggle ── */}
      <div style={{ ...card, padding: 4, marginBottom: 20, display: 'flex', gap: 4 }}>
        {(['requests', 'templates', 'analytics'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '8px 14px',
            backgroundColor: activeTab === tab ? tk.gold : 'transparent',
            border: `1px solid ${activeTab === tab ? tk.gold : 'rgba(201,168,76,0.15)'}`,
            color: activeTab === tab ? '#111' : tk.muted,
            borderRadius: 6, ...body, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
          }}>
            {tab === 'requests' ? 'Requests' : tab === 'templates' ? 'Templates' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* ══ REQUESTS TAB ══ */}
      {activeTab === 'requests' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Verification Requests</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Types</option>
                <option value="identity">Identity</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="address">Address</option>
                <option value="property">Property</option>
                <option value="document">Document</option>
                <option value="background">Background</option>
              </select>
            </div>
          </div>

          {filteredRequests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: tk.muted, ...body, fontSize: 13 }}>
              No verification requests match your filters.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredRequests.map((req) => {
              const StatusIcon = getStatusIcon(req.status);
              const TypeIcon   = getTypeIcon(req.type);
              const sColor = statusColor(req.status);
              const tColor = typeColor(req.type);
              const pColor = priorityColor(req.priority);

              return (
                <div key={req.id} className="vm-row" style={innerRow}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                    {/* Icon */}
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: `${sColor}12`, border: `1px solid ${sColor}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <StatusIcon size={20} style={{ color: sColor }} />
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div>
                          <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 5px' }}>
                            {req.user.name}
                            <span style={{ color: tk.muted, fontWeight: 400, marginLeft: 6 }}>
                              · {req.type.charAt(0).toUpperCase() + req.type.slice(1)} Verification
                            </span>
                          </h4>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                              <User size={11} /> {req.user.type}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                              <Mail size={11} /> {req.user.email}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                              <Phone size={11} /> {req.user.phone}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
                          <span style={pill(sColor)}>{req.status.replace('_', ' ')}</span>
                          <span style={pill(tColor)}>{req.type}</span>
                          <span style={pill(pColor)}>{req.priority}</span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <Calendar size={11} /> Submitted: {fmtDate(req.metadata.submittedAt)}
                        </span>
                        {req.metadata.reviewedAt && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                            <CheckCircle size={11} /> Reviewed: {fmtDate(req.metadata.reviewedAt)}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <FileText size={11} /> {req.documents.length} document{req.documents.length !== 1 ? 's' : ''}
                        </span>
                        {req.property && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                            <Building size={11} /> {req.property.title}
                          </span>
                        )}
                      </div>

                      {/* Document tags */}
                      {req.documents.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {req.documents.map((doc, i) => (
                            <span key={i} style={pill(tk.gold)}>{doc.type.replace('_', ' ')}</span>
                          ))}
                        </div>
                      )}

                      {/* Rejection reason */}
                      {req.metadata.rejectionReason && (
                        <div style={{
                          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                          borderRadius: 6, padding: '8px 12px', marginBottom: 10,
                        }}>
                          <p style={{ ...body, fontSize: 11.5, color: '#fca5a5', margin: 0, lineHeight: 1.55 }}>
                            <strong style={{ color: tk.red }}>Rejection: </strong>{req.metadata.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={ghostBtn(tk.gold)}  className="vm-btn" onClick={() => openDetailModal(req)}>
                          <Eye size={13} /> View Details
                        </button>
                        {(req.status === 'pending' || req.status === 'in_review') && (
                          <>
                            <button style={ghostBtn(tk.green)} className="vm-btn" onClick={() => handleApproveRequest(req.id)}>
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button style={ghostBtn(tk.red)}   className="vm-btn" onClick={() => handleRejectRequest(req.id)}>
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                      </div>

                    </div>{/* /body */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TEMPLATES TAB ══ */}
      {activeTab === 'templates' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Verification Templates</h3>
            <button style={solidBtn} className="vm-btn">
              <Plus size={14} /> Create Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 18 }}>
            {templates.map((tmpl) => {
              const TypeIcon = getTypeIcon(tmpl.type);
              const tColor = typeColor(tmpl.type);

              return (
                <div key={tmpl.id} className="vm-row" style={{ ...innerRow, display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: tmpl.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.10)',
                      border: `1px solid ${tmpl.isActive ? 'rgba(16,185,129,0.28)' : 'rgba(107,114,128,0.22)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TypeIcon size={20} style={{ color: tmpl.isActive ? tk.green : tk.muted }} />
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, marginBottom: 4 }}>{tmpl.name}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={pill(tmpl.isActive ? tk.green : tk.muted)}>{tmpl.isActive ? 'Active' : 'Inactive'}</span>
                        <span style={pill(tColor)}>{tmpl.type}</span>
                        <span style={pill(tmpl.autoVerify ? tk.green : tk.amber)}>{tmpl.autoVerify ? 'Auto' : 'Manual'}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ ...body, fontSize: 12.5, color: '#9a9080', margin: 0, lineHeight: 1.6 }}>
                    {tmpl.description}
                  </p>

                  {tmpl.requiredDocuments.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {tmpl.requiredDocuments.map((doc) => (
                        <span key={doc} style={pill(tk.gold)}>{doc.replace('_', ' ')}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={ghostBtn(tk.gold)} className="vm-btn"><Edit size={13} /> Edit</button>
                    <button style={ghostBtn(tk.blue)} className="vm-btn"><Eye  size={13} /> Preview</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ ANALYTICS TAB ══ */}
      {activeTab === 'analytics' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: '0 0 22px' }}>
            Verification Analytics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>Performance</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Success Rate',        value: `${stats.verificationRate}%`, color: tk.green },
                    { label: 'Avg. Processing Time',value: `${stats.avgProcessingTime}h`, color: tk.cream },
                    { label: 'Requests This Month', value: stats.requestsThisMonth,      color: tk.cream },
                    { label: 'Top Type',            value: stats.topVerificationType,    color: tk.gold  },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ ...body, fontSize: 12, color: tk.muted }}>{label}</span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 600, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>By Type</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['identity','email','phone','address','property','document','background'] as const).map((type) => {
                  const count = requests.filter((r) => r.type === type).length;
                  const color = typeColor(type);
                  return (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...body, fontSize: 12, color: tk.muted }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 700, color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>Status Breakdown</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Approved',   value: stats.approvedRequests,  color: tk.green },
                    { label: 'In Review',  value: stats.inReviewRequests,  color: tk.blue  },
                    { label: 'Pending',    value: stats.pendingRequests,   color: tk.amber },
                    { label: 'Rejected',   value: stats.rejectedRequests,  color: tk.red   },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...body, fontSize: 12, color: tk.muted }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {label}
                      </span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL MODAL ══ */}
      {showDetailModal && selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 }}>
          <div style={{ ...card, padding: 28, maxWidth: 520, width: '100%', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowDetailModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: tk.muted, cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={15} style={{ color: tk.gold }} />
              <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Verification Request</h3>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              <span style={pill(statusColor(selectedRequest.status))}>{selectedRequest.status.replace('_', ' ')}</span>
              <span style={pill(typeColor(selectedRequest.type))}>{selectedRequest.type}</span>
              <span style={pill(priorityColor(selectedRequest.priority))}>{selectedRequest.priority}</span>
            </div>

            {[
              { label: 'User',         value: selectedRequest.user.name },
              { label: 'User Type',    value: selectedRequest.user.type },
              { label: 'Email',        value: selectedRequest.user.email },
              { label: 'Phone',        value: selectedRequest.user.phone },
              { label: 'Method',       value: selectedRequest.metadata.verificationMethod ?? '—' },
              { label: 'Submitted',    value: fmtDate(selectedRequest.metadata.submittedAt) },
              selectedRequest.metadata.reviewedAt ? { label: 'Reviewed', value: `${fmtDate(selectedRequest.metadata.reviewedAt)} by ${selectedRequest.metadata.reviewedBy}` } : null,
              selectedRequest.property            ? { label: 'Property', value: selectedRequest.property.title }                       : null,
              selectedRequest.metadata.rejectionReason ? { label: 'Rejection', value: selectedRequest.metadata.rejectionReason }      : null,
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
                <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...body, fontSize: 12.5, color: tk.cream, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            {selectedRequest.documents.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...labelStyle, marginBottom: 8 }}>Documents</div>
                {selectedRequest.documents.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                    <span style={{ ...body, fontSize: 12, color: tk.cream }}>{doc.fileName}</span>
                    <span style={{ ...body, fontSize: 11, color: tk.muted }}>{formatFileSize(doc.fileSize)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_review') && (
                <>
                  <button style={{ ...ghostBtn(tk.green), flex: 1, justifyContent: 'center' }} className="vm-btn"
                    onClick={() => { handleApproveRequest(selectedRequest.id); setShowDetailModal(false); }}>
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button style={{ ...ghostBtn(tk.red), flex: 1, justifyContent: 'center' }} className="vm-btn"
                    onClick={() => { handleRejectRequest(selectedRequest.id); setShowDetailModal(false); }}>
                    <XCircle size={13} /> Reject
                  </button>
                </>
              )}
              <button style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }} className="vm-btn"
                onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VerificationManagement;