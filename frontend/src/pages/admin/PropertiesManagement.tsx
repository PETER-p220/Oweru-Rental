import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building, Search, Plus, MapPin, Grid, List, Trash2, AlertTriangle, X,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── TOKENS — matches Home page exactly ─── */
const t = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream:   '#F8F8F9',
  slate:   '#94A3B8',
  border:  'rgba(200,145,40,0.18)',
  green:   '#10b981',
  red:     '#ef4444',
} as const;

const body: React.CSSProperties  = { fontFamily: "'Jost', sans-serif" };
const serif: React.CSSProperties = { fontFamily: "'Jost', sans-serif", fontWeight: 700 };

const card: React.CSSProperties = {
  background:   t.navy800,
  border:       `1px solid ${t.border}`,
  borderRadius: 12,
  padding:      24,
};

/* ─── VITE storage base ─── */
const VITE_STORAGE = (import.meta.env.VITE_API_URL ?? '').replace('/api', '');

/* SVG placeholder — inline so there's zero network request */
const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23162035'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='14' fill='%23C89128' opacity='.5'%3ENo Image%3C/text%3E%3C/svg%3E`;

interface Property {
  id:          number | string;
  title:       string;
  description: string;
  price:       number;
  location?:   string;
  address?:    string;
  area?:       number;
  bedrooms?:   number;
  bathrooms?:  number;
  type:        string;
  status?:     string;
  featured?:   boolean;
  images?:     string[];
  isOweru?:    boolean;
  created_at?: string;
  createdAt?:  string;
}

/* Resolve image URL once and memoize per property — avoids re-running on every render */
const resolveImage = (images?: string[]): string => {
  if (!Array.isArray(images) || images.length === 0) return PLACEHOLDER;
  const raw = images[0];
  if (typeof raw !== 'string' || raw.trim() === '') return PLACEHOLDER;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${VITE_STORAGE}${raw}`;
  if (raw.startsWith('storage/')) return `${VITE_STORAGE}/${raw}`;
  return `${VITE_STORAGE}/storage/${raw}`;
};

/* ─── Skeleton card shown while loading ─── */
const SkeletonCard = () => (
  <div style={{ background: t.navy700, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', animation: 'shimmer 1.4s ease-in-out infinite' }}>
    <div style={{ height: 180, background: t.navy900 }} />
    <div style={{ padding: 20 }}>
      <div style={{ height: 16, background: t.navy900, borderRadius: 4, marginBottom: 10, width: '70%' }} />
      <div style={{ height: 12, background: t.navy900, borderRadius: 4, marginBottom: 16, width: '45%' }} />
      <div style={{ height: 12, background: t.navy900, borderRadius: 4, width: '30%' }} />
    </div>
  </div>
);

/* ─── Lazy image with built-in fade-in ─── */
const LazyImg = ({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; setLoaded(true); }}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  );
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount || 0);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const PropertiesManagement = () => {
  const [properties,       setProperties]       = useState<Property[]>([]);
  const [oweruProperties,  setOweruProperties]  = useState<Property[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [viewMode,         setViewMode]         = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);

  /* Load once on mount */
  const loadAllProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await Api.getAdminProperties();
      const all: Property[] = res?.data || [];
      setOweruProperties(all.filter(p => p.type === 'oweru_rental' || p.isOweru));
      setProperties(all.filter(p => p.type !== 'oweru_rental' && !p.isOweru));
    } catch (e) {
      console.error('Failed to load properties:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAllProperties(); }, [loadAllProperties]);

  /* Memoised filter — runs only when searchTerm or properties change */
  const filteredProperties = useMemo(() =>
    properties.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location || p.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [properties, searchTerm]);

  const handleDeleteProperty = async (id: number | string, isOweru: boolean) => {
    try {
      await Api.deleteAdminProperty(parseInt(id as string));
      if (isOweru) setOweruProperties(prev => prev.filter(p => p.id !== id));
      else         setProperties(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete property');
    }
  };

  const confirmDelete = (p: Property) => { setSelectedProperty(p); setShowDeleteModal(true); };
  const closeDelete   = ()            => { setShowDeleteModal(false); setSelectedProperty(null); };

  /* ── Shared property card (grid) ── */
  const PropertyCard = ({ p, oweru }: { p: Property; oweru?: boolean }) => (
    <div style={{ background: t.navy700, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s, transform .2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,145,40,0.5)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.border; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: t.navy900 }}>
        <LazyImg
          src={resolveImage(p.images)}
          alt={p.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {oweru && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: t.gold, color: t.navy900, padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
            OWERU
          </div>
        )}
        {p.featured && !oweru && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: t.gold, color: t.navy900, padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
            FEATURED
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        {/* Type tag */}
        <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.gold, marginBottom: 6 }}>
          {p.type}
        </div>
        <h3 style={{ ...serif, fontSize: 15, color: t.cream, margin: '0 0 8px', lineHeight: 1.3 }}>{p.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: t.slate, marginBottom: 12 }}>
          <MapPin size={11} style={{ color: t.gold, flexShrink: 0 }} />
          {p.location || p.address || '—'}
        </div>
        <div style={{ ...body, fontSize: 19, fontWeight: 700, color: t.gold, marginBottom: 14 }}>
          {formatCurrency(p.price)}
        </div>
        <button
          onClick={() => confirmDelete(p)}
          style={{ width: '100%', background: 'transparent', color: t.red, border: `1px solid ${t.red}30`, padding: '9px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${t.red}15`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', background: t.navy900, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --navy-900:#0F172A; --navy-800:#162035; --navy-700:#1E2D4A;
          --gold:#C89128; --gold-dim:rgba(200,145,40,0.12);
          --cream:#F8F8F9; --slate:#94A3B8; --border:rgba(200,145,40,0.18);
        }
        @keyframes shimmer { 0%{opacity:.5} 50%{opacity:.9} 100%{opacity:.5} }
        .pm-input { outline:none; transition:border-color .2s; }
        .pm-input:focus { border-color:var(--gold) !important; }
        .section-tag {
          display:inline-flex; align-items:center; gap:6px;
          font-size:10px; font-weight:700; letter-spacing:.22em;
          text-transform:uppercase; color:var(--gold);
          background:var(--gold-dim); padding:4px 12px;
          border:1px solid var(--border); font-family:'Jost',sans-serif;
        }
        @media(max-width:768px) {
          .pm-oweru-grid { grid-template-columns: repeat(auto-fill,minmax(260px,1fr)) !important; }
          .pm-grid       { grid-template-columns: repeat(auto-fill,minmax(260px,1fr)) !important; }
        }
        @media(max-width:480px) {
          .pm-oweru-grid { grid-template-columns:1fr !important; }
          .pm-grid       { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-tag" style={{ marginBottom: 10 }}>Admin Panel</div>
        <h1 style={{ ...serif, fontSize: 'clamp(22px,3vw,32px)', color: t.cream, margin: '0 0 6px' }}>
          Properties Management
        </h1>
        <p style={{ ...body, fontSize: 14, color: t.slate, margin: 0 }}>
          Manage all listings including Oweru Rental properties
        </p>
      </div>

      {/* ══ OWERU RENTALS ══ */}
      <div style={{ ...card, marginBottom: 28, position: 'relative', overflow: 'visible' }}>
        {/* gold top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.gold, borderRadius: '12px 12px 0 0' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.gold, marginBottom: 4 }}>Featured on Homepage</div>
            <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: '0 0 4px' }}>Oweru Rental Properties</h2>
            <p style={{ ...body, fontSize: 13, color: t.slate, margin: 0 }}>{oweruProperties.length} propert{oweruProperties.length !== 1 ? 'ies' : 'y'}</p>
          </div>
          <a
            href="/dashboard/admin/add-oweru-property"
            style={{ background: t.gold, color: t.navy900, padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, letterSpacing: '0.04em', flexShrink: 0 }}
          >
            <Plus size={16} /> Add Oweru Property
          </a>
        </div>

        {loading ? (
          <div className="pm-oweru-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px', color: t.slate }}>
            <Building size={40} style={{ color: t.gold, opacity: 0.35, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
            <div style={{ ...body, fontSize: 15, fontWeight: 600, color: t.cream, marginBottom: 4 }}>No Oweru Rental properties yet</div>
            <div style={{ ...body, fontSize: 13 }}>Add your first Oweru property to feature it on the homepage.</div>
          </div>
        ) : (
          <div className="pm-oweru-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {oweruProperties.map(p => <PropertyCard key={p.id} p={p} oweru />)}
          </div>
        )}
      </div>

      {/* ══ ALL PROPERTIES ══ */}
      <div style={{ ...card, position: 'relative', overflow: 'visible' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.border, borderRadius: '12px 12px 0 0' }} />

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: '0 0 4px' }}>All Properties</h2>
            <p style={{ ...body, fontSize: 13, color: t.slate, margin: 0 }}>
              {filteredProperties.length} of {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.slate }} />
              <input
                type="text"
                placeholder="Search properties…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pm-input"
                style={{ padding: '10px 14px 10px 36px', background: t.navy700, border: `1px solid ${t.border}`, borderRadius: 6, color: t.cream, fontSize: 13, width: 240, fontFamily: 'inherit' }}
              />
            </div>
            {/* View toggle */}
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${t.border}` }}>
              {(['grid', 'list'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{ padding: '9px 13px', background: viewMode === mode ? t.gold : 'transparent', color: viewMode === mode ? t.navy900 : t.slate, border: 'none', cursor: 'pointer', transition: 'all .2s' }}
                >
                  {mode === 'grid' ? <Grid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="pm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px', color: t.slate }}>
            <Search size={36} style={{ color: t.gold, opacity: 0.35, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ ...body, fontSize: 15, fontWeight: 600, color: t.cream, marginBottom: 4 }}>No properties found</div>
            <div style={{ ...body, fontSize: 13 }}>Try a different search term.</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="pm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {filteredProperties.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          /* List view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredProperties.map(p => (
              <div
                key={p.id}
                style={{ background: t.navy700, border: `1px solid ${t.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', overflow: 'hidden', transition: 'border-color .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,145,40,0.45)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.border; }}
              >
                {/* Thumbnail */}
                <div style={{ width: 90, height: 68, flexShrink: 0, overflow: 'hidden', background: t.navy900 }}>
                  <LazyImg src={resolveImage(p.images)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, padding: '10px 16px' }}>
                  <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 3 }}>{p.type}</div>
                  <div style={{ ...body, fontWeight: 600, color: t.cream, fontSize: 14, marginBottom: 3 }}>{p.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, ...body, fontSize: 12, color: t.slate }}>
                    <MapPin size={10} style={{ color: t.gold, flexShrink: 0 }} />
                    {p.location || p.address || '—'}
                  </div>
                </div>

                {/* Price */}
                <div style={{ ...body, padding: '0 16px', color: t.gold, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {formatCurrency(p.price)}
                </div>

                {/* Delete */}
                <button
                  onClick={() => confirmDelete(p)}
                  style={{ color: t.red, background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'opacity .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && selectedProperty && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeDelete(); }}
        >
          <div style={{ ...card, maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative', overflow: 'visible' }}>
            {/* Red accent top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.red, borderRadius: '12px 12px 0 0' }} />
            <button onClick={closeDelete} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: t.slate, cursor: 'pointer', display: 'flex' }}>
              <X size={18} />
            </button>

            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${t.red}15`, border: `1px solid ${t.red}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 18px' }}>
              <AlertTriangle size={24} style={{ color: t.red }} />
            </div>
            <h3 style={{ ...serif, fontSize: 20, color: t.cream, margin: '0 0 10px' }}>Delete Property</h3>
            <p style={{ ...body, color: t.slate, marginBottom: 26, lineHeight: 1.7, fontSize: 14 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: t.cream }}>"{selectedProperty.title}"</strong>?{' '}
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={closeDelete}
                style={{ flex: 1, padding: 12, background: 'transparent', color: t.slate, border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteProperty(selectedProperty.id, selectedProperty.type === 'oweru_rental' || !!selectedProperty.isOweru);
                  closeDelete();
                }}
                style={{ flex: 1, padding: 12, background: t.red, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesManagement;