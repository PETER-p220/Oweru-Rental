import { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Eye, Edit, Trash2, Plus,
  Calendar, User, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, BarChart3, PieChart, RefreshCw, ChevronDown, ChevronUp,
  ShieldCheck, Mail, Phone, MapPin, FileText, Camera, Upload
} from 'lucide-react';
import Api from '../../services/api';

/* ─────────────────────────────────────────────────────────────
   VERIFICATION MANAGEMENT STYLE TOKENS
───────────────────────────────────────────────────────────── */
const t = {
  gold:    '#c9a84c',
  goldLt:  '#e8c97a',
  dark:    '#080808',
  dark2:   '#0e0e0e',
  dark3:   '#141414',
  cream:   '#e8e4dc',
  muted:   '#7a7060',
  border:  'rgba(201,168,76,0.12)',
  green:   '#10b981',
  red:     '#ef4444',
  blue:    '#38bdf8',
  orange:  '#f59e0b',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: '20px',
};

const button: React.CSSProperties = {
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s',
};

/* ─────────────────────────────────────────────────────────────
   VERIFICATION MANAGEMENT COMPONENT
───────────────────────────────────────────────────────────── */
const VerificationManagement = () => {
  const [verificationRequests, setVerificationRequests] = useState<Array<{
    id: number;
    user_id: number;
    type: string;
    status: string;
    documents: Array<{
      type: string;
      url: string;
      verified: boolean;
    }>;
    notes: string;
    admin_notes: string;
    created_at: string;
    updated_at: string;
    user?: {
      name: string;
      email: string;
      phone: string;
      user_type: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<{
    id: number;
    user_id: number;
    type: string;
    status: string;
    documents: Array<{
      type: string;
      url: string;
      verified: boolean;
    }>;
    notes: string;
    admin_notes: string;
    created_at: string;
    updated_at: string;
    user?: {
      name: string;
      email: string;
      phone: string;
      user_type: string;
    };
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadVerificationRequests();
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;

      const response = await Api.getVerificationRequests(filters);
      setVerificationRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load verification requests:', error);
      setVerificationRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return t.green;
      case 'pending': return t.orange;
      case 'rejected': return t.red;
      case 'in_review': return t.blue;
      default: return t.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'in_review': return <Eye size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'identity': return <User size={16} />;
      case 'property': return <ShieldCheck size={16} />;
      case 'agent': return <ShieldCheck size={16} />;
      case 'business': return <ShieldCheck size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'identity': return 'Identity Verification';
      case 'property': return 'Property Ownership';
      case 'agent': return 'Agent License';
      case 'business': return 'Business Registration';
      default: return type;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedRequests = [...verificationRequests].sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (aValue < bValue) return -1 * modifier;
    if (aValue > bValue) return 1 * modifier;
    return 0;
  });

  const filteredRequests = sortedRequests.filter((request: any) => {
    const matchesSearch = !searchTerm || 
      request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleApprove = async (requestId: number) => {
    try {
      // API call to approve verification
      await Api.updateVerificationStatus?.(requestId, 'approved');
      loadVerificationRequests();
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: number, reason: string) => {
    try {
      // API call to reject verification
      await Api.updateVerificationStatus?.(requestId, 'rejected', reason);
      loadVerificationRequests();
      setShowDetails(false);
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleExport = () => {
    // CSV export logic
    const csv = [
      ['ID', 'User', 'Type', 'Status', 'Documents', 'Created', 'Updated'],
      ...filteredRequests.map((r: any) => [
        r.id,
        r.user?.name || 'N/A',
        r.type,
        r.status,
        r.documents?.length || 0,
        r.created_at,
        r.updated_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px',
        backgroundColor: t.dark2,
        borderRadius: 12,
        border: `1px solid ${t.border}`
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${t.border}`,
          borderTop: `3px solid ${t.gold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>
            Verification Management
          </h1>
          <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>
            Manage and review user verification requests
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExport}
            style={{ ...button, backgroundColor: `${t.green}20`, color: t.green }}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={loadVerificationRequests}
            style={{ ...button, backgroundColor: `${t.blue}20`, color: t.blue }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.orange}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={24} style={{ color: t.orange }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Pending</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredRequests.filter((r: any) => r.status === 'pending').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.green}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={24} style={{ color: t.green }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Approved</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredRequests.filter((r: any) => r.status === 'approved').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.red}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <XCircle size={24} style={{ color: t.red }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Rejected</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredRequests.filter((r: any) => r.status === 'rejected').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.blue}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Eye size={24} style={{ color: t.blue }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>In Review</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredRequests.filter((r: any) => r.status === 'in_review').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: t.muted 
              }} />
              <input
                type="text"
                placeholder="Search verification requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...body,
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  backgroundColor: t.dark3,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  color: t.cream,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: t.dark3,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              color: t.cream,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: t.dark3,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              color: t.cream,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Types</option>
            <option value="identity">Identity</option>
            <option value="property">Property</option>
            <option value="agent">Agent</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Verification Requests Table */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('id')}>
                  ID {sortBy === 'id' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>User</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Type</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Status</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Documents</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('created_at')}>
                  Created {sortBy === 'created_at' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ 
                    ...body, 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: t.muted 
                  }}>
                    No verification requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request: any) => (
                  <tr key={request.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      #{request.id}
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div>
                        <div>{request.user?.name || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>
                          {request.user?.email || 'N/A'}
                        </div>
                        <div style={{ fontSize: 12, color: t.muted }}>
                          {request.user?.user_type || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getTypeIcon(request.type)}
                        <span>{getTypeLabel(request.type)}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getStatusColor(request.status)
                      }}>
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} />
                        <span>{request.documents?.length || 0} files</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div>
                        <div>{formatDate(request.created_at)}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>
                          {formatTimeAgo(request.created_at)}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleViewDetails(request)}
                          style={{
                            ...button,
                            padding: '6px',
                            backgroundColor: `${t.blue}20`,
                            color: t.blue,
                            borderRadius: 6,
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Details Modal */}
      {showDetails && selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{ ...card, maxWidth: 800, width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowDetails(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: t.muted,
                cursor: 'pointer',
              }}
            >
              <XCircle size={18} />
            </button>

            <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.cream, margin: '0 0 20px' }}>
              Verification Request Details
            </h2>

            <div style={{ display: 'grid', gap: 20 }}>
              {/* Request Information */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Request Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Request ID:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>#{selectedRequest.id}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Type:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {getTypeLabel(selectedRequest.type)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Status:</div>
                    <div style={{ 
                      ...body, 
                      fontSize: 14, 
                      color: getStatusColor(selectedRequest.status),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Created:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {formatDate(selectedRequest.created_at)} ({formatTimeAgo(selectedRequest.created_at)})
                    </div>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  User Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Name:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedRequest.user?.name || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Email:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedRequest.user?.email || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Phone:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedRequest.user?.phone || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>User Type:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedRequest.user?.user_type || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Submitted Documents
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedRequest.documents?.map((doc: any, index: number) => (
                    <div key={index} style={{
                      padding: 12,
                      backgroundColor: t.dark3,
                      borderRadius: 8,
                      border: `1px solid ${t.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        backgroundColor: `${t.blue}20`,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Camera size={20} style={{ color: t.blue }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...body, fontSize: 14, color: t.cream, fontWeight: 500 }}>
                          {doc.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div style={{ ...body, fontSize: 12, color: t.muted }}>
                          {doc.verified ? (
                            <span style={{ color: t.green }}>✓ Verified</span>
                          ) : (
                            <span style={{ color: t.orange }}>⏳ Not verified</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        style={{
                          ...button,
                          padding: '6px 12px',
                          backgroundColor: `${t.blue}20`,
                          color: t.blue,
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Notes & Comments
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>User Notes:</div>
                    <div style={{ 
                      ...body, 
                      fontSize: 14, 
                      color: t.cream,
                      padding: 8,
                      backgroundColor: t.dark3,
                      borderRadius: 6,
                      border: `1px solid ${t.border}`
                    }}>
                      {selectedRequest.notes || 'No notes provided'}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Admin Notes:</div>
                    <div style={{ 
                      ...body, 
                      fontSize: 14, 
                      color: t.cream,
                      padding: 8,
                      backgroundColor: t.dark3,
                      borderRadius: 6,
                      border: `1px solid ${t.border}`
                    }}>
                      {selectedRequest.admin_notes || 'No admin notes'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                    Review Actions
                  </h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      style={{
                        ...button,
                        backgroundColor: `${t.green}20`,
                        color: t.green,
                        flex: 1
                      }}
                    >
                      <CheckCircle size={16} />
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide reason for rejection:');
                        if (reason) {
                          handleReject(selectedRequest.id, reason);
                        }
                      }}
                      style={{
                        ...button,
                        backgroundColor: `${t.red}20`,
                        color: t.red,
                        flex: 1
                      }}
                    >
                      <XCircle size={16} />
                      Reject Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;
