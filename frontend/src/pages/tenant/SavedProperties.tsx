import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle } from './tenantPageStyles';
import { X, MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, Tag, Calendar } from 'lucide-react';

interface SavedPropertyItem {
  id: number;
  property?: any;
}

/* ─── Same base URL resolution as Properties.tsx ─── */
const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

const resolveImage = (src: string, propertyId: number | string): string => {
  if (!src) return `https://picsum.photos/seed/property${propertyId}/400/300.jpg`;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${VITE_STORAGE}/storage/${src}`;
};

const SavedProperties = () => {
  const [items, setItems] = useState<SavedPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setActiveImageIndex(0);
    setShowDetailsModal(true);
  };

  /* ─── Resolve a single thumbnail/card image ─── */
  const getImage = (property: any): string => {
    const id = property?.id ?? 0;
    if (property?.images?.length) {
      return resolveImage(property.images[0], id);
    }
    return `https://picsum.photos/seed/property${id}/400/300.jpg`;
  };

  /* ─── Resolve full images array ─── */
  const getImages = (property: any): string[] => {
    const id = property?.id ?? 0;
    if (property?.images?.length > 0) {
      return property.images.map((img: string) => resolveImage(img, id));
    }
    return [`https://picsum.photos/seed/property${id}/800/500.jpg`];
  };

  const handlePrevImage = () => {
    const images = getImages(selectedProperty);
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const images = getImages(selectedProperty);
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Saved Properties</h1>
        <p style={descriptionStyle}>Properties saved from your tenant account.</p>
        <div style={{ marginTop: '18px', maxWidth: '360px' }}>
          <input
            style={inputStyle}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved properties"
          />
        </div>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? (
          <div style={{ color: '#9f9587' }}>Loading saved properties...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#9f9587' }}>No saved properties found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {filtered.map(({ id, property }) => (
              <div
                key={id}
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a' }}>
                  <img
                    src={getImage(property)}
                    alt={property?.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://picsum.photos/seed/property${property?.id ?? id}/400/300.jpg`;
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{property?.title || 'Untitled property'}</div>
                  <div style={{ color: '#9f9587', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    {property?.location || 'No location'}
                  </div>
                  {property?.bedrooms && (
                    <div style={{ color: '#9f9587', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {property.bedrooms && <><Bed size={10} /> {property.bedrooms} bed</>}
                      {property.bathrooms && <><Bath size={10} /> {property.bathrooms} bath</>}
                      {property.area && <><Square size={10} /> {property.area} sqm</>}
                    </div>
                  )}
                </div>
                <div style={{ color: '#c9a84c', fontSize: '20px', fontWeight: '500' }}>{formatCurrency(property?.price)}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={buttonStyle('primary')} onClick={() => handleViewProperty(property)}>View</button>
                  <button style={buttonStyle('danger')} onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Professional Property Details Modal ── */}
      {showDetailsModal && selectedProperty && (() => {
        const images = getImages(selectedProperty);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowDetailsModal(false); }}
          >
            <div
              style={{
                backgroundColor: '#121212',
                borderRadius: '20px',
                maxWidth: '860px',
                maxHeight: '92vh',
                width: '100%',
                border: '1px solid rgba(201,168,76,0.18)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              }}
            >

              {/* ── Image Hero with carousel ── */}
              <div style={{ position: 'relative', height: '340px', background: '#0d0d0d', flexShrink: 0 }}>
                <img
                  src={images[activeImageIndex]}
                  alt={`${selectedProperty.title} - ${activeImageIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'opacity 0.25s ease',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://picsum.photos/seed/property${selectedProperty?.id ?? 0}/800/500.jpg`;
                  }}
                />

                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)',
                  pointerEvents: 'none',
                }} />

                {/* Close button */}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <X size={16} />
                </button>

                {/* Carousel arrows — only if multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Image counter badge */}
                {images.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    right: '14px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    color: '#fff',
                    fontSize: '12px',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {activeImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Property type badge */}
                {selectedProperty.property_type && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    backgroundColor: 'rgba(201,168,76,0.15)',
                    border: '1px solid rgba(201,168,76,0.4)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    color: '#c9a84c',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    letterSpacing: '0.5px',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    <Tag size={11} />
                    {selectedProperty.property_type}
                  </div>
                )}
              </div>

              {/* ── Thumbnail strip ── */}
              {images.length > 1 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#0d0d0d',
                  overflowX: 'auto',
                  flexShrink: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {images.map((img: string, i: number) => (
                    <div
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      style={{
                        width: '64px',
                        height: '44px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: i === activeImageIndex
                          ? '2px solid #c9a84c'
                          : '2px solid transparent',
                        opacity: i === activeImageIndex ? 1 : 0.5,
                        transition: 'opacity 0.2s, border-color 0.2s',
                      }}
                    >
                      <img
                        src={img}
                        alt={`thumb-${i}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://picsum.photos/seed/property${selectedProperty?.id ?? 0}thumb${i}/64/44.jpg`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Scrollable content body ── */}
              <div style={{ overflowY: 'auto', padding: '28px 28px 32px', flex: 1 }}>

                {/* Title + price row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ color: '#f0ece4', fontSize: '22px', margin: '0 0 6px 0', fontWeight: '600', letterSpacing: '-0.3px' }}>
                      {selectedProperty.title}
                    </h2>
                    <div style={{ color: '#9f9587', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} />
                      {selectedProperty.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '26px', color: '#c9a84c', fontWeight: '600', lineHeight: 1 }}>
                      {formatCurrency(selectedProperty.price)}
                    </div>
                    {selectedProperty.property_type === 'rental' && (
                      <div style={{ fontSize: '12px', color: '#9f9587', marginTop: '4px' }}>/month</div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

                {/* Stats row */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '24px',
                }}>
                  {[
                    selectedProperty.bedrooms && { icon: <Bed size={15} />, label: `${selectedProperty.bedrooms} Bedroom${selectedProperty.bedrooms !== 1 ? 's' : ''}` },
                    selectedProperty.bathrooms && { icon: <Bath size={15} />, label: `${selectedProperty.bathrooms} Bathroom${selectedProperty.bathrooms !== 1 ? 's' : ''}` },
                    selectedProperty.area && { icon: <Square size={15} />, label: `${selectedProperty.area} sqm` },
                  ].filter(Boolean).map((stat: any, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        color: '#c4bdb3',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ color: '#c9a84c' }}>{stat.icon}</span>
                      {stat.label}
                    </div>
                  ))}
                </div>

                {/* Description */}
                {selectedProperty.description && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#9f9587', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '600' }}>
                      About this property
                    </div>
                    <p style={{ color: '#c4bdb3', lineHeight: '1.75', fontSize: '14px', margin: 0 }}>
                      {selectedProperty.description}
                    </p>
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