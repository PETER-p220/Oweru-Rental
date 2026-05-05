import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Check, X, Clock, User, Building2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json' 
        }
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
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const statusStyle: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    approved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/25',
  };

  const statusIcon: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    approved: <Check className="w-4 h-4" />,
    rejected: <X className="w-4 h-4" />,
  };

  const filtered = applications.filter(app => {
    const matchSearch = search === '' || 
      app.property_title.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C89128] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#4A5568] text-sm">Loading applications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">Applications</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1EDD8]">Property Applications</h1>
            <p className="text-[#4A5568] text-sm mt-0.5">Manage rental applications for your properties</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568] w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search applications…" 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-[#F1EDD8] placeholder-[#4A5568] text-sm focus:outline-none focus:border-[#D4AF37] transition-colors" 
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-[#F1EDD8] text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-[#1E2D4A] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#4A5568]" />
            </div>
            <h3 className="text-lg font-semibold text-[#F1EDD8] mb-2">No applications found</h3>
            <p className="text-[#4A5568] text-sm">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Applications will appear here when tenants apply for your properties'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div key={app.id} className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Property Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#1E2D4A] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-[#F1EDD8] truncate">{app.property_title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusStyle[app.status]}`}>
                          {statusIcon[app.status]}
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-[#4A5568] text-sm mb-1">{app.property_type} • {app.property_location}</p>
                      <p className="text-[#4A5568] text-xs">Applied {formatDate(app.created_at)}</p>
                    </div>
                  </div>

                  {/* Applicant Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-[#4A5568]" />
                        <span className="text-[#F1EDD8] font-medium">{app.applicant_name}</span>
                      </div>
                      <div className="text-[#4A5568] text-xs space-y-1">
                        <p>{app.applicant_email}</p>
                        <p>{app.applicant_phone}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/commercial/properties/${app.property_id}`}
                        className="p-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#4A5568] hover:text-[#F1EDD8] hover:border-[#D4AF37]/30 transition-colors"
                        title="View Property"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                {app.message && (
                  <div className="mt-4 pt-4 border-t border-[#1E2D4A]">
                    <p className="text-[#4A5568] text-sm">
                      <span className="font-medium text-[#E2D5B0]">Message:</span> {app.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-[#4A5568] text-sm">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} applications
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
                disabled={pagination.current_page === 1}
                className="p-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#4A5568] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#D4AF37]/30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[#F1EDD8] text-sm px-3">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#4A5568] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#D4AF37]/30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CommercialApplications;
