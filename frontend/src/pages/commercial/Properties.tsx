import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Plus, Search, Eye, Edit, Trash2, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      if (res.ok) fetchProperties();
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/commercial/properties/${id}/toggle-status`, {
        method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      if (res.ok) fetchProperties();
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const priceSuffix = (t: string) => t === 'monthly' ? '/mo' : t === 'yearly' ? '/yr' : '';
  const getPrimaryImage = (p: Property) => {
    const img = p.images.find(i => i.is_primary);
    return img ? `${API_BASE}/storage/${img.image_path}` : null;
  };

  const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
    active:   { bg: 'rgba(16,185,129,0.08)',  color: '#10B981', dot: '#10B981' },
    pending:  { bg: 'rgba(245,158,11,0.08)',  color: '#F59E0B', dot: '#F59E0B' },
    inactive: { bg: 'rgba(100,116,139,0.08)', color: '#64748B', dot: '#64748B' },
    rejected: { bg: 'rgba(239,68,68,0.08)',   color: '#EF4444', dot: '#EF4444' },
  };
  const typeConfig: Record<string, string> = {
    office: '#22D3EE', retail: '#F472B6', warehouse: '#FB923C', commercial: '#A78BFA', industrial: '#818CF8', residential: '#60A5FA',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ color: '#4A5568', fontSize: 13, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>Loading properties…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        .spinner { width: 36px; height: 36px; border: 2px solid rgba(212,175,55,0.15); border-top-color: #D4AF37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .prop-card { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; transition: all 0.3s ease; }
        .prop-card:hover { border-color: rgba(212,175,55,0.2); transform: translateY(-3px); box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
        .action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .action-edit { background: rgba(212,175,55,0.08); color: #D4AF37; border: 1px solid rgba(212,175,55,0.15); flex: 1; }
        .action-edit:hover { background: rgba(212,175,55,0.15); }
        .action-toggle { background: rgba(255,255,255,0.04); color: #94A3B8; border: 1px solid rgba(255,255,255,0.06); flex: 1; }
        .action-toggle:hover { background: rgba(255,255,255,0.08); color: #E2D5B0; }
        .action-del { background: rgba(239,68,68,0.06); color: #EF4444; border: 1px solid rgba(239,68,68,0.12); width: 38px; padding: 9px; flex-shrink: 0; }
        .action-del:hover { background: rgba(239,68,68,0.15); }
        .filter-input { width: 100%; padding: 11px 14px 11px 40px; background: #0C1420; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #E2D5B0; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
        .filter-input:focus { border-color: rgba(212,175,55,0.4); }
        .filter-select { width: 100%; padding: 11px 14px; background: #0C1420; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #E2D5B0; font-size: 13px; font-family: inherit; outline: none; appearance: none; cursor: pointer; transition: border-color 0.2s; }
        .filter-select:focus { border-color: rgba(212,175,55,0.4); }
        .filter-select option { background: #0C1420; }
        .add-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: #080E1A; padding: 12px 22px; border-radius: 14px; font-weight: 700; font-size: 13px; text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px rgba(212,175,55,0.25); letter-spacing: 0.3px; }
        .add-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(212,175,55,0.35); }
        .page-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: #0F1829; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #E2D5B0; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .page-btn:hover:not(:disabled) { border-color: rgba(212,175,55,0.3); color: #D4AF37; }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        .type-pill { padding: 3px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        .feat-tag { padding: 3px 9px; background: rgba(255,255,255,0.04); border-radius: 6px; font-size: 10px; color: #4A5568; font-weight: 600; }
        .success-bar { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        @media (max-width: 640px) {
          .props-grid { grid-template-columns: 1fr !important; }
          .filter-row { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .props-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Inventory</span>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 6 }}>My Properties</h1>
            <p style={{ color: '#4A5568', fontSize: 13 }}>Manage your commercial listings</p>
          </div>
          <Link to="/commercial/properties/add" className="add-btn">
            <Plus size={15} />Add Property
          </Link>
        </div>

        {/* ── Success Message ── */}
        {successMessage && (
          <div className="success-bar">
            <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0 }} />
            <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600, flex: 1 }}>{successMessage}</p>
            <button onClick={() => setSuccessMessage('')} style={{ background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer', fontSize: 12, padding: '2px 8px', borderRadius: 6, transition: 'color 0.2s' }}>✕</button>
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ background: '#0F1829', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 18, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: filtersOpen || window.innerWidth > 640 ? 14 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 600 }}>Filters</span>
              <span style={{ color: '#4A5568', fontSize: 11, fontWeight: 600 }}>— {pagination.total} results</span>
            </div>
            <button onClick={() => setFiltersOpen(p => !p)} style={{ display: 'none', background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer', fontSize: 12 }} className="filter-toggle">
              {filtersOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="filter-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#4A5568" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search properties…" value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select" style={{ width: 'auto', minWidth: 130 }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select" style={{ width: 'auto', minWidth: 130 }}>
              <option value="all">All Types</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
        </div>

        {/* ── Grid ── */}
        {properties.length === 0 ? (
          <div style={{ background: '#0F1829', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Building2 size={26} color="#2D3748" />
            </div>
            <h3 style={{ color: '#E2D5B0', fontWeight: 700, fontSize: 18, marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>No properties found</h3>
            <p style={{ color: '#4A5568', fontSize: 13, marginBottom: 24 }}>Get started by adding your first listing</p>
            <Link to="/commercial/properties/add" className="add-btn"><Plus size={14} />Add First Property</Link>
          </div>
        ) : (
          <div className="props-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {properties.map(p => {
              const img = getPrimaryImage(p);
              const sc = statusConfig[p.status] || statusConfig.inactive;
              const tc = typeConfig[p.type] || '#94A3B8';
              return (
                <div key={p.id} className="prop-card">
                  {/* Image */}
                  <div style={{ position: 'relative', height: 200, background: '#0C1420' }}>
                    {img
                      ? <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={36} color="#1E2D4A" />
                        </div>}
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,14,26,0.7) 0%, transparent 50%)' }} />
                    {/* Badges */}
                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                      <span className="pill" style={{ background: sc.bg, color: sc.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {p.status}
                      </span>
                      <span className="type-pill" style={{ background: `${tc}15`, color: tc }}>{p.type}</span>
                    </div>
                    {/* Views */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(8,14,26,0.7)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Eye size={11} color="#94A3B8" />
                      <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 600 }}>{p.views}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 18 }}>
                    <h3 style={{ color: '#F1EDD8', fontSize: 14, fontWeight: 700, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4A5568', fontSize: 12, marginBottom: 14 }}>
                      <MapPin size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location}</span>
                    </div>

                    {/* Price row */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#D4AF37', letterSpacing: '-0.5px' }}>{fmt(p.price)}</span>
                        <span style={{ fontSize: 11, color: '#4A5568', marginLeft: 4 }}>{priceSuffix(p.price_type)}</span>
                      </div>
                      {p.furnished && <span className="feat-tag">Furnished</span>}
                    </div>

                    {/* Feature pills */}
                    {(p.bedrooms || p.bathrooms || p.area || p.parking_spaces) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {p.bedrooms ? <span className="feat-tag">{p.bedrooms} Beds</span> : null}
                        {p.bathrooms ? <span className="feat-tag">{p.bathrooms} Baths</span> : null}
                        {p.area ? <span className="feat-tag">{p.area} m²</span> : null}
                        {p.parking_spaces ? <span className="feat-tag">{p.parking_spaces}P</span> : null}
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/commercial/properties/${p.id}/edit`} className="action-btn action-edit">
                        <Edit size={12} />Edit
                      </Link>
                      {(p.status === 'active' || p.status === 'inactive') && (
                        <button onClick={() => handleToggle(p.id)} className="action-btn action-toggle">
                          <Eye size={12} />{p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="action-btn action-del">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            <button onClick={() => setPagination(p => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))} disabled={pagination.current_page === 1} className="page-btn">
              <ChevronLeft size={15} />Prev
            </button>
            <div style={{ padding: '10px 18px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, color: '#D4AF37', fontSize: 13, fontWeight: 700 }}>
              {pagination.current_page} / {pagination.last_page}
            </div>
            <button onClick={() => setPagination(p => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))} disabled={pagination.current_page === pagination.last_page} className="page-btn">
              Next<ChevronRight size={15} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Properties;