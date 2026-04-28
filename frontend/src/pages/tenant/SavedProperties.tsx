import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, Tag, Bookmark, Heart, Eye } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency } from './tenantPageStyles';

interface SavedPropertyItem { id: number; property?: any; }

const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

const B = {
  navy900:  '#0F172A',
  navy800:  '#162035',
  navy700:  '#1E2D4A',
  gold:     '#C89128',
  goldLt:   '#D4A843',
  goldDim:  'rgba(200,145,40,0.12)',
  cream:    '#F8F8F9',
  slate:    '#94A3B8',
  border:   'rgba(200,145,40,0.18)',
  borderF:  'rgba(200,145,40,0.08)',
};

const resolveImage = (src: string, propertyId: number | string): string => {
  if (!src) return `https://picsum.photos/seed/property${propertyId}/400/300.jpg`;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${VITE_STORAGE}/storage/${src}`;
};

const SavedProperties = () => {
  const [items, setItems]     = useState<SavedPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showModal, setShowModal]               = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api.getSavedProperties();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load saved properties.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(({ property }) => {
    const hay = `${property?.title || ''} ${property?.location || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  }), [items, search]);

  const getImage  = (property: any) => property?.images?.length ? resolveImage(property.images[0], property?.id ?? 0) : `https://picsum.photos/seed/property${property?.id ?? 0}/400/300.jpg`;
  const getImages = (property: any): string[] => property?.images?.length ? property.images.map((img: string) => resolveImage(img, property?.id ?? 0)) : [`https://picsum.photos/seed/property${property?.id ?? 0}/800/500.jpg`];

  const openProperty = (property: any) => { setSelectedProperty(property); setActiveImageIndex(0); setShowModal(true); };

  return (
    <div className="sp-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .sp-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 24px;
          background: #0F172A;
          min-height: 100vh;
        }

        .sp-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .sp-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .sp-subtitle {
          font-size: 18px;
          color: #94A3B8;
          font-weight: 400;
          margin-bottom: 32px;
        }

        .sp-stats-bar {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(200,145,40,0.1);
          border: 1px solid rgba(200,145,40,0.2);
          padding: 12px 24px;
          border-radius: 100px;
          color: #C89128;
          font-weight: 600;
          font-size: 14px;
        }

        .sp-search-section {
          max-width: 600px;
          margin: 0 auto 48px;
        }

        .sp-search {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #FFFFFF;
          padding: 16px 24px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          border-radius: 16px;
          outline: none;
          transition: all 0.2s ease;
        }
        .sp-search::placeholder { color: rgba(255,255,255,0.4); }
        .sp-search:focus { 
          border-color: #C89128; 
          background: rgba(255,255,255,0.08);
        }

        .sp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 32px;
        }

        .sp-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }
        .sp-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border-color: rgba(200,145,40,0.3);
        }

        .sp-card-image {
          width: 100%;
          height: 240px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .sp-card:hover .sp-card-image {
          transform: scale(1.02);
        }

        .sp-card-content {
          padding: 24px;
        }

        .sp-card-title {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .sp-card-location {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94A3B8;
          font-size: 15px;
          margin-bottom: 16px;
        }

        .sp-card-features {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          color: #94A3B8;
          font-size: 14px;
        }

        .sp-card-feature {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sp-card-price {
          font-size: 28px;
          font-weight: 800;
          color: #C89128;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .sp-card-actions {
          display: flex;
          gap: 12px;
        }

        .sp-btn-view {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #C89128;
          color: #FFFFFF;
          padding: 14px 24px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sp-btn-view:hover {
          background: #D4A843;
          transform: translateY(-1px);
        }

        .sp-btn-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          color: #EF4444;
          padding: 14px 20px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sp-btn-remove:hover {
          background: rgba(239,68,68,0.2);
          border-color: rgba(239,68,68,0.3);
        }
          padding: 8px 14px;
          font-size: 13px; font-weight: 600;
          font-family: 'Jost', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid ${B.border}; cursor: pointer;
          transition: all 0.2s;
        }
        .sp-btn-view:hover { background: rgba(200,145,40,0.22); border-color: rgba(200,145,40,0.45); }

        .sp-btn-remove {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(239,68,68,0.08); color: #f87171;
          padding: 8px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
      `}</style>

      {/* ── Header ── */}
      <div className="sp-header">
        <h1 className="sp-title">Saved Properties</h1>
        <p className="sp-subtitle">Your favorite properties in one place</p>
        
        {items.length > 0 && (
          <div className="sp-stats-bar">
            <Bookmark size={16} /> {items.length} Saved Properties
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div className="sp-search-section">
        <input
          className="sp-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your saved properties..."
        />
      </div>

      {/* ── Results ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#94A3B8' }}>
          <div style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#C89128', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px' }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
          <Heart size={64} style={{ color: '#C89128', opacity: 0.3, margin: '0 auto 24px' }} />
          <div style={{ fontSize: 24, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>No saved properties</div>
          <div style={{ fontSize: 16, opacity: 0.7 }}>Start browsing and save your favorite properties</div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="sp-grid">
          {filtered.map(({ id, property }) => (
            <div key={id} className="sp-card">
              {/* Image */}
              <img
                src={getImage(property)}
                alt={property?.title}
                className="sp-card-image"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/property${property?.id ?? id}/400/300.jpg`; }}
              />

              {/* Content */}
              <div className="sp-card-content">
                <div className="sp-card-title">
                  {property?.title || 'Untitled property'}
                </div>
                <div className="sp-card-location">
                  <MapPin size={16} />
                  {property?.location || 'No location'}
                </div>
                <div className="sp-card-features">
                  {property?.bedrooms && (
                    <div className="sp-card-feature">
                      <Bed size={14} /> {property.bedrooms} bed
                    </div>
                  )}
                  {property?.bathrooms && (
                    <div className="sp-card-feature">
                      <Bath size={14} /> {property.bathrooms} bath
                    </div>
                  )}
                  {property?.area && (
                    <div className="sp-card-feature">
                      <Square size={14} /> {property.area} sqm
                    </div>
                  )}
                </div>
                <div className="sp-card-price">
                  {formatCurrency(property?.price)}
                </div>
                <div className="sp-card-actions">
                  <button className="sp-btn-view" onClick={() => openProperty(property)}>
                    <Eye size={16} /> View
                  </button>
                  <button className="sp-btn-remove" onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>
                    <Heart size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && selectedProperty && (() => {
        const images = getImages(selectedProperty);
        return (
          <div className="sp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="sp-modal">

              {/* Hero image */}
              <div style={{ position: 'relative' as const, height: 340, background: B.navy900, flexShrink: 0 }}>
                <img
                  src={images[activeImageIndex]}
                  alt={selectedProperty.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/property${selectedProperty?.id ?? 0}/800/500.jpg`; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, transparent 40%, rgba(15,23,42,0.6) 100%)', pointerEvents: 'none' }} />

                <button className="sp-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>

                {images.length > 1 && (
                  <>
                    <button className="sp-modal-nav" style={{ left: 14 }} onClick={() => setActiveImageIndex(i => i === 0 ? images.length - 1 : i - 1)}>
                      <ChevronLeft size={18} />
                    </button>
                    <button className="sp-modal-nav" style={{ right: 14 }} onClick={() => setActiveImageIndex(i => i === images.length - 1 ? 0 : i + 1)}>
                      <ChevronRight size={18} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(15,23,42,0.75)', border: `1px solid ${B.border}`, padding: '4px 10px', color: B.cream, fontSize: 12 }}>
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}

                {selectedProperty.property_type && (
                  <div style={{ position: 'absolute', top: 14, left: 14, background: B.goldDim, border: `1px solid ${B.border}`, padding: '4px 12px', color: B.gold, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Tag size={11} /> {selectedProperty.property_type}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 6, padding: '10px 20px', background: B.navy900, overflowX: 'auto', flexShrink: 0, borderBottom: `1px solid ${B.borderF}` }}>
                  {images.map((img: string, i: number) => (
                    <div key={i} onClick={() => setActiveImageIndex(i)}
                      style={{ width: 64, height: 44, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: `2px solid ${i === activeImageIndex ? B.gold : 'transparent'}`, opacity: i === activeImageIndex ? 1 : 0.4, transition: 'all 0.2s' }}>
                      <img src={img} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="sp-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ color: B.cream, fontSize: 22, margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      {selectedProperty.title}
                    </h2>
                    <div style={{ color: B.slate, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} /> {selectedProperty.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.slate, marginBottom: 6 }}>Monthly Rent</div>
                    <div style={{ fontSize: 28, color: B.gold, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                      {formatCurrency(selectedProperty.price)}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: B.borderF, margin: '20px 0' }} />

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                  {[
                    selectedProperty.bedrooms  && { icon: <Bed size={14} />,    label: `${selectedProperty.bedrooms} Bed${selectedProperty.bedrooms !== 1 ? 's' : ''}` },
                    selectedProperty.bathrooms && { icon: <Bath size={14} />,   label: `${selectedProperty.bathrooms} Bath${selectedProperty.bathrooms !== 1 ? 's' : ''}` },
                    selectedProperty.area      && { icon: <Square size={14} />, label: `${selectedProperty.area} sqm` },
                  ].filter(Boolean).map((stat: any, i) => (
                    <div key={i} className="sp-stat-pill">
                      <span style={{ color: B.gold }}>{stat.icon}</span> {stat.label}
                    </div>
                  ))}
                </div>

                {selectedProperty.description && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: B.gold, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 10 }}>About this property</div>
                    <p style={{ color: B.slate, lineHeight: 1.75, fontSize: 14, margin: 0, fontWeight: 300 }}>{selectedProperty.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SavedProperties;