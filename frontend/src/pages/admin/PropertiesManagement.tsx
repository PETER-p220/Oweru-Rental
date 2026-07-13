import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building, Search, Plus, MapPin, Grid, List, Trash2, AlertTriangle, X,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, btnPrimary, btnGhost,
  statCard, ADMIN_CSS, adminHeaderStyle,
} from './adminTheme';

/* ─── VITE storage base ─── */
const VITE_STORAGE = (import.meta.env.VITE_API_URL ?? '').replace('/api', '');

/* SVG placeholder — inline so there's zero network request */
const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23E2E8F0'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%2394A3B8'%3ENo Image%3C/text%3E%3C/svg%3E`;

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
  <div style={{ ...card, padding: 0, overflow: 'hidden', animation: 'admin-shimmer 1.4s ease-in-out infinite' }}>
    <div style={{ height: 180, background: C.slate200 }} />
    <div style={{ padding: 20 }}>
      <div style={{ height: 16, background: C.slate200, borderRadius: 4, marginBottom: 10, width: '70%' }} />
      <div style={{ height: 12, background: C.slate200, borderRadius: 4, marginBottom: 16, width: '45%' }} />
      <div style={{ height: 12, background: C.slate200, borderRadius: 4, width: '30%' }} />
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
    <div className="admin-card-hover" style={{ ...card, padding: 0, overflow: 'hidden', transition: 'box-shadow .2s, transform .2s' }}>
      {/* Image */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: C.slate100 }}>
        <LazyImg
          src={resolveImage(p.images)}
          alt={p.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {oweru && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: C.gold, color: '#fff', padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
            OWERU
          </div>
        )}
        {p.featured && !oweru && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: C.gold, color: '#fff', padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
            FEATURED
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>
          {p.type}
        </div>
        <h3 style={{ ...body, fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 8px', lineHeight: 1.3 }}>{p.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
          <MapPin size={11} style={{ color: C.gold, flexShrink: 0 }} />
          {p.location || p.address || '—'}
        </div>
        <div style={{ ...body, fontSize: 19, fontWeight: 700, color: C.gold, marginBottom: 14 }}>
          {formatCurrency(p.price)}
        </div>
        <button
          onClick={() => confirmDelete(p)}
          style={{ width: '100%', background: C.redBg, color: C.red, border: `1.5px solid rgba(220,38,38,0.25)`, padding: '9px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}</style>
      <div style={pageInner}>

      {/* ── Header ── */}
      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>
              Admin · Properties
            </div>
            <h1 style={{ ...body, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
              Properties Management
            </h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight, margin: 0 }}>
              Manage all listings including Oweru Rental properties
            </p>
          </div>
        </div>
      </div>

      {/* ══ OWERU RENTALS ══ */}
      <div style={{ ...card, marginBottom: 28 }}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ ...body, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>Featured on Homepage</div>
            <h2 style={{ ...body, fontWeight: 700, fontSize: 20, color: C.text, margin: '0 0 4px' }}>Oweru Rental Properties</h2>
            <p style={{ ...body, fontSize: 13, color: C.textMuted, margin: 0 }}>{oweruProperties.length} propert{oweruProperties.length !== 1 ? 'ies' : 'y'}</p>
          </div>
          <a href="/dashboard/admin/add-oweru-property" style={{ ...btnPrimary, textDecoration: 'none', flexShrink: 0 }}>
            <Plus size={16} /> Add Oweru Property
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {[0,1,2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px', color: C.textMuted }}>
            <Building size={40} style={{ color: C.gold, opacity: 0.35, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
            <div style={{ ...body, fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>No Oweru Rental properties yet</div>
            <div style={{ ...body, fontSize: 13 }}>Add your first Oweru property to feature it on the homepage.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {oweruProperties.map(p => <PropertyCard key={p.id} p={p} oweru />)}
          </div>
        )}
      </div>

      {/* ══ ALL PROPERTIES ══ */}
      <div style={card}>
        <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ ...body, fontWeight: 700, fontSize: 20, color: C.text, margin: '0 0 4px' }}>All Properties</h2>
            <p style={{ ...body, fontSize: 13, color: C.textMuted, margin: 0 }}>
              {filteredProperties.length} of {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
              <input
                type="text"
                placeholder="Search properties…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="admin-input"
                style={{ ...inputCss, paddingLeft: 36, width: 240 }}
              />
            </div>
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
              {(['grid', 'list'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{ padding: '9px 13px', background: viewMode === mode ? C.gold : C.cardBg, color: viewMode === mode ? '#fff' : C.textMuted, border: 'none', cursor: 'pointer' }}
                >
                  {mode === 'grid' ? <Grid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px', color: C.textMuted }}>
            <Search size={36} style={{ color: C.gold, opacity: 0.35, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ ...body, fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>No properties found</div>
            <div style={{ ...body, fontSize: 13 }}>Try a different search term.</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {filteredProperties.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredProperties.map(p => (
              <div
                key={p.id}
                className="admin-card-hover"
                style={{ ...statCard, display: 'flex', alignItems: 'center', overflow: 'hidden', padding: 0 }}
              >
                <div style={{ width: 90, height: 68, flexShrink: 0, overflow: 'hidden', background: C.slate100 }}>
                  <LazyImg src={resolveImage(p.images)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ flex: 1, padding: '10px 16px' }}>
                  <div style={{ ...body, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 3 }}>{p.type}</div>
                  <div style={{ ...body, fontWeight: 600, color: C.text, fontSize: 14, marginBottom: 3 }}>{p.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, ...body, fontSize: 12, color: C.textMuted }}>
                    <MapPin size={10} style={{ color: C.gold, flexShrink: 0 }} />
                    {p.location || p.address || '—'}
                  </div>
                </div>
                <div style={{ ...body, padding: '0 16px', color: C.gold, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {formatCurrency(p.price)}
                </div>
                <button
                  onClick={() => confirmDelete(p)}
                  style={{ color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeDelete(); }}
        >
          <div className="admin-modal" style={{ ...card, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <button onClick={closeDelete} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', display: 'flex' }}>
              <X size={18} />
            </button>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.redBg, border: `1px solid rgba(220,38,38,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 18px' }}>
              <AlertTriangle size={24} style={{ color: C.red }} />
            </div>
            <h3 style={{ ...body, fontWeight: 700, fontSize: 20, color: C.text, margin: '0 0 10px' }}>Delete Property</h3>
            <p style={{ ...body, color: C.textSub, marginBottom: 26, lineHeight: 1.7, fontSize: 14 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: C.text }}>"{selectedProperty.title}"</strong>?{' '}
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={closeDelete} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
              <button
                onClick={() => {
                  handleDeleteProperty(selectedProperty.id, selectedProperty.type === 'oweru_rental' || !!selectedProperty.isOweru);
                  closeDelete();
                }}
                style={{ ...btnPrimary, flex: 1, background: C.red, boxShadow: 'none' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PropertiesManagement;