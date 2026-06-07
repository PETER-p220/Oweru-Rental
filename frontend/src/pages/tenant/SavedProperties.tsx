import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, Tag, Bookmark, Search, Heart } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency } from './tenantPageStyles';

interface SavedPropertyItem { id: number; property?: any; }

const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .sp-panel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 24px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 768px) { .sp-panel { padding: 32px; } }

        .sp-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #C89128;
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .sp-tag::before { content: ''; width: 20px; height: 1px; background: #C89128; }

        .sp-search {
          width: 100%; max-width: 100%;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          padding: 10px 14px 10px 38px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 400;
          outline: none;
          transition: border-color 0.2s;
        }
        @media (min-width: 768px) { .sp-search { max-width: 380px; } }
        .sp-search:focus { border-color: #C89128; }

        .sp-card {
          padding: 16px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 1px;
          transition: border-color 0.2s, background 0.2s;
        }
        
        @media (min-width: 768px) {
          .sp-card {
            display: grid;
            grid-template-columns: 88px 1fr auto auto;
            flex-direction: row;
            align-items: center;
          }
        }
        .sp-card:hover { border-color: rgba(200,145,40,0.35); background: rgba(200,145,40,0.03); }

        .sp-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        @media (min-width: 768px) { .sp-actions-row { width: auto; contents; } }

        .sp-btn-view {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: rgba(200,145,40,0.10); color: #C89128;
          padding: 8px 14px; flex: 1;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid rgba(200,145,40,0.28); cursor: pointer;
        }
        @media (min-width: 768px) { .sp-btn-view { flex: none; } }

        .sp-btn-remove {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: rgba(220,38,38,0.08); color: #DC2626;
          padding: 8px 14px; flex: 1;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: 1px solid rgba(220,38,38,0.2); cursor: pointer;
        }
        @media (min-width: 768px) { .sp-btn-remove { flex: none; } }

        .sp-modal {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          max-width: 860px;
          width: 100%;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .sp-modal-body { 
          overflow-y: auto; 
          padding: 20px; 
          flex: 1; 
        }
        @media (min-width: 768px) { .sp-modal-body { padding: 28px 32px 36px; } }

        .sp-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15,23,42,0.85); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }

        .sp-modal-close {
          position: absolute; top: 12px; right: 12px;
          background: rgba(0,0,0,0.5); color: #FFFFFF;
          border: none; width: 32px; height: 32px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
        }
        .sp-modal-close:hover { background: rgba(0,0,0,0.7); }

        .sp-modal-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(0,0,0,0.5); color: #FFFFFF;
          border: none; width: 40px; height: 40px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
        }
        .sp-modal-nav:hover { background: rgba(0,0,0,0.7); }

        .sp-stat-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Tenant Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>
              Saved Properties
            </h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>
              Properties saved from your tenant account.
            </p>
          </div>
          {items.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', color: '#C89128', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '8px' }}>
              <Bookmark size={14} /> {items.length} <span className="hide-mobile">Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 40px 0', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
          <input className="sp-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved properties…" />
      </div>

      {/* ── Cards Panel ── */}
      <div className="sp-panel">
        <div className="sp-tag">Saved Listings</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Your Favourites</h2>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #E2E8F0', borderTopColor: '#C89128', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748B' }}>
            <Heart size={40} style={{ color: '#C89128', opacity: 0.3, margin: '0 auto 14px', display: 'block' }} />
            <div style={{ fontSize: 16, color: '#0F172A' }}>No saved properties</div>
          </div>
        ) : (
          <div style={{ border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {filtered.map(({ id, property }) => (
              <div key={id} className="sp-card">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 88, height: 66, overflow: 'hidden', flexShrink: 0, border: '1px solid #F1F5F9' }}>
                    <img src={getImage(property)} alt={property?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {property?.title || 'Untitled property'}
                    </div>
                    <div style={{ color: '#64748B', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {property?.location || 'No location'}
                    </div>
                  </div>
                </div>

                <div className="sp-actions-row">
                  <div style={{ fontWeight: 700, color: '#C89128', fontSize: 18 }}>
                    {formatCurrency(property?.price)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                    <button className="sp-btn-view" onClick={() => openProperty(property)}>View</button>
                    <button className="sp-btn-remove" onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>Remove</button>
                  </div>
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
              <div style={{ position: 'relative', height: 'clamp(200px, 40vh, 340px)', background: '#0F172A', flexShrink: 0 }}>
                <img src={images[activeImageIndex]} alt={selectedProperty.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                <button className="sp-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                {images.length > 1 && (
                  <>
                    <button className="sp-modal-nav" style={{ left: 10 }} onClick={() => setActiveImageIndex(i => i === 0 ? images.length - 1 : i - 1)}><ChevronLeft size={18} /></button>
                    <button className="sp-modal-nav" style={{ right: 10 }} onClick={() => setActiveImageIndex(i => i === images.length - 1 ? 0 : i + 1)}><ChevronRight size={18} /></button>
                  </>
                )}
              </div>

              <div className="sp-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <h2 style={{ color: '#0F172A', fontSize: 20, margin: '0 0 6px', fontWeight: 700 }}>{selectedProperty.title}</h2>
                    <div style={{ color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {selectedProperty.location}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, color: '#C89128', fontWeight: 800 }}>{formatCurrency(selectedProperty.price)}</div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#F1F5F9', margin: '20px 0' }} />

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                   {/* Stat Pills here... (same logic as before) */}
                   {selectedProperty.bedrooms && <div className="sp-stat-pill"><Bed size={14}/> {selectedProperty.bedrooms} Bed</div>}
                   {selectedProperty.bathrooms && <div className="sp-stat-pill"><Bath size={14}/> {selectedProperty.bathrooms} Bath</div>}
                   {selectedProperty.area      && <div className="sp-stat-pill"><Square size={14}/> {selectedProperty.area} sqm</div>}
                </div>
                <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: 14, fontWeight: 300 }}>{selectedProperty.description}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SavedProperties;