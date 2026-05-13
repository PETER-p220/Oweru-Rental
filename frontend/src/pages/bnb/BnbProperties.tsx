import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Download, Eye, Edit, Plus,
  Bed, Bath, Users, Star, MapPin, Wifi, Car,
  Dumbbell, Wind, Utensils, Monitor, Tv, Shirt,
  Home, RefreshCw, ImageIcon, CheckCircle, AlertCircle,
  XCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import Api from '../../services/api';

/* ─── TOKENS ─────────────────────────────────────────── */
const t = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark:   '#080808',
  dark2:  '#0e0e0e',
  dark3:  '#141414',
  cream:  '#e8e4dc',
  muted:  '#7a7060',
  border: 'rgba(201,168,76,0.12)',
  green:  '#10b981',
  red:    '#ef4444',
  blue:   '#38bdf8',
  orange: '#f59e0b',
} as const;

const body: React.CSSProperties   = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties  = { fontFamily: 'Cormorant Garamond, Georgia, serif' };
const card: React.CSSProperties   = { backgroundColor: t.dark3, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' };
const btn: React.CSSProperties    = { ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s' };

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace('/api', '');

/* ─── IMAGE UTILITIES ───────────────────────────────── */
const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23141414'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='DM Sans' font-size='18' fill='%23c9a84c'%3ENo Image%3C/text%3E%3C/svg%3E`;

function resolveUrl(path: string): string {
  if (!path?.trim()) return PLACEHOLDER;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage/')) return `${BASE}${path}`;
  if (path.startsWith('storage/'))  return `${BASE}/${path}`;
  if (path.startsWith('/'))         return `${BASE}${path}`;
  return `${BASE}/storage/${path}`;
}

/** Returns all resolved image URLs from any property shape */
function getAllImages(property: any): string[] {
  const imgs: string[] = [];

  // snake_case: property_images[].image_path | .url
  for (const src of [property?.property_images, property?.propertyImages]) {
    if (Array.isArray(src) && src.length) {
      // primary first
      const sorted = [...src].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      for (const i of sorted) {
        const p = i?.image_path ?? i?.url ?? '';
        if (p) imgs.push(resolveUrl(p));
      }
      if (imgs.length) return imgs;
    }
  }

  // plain images[]
  if (Array.isArray(property?.images) && property.images.length) {
    for (const i of property.images) {
      const p = typeof i === 'string' ? i : (i?.image_path ?? i?.url ?? '');
      if (p) imgs.push(resolveUrl(p));
    }
    if (imgs.length) return imgs;
  }

  return [PLACEHOLDER];
}

function getPrimaryImage(property: any): string {
  return getAllImages(property)[0];
}

/* ─── LAZY IMAGE ────────────────────────────────────── */
function LazyImg({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        ref.current!.src = src;
        obs.disconnect();
      }
    }, { rootMargin: '200px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [src]);

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* skeleton */}
      {!loaded && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, ${t.dark3} 25%, #1e1e1e 50%, ${t.dark3} 75%)`,
          backgroundSize: '400% 100%',
          animation: 'shimmer 1.4s ease infinite',
          borderRadius: 'inherit',
        }} />
      )}
      {error ? (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: t.dark3, borderRadius: 'inherit',
        }}>
          <ImageIcon size={32} style={{ color: t.muted }} />
        </div>
      ) : (
        <img
          ref={ref}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            borderRadius: 'inherit',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            display: 'block',
          }}
        />
      )}
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ─── IMAGE CAROUSEL ────────────────────────────────── */
function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0 || images[0] === PLACEHOLDER) {
    return (
      <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.dark3, border: `2px dashed ${t.border}`, borderRadius: 8 }}>
        <ImageIcon size={40} style={{ color: t.muted }} />
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', height: 220, borderRadius: 8, overflow: 'hidden' }}>
      <LazyImg src={images[idx]} alt={`${title} ${idx + 1}`} style={{ width: '100%', height: 220, borderRadius: 8 }} />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} />
          </button>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {images.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? t.gold : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── SKELETON CARD ─────────────────────────────────── */
function SkeletonCard() {
  const shimmer = { background: `linear-gradient(90deg, ${t.dark3} 25%, #1e1e1e 50%, ${t.dark3} 75%)`, backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', borderRadius: 6 } as React.CSSProperties;
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ ...shimmer, height: 220, marginBottom: 16, borderRadius: 8 }} />
      <div style={{ ...shimmer, height: 20, width: '70%', marginBottom: 10 }} />
      <div style={{ ...shimmer, height: 14, width: '50%', marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        {[1,2,3].map(i => <div key={i} style={{ ...shimmer, height: 14, width: 60 }} />)}
      </div>
      <div style={{ ...shimmer, height: 14, width: '90%', marginBottom: 6 }} />
      <div style={{ ...shimmer, height: 14, width: '75%', marginBottom: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...shimmer, height: 24, width: 100 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ ...shimmer, height: 32, width: 32, borderRadius: 6 }} />
          <div style={{ ...shimmer, height: 32, width: 32, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── HELPERS ───────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });

const statusColor = (s: string) => ({ available: t.green, occupied: t.red, maintenance: t.orange }[s] ?? t.muted);
const StatusIcon = ({ s }: { s: string }) => s === 'available' ? <CheckCircle size={14}/> : s === 'occupied' ? <XCircle size={14}/> : <AlertCircle size={14}/>;

const amenityIcon = (a: string) => {
  const icons: Record<string, JSX.Element> = { wifi: <Wifi size={13}/>, parking: <Car size={13}/>, gym: <Dumbbell size={13}/>, kitchen: <Utensils size={13}/>, workspace: <Monitor size={13}/>, tv: <Tv size={13}/>, washer: <Shirt size={13}/>, ac: <Wind size={13}/> };
  return icons[a.toLowerCase()] ?? <Star size={13}/>;
};

/* ─── MAIN COMPONENT ────────────────────────────────── */
export default function BnbProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebounce(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]     = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      const res = await Api.getBnbProperties(filters);
      setProperties(res.data || []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const csv = [
      ['ID','Title','Location','Price','Bedrooms','Bathrooms','Max Guests','Status','Rating'],
      ...properties.map((p: any) => [p.id, p.title, p.location, p.price, p.bedrooms, p.bathrooms, p.bnb_details?.max_guests ?? p.max_guests ?? 2, p.status, p.average_rating ?? 'N/A'])
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `bnb-properties-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', ...body }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 6px' }}>BNB Properties</h1>
          <p style={{ fontSize: 15, color: t.muted, margin: 0 }}>
            {loading ? 'Loading…' : `${properties.length} listing${properties.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowAdd(true)} style={{ ...btn, backgroundColor: t.gold, color: t.dark }}><Plus size={15}/>Add Property</button>
          <button onClick={handleExport}           style={{ ...btn, backgroundColor: `${t.green}20`, color: t.green }}><Download size={15}/>Export</button>
          <button onClick={load}                   style={{ ...btn, backgroundColor: `${t.blue}20`, color: t.blue }}><RefreshCw size={15}/>Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search properties…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ ...body, width: '100%', padding: '9px 12px 9px 36px', backgroundColor: '#0e0e0e', border: `1px solid ${t.border}`, borderRadius: 8, color: t.cream, fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...body, padding: '9px 12px', backgroundColor: '#0e0e0e', border: `1px solid ${t.border}`, borderRadius: 8, color: t.cream, fontSize: 14 }}>
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 22 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : properties.length === 0 ? (
          <div style={{ ...card, gridColumn: '1/-1', textAlign: 'center', padding: 60, animation: 'fadeIn 0.4s ease' }}>
            <Home size={48} style={{ color: t.muted, marginBottom: 16 }} />
            <div style={{ ...serif, fontSize: 20, color: t.cream, marginBottom: 8 }}>No properties found</div>
            <div style={{ color: t.muted, marginBottom: 24 }}>Start by adding your first listing</div>
            <button onClick={() => setShowAdd(true)} style={{ ...btn, backgroundColor: t.gold, color: t.dark }}><Plus size={15}/>Add Property</button>
          </div>
        ) : (
          properties.map((p: any) => (
            <PropertyCard key={p.id} property={p} onView={() => { setSelected(p); setShowDetails(true); }} />
          ))
        )}
      </div>

      {/* Detail modal */}
      {showDetails && selected && (
        <DetailModal property={selected} onClose={() => setShowDetails(false)} />
      )}

      {/* Add modal */}
      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load(); }} />
      )}
    </div>
  );
}

/* ─── PROPERTY CARD ─────────────────────────────────── */
function PropertyCard({ property: p, onView }: { property: any; onView: () => void }) {
  const images = getAllImages(p);
  const enabledAmenities = p.bnb_details?.amenities_bnb
    ? Object.entries(p.bnb_details.amenities_bnb).filter(([_, v]) => v).map(([k]) => k)
    : (p.amenities ?? []);

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.35s ease' }}>
      {/* Image + badges */}
      <div style={{ position: 'relative', padding: 12, paddingBottom: 0 }}>
        <ImageCarousel images={images} title={p.title} />

        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', backgroundColor: `${statusColor(p.status)}1a`, border: `1px solid ${statusColor(p.status)}40`, borderRadius: 20, color: statusColor(p.status), fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <StatusIcon s={p.status} />{p.status}
        </div>

        {p.average_rating && (
          <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 20, color: t.gold, fontSize: 12, fontWeight: 600 }}>
            <Star size={12} fill={t.gold}/>{p.average_rating.toFixed(1)}
          </div>
        )}

        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 8, right: 20, fontSize: 11, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', padding: '2px 7px', borderRadius: 10 }}>
            {images.length} photos
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 14px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0, lineHeight: 1.25 }}>{p.title}</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.muted, fontSize: 13 }}>
          <MapPin size={13}/>{p.location}
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { icon: <Bed size={13}/>, label: `${p.bedrooms} bed${p.bedrooms !== 1 ? 's' : ''}` },
            { icon: <Bath size={13}/>, label: `${p.bathrooms} bath${p.bathrooms !== 1 ? 's' : ''}` },
            { icon: <Users size={13}/>, label: `${p.bnb_details?.max_guests ?? p.max_guests ?? 2} guests` },
          ].map(({ icon, label }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: t.cream, fontSize: 13 }}>
              <span style={{ color: t.muted }}>{icon}</span>{label}
            </div>
          ))}
        </div>

        {enabledAmenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {enabledAmenities.slice(0, 4).map((a: string) => (
              <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', backgroundColor: `${t.gold}18`, border: `1px solid ${t.gold}30`, borderRadius: 5, fontSize: 11, color: t.goldLt }}>
                {amenityIcon(a)}{a}
              </span>
            ))}
            {enabledAmenities.length > 4 && (
              <span style={{ padding: '3px 8px', backgroundColor: `${t.border}`, borderRadius: 5, fontSize: 11, color: t.muted }}>+{enabledAmenities.length - 4}</span>
            )}
          </div>
        )}

        <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.description}
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${t.border}`, marginTop: 4 }}>
        <div>
          <div style={{ ...serif, fontSize: 20, fontWeight: 700, color: t.gold }}>{fmt(p.price)}</div>
          <div style={{ fontSize: 11, color: t.muted }}>per night</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onView} style={{ ...btn, padding: '7px 14px', backgroundColor: `${t.blue}18`, color: t.blue, fontSize: 13 }}><Eye size={14}/>View</button>
          <button style={{ ...btn, padding: '7px 10px', backgroundColor: `${t.gold}18`, color: t.gold, fontSize: 13 }}><Edit size={14}/></button>
        </div>
      </div>
    </div>
  );
}

/* ─── DETAIL MODAL ──────────────────────────────────── */
function DetailModal({ property: p, onClose }: { property: any; onClose: () => void }) {
  const images = getAllImages(p);
  const [imgIdx, setImgIdx] = useState(0);
  const enabledAmenities = p.bnb_details?.amenities_bnb
    ? Object.entries(p.bnb_details.amenities_bnb).filter(([_, v]) => v).map(([k]) => k)
    : (p.amenities ?? []);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ ...card, maxWidth: 860, width: '100%', maxHeight: '88vh', overflowY: 'auto', animation: 'fadeIn 0.25s ease' }}>
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, backgroundColor: t.dark3, zIndex: 1 }}>
          <div>
            <h2 style={{ ...serif, fontSize: 22, fontWeight: 600, color: t.cream, margin: 0 }}>{p.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.muted, fontSize: 13, marginTop: 4 }}><MapPin size={13}/>{p.location}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}><XCircle size={22}/></button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Gallery */}
          {images[0] !== PLACEHOLDER && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ position: 'relative', height: 320, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                <LazyImg src={images[imgIdx]} alt={p.title} style={{ width: '100%', height: 320, borderRadius: 10 }} />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i-1+images.length)%images.length)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18}/></button>
                    <button onClick={() => setImgIdx(i => (i+1)%images.length)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18}/></button>
                    <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, padding: '3px 9px', borderRadius: 12 }}>{imgIdx+1}/{images.length}</div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {images.map((img, i) => (
                    <div key={i} onClick={() => setImgIdx(i)} style={{ flexShrink: 0, width: 72, height: 52, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === imgIdx ? t.gold : 'transparent'}`, transition: 'border-color 0.2s' }}>
                      <LazyImg src={img} alt="" style={{ width: 72, height: 52, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Price', value: `${fmt(p.price)}/night` },
              { label: 'Status', value: <span style={{ color: statusColor(p.status), display: 'flex', alignItems: 'center', gap: 5 }}><StatusIcon s={p.status}/>{p.status}</span> },
              { label: 'Bedrooms', value: `${p.bedrooms}` },
              { label: 'Bathrooms', value: `${p.bathrooms}` },
              { label: 'Max Guests', value: `${p.bnb_details?.max_guests ?? p.max_guests ?? 2}` },
              { label: 'Min Stay', value: `${p.bnb_details?.min_stay ?? p.min_stay ?? 1} nights` },
              { label: 'Check-in', value: p.bnb_details?.check_in_time ?? p.check_in_time ?? '15:00' },
              { label: 'Check-out', value: p.bnb_details?.check_out_time ?? p.check_out_time ?? '11:00' },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: t.dark2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, color: t.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: 14, color: t.cream, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {enabledAmenities.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 10px' }}>Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {enabledAmenities.map((a: string) => (
                  <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: `${t.gold}18`, border: `1px solid ${t.gold}30`, borderRadius: 8, fontSize: 13, color: t.goldLt }}>
                    {amenityIcon(a)}{a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 8px' }}>Description</h3>
            <p style={{ color: t.cream, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{p.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ADD MODAL ─────────────────────────────────────── */
function AddModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', location: '', address: '', type: 'apartment', bedrooms: '1', bathrooms: '1', max_guests: '2', min_stay: '1', check_in_time: '15:00', check_out_time: '11:00', instant_book: false, amenities: [] as string[] });
  const [files, setFiles]       = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const set = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valid = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    setPreviews(p => [...p, ...valid.map(f => URL.createObjectURL(f))]);
    setFiles(f => [...f, ...valid]);
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setPreviews(p => p.filter((_, j) => j !== i));
    setFiles(f => f.filter((_, j) => j !== i));
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim())       errs.title       = 'Required';
    if (!form.description.trim()) errs.description = 'Required';
    if (!form.price || +form.price <= 0) errs.price = 'Enter a valid price';
    if (!form.location.trim())    errs.location    = 'Required';
    if (!form.address.trim())     errs.address     = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      let images: string[] = [];
      if (files.length) {
        const fd = new FormData();
        files.forEach(f => fd.append('images[]', f));
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, Accept: 'application/json' },
          body: fd,
        });
        if (res.ok) {
          const j = await res.json();
          images = j.images.map((i: any) => i.url);
        }
      }
      await Api.createBnbProperty({ ...form, price: +form.price, bedrooms: +form.bedrooms, bathrooms: +form.bathrooms, max_guests: +form.max_guests, min_stay: +form.min_stay, images });
      onSuccess();
    } catch (err: any) {
      setErrors(err?.response?.data?.errors ?? { submit: 'Failed to create property. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    ...body, width: '100%', padding: '10px 12px', backgroundColor: t.dark3, border: `1px solid ${t.border}`,
    borderRadius: 8, color: t.cream, fontSize: 14, boxSizing: 'border-box', ...style,
  });
  const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: t.cream };

  const amenityOptions = ['WiFi','Kitchen','Parking','Air Conditioning','Heating','Washer','Dryer','TV','Workspace','Pool','Gym','Pet Friendly'];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: t.dark2, borderRadius: 14, padding: 28, maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', width: '100%', border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ ...serif, fontSize: 22, color: t.gold, margin: 0 }}>Add New Property</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer' }}><XCircle size={20}/></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={inp({ borderColor: errors.title ? t.red : t.border })} placeholder="e.g. Luxury Beach Villa"/>
            {errors.title && <div style={{ color: t.red, fontSize: 11, marginTop: 3 }}>{errors.title}</div>}
          </div>
          <div>
            <label style={lbl}>Price per Night (TZS) *</label>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={inp({ borderColor: errors.price ? t.red : t.border })} placeholder="50000"/>
            {errors.price && <div style={{ color: t.red, fontSize: 11, marginTop: 3 }}>{errors.price}</div>}
          </div>
          <div>
            <label style={lbl}>Location *</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} style={inp({ borderColor: errors.location ? t.red : t.border })} placeholder="Dar es Salaam, Tanzania"/>
            {errors.location && <div style={{ color: t.red, fontSize: 11, marginTop: 3 }}>{errors.location}</div>}
          </div>
          <div>
            <label style={lbl}>Property Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={inp()}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
              <option value="condo">Condo</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Address *</label>
          <input value={form.address} onChange={e => set('address', e.target.value)} style={inp({ borderColor: errors.address ? t.red : t.border })} placeholder="Full street address"/>
          {errors.address && <div style={{ color: t.red, fontSize: 11, marginTop: 3 }}>{errors.address}</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inp(), resize: 'vertical', borderColor: errors.description ? t.red : t.border } as any} placeholder="Describe your property…"/>
          {errors.description && <div style={{ color: t.red, fontSize: 11, marginTop: 3 }}>{errors.description}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[['Bedrooms','bedrooms','0'],['Bathrooms','bathrooms','0'],['Max Guests','max_guests','1'],['Min Stay (nights)','min_stay','1']].map(([label, key, min]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type="number" min={min} value={(form as any)[key]} onChange={e => set(key, e.target.value)} style={inp()}/>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Check-in Time</label>
            <input type="time" value={form.check_in_time} onChange={e => set('check_in_time', e.target.value)} style={inp()}/>
          </div>
          <div>
            <label style={lbl}>Check-out Time</label>
            <input type="time" value={form.check_out_time} onChange={e => set('check_out_time', e.target.value)} style={inp()}/>
          </div>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Property Images</label>
          <input type="file" multiple accept="image/*" id="img-up" onChange={addFiles} style={{ display: 'none' }}/>
          <label htmlFor="img-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px', border: `2px dashed ${t.border}`, borderRadius: 8, cursor: 'pointer', backgroundColor: `${t.gold}08`, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold; e.currentTarget.style.backgroundColor = `${t.gold}12`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.backgroundColor = `${t.gold}08`; }}>
            <ImageIcon size={28} style={{ color: t.gold, marginBottom: 6 }}/>
            <div style={{ color: t.cream, fontSize: 13, fontWeight: 500 }}>Click to upload images</div>
            <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>JPG, PNG, GIF — max 5MB each</div>
          </label>
          {previews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginTop: 10 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', height: 70 }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <button type="button" onClick={() => removeFile(i)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 18, height: 18, color: '#fff', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amenities */}
        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Amenities</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {amenityOptions.map(a => (
              <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: t.cream }}>
                <input type="checkbox" checked={form.amenities.includes(a)} onChange={e => set('amenities', e.target.checked ? [...form.amenities, a] : form.amenities.filter(x => x !== a))} style={{ accentColor: t.gold }}/>
                {a}
              </label>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 13, color: t.cream }}>
          <input type="checkbox" checked={form.instant_book} onChange={e => set('instant_book', e.target.checked)} style={{ accentColor: t.gold }}/>
          Enable Instant Booking
        </label>

        {errors.submit && (
          <div style={{ backgroundColor: `${t.red}18`, border: `1px solid ${t.red}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: t.red, fontSize: 13 }}>{errors.submit}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btn, backgroundColor: 'transparent', border: `1px solid ${t.border}`, color: t.cream }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ ...btn, backgroundColor: t.gold, color: t.dark, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating…' : 'Create Property'}
          </button>
        </div>
      </div>
    </div>
  );
}