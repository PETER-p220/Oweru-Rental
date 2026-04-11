import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, Tag, Bookmark, Search, Heart } from 'lucide-react';
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
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .sp-panel {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          padding: 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .sp-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: ${B.gold};
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .sp-tag::before { content: ''; width: 20px; height: 1px; background: ${B.gold}; }

        .sp-search {
          width: 100%; max-width: 380px;
          background: ${B.navy900};
          border: 1px solid ${B.border};
          color: ${B.cream};
          padding: 10px 14px 10px 38px;
          font-family: 'Jost', sans-serif;
          font-size: 14px; font-weight: 400;
          outline: none;
          transition: border-color 0.2s;
        }
        .sp-search::placeholder { color: rgba(148,163,184,0.4); }
        .sp-search:focus { border-color: ${B.gold}; }

        .sp-card {
          padding: 18px;
          background: ${B.navy900};
          border: 1px solid ${B.borderF};
          display: grid;
          grid-template-columns: 88px 1fr auto auto;
          gap: 16px;
          align-items: center;
          margin-bottom: 1px;
          transition: border-color 0.2s, background 0.2s;
        }
        .sp-card:hover { border-color: rgba(200,145,40,0.35); background: rgba(200,145,40,0.03); }

        .sp-btn-view {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${B.goldDim}; color: ${B.gold};
          padding: 8px 14px;
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
          border: 1px solid rgba(239,68,68,0.2); cursor: pointer;
          transition: all 0.2s;
        }
        .sp-btn-remove:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.4); }

        /* Modal */
        .sp-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.88);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 16px;
        }

        .sp-modal {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          max-width: 860px;
          max-height: 92vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .sp-modal::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: ${B.gold};
          z-index: 2;
        }

        .sp-modal-close {
          position: absolute; top: 16px; right: 16px; z-index: 10;
          background: rgba(15,23,42,0.75); border: 1px solid ${B.border};
          width: 36px; height: 36px;
          color: ${B.cream}; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
          transition: border-color 0.2s;
        }
        .sp-modal-close:hover { border-color: ${B.gold}; color: ${B.gold}; }

        .sp-modal-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(15,23,42,0.75); border: 1px solid ${B.border};
          width: 36px; height: 36px;
          color: ${B.cream}; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
          transition: border-color 0.2s;
          z-index: 5;
        }
        .sp-modal-nav:hover { border-color: ${B.gold}; }

        .sp-stat-pill {
          display: flex; align-items: center; gap: 7px;
          background: ${B.goldDim};
          border: 1px solid ${B.border};
          padding: 8px 14px;
          font-size: 13px; font-weight: 500;
          color: ${B.cream};
        }

        .sp-modal-body { overflow-y: auto; padding: 28px 32px 36px; flex: 1; }
      `}</style>

      {/* ── Header Panel ── */}
      <div className="sp-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: B.gold }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="sp-tag">Tenant Workspace</div>
            <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: B.cream, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Saved Properties
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: B.slate, margin: 0 }}>
              Properties saved from your tenant account.
            </p>
          </div>

          {items.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: B.goldDim, border: `1px solid ${B.border}`, color: B.gold, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Bookmark size={14} /> {items.length} Saved
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, position: 'relative' as const, display: 'inline-block' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: B.slate, pointerEvents: 'none' }} />
          <input
            className="sp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved properties…"
          />
        </div>
      </div>

      {/* ── Cards Panel ── */}
      <div className="sp-panel">
        <div className="sp-tag">Saved Listings</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          Your Favourites
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: B.slate, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${B.border}`, borderTopColor: B.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading saved properties…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: B.slate }}>
            <Heart size={40} style={{ color: B.gold, opacity: 0.3, margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: B.cream, marginBottom: 6 }}>No saved properties</div>
            <div style={{ fontSize: 13, fontWeight: 300 }}>Browse properties and save your favorites.</div>
          </div>
        ) : (
          <div style={{ border: `1px solid ${B.border}`, overflow: 'hidden' }}>
            {filtered.map(({ id, property }) => (
              <div key={id} className="sp-card">
                {/* Thumbnail */}
                <div style={{ width: 88, height: 66, overflow: 'hidden', flexShrink: 0, border: `1px solid ${B.borderF}` }}>
                  <img
                    src={getImage(property)}
                    alt={property?.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/property${property?.id ?? id}/400/300.jpg`; }}
                  />
                </div>

                {/* Info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: B.cream, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {property?.title || 'Untitled property'}
                  </div>
                  <div style={{ color: B.slate, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                    <MapPin size={11} /> {property?.location || 'No location'}
                  </div>
                  <div style={{ display: 'flex', gap: 12, color: B.slate, fontSize: 12, fontWeight: 300 }}>
                    {property?.bedrooms  && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={11} /> {property.bedrooms} bed</span>}
                    {property?.bathrooms && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={11} /> {property.bathrooms} bath</span>}
                    {property?.area      && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Square size={11} /> {property.area} sqm</span>}
                  </div>
                </div>

                {/* Price */}
                <div style={{ fontWeight: 700, color: B.gold, fontSize: 17, letterSpacing: '-0.02em', whiteSpace: 'nowrap' as const }}>
                  {formatCurrency(property?.price)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="sp-btn-view" onClick={() => openProperty(property)}>View</button>
                  <button className="sp-btn-remove" onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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