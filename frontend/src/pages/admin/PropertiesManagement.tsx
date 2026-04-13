import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building, Search, Plus, Edit, Trash2, Eye,
  MapPin, Home, Calendar, DollarSign, Users,
  CheckCircle, X, AlertTriangle, Star, Heart,
  RefreshCw, Grid, List, ArrowUpDown, Square,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ───────────────────────────────────────────────── */
interface Property {
  id: number;
  title: string;
  description: string;
  price: number | null | undefined;
  address: string;
  city: string;
  area: number | null | undefined;
  bedrooms: number | null | undefined;
  bathrooms: number | null | undefined;
  type: 'apartment' | 'house' | 'villa' | 'commercial' | 'studio';
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  featured: boolean;
  furnished: boolean;
  images: string[];
  owner: { id: number; name: string; email: string; phone: string; verified: boolean };
  agent?: { id: number; name: string; email: string; phone: string; code: string; verified: boolean; commission: number };
  createdAt: string;
  updatedAt: string;
  views: number | null | undefined;
  inquiries: number | null | undefined;
  applications: number | null | undefined;
}

interface PropertyStats {
  totalProperties: number | null | undefined;
  availableProperties: number | null | undefined;
  rentedProperties: number | null | undefined;
  maintenanceProperties: number | null | undefined;
  totalValue: number | null | undefined;
  avgPrice: number | null | undefined;
  featuredProperties: number | null | undefined;
  newThisMonth: number | null | undefined;
  totalViews: number | null | undefined;
  totalInquiries: number | null | undefined;
  totalApplications: number | null | undefined;
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

const selectStyle: React.CSSProperties = {
  ...body, padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

const inputStyle: React.CSSProperties = {
  ...body, padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

/* ─── Helpers ────────────────────────────────────────────── */

// FIX: safe currency formatter — guards against null/undefined/NaN
const fmt = (n: number | null | undefined): string => {
  const num = typeof n === 'number' && !isNaN(n) ? n : 0;
  if (num === 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS', minimumFractionDigits: 0,
  }).format(num);
};

// FIX: safe toLocaleString — never crashes on undefined/null/NaN
const fmtNum = (n: number | null | undefined): string => {
  if (n == null || isNaN(Number(n))) return '0';
  return Number(n).toLocaleString();
};

const fmtDate = (d: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

const statusColor = (s: string): string =>
  ({ available: tk.green, rented: tk.blue, maintenance: tk.amber, unavailable: tk.red }[s] ?? tk.muted);

const typeColor = (t: string): string =>
  ({ apartment: tk.blue, house: tk.green, villa: tk.purple, commercial: tk.amber, studio: tk.muted }[t] ?? tk.muted);

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const PropertiesManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'created' | 'price' | 'views' | 'inquiries'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);

      const [propertiesRes, statsRes] = await Promise.all([
        Api.getAdminProperties({
          search: searchTerm,
          type: typeFilter,
          status: statusFilter,
          min_price: priceRange[0],
          max_price: priceRange[1],
        }).catch(() => ({ data: [] })),
        Api.getAdminPropertyStats().catch(() => ({ data: null })),
      ]);

      if (propertiesRes?.data && Array.isArray(propertiesRes.data)) {
        setProperties(propertiesRes.data);
      } else {
        setProperties([]);
      }

      if (statsRes?.data) {
        setStats(statsRes.data);
      } else {
        setStats({
          totalProperties: 0,
          availableProperties: 0,
          rentedProperties: 0,
          maintenanceProperties: 0,
          totalValue: 0,
          avgPrice: 0,
          featuredProperties: 0,
          newThisMonth: 0,
          totalViews: 0,
          totalInquiries: 0,
          totalApplications: 0,
        });
      }
    } catch (e) {
      console.error('Failed to load properties:', e);
      setProperties([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = (id: number) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    setShowDeleteModal(false);
    setSelectedProperty(null);
  };

  const handleToggleFeatured = (id: number) => {
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, featured: !p.featured } : p));
  };

  const handleStatusChange = (id: number, newStatus: Property['status']) => {
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
  };

  const openDeleteModal = (property: Property) => {
    setSelectedProperty(property);
    setShowDeleteModal(true);
  };

  const openDetailModal = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
  };

  /* ── Filtering + sorting ── */
  const filtered = properties
    .filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return (
        matchSearch &&
        (statusFilter === 'all' || p.status === statusFilter) &&
        (typeFilter   === 'all' || p.type   === typeFilter) &&
        (cityFilter   === 'all' || p.city   === cityFilter) &&
        (p.price ?? 0) >= priceRange[0] && (p.price ?? 0) <= priceRange[1]
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'price')      cmp = (a.price ?? 0) - (b.price ?? 0);
      else if (sortBy === 'views') cmp = (a.views ?? 0) - (b.views ?? 0);
      else if (sortBy === 'inquiries') cmp = (a.inquiries ?? 0) - (b.inquiries ?? 0);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(201,168,76,0.15)',
            borderTop: `3px solid ${tk.gold}`,
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ color: tk.muted, ...body, fontSize: 13 }}>Loading properties…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Property spec row (reused in grid + list) ── */
  const SpecRow = ({ p }: { p: Property }) => (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {(p.bedrooms ?? 0) > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
          <Home size={12} style={{ color: tk.gold }} /> {p.bedrooms} bed{p.bedrooms !== 1 ? 's' : ''}
        </span>
      )}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
        <Square size={12} style={{ color: tk.gold }} /> {p.area ?? '—'} m²
      </span>
      {/* FIX: was p.views.toLocaleString() — crashes if views is undefined */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
        <Eye size={12} /> {fmtNum(p.views)} views
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
        <Users size={12} /> {p.inquiries ?? 0} inquiries
      </span>
    </div>
  );

  /* ── Action buttons (reused in grid + list) ── */
  const ActionRow = ({ p }: { p: Property }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button style={ghostBtn(tk.gold)}   className="pm-btn" onClick={() => openDetailModal(p)}>
        <Eye size={13} /> View
      </button>
      <button style={ghostBtn(tk.purple)} className="pm-btn" onClick={() => handleToggleFeatured(p.id)}>
        <Star size={13} /> {p.featured ? 'Unfeature' : 'Feature'}
      </button>
      <button style={ghostBtn(tk.red)}    className="pm-btn" onClick={() => openDeleteModal(p)}>
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        .pm-row:hover  { border-color: rgba(201,168,76,0.15) !important; background: rgba(201,168,76,0.015) !important; }
        .pm-card:hover { border-color: rgba(201,168,76,0.18) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .pm-btn:hover  { filter: brightness(1.1); transform: translateY(-1px); }
        .pm-btn:active { transform: scale(.97); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building size={22} style={{ color: tk.gold }} />
            <h1 style={{ ...serif, fontSize: 26, fontWeight: 600, color: tk.cream, margin: 0, letterSpacing: '-0.02em' }}>
              Properties Management
            </h1>
          </div>
          <Link
            to="/dashboard/admin/add-oweru-property"
            style={{
              background: tk.gold,
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            <Plus size={14} />
            Add Oweru Property
          </Link>
        </div>
        <p style={{ color: tk.muted, ...body, fontSize: 13, margin: 0 }}>
          Manage and monitor all property listings across the platform.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',       value: stats.totalProperties ?? 0,              color: tk.cream  },
            { label: 'Available',   value: stats.availableProperties ?? 0,          color: tk.green  },
            { label: 'Rented',      value: stats.rentedProperties ?? 0,             color: tk.blue   },
            { label: 'Maintenance', value: stats.maintenanceProperties ?? 0,        color: tk.amber  },
            { label: 'Total Value', value: fmt(stats.totalValue),                   color: tk.gold   },
            { label: 'Avg. Price',  value: fmt(stats.avgPrice),                     color: tk.cream  },
            { label: 'Featured',    value: stats.featuredProperties ?? 0,           color: tk.purple },
            // FIX: was stats.totalViews.toLocaleString() — crashes if totalViews is undefined
            { label: 'Total Views', value: fmtNum(stats.totalViews),               color: tk.green  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ ...body, fontSize: 18, fontWeight: 700, color, marginBottom: 3, lineHeight: 1.2, wordBreak: 'break-word' }}>
                {value}
              </div>
              <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ color: tk.muted, flexShrink: 0 }} />
            <input type="text" placeholder="Search properties…" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
            <option value="studio">Studio</option>
          </select>

          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Cities</option>
            <option value="Dar es Salaam">Dar es Salaam</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={selectStyle}>
            <option value="created">Date</option>
            <option value="price">Price</option>
            <option value="views">Views</option>
            <option value="inquiries">Inquiries</option>
          </select>

          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={ghostBtn(tk.gold)} className="pm-btn">
            <ArrowUpDown size={13} /> {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </button>

          {/* Price range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...body, fontSize: 11, color: tk.muted, whiteSpace: 'nowrap' }}>Price:</span>
            <input type="number" placeholder="Min" value={priceRange[0]}
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
              style={{ ...inputStyle, width: 90 }} />
            <span style={{ color: tk.muted }}>–</span>
            <input type="number" placeholder="Max" value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
              style={{ ...inputStyle, width: 90 }} />
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid rgba(201,168,76,0.15)` }}>
            {(['grid', 'list'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  padding: '7px 12px', cursor: 'pointer', border: 'none',
                  backgroundColor: viewMode === mode ? tk.gold : 'transparent',
                  color: viewMode === mode ? '#111' : tk.muted,
                  transition: 'all 0.18s',
                }}>
                {mode === 'grid' ? <Grid size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Properties container ── */}
      <div style={{ ...card, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Properties</h3>
          <span style={{ ...body, fontSize: 12, color: tk.muted }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <Building size={40} style={{ color: tk.muted, marginBottom: 12 }} />
            <p style={{ ...body, fontSize: 14, color: tk.muted, margin: 0 }}>No properties match your filters.</p>
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
            {filtered.map((p) => (
              <div key={p.id} className="pm-card" style={{ ...innerRow, overflow: 'hidden', padding: 0, transition: 'all 0.2s' }}>

                {/* Image */}
                <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                  <img src={p.images?.[0]} alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,.6) 0%, transparent 55%)' }} />
                  {p.featured && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: tk.gold, color: '#111',
                      ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 4,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Star size={9} fill="currentColor" /> Featured
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
                    <div style={{ ...body, fontSize: 17, fontWeight: 700, color: tk.gold }}>{fmt(p.price)}</div>
                    <div style={{ ...body, fontSize: 10, color: 'rgba(232,228,220,.7)', marginTop: 1 }}>per month</div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                    <span style={pill(statusColor(p.status))}>{p.status}</span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: '16px 18px 18px' }}>
                  <h4 style={{ ...serif, fontSize: 15, fontWeight: 600, color: tk.cream, margin: '0 0 5px', lineHeight: 1.3 }}>
                    {p.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted, marginBottom: 10 }}>
                    <MapPin size={11} /> {p.address}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={pill(typeColor(p.type))}>{p.type}</span>
                    {p.furnished && <span style={pill(tk.gold)}>Furnished</span>}
                  </div>

                  <SpecRow p={p} />

                  <div style={{ marginTop: 14 }}>
                    <ActionRow p={p} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((p) => (
              <div key={p.id} className="pm-row" style={{ ...innerRow, display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16 }}>

                {/* Thumb */}
                <div style={{ width: 110, height: 76, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={p.images?.[0]} alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ ...serif, fontSize: 15, fontWeight: 600, color: tk.cream, margin: '0 0 3px' }}>{p.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                        <MapPin size={11} /> {p.address}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ ...body, fontSize: 17, fontWeight: 700, color: tk.gold, lineHeight: 1 }}>{fmt(p.price)}</div>
                      <div style={{ ...body, fontSize: 9, color: tk.muted }}>/ month</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={pill(statusColor(p.status))}>{p.status}</span>
                    <span style={pill(typeColor(p.type))}>{p.type}</span>
                    {p.featured  && <span style={pill(tk.gold)}>Featured</span>}
                    {p.furnished && <span style={pill(tk.muted)}>Furnished</span>}
                  </div>

                  <SpecRow p={p} />

                  <div style={{ marginTop: 10 }}>
                    <ActionRow p={p} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ DETAIL MODAL ══ */}
      {showDetailModal && selectedProperty && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 999,
        }}>
          <div style={{ ...card, padding: 28, maxWidth: 540, width: '100%', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowDetailModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: tk.muted, cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Building size={15} style={{ color: tk.gold }} />
              <h3 style={{ ...serif, fontSize: 19, fontWeight: 500, color: tk.cream, margin: 0 }}>Property Details</h3>
            </div>

            <div style={{ height: 180, borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
              <img src={selectedProperty.images?.[0]} alt={selectedProperty.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h4 style={{ ...serif, fontSize: 17, fontWeight: 600, color: tk.cream, margin: '0 0 6px' }}>
              {selectedProperty.title}
            </h4>
            <p style={{ ...body, fontSize: 12.5, color: '#9a9080', margin: '0 0 14px', lineHeight: 1.6 }}>
              {selectedProperty.description}
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={pill(statusColor(selectedProperty.status))}>{selectedProperty.status}</span>
              <span style={pill(typeColor(selectedProperty.type))}>{selectedProperty.type}</span>
              {selectedProperty.featured  && <span style={pill(tk.gold)}>Featured</span>}
              {selectedProperty.furnished && <span style={pill(tk.muted)}>Furnished</span>}
            </div>

            {[
              { label: 'Price',        value: `${fmt(selectedProperty.price)} / month` },
              { label: 'Address',      value: selectedProperty.address },
              { label: 'Area',         value: `${selectedProperty.area ?? '—'} m²` },
              { label: 'Bedrooms',     value: selectedProperty.bedrooms ?? 'N/A' },
              { label: 'Bathrooms',    value: selectedProperty.bathrooms ?? 'N/A' },
              { label: 'Owner',        value: `${selectedProperty.owner.name} (${selectedProperty.owner.email})` },
              selectedProperty.agent
                ? { label: 'Agent', value: `${selectedProperty.agent.name} · ${selectedProperty.agent.code} · ${selectedProperty.agent.commission}% commission` }
                : null,
              // FIX: was selectedProperty.views.toLocaleString() — crashes if views is undefined
              { label: 'Views',        value: fmtNum(selectedProperty.views) },
              { label: 'Inquiries',    value: selectedProperty.inquiries ?? 0 },
              { label: 'Applications', value: selectedProperty.applications ?? 0 },
              { label: 'Listed',       value: fmtDate(selectedProperty.createdAt) },
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.07)',
              }}>
                <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...body, fontSize: 12.5, color: tk.cream, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button style={{ ...ghostBtn(tk.purple), flex: 1, justifyContent: 'center' }} className="pm-btn"
                onClick={() => handleToggleFeatured(selectedProperty.id)}>
                <Star size={13} /> {selectedProperty.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }} className="pm-btn"
                onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {showDeleteModal && selectedProperty && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 999,
        }}>
          <div style={{ ...card, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: tk.red, marginBottom: 14 }} />
            <h3 style={{ ...serif, fontSize: 20, fontWeight: 500, color: tk.cream, margin: '0 0 10px' }}>
              Delete Property
            </h3>
            <p style={{ ...body, fontSize: 13, color: tk.muted, lineHeight: 1.7, marginBottom: 22 }}>
              Are you sure you want to delete<br />
              <strong style={{ color: tk.cream }}>"{selectedProperty.title}"</strong>?<br />
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }}
                className="pm-btn"
                onClick={() => { setShowDeleteModal(false); setSelectedProperty(null); }}
              >
                Cancel
              </button>
              <button
                style={{ ...ghostBtn(tk.red), flex: 1, justifyContent: 'center' }}
                className="pm-btn"
                onClick={() => handleDeleteProperty(selectedProperty.id)}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertiesManagement;