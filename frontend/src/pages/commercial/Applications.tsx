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
        setError(
          data.message
            || (res.status === 403
              ? 'You do not have permission to view commercial applications.'
              : res.status === 404 || res.status === 500
                ? 'Applications API is not available on the server yet. Deploy the latest backend and try again.'
                : `Failed to load applications (${res.status}).`),
        );
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
    const t = window.setTimeout(() => { fetchApplications(); }, search ? 300 : 0);
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
      if (res.ok) {
        fetchApplications();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.message || 'Failed to approve application.');
      }
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
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: 'Application rejected by property owner.' }),
      });
      if (res.ok) {
        fetchApplications();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.message || 'Failed to reject application.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to reject application.');
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-TZ', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const statusConfig: Record<string, { pill: string; icon: React.ReactNode }> = {
    pending: {
      pill: 'bg-amber-500/10 border border-amber-500/25 text-amber-400',
      icon: <Clock className="w-3 h-3" />,
    },
    approved: {
      pill: 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400',
      icon: <Check className="w-3 h-3" />,
    },
    rejected: {
      pill: 'bg-red-500/10 border border-red-500/25 text-red-400',
      icon: <X className="w-3 h-3" />,
    },
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>Loading applications…</p>
        </div>
        <style>{`.spinner { width: 36px; height: 36px; border: 2px solid rgba(212,175,55,0.15); border-top-color: #D4AF37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(212,175,55,0.15); border-top-color: #D4AF37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .panel-header { padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; }
        .gold-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4AF37; margin-right: 10px; flex-shrink: 0; box-shadow: 0 0 8px rgba(212,175,55,0.5); }
        .app-row { padding: 20px 22px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; }
        .app-row:last-child { border-bottom: none; }
        .app-row:hover { background: rgba(212,175,55,0.025); }
        .prop-icon { width: 44px; height: 44px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.12); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #D4AF37; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        .action-icon-btn { padding: 8px; background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.12); border-radius: 10px; color: #D4AF37; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; text-decoration: none; }
        .action-icon-btn:hover { background: rgba(212,175,55,0.15); }
        .approve-btn { background: rgba(16,185,129,0.1) !important; border-color: rgba(16,185,129,0.2) !important; color: #10B981 !important; }
        .approve-btn:hover { background: rgba(16,185,129,0.2) !important; }
        .reject-btn { background: rgba(239,68,68,0.1) !important; border-color: rgba(239,68,68,0.2) !important; color: #EF4444 !important; }
        .reject-btn:hover { background: rgba(239,68,68,0.2) !important; }
        .add-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: #080E1A; padding: 11px 20px; border-radius: 14px; font-weight: 700; font-size: 13px; text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px rgba(212,175,55,0.25); border: none; cursor: pointer; letter-spacing: 0.3px; }
        .add-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(212,175,55,0.35); }
        .filter-input { background: #0C1420; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; color: #F1EDD8; font-size: 13px; padding: 9px 14px 9px 36px; outline: none; width: 100%; transition: border-color 0.2s; }
        .filter-input:focus { border-color: #D4AF37; }
        .filter-select { background: #0C1420; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; color: #F1EDD8; font-size: 13px; padding: 9px 14px; outline: none; transition: border-color 0.2s; }
        .filter-select:focus { border-color: #D4AF37; }
        .pager-btn { padding: 8px; background: #0C1420; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; color: #4A5568; cursor: pointer; display: flex; align-items: center; transition: border-color 0.2s; }
        .pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pager-btn:not(:disabled):hover { border-color: rgba(212,175,55,0.3); }
        .empty-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.03); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: 6 }}>Applications</p>
            <h1 style={{ fontSize: 'clamp(24px,5vw,32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 6 }}>
              Property Applications
            </h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Manage rental applications for your properties</p>
          </div>
          <Link to="/dashboard/commercial/properties/add" className="add-btn">
            <Plus size={14} /> Add Property
          </Link>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, color: '#FCA5A5', fontSize: 13 }}>
            <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Could not load applications</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <div style={{ background: '#0F1829', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#4A5568' }} />
              <input
                type="text"
                placeholder="Search applications…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="filter-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="card-panel" style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div className="empty-icon">
              <FileText size={22} color="#2D3748" />
            </div>
            <h3 style={{ color: '#E2D5B0', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No applications found</h3>
            <p style={{ color: '#4A5568', fontSize: 13 }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here when tenants apply for your commercial properties'}
            </p>
          </div>
        ) : (
          <div className="card-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="gold-dot" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Recent Applications</span>
              </div>
              <span style={{ color: '#2D3748', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{pagination.total} total</span>
            </div>

            {applications.map(app => {
              const cfg = statusConfig[app.status] || statusConfig.pending;
              return (
                <div key={app.id} className="app-row">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div className="prop-icon">
                      <Building2 size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ color: '#F1EDD8', fontWeight: 600, fontSize: 15 }}>{app.property_title}</span>
                        <span className={`status-pill ${cfg.pill}`}>
                          {cfg.icon}
                          {(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                        </span>
                      </div>
                      <p style={{ color: '#4A5568', fontSize: 12, marginBottom: 2 }}>{app.property_type} · {app.property_location}</p>
                      <p style={{ color: '#2D3748', fontSize: 11 }}>Applied {formatDate(app.created_at)}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{app.applicant_name}</p>
                        <p style={{ color: '#4A5568', fontSize: 11 }}>{app.applicant_email}</p>
                        <p style={{ color: '#4A5568', fontSize: 11 }}>{app.applicant_phone}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link
                          to={`/dashboard/commercial/my-properties`}
                          className="action-icon-btn"
                          title="View Properties"
                        >
                          <Eye size={14} />
                        </Link>
                        {app.status === 'pending' && (
                          <>
                            <button type="button" onClick={() => handleApprove(app.id)} className="action-icon-btn approve-btn" title="Approve">
                              <Check size={14} />
                            </button>
                            <button type="button" onClick={() => handleReject(app.id)} className="action-icon-btn reject-btn" title="Reject">
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {app.message && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ color: '#4A5568', fontSize: 12 }}>
                        <span style={{ color: '#E2D5B0', fontWeight: 600 }}>Message:</span> {app.message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagination.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <span style={{ color: '#4A5568', fontSize: 12 }}>
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} applications
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="pager-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.current_page === 1}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ color: '#E2D5B0', fontSize: 12, padding: '0 8px' }}>
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                type="button"
                className="pager-btn"
                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page === pagination.last_page}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialApplications;
