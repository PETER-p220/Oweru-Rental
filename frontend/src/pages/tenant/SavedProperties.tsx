import { useEffect, useMemo, useState } from 'react';
import {
  X, MapPin, Bed, Bath, Square,
  ChevronLeft, ChevronRight, Bookmark, Search, Heart,
} from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency } from './tenantPageStyles';

// ── Design tokens — 1:1 with landlord_dashboard.dart kSlate* system
const C = {
  pageBg:    '#F1F5F9',   // kPageBg / kSlate100
  headerBg:  '#1E293B',   // kHeaderBg / kSlate800
  cardBg:    '#FFFFFF',   // kCardBg
  border:    '#E2E8F0',   // kBorder / kSlate200
  text:      '#0F172A',   // kSlate900
  textSub:   '#475569',   // kSlate600
  textMuted: '#94A3B8',   // kSlate400
  textLight: '#CBD5E1',   // kSlate300 (on dark bg)
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate500:  '#64748B',
  slate800:  '#1E293B',
  // Gold — CTA buttons, price text, accent labels ONLY
  gold:      '#C89128',
  goldPale:  'rgba(200,145,40,0.10)',
  goldBorder:'rgba(200,145,40,0.28)',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  // Semantic
  green:     '#16A34A', greenBg:  '#DCFCE7',
  red:       '#DC2626', redBg:    '#FEF2F2',
};

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

  const filtered = useMemo(() => items.filter(({ property }) =>
    `${property?.title || ''} ${property?.location || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  const getImage  = (p: any) => p?.images?.length ? resolveImage(p.images[0], p?.id ?? 0) : `https://picsum.photos/seed/property${p?.id ?? 0}/400/300.jpg`;
  const getImages = (p: any): string[] => p?.images?.length ? p.images.map((img: string) => resolveImage(img, p?.id ?? 0)) : [`https://picsum.photos/seed/property${p?.id ?? 0}/800/500.jpg`];

  const openProperty = (property: any) => { setSelectedProperty(property); setActiveImageIndex(0); setShowModal(true); };

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif', background: C.pageBg, color: C.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        .sp-card { transition: box-shadow 0.15s, transform 0.15s; }
        .sp-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.10) !important; transform: translateY(-1px); }
        .sp-btn-view:hover  { opacity: 0.88; }
        .sp-btn-rem:hover   { opacity: 0.88; }
        .sp-nav:hover       { background: rgba(0,0,0,0.72) !important; }
        .sp-close:hover     { background: rgba(0,0,0,0.80) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.slate200}; border-radius: 4px; }
      `}</style>

      {/* ══ Slate-800 header — matches kHeaderBg ══ */}
      <div style={{ background: C.headerBg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            {/* Eyebrow — gold badge on dark header */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px', background: C.goldPale, border: `1px solid ${C.goldBorder}`, borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>
              Tenant Workspace
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Saved Properties
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
              Properties saved from your tenant account.
            </p>
          </div>
          {/* Count badge — white pill on dark header */}
          {items.length > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: C.goldPale, border: `1px solid ${C.goldBorder}`, borderRadius: 8, color: C.gold, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
              <Bookmark size={13} /> {items.length} Saved
            </div>
          )}
        </div>
      </div>

      {/* ══ Body ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* Error */}
        {error && (
          <div style={{ background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: C.red, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Search bar — white card ── */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search saved properties…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.text, fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Saved listings card ── */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>

          {/* Card header */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {/* Section label — gold eyebrow */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>
                Saved Listings
              </div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Your Favourites</h2>
            </div>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMuted, padding: '40px 20px' }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Heart size={26} style={{ color: C.gold, opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No saved properties</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Properties you save will appear here.</div>
            </div>
          ) : (
            <div>
              {filtered.map(({ id, property }, idx) => (
                <div key={id} className="sp-card" style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                  background: C.cardBg,
                }}>
                  {/* Thumbnail — matches ClipRRect in Dart */}
                  <div style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.slate100, border: `1px solid ${C.border}` }}>
                    <img src={getImage(property)} alt={property?.title || 'Property'} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {property?.title || 'Untitled property'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textMuted, fontSize: 12 }}>
                      <MapPin size={11} style={{ flexShrink: 0 }} />
                      {property?.location || 'No location'}
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, letterSpacing: '-0.01em' }}>
                      {formatCurrency(property?.price)}
                    </div>
                    {/* View — gold CTA */}
                    <button className="sp-btn-view" onClick={() => openProperty(property)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', background: C.gold, border: 'none',
                      borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', letterSpacing: '0.02em',
                      boxShadow: C.goldGlow,
                    }}>
                      View
                    </button>
                    {/* Remove — danger outline */}
                    <button className="sp-btn-rem"
                      onClick={() => Api.unsaveProperty(property?.id || id).then(load)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', background: C.redBg,
                        border: `1px solid rgba(220,38,38,0.22)`,
                        borderRadius: 8, color: C.red, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: '0.02em',
                      }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Modal — white card on dark overlay ══ */}
      {showModal && selectedProperty && (() => {
        const images = getImages(selectedProperty);
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          >
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14, maxWidth: 820, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,0.28)' }}>

              {/* Image carousel */}
              <div style={{ position: 'relative', height: 'clamp(200px,38vh,320px)', background: C.slate100, flexShrink: 0 }}>
                <img src={images[activeImageIndex]} alt={selectedProperty.title} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                {/* Close */}
                <button className="sp-close" onClick={() => setShowModal(false)}
                  style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <X size={15} />
                </button>

                {/* Carousel nav */}
                {images.length > 1 && (
                  <>
                    <button className="sp-nav"
                      onClick={() => setActiveImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.50)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                      <ChevronLeft size={16} />
                    </button>
                    <button className="sp-nav"
                      onClick={() => setActiveImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.50)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                      <ChevronRight size={16} />
                    </button>
                    {/* Dots */}
                    <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                      {images.map((_, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === activeImageIndex ? C.gold : 'rgba(255,255,255,0.6)', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal body — white card */}
              <div style={{ overflowY: 'auto', padding: '22px 24px 28px', flex: 1 }}>

                {/* Title + price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
                      {selectedProperty.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.textMuted, fontSize: 13 }}>
                      <MapPin size={13} /> {selectedProperty.location}
                    </div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.gold, letterSpacing: '-0.02em', flexShrink: 0 }}>
                    {formatCurrency(selectedProperty.price)}
                  </div>
                </div>

                <div style={{ height: 1, background: C.border, margin: '0 0 18px' }} />

                {/* Spec chips — matches _MetaChip(color:kSlate100) */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                  {selectedProperty.bedrooms && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.textSub }}>
                      <Bed size={13} style={{ color: C.textMuted }} /> {selectedProperty.bedrooms} Bed
                    </div>
                  )}
                  {selectedProperty.bathrooms && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.textSub }}>
                      <Bath size={13} style={{ color: C.textMuted }} /> {selectedProperty.bathrooms} Bath
                    </div>
                  )}
                  {selectedProperty.area && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.textSub }}>
                      <Square size={13} style={{ color: C.textMuted }} /> {selectedProperty.area} m²
                    </div>
                  )}
                  {/* Status chip */}
                  {selectedProperty.available !== undefined && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      background: selectedProperty.available ? '#DCFCE7' : '#DBEAFE',
                      border: `1px solid ${selectedProperty.available ? '#16A34A30' : '#2563EB30'}`,
                      borderRadius: 8, fontSize: 12, fontWeight: 700,
                      color: selectedProperty.available ? '#16A34A' : '#2563EB',
                    }}>
                      {selectedProperty.available ? 'Available' : 'Occupied'}
                    </div>
                  )}
                </div>

                {selectedProperty.description && (
                  <p style={{ color: C.textSub, lineHeight: 1.65, fontSize: 14, margin: 0 }}>
                    {selectedProperty.description}
                  </p>
                )}

                {/* CTA */}
                <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: C.gold, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow }}>
                    Apply Now
                  </button>
                  <button onClick={() => setShowModal(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: C.cardBg, border: `1.5px solid ${C.border}`, borderRadius: 8, color: C.textSub, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SavedProperties;