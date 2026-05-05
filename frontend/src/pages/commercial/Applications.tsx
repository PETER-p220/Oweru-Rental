import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Check, X, Clock, User, Building2, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  useEffect(() => { fetchApplications(); }, [search, statusFilter, pagination.current_page]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.current_page.toString(),
        per_page: pagination.per_page.toString()
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE}/api/commercial/applications?${params}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.data || []);
        setPagination({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || 10,
          total: data.total || 0
        });
      }
    } catch (e) {
      console.error('Error fetching applications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this application?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/applications/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) fetchApplications();
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this application?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/applications/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) fetchApplications();
    } catch (e) { console.error(e); }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-TZ', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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

  const filtered = applications.filter(app => {
    const matchSearch = search === '' ||
      app.property_title.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: '#64748B', fontSize: 13, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>Loading applications…</p>
      </div>
    </div>
  );

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
        .action-icon-btn { padding: 8px; background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.12); border-radius: 10px; color: #D4AF37; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; }
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
        @media (max-width: 640px) {
          .app-row { padding: 16px; }
          .panel-header { padding: 14px 16px; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', marginBottom: 6 }}>Applications</p>
            <h1 style={{ fontSize: 'clamp(24px,5vw,32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 6 }}>
              Property Applications
            </h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Manage rental applications for your properties</p>
          </div>
          <Link to="/commercial/properties/add" className="add-btn">
            <Plus size={14} /> Add Property
          </Link>
        </div>

        {/* Filters */}
        <div style={{ background: '#0F1829', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#4A5568' }} />
              <input
                type="text"
                placeholder="Search applications…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="filter-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications */}
        {filtered.length === 0 ? (
          <div className="card-panel" style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div className="empty-icon">
              <FileText size={22} color="#2D3748" />
            </div>
            <h3 style={{ color: '#E2D5B0', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No applications found</h3>
            <p style={{ color: '#4A5568', fontSize: 13 }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here when tenants apply for your properties'}
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

            {filtered.map(app => {
              const cfg = statusConfig[app.status];
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
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
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
                          to={`/dashboard/commercial/properties/${app.property_id}`}
                          className="action-icon-btn"
                          title="View Property"
                        >
                          <Eye size={14} />
                        </Link>
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(app.id)} className="action-icon-btn approve-btn" title="Approve">
                              <Check size={14} />
                            </button>
                            <button onClick={() => handleReject(app.id)} className="action-icon-btn reject-btn" title="Reject">
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

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <span style={{ color: '#4A5568', fontSize: 12 }}>
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} applications
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="pager-btn"
                onClick={() => setPagination(p => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
                disabled={pagination.current_page === 1}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ color: '#E2D5B0', fontSize: 12, padding: '0 8px' }}>
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                className="pager-btn"
                onClick={() => setPagination(p => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))}
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