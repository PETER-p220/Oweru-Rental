import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ArrowRight, ChevronRight,
  Heart, Building, X, Star, Shield, Clock, TrendingUp,
  Home as HomeIcon, Briefcase, Layers,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Api from '../services/api';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

// Strip /api suffix to get storage base, e.g. https://api.oweru.com/api → https://api.oweru.com
const _rawBase     = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_BASE     = _rawBase.endsWith('/') ? _rawBase.slice(0, -1) : _rawBase;
const VITE_STORAGE = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`;
const COMMERCIAL_TYPES = ['office', 'retail', 'warehouse', 'commercial', 'industrial'];

// ── Image URL builder ────────────────────────────────────────────────────────
// Laravel stores files with Storage::disk('public')->store('properties', ...)
// which produces paths like "properties/abc123.jpg" (no leading slash).
// The public disk is symlinked to /storage, so the final URL is:
//   https://yourapi.com/storage/properties/abc123.jpg
//
// VITE_STORAGE = VITE_API_URL with "/api" stripped, e.g. "https://yourapi.com"

const resolveStoragePath = (path: string): string => {
  if (!path?.trim()) return PLACEHOLDER;
  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Strip any accidental leading slashes so we can reason about the path cleanly
  const clean = path.replace(/^\/+/, '');
  // Path already includes "storage/" prefix (e.g. from an old full URL fragment)
  if (clean.startsWith('storage/')) return `${VITE_STORAGE}/${clean}`;
  // Normal case: path = "properties/abc.jpg" → /storage/properties/abc.jpg
  return `${VITE_STORAGE}/storage/${clean}`;
};

// ── Image extractor — handles ALL storage shapes used across the app ─────────
//
// Shape A — publicIndex / store (residential/landlord):
//   property.images = ["properties/abc.jpg"]          (plain string array)
//
// Shape B — storeCommercial:
//   property.images = [{"path":"properties/abc.jpg","is_primary":true}]
//
// Shape C — Commercial PropertyController (propertyImages relation):
//   property.propertyImages = [{"image_path":"properties/abc.jpg","is_primary":1}]
//   (also serialised as property_images by Laravel's snake_case JSON)
//
// BnB: images[] already contains full https:// URLs — resolveStoragePath passes through.

const getImage = (property: any): string => {
  // ── Shape C: separate PropertyImage relation rows ──────────────────────
  // Camelcase (commercial controller with->with('propertyImages'))
  const ci: any[] = property?.propertyImages;
  if (Array.isArray(ci) && ci.length > 0) {
    const img = ci.find(i => i.is_primary == 1 || i.is_primary === true) ?? ci[0];
    const p = img?.image_path ?? img?.path ?? '';
    if (p) return resolveStoragePath(p);
  }
  // Snake_case (Laravel auto-serialisation of same relation)
  const si: any[] = property?.property_images;
  if (Array.isArray(si) && si.length > 0) {
    const img = si.find(i => i.is_primary == 1 || i.is_primary === true) ?? si[0];
    const p = img?.image_path ?? img?.path ?? '';
    if (p) return resolveStoragePath(p);
  }

  // ── Shapes A & B: images JSON column on the Property row ──────────────
  let imgs = property?.images;
  // If the backend returned it as a JSON string (some Laravel versions do this
  // when the cast is missing), parse it first.
  if (typeof imgs === 'string') {
    try { imgs = JSON.parse(imgs); } catch { imgs = null; }
  }
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    // Shape A: plain string  →  "properties/abc.jpg"
    if (typeof first === 'string' && first.trim()) return resolveStoragePath(first);
    // Shape B: object with 'path' key  →  { path: "properties/abc.jpg", is_primary: true }
    const p = first?.path ?? first?.image_path ?? first?.url ?? first?.src ?? '';
    if (p) return resolveStoragePath(p);
  }

  return PLACEHOLDER;
};

const fmtPrice = (price: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

const commercialTypeLabel = (type: string) => {
  const map: Record<string, string> = { office: 'Office', retail: 'Retail', warehouse: 'Warehouse', commercial: 'Commercial', industrial: 'Industrial' };
  return map[type?.toLowerCase()] ?? type ?? 'Commercial';
};

// ── Lazy image — fades in on load, shows immediately if cached ───────────────
const LazyImg = memo(({ src, alt, height }: { src: string; alt: string; height: number }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already cached — complete fires before React mounts the onLoad handler
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setVisible(true);
  }, [src]);

  return (
    <img
      ref={imgRef}
      className="prop-img"
      src={src}
      alt={alt}
      style={{ height, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      loading="lazy"
      decoding="async"
      onLoad={() => setVisible(true)}
      onError={e => {
        const el = e.currentTarget as HTMLImageElement;
        if (el.src !== PLACEHOLDER) el.src = PLACEHOLDER;
        setVisible(true);
      }}
    />
  );
});

/* ── Save Button ── */
const SaveButton = memo(({ saved, onClick }: { saved: boolean; onClick: (e: any) => void }) => (
  <button onClick={onClick} style={{
    padding: '7px 14px', border: `1px solid ${saved ? '#C89128' : 'rgba(200,145,40,0.2)'}`,
    backgroundColor: saved ? '#C89128' : 'transparent',
    color: saved ? '#0F172A' : '#94A3B8',
    fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 6,
    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s', fontFamily: 'inherit',
  }}>
    <Heart size={11} fill={saved ? 'currentColor' : 'none'} />
    {saved ? 'Saved' : 'Save'}
  </button>
));

/* ── Booking Form ── */
const BookingForm = ({ property, onClose, onSuccess }: { property: any; onClose: () => void; onSuccess: () => void }) => {
  const [fd, setFd] = useState({ guest_name: '', guest_email: '', guest_phone: '', check_in: '', check_out: '', special_requests: '' });
  const [loading, setLoading] = useState(false);
  const nights = () => {
    if (!fd.check_in || !fd.check_out) return 0;
    return Math.ceil((new Date(fd.check_out).getTime() - new Date(fd.check_in).getTime()) / 86400000);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/bnb/book`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id, customer_name: fd.guest_name, customer_email: fd.guest_email, customer_phone: fd.guest_phone, check_in: fd.check_in, check_out: fd.check_out, special_requests: fd.special_requests, total_amount: nights() * (property.price || 0), status: 'pending' }),
      });
      if (res.ok) onSuccess(); else { const d = await res.json(); alert(d.message || 'Failed'); }
    } catch { alert('Network error.'); } finally { setLoading(false); }
  };
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#0F172A', border: '1px solid rgba(200,145,40,0.2)', color: '#F8F8F9', borderRadius: 8, fontSize: 13, marginBottom: 10, outline: 'none', fontFamily: 'inherit' };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 8 }}><X size={20} /></button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ color: '#F8F8F9', marginBottom: 4, fontSize: 20, fontWeight: 700, fontFamily: 'inherit' }}>Book {property.title}</h2>
        <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 18 }}>{property.location}</p>
        <input required style={inp} placeholder="Your name" value={fd.guest_name} onChange={e => setFd(p => ({ ...p, guest_name: e.target.value }))} />
        <input required type="email" style={inp} placeholder="Email" value={fd.guest_email} onChange={e => setFd(p => ({ ...p, guest_email: e.target.value }))} />
        <input required style={inp} placeholder="Phone" value={fd.guest_phone} onChange={e => setFd(p => ({ ...p, guest_phone: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input required type="date" style={inp} value={fd.check_in} onChange={e => setFd(p => ({ ...p, check_in: e.target.value }))} />
          <input required type="date" style={inp} value={fd.check_out} onChange={e => setFd(p => ({ ...p, check_out: e.target.value }))} />
        </div>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} placeholder="Special requests (optional)" value={fd.special_requests} onChange={e => setFd(p => ({ ...p, special_requests: e.target.value }))} />
        {nights() > 0 && (
          <div style={{ background: 'rgba(200,145,40,0.08)', border: '1px solid rgba(200,145,40,0.2)', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#C89128' }}>TZS {(nights() * property.price).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>{nights()} nights</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, background: 'transparent', color: '#94A3B8', border: '1px solid rgba(200,145,40,0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: 12, background: 'linear-gradient(135deg,#C89128,#E6A830)', color: '#0F172A', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Submitting…' : 'Book Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();

  const [allProperties,        setAllProperties]        = useState<any[]>([]);
  const [bnbProperties,        setBnbProperties]        = useState<any[]>([]);
  const [oweruProperties,      setOweruProperties]      = useState<any[]>([]);
  const [commercialProperties, setCommercialProperties] = useState<any[]>([]);

  const [loading,           setLoading]           = useState(true);
  const [bnbLoading,        setBnbLoading]        = useState(true);
  const [oweruLoading,      setOweruLoading]      = useState(true);
  const [commercialLoading, setCommercialLoading] = useState(true);

  const [savedProperties,  setSavedProperties]  = useState<Set<number>>(new Set());
  const [showBookingModal, setShowBookingModal]  = useState(false);
  const [selectedProperty, setSelectedProperty]  = useState<any>(null);

  // ── Search state (search card only) ──────────────────────────────────────
  const [searchTerm,    setSearchTerm]    = useState('');
  const [searchSection, setSearchSection] = useState('all');
  const [priceRange,    setPriceRange]    = useState('');
  const [searchActive,  setSearchActive]  = useState(false);

  const [navVisible,    setNavVisible]    = useState(false);
  const [activeSection, setActiveSection] = useState('residential');
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = ['residential', 'bnb', 'oweru', 'commercial'];
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveSection(id); }, { threshold: 0.25 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  // ── Optimized: fetch residential first, then defer secondary sections ─────
  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    // 1. Residential first — hero content, highest priority
    setLoading(true);
    try {
      const r1 = await fetch(`${API_BASE}/api/public/properties?per_page=12`, { headers: { Accept: 'application/json' } });
      if (r1.ok) {
        const d = await r1.json();
        const raw: any[] = d?.data?.data ?? d?.data ?? (Array.isArray(d) ? d : []);
        setAllProperties(raw.filter(p => !COMMERCIAL_TYPES.includes(p.type?.toLowerCase?.())));
      }
    } catch (err) { console.error('Residential load error:', err); }
    finally { setLoading(false); }

    // 2. BnB + Oweru + Commercial in parallel (deferred)
    Promise.all([
      fetch(`${API_BASE}/api/public/bnb`,                    { headers: { Accept: 'application/json' } }),
      fetch(`${API_BASE}/api/public/properties?type=oweru_rental&per_page=8`, { headers: { Accept: 'application/json' } }),
      fetch(`${API_BASE}/api/public/properties?per_page=12`, { headers: { Accept: 'application/json' } }),
    ]).then(async ([r2, r3, r4]) => {
      // publicBnbIndex returns a plain array (not wrapped in {data:[]})
      if (r2.ok) { const d = await r2.json(); setBnbProperties(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])); }
      setBnbLoading(false);

      if (r3.ok) { const d = await r3.json(); setOweruProperties(Array.isArray(d?.data) ? d.data : (d?.data?.data ?? [])); }
      setOweruLoading(false);

      if (r4.ok) {
        const d = await r4.json();
        const raw: any[] = d?.data?.data ?? d?.data ?? (Array.isArray(d) ? d : []);
        setCommercialProperties(raw.filter(p => COMMERCIAL_TYPES.includes(p.type?.toLowerCase?.())));
      }
      setCommercialLoading(false);
    }).catch(err => {
      console.error('Secondary load error:', err);
      setBnbLoading(false); setOweruLoading(false); setCommercialLoading(false);
    });

    // 3. Saved properties — non-critical
    loadSavedProperties();
  };

  const loadSavedProperties = async () => {
    try {
      const res = await Api.getSavedProperties();
      const ids = (Array.isArray(res.data) ? res.data : []).map((item: any) => item.property?.id ?? item.id).filter(Boolean);
      setSavedProperties(new Set(ids));
    } catch { /* silent */ }
  };

  const handleSaveProperty = useCallback(async (e: any, propertyId: number) => {
    e.stopPropagation();
    try {
      if (savedProperties.has(propertyId)) {
        await Api.unsaveProperty(propertyId).catch(() => Api.publicUnsaveProperty(propertyId));
        setSavedProperties(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
      } else {
        await Api.saveProperty(propertyId).catch(() => Api.publicSaveProperty(propertyId));
        setSavedProperties(prev => new Set(prev).add(propertyId));
      }
    } catch { /* silent */ }
  }, [savedProperties]);

  // ── Filtered search pool ──────────────────────────────────────────────────
  const searchPool = (() => {
    if (searchSection === 'residential') return allProperties;
    if (searchSection === 'bnb')         return bnbProperties;
    if (searchSection === 'oweru')       return oweruProperties;
    if (searchSection === 'commercial')  return commercialProperties;
    return [...allProperties, ...bnbProperties, ...oweruProperties, ...commercialProperties];
  })();

  const filteredProperties = searchPool.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchText = !term || (p.title || '').toLowerCase().includes(term) || (p.location || '').toLowerCase().includes(term) || (p.address || '').toLowerCase().includes(term);
    const price = Number(p.price ?? 0);
    let matchPrice = true;
    if (priceRange === '0-500')    matchPrice = price <= 500000;
    if (priceRange === '500-1000') matchPrice = price > 500000 && price <= 1000000;
    if (priceRange === '1000+')    matchPrice = price > 1000000;
    return matchText && matchPrice;
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setSearchActive(true);
    setTimeout(() => document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const clearSearch = () => { setSearchTerm(''); setSearchSection('all'); setPriceRange(''); setSearchActive(false); };

  // ── Card components ───────────────────────────────────────────────────────
  const PropCard = memo(({ p, suffix = '/mo', showSave = true }: { p: any; suffix?: string; showSave?: boolean }) => (
    <div className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
      <div className="prop-img-wrap">
        <LazyImg src={getImage(p)} alt={p.title} height={200} />
        <div className="prop-img-overlay" />
        {p.featured && <div className="badge-gold" style={{ position: 'absolute', top: 12, left: 12 }}>Featured</div>}
      </div>
      <div className="prop-body">
        {p.type && <div className="prop-type">{p.type}</div>}
        <div className="prop-title">{p.title}</div>
        <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />{p.location || p.address}</div>
        <div><span className="prop-price">{fmtPrice(p.price)}</span><span className="prop-price-sfx">{suffix}</span></div>
        <button className="view-btn" onClick={e => { e.stopPropagation(); navigate(`/property/${p.id}`); }}>View Details</button>
      </div>
      {showSave && (
        <div style={{ padding: '0 20px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton saved={savedProperties.has(p.id)} onClick={e => handleSaveProperty(e, p.id)} />
        </div>
      )}
    </div>
  ));

  // ── Commercial card — mirrors Properties.tsx image logic exactly ──────────
  const CommCard = memo(({ p }: { p: any }) => {
    const imgSrc = getImage(p);
    const sc: Record<string, { bg: string; color: string; dot: string }> = {
      active:   { bg: 'rgba(16,185,129,0.85)',  color: '#fff', dot: '#10B981' },
      pending:  { bg: 'rgba(245,158,11,0.85)',  color: '#fff', dot: '#F59E0B' },
      inactive: { bg: 'rgba(100,116,139,0.85)', color: '#fff', dot: '#64748B' },
    };
    const statusStyle = sc[p.status] ?? sc.inactive;
    const typeColorMap: Record<string, string> = { office: '#22D3EE', retail: '#F472B6', warehouse: '#FB923C', commercial: '#A78BFA', industrial: '#818CF8' };
    const tc = typeColorMap[p.type?.toLowerCase()] ?? '#C89128';

    return (
      <div className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
        <div className="prop-img-wrap">
          <LazyImg src={imgSrc} alt={p.title} height={200} />
          <div className="prop-img-overlay" />
          {/* Type badge — top right */}
          <div style={{ position: 'absolute', top: 12, right: 12, background: `${tc}22`, border: `1px solid ${tc}55`, color: tc, padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
            {commercialTypeLabel(p.type)}
          </div>
          {/* Status badge — top left */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(8,14,26,0.72)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot, display: 'inline-block', boxShadow: `0 0 6px ${statusStyle.dot}` }} />
            <span style={{ color: '#E2E8F0', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {p.status === 'active' ? 'Available' : p.status === 'pending' ? 'Pending' : p.status ?? 'Available'}
            </span>
          </div>
        </div>
        <div className="prop-body">
          <div className="prop-type" style={{ color: tc }}>{commercialTypeLabel(p.type)}</div>
          <div className="prop-title">{p.title}</div>
          <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location || p.address || 'Tanzania'}</span></div>
          {(p.area || p.parking_spaces || p.furnished) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {p.area               && <span className="feat-tag">{p.area} m²</span>}
              {p.parking_spaces > 0 && <span className="feat-tag">{p.parking_spaces} Parking</span>}
              {p.furnished          && <span className="feat-tag" style={{ color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}>Furnished</span>}
            </div>
          )}
          <div><span className="prop-price">{fmtPrice(p.price)}</span><span className="prop-price-sfx">{p.price_type === 'yearly' ? '/yr' : p.price_type === 'sale' ? '' : '/mo'}</span></div>
          <button className="view-btn" onClick={e => { e.stopPropagation(); navigate(`/property/${p.id}`); }}>View Details</button>
        </div>
      </div>
    );
  });

  const EmptyState = ({ text }: { text: string }) => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <Building size={40} style={{ color: 'var(--gold)', opacity: 0.35, marginBottom: 16 }} />
      <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>{text}</h3>
    </div>
  );

  const SkeletonGrid = ({ count = 3 }: { count?: number }) => (
    <div className="prop-grid">{Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}</div>
  );

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#0A0F1E', color: '#F1F5F9', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#0A0F1E; --bg2:#0F172A; --bg3:#162035;
          --gold:#C89128; --gold-lt:#E6A830; --gold-dim:rgba(200,145,40,0.1);
          --gold-border:rgba(200,145,40,0.2); --gold-border-strong:rgba(200,145,40,0.4);
          --cream:#F1F5F9; --slate:#94A3B8; --slate-dim:#64748B;
          --border:rgba(200,145,40,0.15); --r:14px;
        }
        .sticky-nav { position:fixed; top:0; left:0; right:0; z-index:500; background:rgba(10,15,30,0.97); border-bottom:1px solid var(--border); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); transform:translateY(-100%); transition:transform 0.4s cubic-bezier(0.4,0,0.2,1); box-shadow:0 8px 40px rgba(0,0,0,0.5); }
        .sticky-nav.visible { transform:translateY(0); }
        .sticky-nav-inner { max-width:1200px; margin:0 auto; padding:0 32px; display:flex; align-items:stretch; justify-content:space-between; height:58px; }
        .snav-logo { display:flex; align-items:center; flex-shrink:0; }
        .snav-items { display:flex; align-items:stretch; gap:2px; }
        .snav-item { display:flex; align-items:center; gap:7px; padding:0 16px; font-size:13px; font-weight:500; color:var(--slate); cursor:pointer; border:none; background:none; font-family:inherit; border-bottom:2px solid transparent; transition:all 0.2s; white-space:nowrap; }
        .snav-item:hover { color:var(--cream); }
        .snav-item.active { color:var(--gold); border-bottom-color:var(--gold); background:var(--gold-dim); }
        .snav-cta { display:flex; align-items:center; gap:7px; margin-left:16px; padding:0 18px; background:linear-gradient(135deg,var(--gold),var(--gold-lt)); color:var(--bg); font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; border-radius:8px; align-self:center; height:34px; flex-shrink:0; transition:all 0.2s; }
        .snav-cta:hover { filter:brightness(1.1); }
        .hero { position:relative; min-height:100vh; display:flex; flex-direction:column; overflow:hidden; }
        .hero-bg { position:absolute; inset:0; background-image:url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1800&q=80"); background-size:cover; background-position:center 40%; animation:hero-zoom 20s ease-in-out infinite alternate; will-change:transform; }
        @keyframes hero-zoom { from{transform:scale(1.02)} to{transform:scale(1.08)} }
        .hero-overlay { position:absolute; inset:0; background:linear-gradient(120deg,rgba(10,15,30,0.96) 0%,rgba(10,15,30,0.82) 50%,rgba(22,32,53,0.65) 100%); }
        .hero-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(200,145,40,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(200,145,40,0.03) 1px,transparent 1px); background-size:60px 60px; pointer-events:none; }
        .hero-body { position:relative; z-index:2; flex:1; max-width:1200px; margin:0 auto; padding:90px 32px 0; display:grid; grid-template-columns:1.1fr 0.9fr; gap:60px; align-items:center; width:100%; }
        .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:10px; font-weight:600; letter-spacing:0.25em; text-transform:uppercase; color:var(--gold); padding:6px 14px; background:var(--gold-dim); border:1px solid var(--gold-border); border-radius:4px; margin-bottom:24px; }
        .hero-dot { width:6px; height:6px; background:#4ade80; border-radius:50%; animation:blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero-title { font-family:'Cormorant Garamond',serif; font-size:clamp(38px,6vw,68px); font-weight:300; line-height:1.05; letter-spacing:-0.02em; color:var(--cream); margin-bottom:18px; }
        .hero-title strong { font-weight:600; color:var(--gold); font-style:italic; }
        .hero-sub { font-size:15px; font-weight:300; line-height:1.75; color:rgba(241,245,249,0.55); margin-bottom:36px; max-width:480px; }
        .hero-btns { display:flex; gap:12px; flex-wrap:wrap; }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,var(--gold),var(--gold-lt)); color:var(--bg); padding:14px 28px; border-radius:10px; font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; border:none; cursor:pointer; transition:all 0.2s; box-shadow:0 8px 32px rgba(200,145,40,0.3); font-family:inherit; }
        .btn-primary:hover { filter:brightness(1.1); transform:translateY(-2px); }
        .btn-ghost-hero { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); color:var(--cream); padding:14px 28px; border-radius:10px; font-size:13px; font-weight:500; text-decoration:none; border:1px solid rgba(255,255,255,0.12); transition:all 0.2s; }
        .btn-ghost-hero:hover { border-color:var(--gold-border); color:var(--gold); background:var(--gold-dim); }
        .search-card { background:rgba(15,23,42,0.93); border:1px solid var(--border); border-radius:20px; padding:28px; backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); box-shadow:0 40px 80px rgba(0,0,0,0.5); position:relative; overflow:hidden; }
        .search-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--gold),var(--gold-lt),transparent); }
        .search-icon-box { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,var(--gold),var(--gold-lt)); display:flex; align-items:center; justify-content:center; color:var(--bg); flex-shrink:0; box-shadow:0 4px 16px rgba(200,145,40,0.3); }
        .s-input,.s-select { width:100%; padding:11px 14px; background:rgba(10,15,30,0.8); border:1px solid var(--border); color:var(--cream); font-size:13px; outline:none; font-family:'Outfit',sans-serif; border-radius:10px; transition:border-color 0.2s,box-shadow 0.2s; }
        .s-input:focus,.s-select:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(200,145,40,0.08); }
        .s-input::placeholder { color:var(--slate-dim,#64748b); }
        .s-select option { background:#0F172A; color:var(--cream); }
        .search-btn { width:100%; padding:13px; border:none; cursor:pointer; background:linear-gradient(135deg,var(--gold),var(--gold-lt)); color:var(--bg); font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; border-radius:10px; font-family:'Outfit',sans-serif; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 16px rgba(200,145,40,0.25); }
        .search-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
        .section { max-width:1200px; margin:0 auto; padding:80px 32px; }
        .section-header { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:48px; flex-wrap:wrap; }
        .section-tag { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; background:var(--gold-dim); padding:4px 12px; border:1px solid var(--gold-border); border-radius:4px; }
        .section-title { font-family:'Cormorant Garamond',serif; font-size:clamp(28px,3.5vw,44px); font-weight:300; line-height:1.1; letter-spacing:-0.02em; color:var(--cream); }
        .section-title em { font-style:italic; color:var(--gold); }
        .section-sub { font-size:14px; color:var(--slate); margin-top:8px; line-height:1.6; }
        .btn-ghost { display:inline-flex; align-items:center; gap:7px; background:transparent; color:var(--gold); padding:10px 20px; border-radius:8px; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; border:1px solid var(--gold-border); cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .btn-ghost:hover { background:var(--gold-dim); border-color:var(--gold); }
        .btn-outline { display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--cream); padding:11px 22px; border-radius:8px; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; border:1px solid rgba(255,255,255,0.15); transition:all 0.2s; }
        .btn-outline:hover { border-color:var(--gold-border); color:var(--gold); }
        .stats-bar { background:var(--bg2); border-bottom:1px solid var(--border); }
        .stats-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); border-left:1px solid var(--border); }
        .stat-cell { text-align:center; padding:28px 16px; border-right:1px solid var(--border); transition:background 0.2s; }
        .stat-cell:hover { background:var(--gold-dim); }
        .stat-num { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:300; color:var(--gold); margin-bottom:6px; }
        .stat-lbl { font-size:10px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:var(--slate); }
        .prop-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
        .prop-card { background:var(--bg3); border:1px solid var(--border); border-radius:var(--r); overflow:hidden; transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s; cursor:pointer; }
        .prop-card:hover { border-color:var(--gold-border-strong); transform:translateY(-4px); box-shadow:0 20px 50px rgba(0,0,0,0.5); }
        .prop-img-wrap { position:relative; overflow:hidden; background:var(--bg2); }
        .prop-img { width:100%; display:block; object-fit:cover; transition:transform 0.5s; }
        .prop-card:hover .prop-img { transform:scale(1.04); }
        .prop-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(10,15,30,0.7) 0%,transparent 55%); }
        .prop-body { padding:18px 20px 16px; }
        .prop-type { font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:6px; }
        .prop-title { font-size:15px; font-weight:600; color:var(--cream); margin-bottom:6px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .prop-loc { color:var(--slate); font-size:12px; margin-bottom:12px; display:flex; align-items:center; gap:4px; }
        .prop-price { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:400; color:var(--gold); }
        .prop-price-sfx { font-size:11px; color:var(--slate); font-weight:400; font-family:'Outfit',sans-serif; }
        .view-btn { width:100%; margin-top:14px; padding:11px; background:linear-gradient(135deg,var(--gold),var(--gold-lt)); color:var(--bg); border:none; border-radius:8px; font-weight:700; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; font-family:inherit; transition:filter 0.2s; }
        .view-btn:hover { filter:brightness(1.1); }
        .badge-gold { background:var(--gold); color:var(--bg); padding:4px 10px; border-radius:6px; font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; }
        .feat-tag { display:inline-flex; align-items:center; padding:3px 8px; border-radius:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); font-size:10px; color:var(--slate); font-weight:600; }
        .bnb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
        .skeleton { background:var(--bg3); border:1px solid var(--border); border-radius:var(--r); animation:shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:0.9} 100%{opacity:0.5} }
        @media(max-width:900px) {
          .hero-body { grid-template-columns:1fr; gap:36px; padding:64px 20px 0; }
          .section { padding:56px 20px; }
          .stats-inner { grid-template-columns:repeat(2,1fr); }
          .stat-cell:nth-child(2){border-right:none;} .stat-cell:nth-child(3){border-top:1px solid var(--border);}
          .sticky-nav-inner { padding:0 16px; }
          .snav-item { padding:0 10px; font-size:12px; }
        }
        @media(max-width:600px) {
          .hero-body { padding:48px 16px 0; }
          .hero-title { font-size:clamp(32px,8vw,48px); }
          .section { padding:44px 16px; }
          .search-card { padding:20px 16px; }
          .section-header { flex-direction:column; gap:12px; align-items:flex-start; }
          .prop-grid,.bnb-grid { grid-template-columns:1fr; }
        }
      `}</style>

      
      {/* ══ HERO ══ */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" /><div className="hero-overlay" /><div className="hero-grid" />

        <div className="hero-body">
          {/* Left */}
          <div>
            <div className="hero-eyebrow"><span className="hero-dot" /> Tanzania's Premier Rental Platform</div>
            <h1 className="hero-title">Find Your<br /><strong>Perfect Rental</strong><br />Property</h1>
            <p className="hero-sub">Connect with trusted landlords and professional agents across Tanzania. Residential, commercial, and short-stay all in one place.</p>
            <div className="hero-btns">
              <Link to="/properties" className="btn-primary">Browse All <ArrowRight size={15} /></Link>
              <Link to="/register"   className="btn-ghost-hero">Create Account <ChevronRight size={14} /></Link>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 36, flexWrap: 'wrap' }}>
              {[{ icon: Shield, label: 'Verified landlords' }, { icon: Clock, label: '24hr response' }, { icon: TrendingUp, label: '1,200+ listings' }].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(241,245,249,0.5)', fontWeight: 500 }}>
                  <Icon size={13} style={{ color: 'var(--gold)' }} />{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Search Card ── */}
          <div className="search-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div className="search-icon-box"><Search size={18} /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)' }}>Search Properties</div>
                <div style={{ fontSize: 12, color: 'var(--slate)' }}>Find residential, commercial & more</div>
              </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input className="s-input" type="text" placeholder="Location, neighbourhood, property name…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ paddingRight: searchTerm ? 36 : 14 }} />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer', display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category + Price filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <select className="s-select" value={searchSection} onChange={e => setSearchSection(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="residential">🏠 Residential</option>
                <option value="bnb">🏝️ Short Stay</option>
                <option value="commercial">🏢 Commercial</option>
                <option value="oweru">👑 Oweru Special</option>
              </select>
              <select className="s-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                <option value="">All Prices</option>
                <option value="0-500">Under TZS 500K</option>
                <option value="500-1000">TZS 500K – 1M</option>
                <option value="1000+">Above TZS 1M</option>
              </select>
            </div>

            <button onClick={handleSearch} className="search-btn">
              <Search size={15} /> Search Properties
            </button>

            {(searchTerm || searchSection !== 'all' || priceRange) && (
              <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--slate)', fontSize: 12, cursor: 'pointer', margin: '10px auto 0', fontFamily: 'inherit' }}>
                <X size={11} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Scroll hint bar (no filter logic — just section jumps) ── */}
        <div style={{ position: 'relative', zIndex: 10, background: 'rgba(15,23,42,0.98)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'stretch', height: 52 }}>
            <span style={{ display: 'flex', alignItems: 'center', paddingRight: 20, marginRight: 8, borderRight: '1px solid var(--border)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--slate-dim,#64748b)', flexShrink: 0, whiteSpace: 'nowrap' }}>Browse</span>
           
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 0, paddingLeft: 20, borderLeft: '1px solid var(--border)' }}>
              <Link to="/properties" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,var(--gold),var(--gold-lt))', color: 'var(--bg)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}>All Listings <ArrowRight size={12} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SEARCH RESULTS ══ */}
      {searchActive && (
        <section id="search-results" style={{ background: 'var(--bg2)', borderTop: '2px solid var(--gold)' }}>
          <div className="section" style={{ paddingTop: 48, paddingBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Search Results</div>
                <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 28, fontWeight: 300, color: 'var(--cream)' }}>
                  {loading ? 'Searching…' : `${filteredProperties.length} propert${filteredProperties.length !== 1 ? 'ies' : 'y'} found`}
                  {searchTerm && <em style={{ fontWeight: 300, color: 'var(--slate)', fontSize: 20 }}> for "{searchTerm}"</em>}
                </h2>
               
              </div>
              <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--slate)', padding: '8px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 8, fontFamily: 'inherit' }}>
                <X size={12} /> Clear
              </button>
            </div>

            {loading ? <SkeletonGrid count={6} /> : filteredProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Search size={40} style={{ color: 'var(--gold)', opacity: 0.4, marginBottom: 16 }} />
                <h3 style={{ color: 'var(--cream)', fontSize: 20, marginBottom: 8 }}>No properties found</h3>
                <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 20 }}>Try a different location or adjust your filters.</p>
                <button onClick={clearSearch} className="btn-ghost">Clear filters</button>
              </div>
            ) : (
              <>
                <div className="prop-grid">
                  {filteredProperties.map(p =>
                    COMMERCIAL_TYPES.includes(p.type?.toLowerCase?.())
                      ? <CommCard key={p.id} p={p} />
                      : <PropCard key={p.id} p={p} suffix="/mo" />
                  )}
                </div>
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <Link to="/properties" className="btn-ghost">View all listings <ArrowRight size={14} /></Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ══ STATS ══ */}
      {!searchActive && (
        <div className="stats-bar">
          <div className="stats-inner">
            {[{ num: '1,247', lbl: 'Active Listings' }, { num: '3,842', lbl: 'Registered Users' }, { num: '892', lbl: 'Available Now' }, { num: '24 hr', lbl: 'Avg. Response' }].map(s => (
              <div key={s.lbl} className="stat-cell"><div className="stat-num">{s.num}</div><div className="stat-lbl">{s.lbl}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RESIDENTIAL ══ */}
      {!searchActive && (
        <section id="residential" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-tag"><HomeIcon size={10} /> Residential</div>
                <h2 className="section-title">Popular <em>Properties</em></h2>
                <p className="section-sub">Apartments, houses, studios and more across Tanzania.</p>
              </div>
              <Link to="/properties" className="btn-ghost">View All <ArrowRight size={14} /></Link>
            </div>
            {loading ? <SkeletonGrid /> : allProperties.length === 0 ? <EmptyState text="No residential properties yet" /> : (
              <div className="prop-grid">{allProperties.slice(0, 6).map(p => <PropCard key={p.id} p={p} suffix="/month" />)}</div>
            )}
            {allProperties.length > 6 && <div style={{ textAlign: 'center', marginTop: 36 }}><Link to="/properties" className="btn-ghost">See all residential <ArrowRight size={14} /></Link></div>}
          </div>
        </section>
      )}

      {/* ══ BNB ══ */}
      {!searchActive && (
        <section id="bnb" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-tag"><Star size={10} /> Vacation Rentals</div>
                <h2 className="section-title">Premium <em>Short Stay</em></h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate)', maxWidth: 280, textAlign: 'right' }}>Handpicked short-term rentals across Tanzania.</p>
            </div>
            {bnbLoading ? <SkeletonGrid /> : bnbProperties.length === 0 ? <EmptyState text="No BNB properties yet" /> : (
              <div className="bnb-grid">
                {bnbProperties.map((p: any) => (
                  <div key={p.id} className="prop-card">
                    <div className="prop-img-wrap">
                      <LazyImg src={getImage(p)} alt={p.title} height={220} />
                      <div className="prop-img-overlay" />
                    </div>
                    <div className="prop-body">
                      <div className="prop-title">{p.title}</div>
                      <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />{p.location}</div>
                      <div><span className="prop-price">{fmtPrice(p.price)}</span><span className="prop-price-sfx">/night</span></div>
                      <button className="view-btn" onClick={() => { setSelectedProperty(p); setShowBookingModal(true); }}>Book Now</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ OWERU SPECIAL ══ */}
      {!searchActive && (
        <section id="oweru" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-tag"><Shield size={10} /> Exclusive Offers</div>
                <h2 className="section-title">Oweru <em>Special Packages</em></h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate)', maxWidth: 280, textAlign: 'right' }}>Premium properties handpicked by Oweru.</p>
            </div>
            {oweruLoading ? <SkeletonGrid /> : oweruProperties.length === 0 ? <EmptyState text="No Oweru packages yet" /> : (
              <div className="prop-grid">
                {oweruProperties.map((p: any) => (
                  <div key={p.id} className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
                    <div className="prop-img-wrap">
                      <LazyImg src={getImage(p)} alt={p.title} height={210} />
                      <div className="prop-img-overlay" />
                      <div className="badge-gold" style={{ position: 'absolute', top: 12, right: 12 }}>OWERU</div>
                    </div>
                    <div className="prop-body">
                      <div className="prop-title">{p.title}</div>
                      <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />{p.location || p.address || 'Tanzania'}</div>
                      <div><span className="prop-price">{fmtPrice(p.price)}</span><span className="prop-price-sfx">/month</span></div>
                      <button className="view-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ COMMERCIAL ══ */}
      {!searchActive && (
        <section id="commercial" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-tag"><Briefcase size={10} /> Business Spaces</div>
                <h2 className="section-title">Commercial <em>Properties</em></h2>
                <p className="section-sub">Offices, retail spaces, warehouses, and industrial properties for your business.</p>
              </div>
              <Link to="/properties?type=commercial" className="btn-outline">All Commercial <ChevronRight size={15} /></Link>
            </div>
            {commercialLoading ? <SkeletonGrid count={4} /> : commercialProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Layers size={48} style={{ color: 'var(--slate)', marginBottom: 16 }} />
                <h3 style={{ fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>No commercial properties available</h3>
                <p style={{ color: 'var(--slate)', fontSize: 15 }}>Check back soon for office spaces, retail, and more.</p>
              </div>
            ) : (
              <>
                <div className="prop-grid">{commercialProperties.slice(0, 8).map(p => <CommCard key={p.id} p={p} />)}</div>
                {commercialProperties.length > 8 && (
                  <div style={{ textAlign: 'center', marginTop: 36 }}>
                    <Link to="/properties?type=commercial" className="btn-ghost">See all commercial <ArrowRight size={14} /></Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ══ CTA ══ */}
      {!searchActive && (
        <section style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
              <div>
                <div className="section-tag">Get Started</div>
                <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 300, color: 'var(--cream)', marginBottom: 16, lineHeight: 1.1 }}>
                  Ready to Find Your<br /><em style={{ color: 'var(--gold)' }}>Next Home?</em>
                </h2>
                <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 32, lineHeight: 1.7 }}>Join thousands of Tanzanians who found their perfect rental through Oweru.</p>
                <Link to="/properties" className="btn-primary">Browse All Properties <ArrowRight size={15} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Verified landlords & agents', 'Secure payment processing', 'Dedicated tenant support', 'Digital contract management'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--cream)', fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0 }} />{item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ BOOKING MODAL ══ */}
      {showBookingModal && selectedProperty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setShowBookingModal(false)}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: 36, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 20 }}
            onClick={e => e.stopPropagation()}>
            <BookingForm property={selectedProperty} onClose={() => setShowBookingModal(false)} onSuccess={() => { setShowBookingModal(false); alert('Booking submitted! The owner will contact you soon.'); }} />
          </div>
        </div>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '28px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <img src={LOGO} alt="OWERU" style={{ height: 22 }} loading="lazy" />
          <div style={{ color: 'var(--slate)', fontSize: 13 }}>&copy; 2026 Oweru. Tanzania.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;