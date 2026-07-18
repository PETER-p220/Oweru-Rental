import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Check, X, Clock, Building2, Search, ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { TOKEN_KEY } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Application {
  id: number;
  property_id: number;
  property_title: string;
  property_type: string;
  property_location: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const CommercialApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setError('Please log in again to view applications.');
        setApplications([]);
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        per_page: '10',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE}/api/commercial/applications?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setApplications([]);
        setError(data.message || `Failed to load applications (${res.status})`);
        return;
      }

      const list = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.data)
          ? data.data.data
          : [];

      setApplications(list);
      setPagination({
        current_page: data.current_page ?? data.pagination?.current_page ?? page,
        last_page: data.last_page ?? data.pagination?.last_page ?? 1,
        per_page: data.per_page ?? data.pagination?.per_page ?? 10,
        total: data.total ?? data.pagination?.total ?? list.length,
      });
    } catch (e) {
      console.error('Error fetching applications:', e);
      setApplications([]);
      setError('Network error while loading applications.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => fetchApplications(), search ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [fetchApplications, search]);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this application?')) return;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/commercial/applications/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) fetchApplications();
      else alert('Failed to approve application.');
    } catch (e) {
      console.error(e);
      alert('Failed to approve application.');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this application?')) return;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/commercial/applications/${id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: 'Application rejected by property owner.' }),
      });
      if (res.ok) fetchApplications();
      else alert('Failed to reject application.');
    } catch (e) {
      console.error(e);
      alert('Failed to reject application.');
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-TZ', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', color: 'amber', icon: <Clock size={14} /> },
    approved: { label: 'Approved', color: 'emerald', icon: <Check size={14} /> },
    rejected: { label: 'Rejected', color: 'red', icon: <X size={14} /> },
  };

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .cd-wrap { max-width: 1280px; margin: 0 auto; padding: 32px 40px 80px; }
        
        .cd-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
        }
        
        .cd-panel-header { 
          padding: 20px 24px; 
          border-bottom: 1px solid #F1F5F9; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
        }
        
        .cd-row { 
          padding: 20px 24px; 
          border-bottom: 1px solid #F1F5F9; 
          transition: background 0.2s; 
        }
        .cd-row:hover { background: #F8FAFC; }
        .cd-row:last-child { border-bottom: none; }
        
        .cd-status-pill { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          padding: 4px 12px; 
          border-radius: 9999px; 
          font-size: 12px; 
          font-weight: 600; 
        }
        
        .status-pending { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
        .status-approved { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .status-rejected { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
        
        .cd-filter-input { 
          width: 100%; 
          padding: 10px 12px 10px 40px; 
          background: white; 
          border: 1px solid #CBD5E1; 
          border-radius: 10px; 
          font-size: 14px; 
        }
        
        .cd-btn { 
          padding: 10px 16px; 
          border-radius: 10px; 
          font-weight: 600; 
          font-size: 13px; 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          transition: all 0.2s; 
          cursor: pointer; 
        }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                COMMERCIAL PORTAL
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Property Applications
              </h1>
              <p style={{ color: '#64748B', marginTop: 4 }}>Review and manage rental applications</p>
            </div>
            <Link to="/dashboard/commercial/properties/add" className="cd-btn" style={{ background: '#0F172A', color: 'white' }}>
              <Plus size={16} /> Add Property
            </Link>
          </div>
        </div>
      </div>

      <div className="cd-wrap">
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '16px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', gap: 12 }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Filters */}
        <div className="cd-card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} size={18} />
              <input
                type="text"
                placeholder="Search by name, property or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="cd-filter-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #CBD5E1', background: 'white', minWidth: 160 }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="cd-card" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748B' }}>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="cd-card" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
            <h3 style={{ color: '#0F172A', marginBottom: 8 }}>No applications found</h3>
            <p style={{ color: '#64748B' }}>
              {search || statusFilter !== 'all' ? 'Try changing your filters' : 'Applications from tenants will appear here'}
            </p>
          </div>
        ) : (
          <div className="cd-card">
            <div className="cd-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={20} style={{ color: '#3B82F6' }} />
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Recent Applications</span>
              </div>
              <span style={{ fontSize: 13, color: '#64748B' }}>{pagination.total} total</span>
            </div>

            {applications.map(app => {
              const cfg = statusConfig[app.status] || statusConfig.pending;
              return (
                <div key={app.id} className="cd-row">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 48, height: 48, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={24} style={{ color: '#3B82F6' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 15.5 }}>{app.property_title}</span>
                        <span className={`cd-status-pill status-${app.status}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p style={{ color: '#64748B', fontSize: 13 }}>
                        {app.property_type} • {app.property_location}
                      </p>
                      <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                        Applied {formatDate(app.created_at)}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 180 }}>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{app.applicant_name}</p>
                      <p style={{ color: '#64748B', fontSize: 13 }}>{app.applicant_email}</p>
                      <p style={{ color: '#64748B', fontSize: 13 }}>{app.applicant_phone}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                      <Link to={`/dashboard/commercial/my-properties`} className="cd-btn" style={{ border: '1px solid #CBD5E1', color: '#475569' }}>
                        <Eye size={16} /> View
                      </Link>

                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(app.id)} className="cd-btn" style={{ background: '#10B981', color: 'white' }}>
                            <Check size={16} /> Approve
                          </button>
                          <button onClick={() => handleReject(app.id)} className="cd-btn" style={{ background: '#EF4444', color: 'white' }}>
                            <X size={16} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {app.message && (
                    <div style={{ marginTop: 16, padding: 14, background: '#F8FAFC', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                      <p style={{ color: '#475569', fontSize: 13 }}><strong>Message:</strong> {app.message}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ color: '#64748B', fontSize: 13 }}>
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.current_page === 1}
                className="cd-btn"
                style={{ border: '1px solid #CBD5E1', color: '#475569' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ padding: '8px 16px', color: '#0F172A', fontWeight: 500 }}>
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page === pagination.last_page}
                className="cd-btn"
                style={{ border: '1px solid #CBD5E1', color: '#475569' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialApplications;