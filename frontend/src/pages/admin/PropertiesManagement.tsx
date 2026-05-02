import React, { useState, useEffect } from 'react';
import {
  Building, Search, Plus, MapPin, Grid, List, Trash2, AlertTriangle, X
} from 'lucide-react';
import Api from '../../services/api';

/* ── Design tokens ── */
const t = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark:   '#080808',
  dark2:  '#0e0e0e',
  dark3:  '#141414',
  cream:  '#e8e4dc',
  muted:  '#7a7060',
  border: 'rgba(201,168,76,0.14)',
  green:  '#10b981',
  red:    '#ef4444',
  blue:   '#2563eb',
};

const serif = { fontFamily: "'Playfair Display', 'Georgia', serif" };
const body  = { fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" };

const card: React.CSSProperties = {
  background:   t.dark2,
  border:       `1px solid ${t.border}`,
  borderRadius: 12,
  padding:      24,
};

const mobileStyles = `
  @media (max-width: 768px) {
    .properties-management { padding: 16px !important; }
    .property-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important; }
  }
  @media (max-width: 480px) {
    .properties-management { padding: 12px !important; }
    .property-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ── VITE storage base (same pattern used in Home.tsx / Properties.tsx) ── */
const VITE_STORAGE = (import.meta.env.VITE_API_URL ?? '').replace('/api', '');

/**
 * Resolve a property image to a usable URL.
 * Supports: fully-qualified URLs, storage-relative paths, and plain filenames.
 * Falls back to a clean SVG placeholder when no image is available.
 */
const resolveImage = (property: Property): string => {
  // Debug: Log the property images structure
  console.log('Property images for', property.title, ':', property.images);
  
  const images = property.images;

  if (Array.isArray(images) && images.length > 0) {
    const raw = images[0];
    console.log('First image raw value:', raw);
    
    if (typeof raw === 'string' && raw.trim() !== '') {
      let finalUrl = '';
      
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        finalUrl = raw;
      } else if (raw.startsWith('/')) {
        finalUrl = `${VITE_STORAGE}${raw}`;
      } else if (raw.startsWith('storage/')) {
        finalUrl = `${VITE_STORAGE}/${raw}`;
      } else {
        finalUrl = `${VITE_STORAGE}/storage/${raw}`;
      }
      
      console.log('Resolved image URL:', finalUrl);
      return finalUrl;
    }
  }
  
  // SVG placeholder - matches the dark admin theme
  const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%230e0e0e'/%3E%3Crect x='240' y='140' width='120' height='120' rx='8' fill='none' stroke='%23c9a84c' stroke-width='2' opacity='0.4'/%3E%3Ctext x='50%25' y='78%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='13' fill='%237a7060'%3ENo Image%3C/text%3E%3C/svg%3E`;
  console.log('Using placeholder for', property.title);
  return placeholder;
};

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

const PropertiesManagement = () => {
  const [properties,      setProperties]      = useState<Property[]>([]);
  const [oweruProperties, setOweruProperties] = useState<Property[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingOweru,    setLoadingOweru]    = useState(false);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [viewMode,        setViewMode]        = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDeleteModal,   setShowDeleteModal]  = useState(false);

  useEffect(() => { loadAllProperties(); }, []);

  const loadAllProperties = async () => {
    try {
      setLoading(true);

      // Fetch ALL properties (no pagination limit in admin endpoint)
      const res   = await Api.getAdminProperties();
      const all: Property[] = res?.data || [];

      // Split by type — Oweru vs everything else
      const oweru   = all.filter((p) => p.type === 'oweru_rental' || p.isOweru);
      const regular = all.filter((p) => p.type !== 'oweru_rental' && !p.isOweru);

      setOweruProperties(oweru);
      setProperties(regular);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
      setLoadingOweru(false);
    }
  };

  const handleDeleteProperty = async (id: number | string, isOweru: boolean = false) => {
    try {
      await Api.deleteAdminProperty(parseInt(id as string));
      if (isOweru) {
        setOweruProperties((prev) => prev.filter((p) => p.id !== id));
      } else {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete property');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency', currency: 'TZS', minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.location || p.address || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: t.cream }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 12 }}>Loading Properties…</div>
          <div style={{ color: t.muted, fontSize: 14 }}>Please wait</div>
        </div>
      </div>
    );
  }

  /* ── Shared card image component ── */
  const PropertyImage = ({ property, height = 180 }: { property: Property; height?: number }) => (
    <div style={{ height, position: 'relative', overflow: 'hidden', background: t.dark3, flexShrink: 0 }}>
      <img
        src={resolveImage(property)}
        alt={property.title}
        loading="lazy"
        decoding="async"
        width="180"
        height="135"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#141414'
        }}
        onError={(e) => {
          // If the resolved URL 404s, swap to SVG placeholder
          (e.currentTarget as HTMLImageElement).src = resolveImage({ ...property, images: [] });
        }}
      />
    </div>
  );

  /* ── Oweru badge overlay ── */
  const OweruBadge = () => (
    <div style={{
      position:     'absolute',
      top:          12,
      right:        12,
      background:   t.green,
      color:        t.dark,
      padding:      '4px 10px',
      borderRadius: 6,
      fontSize:     11,
      fontWeight:   700,
      letterSpacing: '0.06em',
    }}>
      OWERU
    </div>
  );

  return (
    <div className="properties-management" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{mobileStyles}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>
          Properties Management
        </h1>
        <p style={{ ...body, fontSize: 16, color: t.muted }}>
          Manage all listings including Oweru Rental properties
        </p>
      </div>

      {/* ══════════════════════════════════════════
          OWERU RENTAL PROPERTIES
      ══════════════════════════════════════════ */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: 0 }}>
              Oweru Rental Properties
            </h2>
            <p style={{ ...body, fontSize: 14, color: t.muted, margin: '4px 0 0' }}>
              Featured on homepage &bull; {oweruProperties.length} properties
            </p>
          </div>
          <a
            href="/dashboard/admin/add-oweru-property"
            style={{
              background:     t.gold,
              color:          t.dark,
              padding:        '10px 20px',
              borderRadius:   8,
              textDecoration: 'none',
              fontWeight:     600,
              display:        'flex',
              alignItems:     'center',
              gap:            8,
              fontSize:       14,
            }}
          >
            <Plus size={18} /> Add Oweru Property
          </a>
        </div>

        {loadingOweru ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>
            Loading Oweru properties…
          </div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.muted }}>
            <Building size={48} style={{ opacity: 0.4, marginBottom: 16 }} />
            <div>No Oweru Rental properties yet</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {oweruProperties.map((property) => (
              <div
                key={property.id}
                style={{ background: t.dark3, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}
              >
                {/* ── Image with OWERU badge ── */}
                <div style={{ position: 'relative' }}>
                  <PropertyImage property={property} height={180} />
                  <OweruBadge />
                </div>

                <div style={{ padding: 20 }}>
                  <h3 style={{ ...serif, fontSize: 17, color: t.cream, margin: '0 0 8px' }}>
                    {property.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <MapPin size={14} style={{ color: t.gold }} />
                    <span style={{ ...body, color: t.muted, fontSize: 14 }}>
                      {property.location || property.address || '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: t.gold, marginBottom: 16 }}>
                    {formatCurrency(property.price)}
                  </div>
                  <button
                    onClick={() => { setSelectedProperty(property); setShowDeleteModal(true); }}
                    style={{
                      width:        '100%',
                      background:   'transparent',
                      color:        t.red,
                      border:       `1px solid ${t.red}`,
                      padding:      '10px',
                      borderRadius: 8,
                      fontSize:     13,
                      cursor:       'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          ALL OTHER PROPERTIES
      ══════════════════════════════════════════ */}
      <div style={card}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ ...serif, fontSize: 20, color: t.cream, margin: 0 }}>All Properties</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.muted }} />
              <input
                type="text"
                placeholder="Search properties…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width:        '100%',
                  padding:      '12px 12px 12px 44px',
                  background:   t.dark3,
                  border:       `1px solid ${t.border}`,
                  borderRadius: 8,
                  color:        t.cream,
                  fontSize:     14,
                  outline:      'none',
                }}
              />
            </div>
            {/* View toggle */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.border}` }}>
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding:    '10px 14px',
                    background: viewMode === mode ? t.gold : 'transparent',
                    color:      viewMode === mode ? t.dark : t.muted,
                    border:     'none',
                    cursor:     'pointer',
                  }}
                >
                  {mode === 'grid' ? <Grid size={18} /> : <List size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.muted }}>
            No properties found matching your search.
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid view ── */
          <div
            className="property-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}
          >
            {filteredProperties.map((p) => (
              <div
                key={p.id}
                style={{ background: t.dark3, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}
              >
                <PropertyImage property={p} height={180} />
                <div style={{ padding: 20 }}>
                  <h3 style={{ ...serif, fontSize: 17, color: t.cream, margin: '0 0 8px' }}>{p.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: t.muted, fontSize: 14 }}>
                    <MapPin size={14} style={{ color: t.gold, flexShrink: 0 }} />
                    {p.location || p.address || '—'}
                  </div>
                  <div style={{ color: t.gold, fontSize: 19, fontWeight: 600, marginBottom: 16 }}>
                    {formatCurrency(p.price)}
                  </div>
                  <button
                    onClick={() => { setSelectedProperty(p); setShowDeleteModal(true); }}
                    style={{
                      width:        '100%',
                      background:   'transparent',
                      color:        t.red,
                      border:       `1px solid ${t.red}`,
                      padding:      '10px',
                      borderRadius: 8,
                      fontSize:     13,
                      cursor:       'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── List view ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredProperties.map((p) => (
              <div
                key={p.id}
                style={{
                  background:   t.dark3,
                  border:       `1px solid ${t.border}`,
                  borderRadius: 12,
                  display:      'flex',
                  alignItems:   'center',
                  overflow:     'hidden',
                  gap:          0,
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 100, height: 80, flexShrink: 0, overflow: 'hidden' }}>
                  <img
                    src={resolveImage(p)}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    width="100"
                    height="80"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#141414'
                    }}
                  />
                </div>
                {/* Content */}
                <div style={{ flex: 1, padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: t.cream, fontSize: 15, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.muted, fontSize: 13 }}>
                    <MapPin size={12} style={{ color: t.gold, flexShrink: 0 }} />
                    {p.location || p.address || '—'}
                  </div>
                </div>
                <div style={{ padding: '0 16px', color: t.gold, fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                  {formatCurrency(p.price)}
                </div>
                <button
                  onClick={() => { setSelectedProperty(p); setShowDeleteModal(true); }}
                  style={{ color: t.red, background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px', flexShrink: 0 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════ */}
      {showDeleteModal && selectedProperty && (
        <div style={{
          position:        'fixed',
          inset:           0,
          background:      'rgba(0,0,0,0.85)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          zIndex:          1000,
        }}>
          <div style={{ ...card, maxWidth: 420, textAlign: 'center', position: 'relative' }}>
            {/* Close button */}
            <button
              onClick={() => { setShowDeleteModal(false); setSelectedProperty(null); }}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: t.muted, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <AlertTriangle size={48} style={{ color: t.red, marginBottom: 16 }} />
            <h3 style={{ ...serif, fontSize: 22, color: t.cream, marginBottom: 12 }}>Delete Property</h3>
            <p style={{ ...body, color: t.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: t.cream }}>"{selectedProperty.title}"</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedProperty(null); }}
                style={{
                  flex:         1,
                  padding:      '12px',
                  background:   t.dark3,
                  color:        t.cream,
                  border:       `1px solid ${t.border}`,
                  borderRadius: 8,
                  cursor:       'pointer',
                  fontSize:     14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteProperty(
                    selectedProperty.id,
                    selectedProperty.type === 'oweru_rental' || !!selectedProperty.isOweru,
                  );
                  setShowDeleteModal(false);
                  setSelectedProperty(null);
                }}
                style={{
                  flex:         1,
                  padding:      '12px',
                  background:   t.red,
                  color:        '#fff',
                  border:       'none',
                  borderRadius: 8,
                  cursor:       'pointer',
                  fontWeight:   600,
                  fontSize:     14,
                }}
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