import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2, Plus, Search, Eye, Edit, Trash2, MapPin,
  ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle2, ToggleLeft, ToggleRight
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getToken = () => localStorage.getItem('token');

interface PropertyImage { id: number; image_path: string; is_primary: boolean; }
interface Amenity { id: number; name: string; icon: string; }

interface Property {
  id: number; title: string; description: string; type: string; location: string;
  address: string; price: number; price_type: string; area: number;
  bedrooms?: number; bathrooms?: number; parking_spaces?: number;
  furnished: boolean; available_from: string; status: string; views: number;
  images?: PropertyImage[]; property_images?: PropertyImage[];
}

const Properties: React.FC = () => {
  const location = useLocation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [successMessage, setSuccessMessage] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pagination.current_page), per_page: '9' });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE}/api/commercial/properties?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
      });
      const data = await res.json();
      setProperties(data.data || []);
      setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProperties(); }, [search, statusFilter, pagination.current_page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this property?')) return;
    await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    fetchProperties();
  };

  const handleToggle = async (id: number) => {
    await fetch(`${API_BASE}/api/commercial/properties/${id}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
    });
    fetchProperties();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n);
  const getImg = (p: Property) => {
    const img = (p.property_images || p.images || []).find(i => i.is_primary) || (p.property_images || p.images || [])[0];
    return img ? `${API_BASE}/storage/${img.image_path}` : null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .prop-page-wrap { max-width: 1280px; margin: 0 auto; padding: 40px; }
        .prop-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; transition: all 0.2s; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .prop-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .action-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s; color: #475569; }
        .action-btn:hover { background: #F8FAFC; border-color: #CBD5E1; }
        .action-del { color: #E11D48; }
        .action-del:hover { background: #FFF1F2; border-color: #FECDD3; }
        .filter-input { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px 14px 10px 36px; font-size: 13px; outline: none; }
        .add-btn { background: #0F172A; color: #FFFFFF; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 13px; text-decoration: none; display: flex; align-items: center; gap: 8px; }
      `}</style>

      <div className="prop-page-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0 }}>My Properties</h1>
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>Manage your commercial real estate inventory</p>
          </div>
          <Link to="/dashboard/commercial/properties/add" className="add-btn"><Plus size={16} /> Add Property</Link>
        </div>

        <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8' }} />
            <input className="filter-input" style={{ width: '100%' }} placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {properties.map(p => (
              <div key={p.id} className="prop-card">
                <div style={{ height: 160, background: '#F1F5F9' }}>
                  {getImg(p) && <img src={getImg(p)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.title} />}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: p.status === 'active' ? '#059669' : '#64748B' }}>{p.status}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{fmt(p.price)}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>{p.title}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {p.location}</p>
                  
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <Link to={`/dashboard/commercial/properties/${p.id}/edit`} className="action-btn"><Edit size={14} /> Edit</Link>
                    <button onClick={() => handleToggle(p.id)} className="action-btn">
                      {p.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="action-btn action-del"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;