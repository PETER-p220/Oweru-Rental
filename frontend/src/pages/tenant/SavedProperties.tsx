import { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Bed, Bath, Square, ChevronLeft, ChevronRight, Tag, Bookmark, Search, Heart } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, headingStyle,
  inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle,
} from './tenantPageStyles';

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
  const [selectedProperty, setSelectedProperty]   = useState<any>(null);
  const [showModal, setShowModal]                 = useState(false);
  const [activeImageIndex, setActiveImageIndex]   = useState(0);

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

  const getImage = (property: any): string => {
    const id = property?.id ?? 0;
    return property?.images?.length ? resolveImage(property.images[0], id) : `https://picsum.photos/seed/property${id}/400/300.jpg`;
  };

  const getImages = (property: any): string[] => {
    const id = property?.id ?? 0;
    return property?.images?.length
      ? property.images.map((img: string) => resolveImage(img, id))
      : [`https://picsum.photos/seed/property${id}/800/500.jpg`];
  };

  const openProperty = (property: any) => { setSelectedProperty(property); setActiveImageIndex(0); setShowModal(true); };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.blue600}, transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.blue600, display: 'inline-block' }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Saved Properties</h1>
            <p style={descriptionStyle}>Properties saved from your tenant account.</p>
          </div>
          {items.length > 0 && (
            <div style={{ padding: '10px 18px', borderRadius: '12px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', color: palette.blue600, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={14} /> {items.length} Saved
            </div>
          )}
        </div>
        <div style={{ marginTop: '20px', maxWidth: '360px', position: 'relative' as const }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: palette.gray400 }} />
          <input style={{ ...inputStyle, paddingLeft: '36px', borderRadius: '12px' }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved properties…" />
        </div>
      </section>

      {/* Cards */}
      <section style={{ ...panelStyle }}>
        {error && <div style={{ color: '#f87171', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.blue600}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading saved properties...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: palette.gray400 }}>
            <Heart size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '16px' }}>No saved properties</div>
            <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '6px' }}>Browse properties and save your favorites.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.map(({ id, property }) => (
              <div key={id} style={{
                padding: '16px', borderRadius: '16px',
                background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.08)',
                display: 'grid', gridTemplateColumns: '88px 1fr auto auto',
                gap: '16px', alignItems: 'center',
                transition: 'border-color 0.18s, background 0.18s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245,158,11,0.2)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.08)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.5)'; }}
              >
                {/* Thumbnail */}
                <div style={{ width: 88, height: 66, borderRadius: '10px', overflow: 'hidden', background: palette.slate700, flexShrink: 0 }}>
                  <img src={getImage(property)} alt={property?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/property${property?.id ?? id}/400/300.jpg`; }} />
                </div>

                {/* Info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: palette.white, marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {property?.title || 'Untitled property'}
                  </div>
                  <div style={{ color: palette.gray500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                    <MapPin size={11} /> {property?.location || 'No location'}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', color: palette.gray500, fontSize: '12px' }}>
                    {property?.bedrooms && <><Bed size={10} /> {property.bedrooms} bed</>}
                    {property?.bathrooms && <><Bath size={10} /> {property.bathrooms} bath</>}
                    {property?.area && <><Square size={10} /> {property.area} sqm</>}
                  </div>
                </div>

                {/* Price */}
                <div style={{ fontWeight: 700, color: palette.blue600, fontSize: '17px', letterSpacing: '-0.3px', whiteSpace: 'nowrap' as const }}>
                  {formatCurrency(property?.price)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...buttonStyle('primary'), padding: '8px 14px', fontSize: '13px', borderRadius: '10px' }} onClick={() => openProperty(property)}>View</button>
                  <button style={{ ...buttonStyle('danger'), padding: '8px 14px', fontSize: '13px', borderRadius: '10px' }}
                    onClick={() => Api.unsaveProperty(property?.id || id).then(load)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modal ── */}
      {showModal && selectedProperty && (() => {
        const images = getImages(selectedProperty);
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div style={{ backgroundColor: palette.slate800, borderRadius: '24px', maxWidth: '860px', maxHeight: '92vh', width: '100%', border: `1px solid rgba(245,158,11,0.2)`, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>

              {/* Hero image */}
              <div style={{ position: 'relative' as const, height: '340px', background: palette.slate900, flexShrink: 0 }}>
                <img src={images[activeImageIndex]} alt={selectedProperty.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/property${selectedProperty?.id ?? 0}/800/500.jpg`; }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />

                {/* Close */}
                <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <X size={16} />
                </button>

                {/* Carousel */}
                {images.length > 1 && (
                  <>
                    {[{ dir: 'prev', icon: ChevronLeft, side: 'left' as const }, { dir: 'next', icon: ChevronRight, side: 'right' as const }].map(({ dir, icon: Icon, side }) => (
                      <button key={dir} onClick={() => dir === 'prev'
                        ? setActiveImageIndex(i => (i === 0 ? images.length - 1 : i - 1))
                        : setActiveImageIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                        style={{ position: 'absolute', [side]: 14, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <Icon size={18} />
                      </button>
                    ))}
                    <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '4px 10px', color: '#fff', fontSize: '12px' }}>
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}

                {selectedProperty.property_type && (
                  <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.35)', borderRadius: '20px', padding: '4px 12px', color: palette.blue600, fontSize: '12px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)' }}>
                    <Tag size={11} /> {selectedProperty.property_type}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', background: palette.gray900, overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {images.map((img: string, i: number) => (
                    <div key={i} onClick={() => setActiveImageIndex(i)} style={{ width: 64, height: 44, borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: `2px solid ${i === activeImageIndex ? palette.blue600 : 'transparent'}`, opacity: i === activeImageIndex ? 1 : 0.45, transition: 'all 0.2s' }}>
                      <img src={img} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Body */}
              <div style={{ overflowY: 'auto', padding: '28px 28px 32px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ color: palette.gray800, fontSize: '22px', margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.3px' }}>{selectedProperty.title}</h2>
                    <div style={{ color: palette.gray500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={13} /> {selectedProperty.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', color: palette.blue600, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px' }}>{formatCurrency(selectedProperty.price)}</div>
                    <div style={{ fontSize: '12px', color: palette.gray500, marginTop: '4px' }}>/month</div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(148,163,184,0.08)', margin: '20px 0' }} />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {[
                    selectedProperty.bedrooms  && { icon: <Bed size={14} />,    label: `${selectedProperty.bedrooms} Bed${selectedProperty.bedrooms !== 1 ? 's' : ''}` },
                    selectedProperty.bathrooms && { icon: <Bath size={14} />,   label: `${selectedProperty.bathrooms} Bath${selectedProperty.bathrooms !== 1 ? 's' : ''}` },
                    selectedProperty.area      && { icon: <Square size={14} />, label: `${selectedProperty.area} sqm` },
                  ].filter(Boolean).map((stat: any, i) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', padding: '8px 14px', color: palette.white, fontSize: '13px' }}>
                      <span style={{ color: palette.blue600 }}>{stat.icon}</span> {stat.label}
                    </div>
                  ))}
                </div>

                {selectedProperty.description && (
                  <div>
                    <div style={{ fontSize: '10px', color: palette.gray400, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '10px', fontWeight: 600 }}>About this property</div>
                    <p style={{ color: palette.gray400, lineHeight: 1.75, fontSize: '14px', margin: 0 }}>{selectedProperty.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SavedProperties;