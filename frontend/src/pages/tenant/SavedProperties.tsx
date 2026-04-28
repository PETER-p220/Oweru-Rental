import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, Tag, Bookmark, Search, Heart, Eye } from 'lucide-react';
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
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .sp-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: linear-gradient(135deg, #0F172A 0%, #162035 100%);
          min-height: 100vh;
        }

        .sp-header {
          text-align: center;
          margin-bottom: 48px;
          position: relative;
        }

        .sp-header::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #C89128, #D4A843);
          border-radius: 2px;
        }

        .sp-title {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          color: #F8F8F9;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #F8F8F9 0%, #C89128 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sp-subtitle {
          font-size: 16px;
          color: #94A3B8;
          font-weight: 400;
          margin-bottom: 24px;
        }

        .sp-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .sp-stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(200,145,40,0.12);
          border: 1px solid rgba(200,145,40,0.18);
          padding: 8px 16px;
          border-radius: 12px;
          color: #C89128;
          font-weight: 600;
          font-size: 14px;
        }

        .sp-search-container {
          max-width: 500px;
          margin: 0 auto 48px;
          position: relative;
        }

        .sp-search {
          width: 100%;
          background: linear-gradient(135deg, #162035 0%, #1E2D4A 100%);
          border: 2px solid rgba(200,145,40,0.18);
          color: #F8F8F9;
          padding: 16px 20px 16px 52px;
          font-family: 'Jost', sans-serif;
          font-size: 16px;
          font-weight: 500;
          border-radius: 16px;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .sp-search::placeholder { color: rgba(148,163,184,0.5); }
        .sp-search:focus { 
          border-color: #C89128; 
          box-shadow: 0 8px 30px rgba(200,145,40,0.2), 0 4px 20px rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }

        .sp-search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #C89128;
          pointer-events: none;
        }

        .sp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .sp-card {
          background: linear-gradient(135deg, #162035 0%, #1E2D4A 100%);
          border: 1px solid rgba(200,145,40,0.18);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          position: relative;
        }
        .sp-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #C89128, #D4A843);
        }
        .sp-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(200,145,40,0.25), 0 8px 30px rgba(0,0,0,0.4);
          border-color: rgba(200,145,40,0.35);
        }

        .sp-card-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .sp-card:hover .sp-card-image {
          transform: scale(1.05);
        }

        .sp-card-content {
          padding: 20px;
        }

        .sp-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #F8F8F9;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sp-card-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94A3B8;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .sp-card-features {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          color: #94A3B8;
          font-size: 13px;
        }

        .sp-card-feature {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sp-card-price {
          font-size: 24px;
          font-weight: 800;
          color: #C89128;
          margin-bottom: 16px;
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
          background: linear-gradient(135deg, #C89128 0%, #D4A843 100%);
          color: #F8F8F9;
          padding: 12px 20px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(200,145,40,0.3);
        }
        .sp-btn-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(200,145,40,0.4);
        }

        .sp-btn-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          color: #f87171;
          padding: 12px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .sp-btn-remove:hover {
          background: rgba(239,68,68,0.2);
          border-color: rgba(239,68,68,0.4);
          transform: translateY(-1px);
        }

        .sp-btn-view {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${B.goldDim}; color: ${B.gold};
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
          border: 1px solid rgba(239,68,68,0.2); cursor: pointer;
          transition: all 0.2s;
        }
        .sp-btn-remove:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.4); }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .sp-card { grid-template-columns: 88px 1fr; gap: 14px; padding: 16px; }
          .sp-card > div:nth-child(3) { grid-column: 1 / -1; order: 3; }
          .sp-card > div:nth-child(4) { grid-column: 1 / -1; order: 4; }
          .sp-btn-view, .sp-btn-remove { padding: 10px 16px; font-size: 12px; }
        }

        @media (max-width: 768px) {
          .sp-card { grid-template-columns: 80px 1fr; gap: 12px; padding: 14px; }
          .sp-card > div:nth-child(3) { grid-column: 1 / -1; order: 3; }
          .sp-card > div:nth-child(4) { grid-column: 1 / -1; order: 4; }
          .sp-btn-view, .sp-btn-remove { padding: 8px 14px; font-size: 11px; }
          .sp-modal { max-width: 95vw; max-height: 95vh; }
          .sp-modal-body { padding: 20px 24px 28px; }
        }

        @media (max-width: 480px) {
          .sp-card { grid-template-columns: 72px 1fr; gap: 10px; padding: 12px; }
          .sp-card > div:nth-child(3) { grid-column: 1 / -1; order: 3; }
          .sp-card > div:nth-child(4) { grid-column: 1 / -1; order: 4; }
          .sp-btn-view, .sp-btn-remove { padding: 6px 12px; font-size: 10px; }
          .sp-modal { max-width: 98vw; max-height: 98vh; }
          .sp-modal-body { padding: 16px 20px 24px; }
          .sp-panel { padding: 20px 16px; }
          .sp-tag { font-size: 9px; }
        }

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
                    <MapPin size={14} />
                    {property?.location || 'No location'}
                  </div>
                  <div className="sp-card-features">
                    {property?.bedrooms && (
                      <div className="sp-card-feature">
                        <Bed size={12} /> {property.bedrooms} bed
                      </div>
                    )}
                    {property?.bathrooms && (
                      <div className="sp-card-feature">
                        <Bath size={12} /> {property.bathrooms} bath
                      </div>
                    )}
                    {property?.area && (
                      <div className="sp-card-feature">
                        <Square size={12} /> {property.area} sqm
                      </div>
                    )}
                  </div>
                  <div className="sp-card-price">
                    {formatCurrency(property?.price)}
                  </div>
                  <div className="sp-card-actions">
                    <button className="sp-btn-view" onClick={() => openProperty(property)}>
                      <Eye size={14} /> View
                    </button>
                    <button className="sp-btn-remove" onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>
                      <Heart size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Header ── */}
      <div className="sp-header">
        <h1 className="sp-title">Saved Properties</h1>
        <p className="sp-subtitle">Your favorite properties in one place</p>
        
        {items.length > 0 && (
          <div className="sp-stats">
            <div className="sp-stat-item">
              <Bookmark size={16} /> {items.length} Saved
            </div>
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div className="sp-search-container">
        <Search className="sp-search-icon" />
        <input
          className="sp-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your saved properties..."
        />
      </div>

      {/* ── Results ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: B.slate }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${B.border}`, borderTopColor: B.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: B.slate }}>
          <Heart size={48} style={{ color: B.gold, opacity: 0.3, margin: '0 auto 20px' }} />
          <div style={{ fontSize: 20, fontWeight: 600, color: B.cream, marginBottom: 8 }}>No saved properties</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Start browsing and save your favorite properties</div>
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
                  <MapPin size={14} />
                  {property?.location || 'No location'}
                </div>
                <div className="sp-card-features">
                  {property?.bedrooms && (
                    <div className="sp-card-feature">
                      <Bed size={12} /> {property.bedrooms} bed
                    </div>
                  )}
                  {property?.bathrooms && (
                    <div className="sp-card-feature">
                      <Bath size={12} /> {property.bathrooms} bath
                    </div>
                  )}
                  {property?.area && (
                    <div className="sp-card-feature">
                      <Square size={12} /> {property.area} sqm
                    </div>
                  )}
                </div>
                <div className="sp-card-price">
                  {formatCurrency(property?.price)}
                </div>
                <div className="sp-card-actions">
                  <button className="sp-btn-view" onClick={() => openProperty(property)}>
                    <Eye size={14} /> View
                  </button>
                  <button className="sp-btn-remove" onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>
                    <Heart size={14} /> Remove
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