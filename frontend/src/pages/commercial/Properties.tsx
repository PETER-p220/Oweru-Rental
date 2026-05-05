import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Plus, Search, Eye, Edit, Trash2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Property {
  id: number; title: string; description: string; type: string; location: string;
  address: string; price: number; price_type: string; area: number; bedrooms?: number;
  bathrooms?: number; parking_spaces?: number; furnished: boolean; available_from: string;
  status: string; views: number;
  images: Array<{ id: number; image_path: string; is_primary: boolean }>;
  amenities: Array<{ id: number; name: string; icon: string }>;
  created_at: string;
}

const Properties: React.FC = () => {
  const location = useLocation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { fetchProperties(); }, [search, statusFilter, typeFilter, pagination.current_page]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: pagination.current_page.toString(), per_page: pagination.per_page.toString() });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      const res = await fetch(`${API_BASE}/api/commercial/properties?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data.data);
        setPagination({ current_page: data.current_page, last_page: data.last_page, per_page: data.per_page, total: data.total });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this property?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      if (res.ok) fetchProperties();
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/commercial/properties/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      if (res.ok) fetchProperties();
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusStyle: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    inactive: 'text-slate-400 bg-slate-400/10 border-slate-400/25',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/25',
  };

  const typeStyle: Record<string, string> = {
    office: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25',
    retail: 'text-pink-400 bg-pink-400/10 border-pink-400/25',
    warehouse: 'text-orange-400 bg-orange-400/10 border-orange-400/25',
    commercial: 'text-violet-400 bg-violet-400/10 border-violet-400/25',
    industrial: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/25',
    residential: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  };

  const getPrimaryImage = (p: Property) => {
    const img = p.images.find(i => i.is_primary);
    return img ? `${API_BASE}/storage/${img.image_path}` : null;
  };

  const priceSuffix = (t: string) => t === 'monthly' ? '/mo' : t === 'yearly' ? '/yr' : '';

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#C89128] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading properties…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">Inventory</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Properties</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage your commercial listings</p>
          </div>
          <Link to="/commercial/properties/add"
            className="inline-flex items-center gap-2 bg-[#C89128] text-[#0F172A] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#D4A843] transition-colors self-start sm:self-auto shadow-lg shadow-[#C89128]/20">
            <Plus className="w-4 h-4" />Add Property
          </Link>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-emerald-400 font-medium">{successMessage}</p>
              <button onClick={() => setSuccessMessage('')} className="text-slate-500 hover:text-slate-400 text-sm mt-1">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-1 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Search properties…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C89128] transition-colors" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128]">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128]">
              <option value="all">All Types</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-3">{pagination.total} {pagination.total === 1 ? 'property' : 'properties'} found</p>
        </div>

        {/* Grid */}
        {properties.length === 0 ? (
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl py-16 text-center">
            <div className="w-16 h-16 bg-[#1E2D4A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No properties found</h3>
            <p className="text-slate-400 text-sm mb-6">Get started by adding your first listing</p>
            <Link to="/commercial/properties/add"
              className="inline-flex items-center gap-2 bg-[#C89128] text-[#0F172A] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#D4A843] transition-colors">
              <Plus className="w-4 h-4" />Add First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map(p => {
              const img = getPrimaryImage(p);
              return (
                <div key={p.id} className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden hover:border-[#C89128]/30 transition-all duration-200 group">
                  {/* Image */}
                  <div className="relative h-44 bg-[#1E2D4A]">
                    {img
                      ? <img src={img} alt={p.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-slate-600" /></div>}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${statusStyle[p.status] || statusStyle.inactive}`}>{p.status}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${typeStyle[p.type] || 'text-slate-400 bg-slate-400/10 border-slate-400/25'}`}>{p.type}</span>
                    </div>
                    {/* Views */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0F172A]/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-300">{p.views}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white mb-1 truncate">{p.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <span className="text-base font-bold text-[#C89128]">{fmt(p.price)}</span>
                        <span className="text-xs text-slate-500 ml-1">{priceSuffix(p.price_type)}</span>
                      </div>
                      {p.furnished && (
                        <span className="px-2 py-0.5 bg-[#1E2D4A] rounded-lg text-[10px] text-slate-400">Furnished</span>
                      )}
                    </div>

                    {/* Feature Pills */}
                    {(p.bedrooms || p.bathrooms || p.area || p.parking_spaces) ? (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.bedrooms && <span className="px-2 py-0.5 bg-[#1E2D4A] rounded-lg text-[10px] text-slate-400">{p.bedrooms} Beds</span>}
                        {p.bathrooms && <span className="px-2 py-0.5 bg-[#1E2D4A] rounded-lg text-[10px] text-slate-400">{p.bathrooms} Baths</span>}
                        {p.area && <span className="px-2 py-0.5 bg-[#1E2D4A] rounded-lg text-[10px] text-slate-400">{p.area} m²</span>}
                        {p.parking_spaces ? <span className="px-2 py-0.5 bg-[#1E2D4A] rounded-lg text-[10px] text-slate-400">{p.parking_spaces}P</span> : null}
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-[#1E2D4A]">
                      <Link to={`/commercial/properties/${p.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1E2D4A] text-white rounded-xl text-xs font-medium hover:bg-[#1E2D4A]/80 transition-colors">
                        <Edit className="w-3.5 h-3.5" />Edit
                      </Link>
                      {(p.status === 'active' || p.status === 'inactive') && (
                        <button onClick={() => handleToggle(p.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1E2D4A] text-white rounded-xl text-xs font-medium hover:bg-[#1E2D4A]/80 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          {p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)}
                        className="flex items-center justify-center w-9 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination(p => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
              disabled={pagination.current_page === 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#162035] border border-[#1E2D4A] rounded-xl text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C89128]/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Prev
            </button>
            <span className="px-4 py-2 text-sm text-slate-400">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))}
              disabled={pagination.current_page === pagination.last_page}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#162035] border border-[#1E2D4A] rounded-xl text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C89128]/30 transition-colors"
            >
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Properties;