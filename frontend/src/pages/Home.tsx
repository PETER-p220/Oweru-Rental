import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ArrowRight, ChevronRight,
  Heart, Building, X, Star, Shield, Clock, TrendingUp,
  Home as HomeIcon, Briefcase, Layers,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getPublicBnbPropertyPath } from '../utils/bnbNav';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import { getPropertyThumbnail, PROPERTY_IMAGE_PLACEHOLDER, normalizeBnbProperty } from '../utils/propertyImages';
import PropertyVideoBadge from '../components/PropertyVideoBadge';

const _rawBase     = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_BASE     = _rawBase.endsWith('/') ? _rawBase.slice(0, -1) : _rawBase;

const COMMERCIAL_TYPES = ['office', 'retail', 'warehouse', 'commercial', 'industrial'];

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
    <div style={{ position: 'relative', background: '#F1F5F9', minHeight: height }}>
      {!visible && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg,#F1F5F9 0%,#E2E8F0 50%,#F1F5F9 100%)',
            backgroundSize: '200% 100%',
            animation: 'img-shimmer 1.1s ease-in-out infinite',
          }}
        />
      )}
      <img
        ref={imgRef}
        className="prop-img"
        src={src}
        alt={alt}
        style={{ height, width: '100%', objectFit: 'cover', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', position: 'relative', zIndex: 1 }}
        loading="lazy"
        decoding="async"
        onLoad={() => setVisible(true)}
        onError={e => {
          const el = e.currentTarget as HTMLImageElement;
          if (el.src !== PROPERTY_IMAGE_PLACEHOLDER) el.src = PROPERTY_IMAGE_PLACEHOLDER;
          setVisible(true);
        }}
      />
    </div>
  );
});

/* ── Save Button ── */
const SaveButton = memo(({ saved, onClick }: { saved: boolean; onClick: (e: any) => void }) => (
  <button onClick={onClick} style={{
    padding: '7px 14px', border: `1px solid ${saved ? '#0F172A' : '#E2E8F0'}`,
    backgroundColor: saved ? '#0F172A' : 'transparent',
    color: saved ? '#FFFFFF' : '#64748B',
    fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 6,
    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s', fontFamily: 'inherit',
  }}>
    <Heart size={11} fill={saved ? 'currentColor' : 'none'} />
    {saved ? 'Saved' : 'Save'}
  </button>
));

/* ── Booking Form ── */
const BookingForm = ({ property, onClose, onSuccess }: { property: any; onClose: () => void; onSuccess: (data?: any) => void }) => {
  const [fd, setFd] = useState({ guest_name: '', guest_email: '', guest_phone: '', check_in: '', check_out: '', guest_count: 1, special_requests: '' });
  const [loading, setLoading] = useState(false);
  const nights = () => {
    if (!fd.check_in || !fd.check_out) return 0;
    return Math.ceil((new Date(fd.check_out).getTime() - new Date(fd.check_in).getTime()) / 86400000);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = `/login?redirect=${encodeURIComponent(getPublicBnbPropertyPath(property.id))}`;
      return;
    }
    onClose();
    window.location.href = getPublicBnbPropertyPath(property.id);
  };
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', borderRadius: 8, fontSize: 13, marginBottom: 10, outline: 'none', fontFamily: 'inherit' };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 8 }}><X size={20} /></button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ color: '#0F172A', marginBottom: 4, fontSize: 20, fontWeight: 700, fontFamily: 'inherit' }}>Book {property.title}</h2>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>{property.location}</p>
        <p style={{ color: '#94A3B8', fontSize: 12, marginBottom: 14 }}>Sign in to book and pay securely on the property page.</p>
        <input required style={inp} placeholder="Your name" value={fd.guest_name} onChange={e => setFd(p => ({ ...p, guest_name: e.target.value }))} />
        <input required type="email" style={inp} placeholder="Email" value={fd.guest_email} onChange={e => setFd(p => ({ ...p, guest_email: e.target.value }))} />
        <input required style={inp} placeholder="Phone" value={fd.guest_phone} onChange={e => setFd(p => ({ ...p, guest_phone: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input required type="date" style={inp} value={fd.check_in} onChange={e => setFd(p => ({ ...p, check_in: e.target.value }))} />
          <input required type="date" style={inp} value={fd.check_out} onChange={e => setFd(p => ({ ...p, check_out: e.target.value }))} />
        </div>
        <input required type="number" min={1} max={20} style={inp} placeholder="Guests" value={fd.guest_count} onChange={e => setFd(p => ({ ...p, guest_count: Number(e.target.value) }))} />
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} placeholder="Special requests (optional)" value={fd.special_requests} onChange={e => setFd(p => ({ ...p, special_requests: e.target.value }))} />
        {nights() > 0 && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>TZS {(nights() * property.price).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{nights()} nights</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: 12, background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Submitting…' : 'Book Now'}
          </button>
        </div>
        <button type="button" onClick={() => { onClose(); window.location.href = getPublicBnbPropertyPath(property.id); }} style={{ width: '100%', marginTop: 10, padding: 10, background: 'transparent', border: 'none', color: '#64748B', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
          View full details & reviews
        </button>
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

  useEffect(() => {
    if (window.location.hash === '#bnb') {
      const t = window.setTimeout(() => {
        document.getElementById('bnb')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return () => window.clearTimeout(t);
    }
  }, []);

  const loadBnbProperties = useCallback(async (): Promise<any[]> => {
    const parseList = (payload: unknown): any[] => {
      if (Array.isArray(payload)) return payload;
      if (payload && typeof payload === 'object') {
        const row = payload as Record<string, unknown>;
        if (Array.isArray(row.data)) return row.data as any[];
        if (Array.isArray(row.value)) return row.value as any[];
      }
      return [];
    };

    try {
      const primary = await fetch(`${API_BASE}/api/public/bnb`, { headers: { Accept: 'application/json' } });
      if (primary.ok) {
        const list = parseList(await primary.json())
          .filter((p) => p?.id !== 999)
          .map((p) => normalizeBnbProperty(p));
        if (list.length > 0) return list;
      }

      const fallback = await fetch(`${API_BASE}/api/public/bnb/search`, { headers: { Accept: 'application/json' } });
      if (fallback.ok) {
        return parseList(await fallback.json())
          .filter((p) => p?.id !== 999)
          .map((p) => normalizeBnbProperty(p));
      }
    } catch (err) {
      console.error('BnB load error:', err);
    }

    return [];
  }, []);

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
      loadBnbProperties(),
      fetch(`${API_BASE}/api/public/properties?type=oweru_rental&per_page=8`, { headers: { Accept: 'application/json' } }),
      fetch(`${API_BASE}/api/public/properties?per_page=12`, { headers: { Accept: 'application/json' } }),
    ]).then(async ([bnbList, r3, r4]) => {
      setBnbProperties(bnbList);
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
        <LazyImg src={getPropertyThumbnail(p)} alt={p.title} height={200} />
        <div className="prop-img-overlay" />
        <PropertyVideoBadge property={p} />
        {p.featured && <div className="badge-solid" style={{ position: 'absolute', top: 12, left: 12 }}>Featured</div>}
      </div>
      <div className="prop-body">
        {p.type && <div className="prop-type">{p.type}</div>}
        <div className="prop-title">{p.title}</div>
        <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />{p.location || p.address}</div>
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
    const imgSrc = getPropertyThumbnail(p);
    const sc: Record<string, { color: string; dot: string }> = {
      active:   { color: '#166534', dot: '#16A34A' },
      pending:  { color: '#92400E', dot: '#D97706' },
      inactive: { color: '#475569', dot: '#94A3B8' },
    };
    const statusStyle = sc[p.status] ?? sc.inactive;

    return (
      <div className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
        <div className="prop-img-wrap">
          <LazyImg src={imgSrc} alt={p.title} height={200} />
          <div className="prop-img-overlay" />
          <PropertyVideoBadge property={p} />
          {/* Type badge — top right */}
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(15,23,42,0.88)', color: '#FFFFFF', padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
            {commercialTypeLabel(p.type)}
          </div>
          {/* Status badge — top left */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 20, border: '1px solid #E2E8F0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot, display: 'inline-block' }} />
            <span style={{ color: statusStyle.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {p.status === 'active' ? 'Available' : p.status === 'pending' ? 'Pending' : p.status ?? 'Available'}
            </span>
          </div>
        </div>
        <div className="prop-body">
          <div className="prop-type">{commercialTypeLabel(p.type)}</div>
          <div className="prop-title">{p.title}</div>
          <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location || p.address || 'Africa'}</span></div>
          {(p.area || p.parking_spaces || p.furnished) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {p.area               && <span className="feat-tag">{p.area} m²</span>}
              {p.parking_spaces > 0 && <span className="feat-tag">{p.parking_spaces} Parking</span>}
              {p.furnished          && <span className="feat-tag" style={{ color: '#166534', borderColor: '#BBF7D0', background: '#F0FDF4' }}>Furnished</span>}
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
      <Building size={40} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: 16 }} />
      <h3 style={{ color: 'var(--ink)', fontSize: 18, marginBottom: 8, fontWeight: 600 }}>{text}</h3>
    </div>
  );

  const SkeletonGrid = ({ count = 3 }: { count?: number }) => (
    <div className="prop-grid">{Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}</div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FFFFFF', color: '#0F172A', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; }
        :root {
          --bg:#FFFFFF; --bg2:#F8FAFC; --bg3:#FFFFFF;
          --ink:#0F172A; --slate:#64748B; --slate-dim:#94A3B8;
          --accent:#0F172A; --accent-hover:#1E293B; --accent-soft:#F1F5F9;
          --border:#E2E8F0; --border-strong:#CBD5E1; --r:12px;
        }
        body { font-family:'Inter',sans-serif; }
        .sticky-nav { position:fixed; top:0; left:0; right:0; z-index:500; background:rgba(255,255,255,0.97); border-bottom:1px solid var(--border); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); transform:translateY(-100%); transition:transform 0.4s cubic-bezier(0.4,0,0.2,1); box-shadow:0 4px 24px rgba(15,23,42,0.06); }
        .sticky-nav.visible { transform:translateY(0); }
        .sticky-nav-inner { max-width:1200px; margin:0 auto; padding:0 32px; display:flex; align-items:stretch; justify-content:space-between; height:58px; }
        .snav-logo { display:flex; align-items:center; flex-shrink:0; }
        .snav-items { display:flex; align-items:stretch; gap:2px; }
        .snav-item { display:flex; align-items:center; gap:7px; padding:0 16px; font-size:13px; font-weight:500; color:var(--slate); cursor:pointer; border:none; background:none; font-family:inherit; border-bottom:2px solid transparent; transition:all 0.2s; white-space:nowrap; }
        .snav-item:hover { color:var(--ink); }
        .snav-item.active { color:var(--ink); border-bottom-color:var(--ink); background:var(--accent-soft); }
        .snav-cta { display:flex; align-items:center; gap:7px; margin-left:16px; padding:0 18px; background:var(--accent); color:#FFFFFF; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; border-radius:8px; align-self:center; height:34px; flex-shrink:0; transition:all 0.2s; }
        .snav-cta:hover { background:var(--accent-hover); }
        .hero { position:relative; min-height:100vh; display:flex; flex-direction:column; overflow:hidden; }
        .hero-bg { position:absolute; inset:0; background-image:url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1800&q=80"); background-size:cover; background-position:center 40%; animation:hero-zoom 20s ease-in-out infinite alternate; will-change:transform; }
        @keyframes hero-zoom { from{transform:scale(1.02)} to{transform:scale(1.08)} }
        .hero-overlay { position:absolute; inset:0; background:linear-gradient(120deg,rgba(15,23,42,0.95) 0%,rgba(15,23,42,0.88) 45%,rgba(15,23,42,0.74) 100%); }
        .hero-body { position:relative; z-index:2; flex:1; max-width:1200px; margin:0 auto; padding:90px 32px 0; display:grid; grid-template-columns:1.1fr 0.9fr; gap:60px; align-items:center; width:100%; }
        .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:10px; font-weight:600; letter-spacing:0.22em; text-transform:uppercase; color:#E2E8F0; padding:6px 14px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.16); border-radius:4px; margin-bottom:24px; }
        .hero-dot { width:6px; height:6px; background:#4ade80; border-radius:50%; animation:blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero-title { font-family:'Inter',sans-serif; font-size:clamp(36px,5.6vw,60px); font-weight:700; line-height:1.08; letter-spacing:-0.03em; color:#FFFFFF; margin-bottom:18px; }
        .hero-title strong { font-weight:800; color:#FFFFFF; }
        .hero-sub { font-size:15px; font-weight:400; line-height:1.75; color:rgba(255,255,255,0.7); margin-bottom:36px; max-width:480px; }
        .hero-btns { display:flex; gap:12px; flex-wrap:wrap; }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; background:#FFFFFF; color:#0F172A; padding:14px 28px; border-radius:10px; font-size:13px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; text-decoration:none; border:none; cursor:pointer; transition:all 0.25s cubic-bezier(0.4,0,0.2,1); font-family:inherit; }
        .btn-primary:hover { background:#E2E8F0; transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }
        .btn-ghost-hero { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.08); color:#FFFFFF; padding:14px 28px; border-radius:10px; font-size:13px; font-weight:500; text-decoration:none; border:1px solid rgba(255,255,255,0.22); transition:all 0.2s; }
        .btn-ghost-hero:hover { border-color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.14); }
        .search-card { background:#FFFFFF; border:1px solid var(--border); border-radius:16px; padding:28px; box-shadow:0 30px 70px rgba(15,23,42,0.35); position:relative; overflow:hidden; }
        .search-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--ink); }
        .search-icon-box { width:40px; height:40px; border-radius:10px; background:var(--ink); display:flex; align-items:center; justify-content:center; color:#FFFFFF; flex-shrink:0; }
        .s-input,.s-select { width:100%; padding:11px 14px; background:#F8FAFC; border:1px solid var(--border); color:var(--ink); font-size:13px; outline:none; font-family:'Inter',sans-serif; border-radius:10px; transition:border-color 0.2s,box-shadow 0.2s; }
        .s-input:focus,.s-select:focus { border-color:var(--slate-dim); box-shadow:0 0 0 3px rgba(15,23,42,0.06); }
        .s-input::placeholder { color:var(--slate-dim); }
        .s-select option { background:#FFFFFF; color:var(--ink); }
        .search-btn { width:100%; padding:13px; border:none; cursor:pointer; background:var(--ink); color:#FFFFFF; font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; border-radius:10px; font-family:'Inter',sans-serif; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .search-btn:hover { background:var(--accent-hover); }
        .section { max-width:1200px; margin:0 auto; padding:80px 32px; }
        .section-header { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:48px; flex-wrap:wrap; }
        .section-tag { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--slate); margin-bottom:10px; background:var(--accent-soft); padding:4px 12px; border:1px solid var(--border); border-radius:4px; }
        .section-title { font-family:'Inter',sans-serif; font-size:clamp(26px,3.2vw,38px); font-weight:700; line-height:1.15; letter-spacing:-0.02em; color:var(--ink); }
        .section-title em { font-style:normal; color:var(--ink); }
        .section-sub { font-size:14px; color:var(--slate); margin-top:8px; line-height:1.6; }
        .btn-ghost { display:inline-flex; align-items:center; gap:7px; background:transparent; color:var(--ink); padding:10px 20px; border-radius:8px; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none; border:1px solid var(--border-strong); cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .btn-ghost:hover { background:var(--accent-soft); border-color:var(--slate-dim); }
        .btn-outline { display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--ink); padding:11px 22px; border-radius:8px; font-size:12px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; text-decoration:none; border:1px solid var(--border-strong); transition:all 0.2s; }
        .btn-outline:hover { background:var(--accent-soft); }
        .stats-bar { background:var(--bg2); border-bottom:1px solid var(--border); }
        .stats-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); border-left:1px solid var(--border); }
        .stat-cell { text-align:center; padding:28px 16px; border-right:1px solid var(--border); transition:background 0.2s; }
        .stat-cell:hover { background:#FFFFFF; }
        .stat-num { font-family:'Inter',sans-serif; font-size:32px; font-weight:700; color:var(--ink); margin-bottom:6px; }
        .stat-lbl { font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:var(--slate); }
        .prop-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
        .prop-card { background:#FFFFFF; border:1px solid var(--border); border-radius:var(--r); overflow:hidden; transition:border-color 0.25s,transform 0.25s,box-shadow 0.25s; cursor:pointer; box-shadow:0 1px 2px rgba(15,23,42,0.04); }
        .prop-card:hover { border-color:var(--border-strong); transform:translateY(-3px); box-shadow:0 18px 36px rgba(15,23,42,0.1); }
        .prop-img-wrap { position:relative; overflow:hidden; background:var(--bg2); }
        .prop-img { width:100%; display:block; object-fit:cover; transition:transform 0.5s; }
        .prop-card:hover .prop-img { transform:scale(1.04); }
        .prop-img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(15,23,42,0.35) 0%,transparent 55%); }
        .prop-body { padding:18px 20px 16px; }
        .prop-type { font-size:9px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--slate); margin-bottom:6px; }
        .prop-title { font-size:15px; font-weight:600; color:var(--ink); margin-bottom:6px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .prop-loc { color:var(--slate); font-size:12px; margin-bottom:12px; display:flex; align-items:center; gap:4px; }
        .prop-price { font-family:'Inter',sans-serif; font-size:20px; font-weight:700; color:var(--ink); }
        .prop-price-sfx { font-size:11px; color:var(--slate); font-weight:400; font-family:'Inter',sans-serif; }
        .view-btn { width:100%; margin-top:14px; padding:11px; background:var(--ink); color:#FFFFFF; border:none; border-radius:8px; font-weight:600; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; font-family:inherit; transition:background 0.2s; }
        .view-btn:hover { background:var(--accent-hover); }
        .badge-solid { background:var(--ink); color:#FFFFFF; padding:4px 10px; border-radius:6px; font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; }
        .feat-tag { display:inline-flex; align-items:center; padding:3px 8px; border-radius:5px; background:var(--accent-soft); border:1px solid var(--border); font-size:10px; color:var(--slate); font-weight:600; }
        .bnb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
        .skeleton { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); animation:shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:0.9} 100%{opacity:0.5} }
        @keyframes img-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
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
          .hero-title { font-size:clamp(30px,7.5vw,44px); }
          .section { padding:44px 16px; }
          .search-card { padding:20px 16px; }
          .section-header { flex-direction:column; gap:12px; align-items:flex-start; }
          .prop-grid,.bnb-grid { grid-template-columns:1fr; }
        }
      `}</style>

      
      {/* ══ HERO ══ */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" /><div className="hero-overlay" />

        <div className="hero-body">
          {/* Left */}
          <div>
            <div className="hero-eyebrow"><span className="hero-dot" /> Africa's Premier Rental Platform</div>
            <h1 className="hero-title">Find Your<br/><strong>Perfect Rental</strong><br/>Property</h1>
            <p className="hero-sub">Connect with trusted landlords and professional agents across Africa. Residential, commercial, and short-stay all in one place.</p>
            <div className="hero-btns">
              <Link to="/properties" className="btn-primary">Browse All <ArrowRight size={15} /></Link>
              <Link to="/register"   className="btn-ghost-hero">Create Account <ChevronRight size={14} /></Link>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 36, flexWrap: 'wrap' }}>
              {[{ icon: Shield, label: 'Verified landlords' }, { icon: Clock, label: '24hr response' }, { icon: TrendingUp, label: '1,200+ listings' }].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                  <Icon size={13} style={{ color: '#FFFFFF' }} />{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Search Card ── */}
          <div className="search-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div className="search-icon-box"><Search size={18} /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Search Properties</div>
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
                <option value="residential">Residential</option>
                <option value="bnb">Short Stay</option>
                <option value="commercial">Commercial</option>
                <option value="oweru">Oweru Special</option>
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

      </section>

      {/* ══ SEARCH RESULTS ══ */}
      {searchActive && (
        <section id="search-results" style={{ background: 'var(--bg2)', borderTop: '2px solid var(--ink)' }}>
          <div className="section" style={{ paddingTop: 48, paddingBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 6 }}>Search Results</div>
                <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--ink)' }}>
                  {loading ? 'Searching…' : `${filteredProperties.length} propert${filteredProperties.length !== 1 ? 'ies' : 'y'} found`}
                  {searchTerm && <em style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--slate)', fontSize: 18 }}> for "{searchTerm}"</em>}
                </h2>
               
              </div>
              <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--slate)', padding: '8px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 8, fontFamily: 'inherit' }}>
                <X size={12} /> Clear
              </button>
            </div>

            {loading ? <SkeletonGrid count={6} /> : filteredProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Search size={40} style={{ color: 'var(--slate-dim)', marginBottom: 16 }} />
                <h3 style={{ color: 'var(--ink)', fontSize: 20, marginBottom: 8, fontWeight: 700 }}>No properties found</h3>
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

      
      {/* ══ RESIDENTIAL ══ */}
      {!searchActive && (
        <section id="residential" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-tag"><HomeIcon size={10} /> Residential</div>
                <h2 className="section-title">Popular Properties</h2>
                <p className="section-sub">Apartments, houses, studios and more across Africa.</p>
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
                <h2 className="section-title">Premium Short Stay</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate)', maxWidth: 280, textAlign: 'right' }}>Handpicked short-term rentals across Africa.</p>
            </div>
            {bnbLoading ? <SkeletonGrid /> : bnbProperties.length === 0 ? <EmptyState text="No BNB properties yet" /> : (
              <div className="bnb-grid">
                {bnbProperties.map((p: any) => (
                  <div key={p.id} className="prop-card">
                    <div className="prop-img-wrap">
                      <LazyImg src={getPropertyThumbnail(p)} alt={p.title} height={220} />
                      <div className="prop-img-overlay" />
                    </div>
                    <div className="prop-body">
                      <div className="prop-title">{p.title}</div>
                      <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />{p.location}</div>
                      <div><span className="prop-price">{fmtPrice(p.price)}</span><span className="prop-price-sfx">/night</span></div>
                      <button className="view-btn" onClick={() => navigate(getPublicBnbPropertyPath(p.id))}>Book Now</button>
                      <button type="button" onClick={() => navigate(getPublicBnbPropertyPath(p.id))} style={{ marginTop: 8, width: '100%', padding: '8px 0', background: 'transparent', border: 'none', color: 'var(--slate)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                        Details & reviews
                      </button>
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
                <h2 className="section-title">Oweru Special Packages</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate)', maxWidth: 280, textAlign: 'right' }}>Premium properties handpicked by Oweru.</p>
            </div>
            {oweruLoading ? <SkeletonGrid /> : oweruProperties.length === 0 ? <EmptyState text="No Oweru packages yet" /> : (
              <div className="prop-grid">
                {oweruProperties.map((p: any) => (
                  <div key={p.id} className="prop-card" onClick={() => navigate(`/property/${p.id}`)}>
                    <div className="prop-img-wrap">
                      <LazyImg src={getPropertyThumbnail(p)} alt={p.title} height={210} />
                      <div className="prop-img-overlay" />
                      <div className="badge-solid" style={{ position: 'absolute', top: 12, right: 12 }}>OWERU</div>
                    </div>
                    <div className="prop-body">
                      <div className="prop-title">{p.title}</div>
                      <div className="prop-loc"><MapPin size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />{p.location || p.address || 'Africa'}</div>
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
                <h2 className="section-title">Commercial Properties</h2>
                <p className="section-sub">Offices, retail spaces, warehouses, and industrial properties for your business.</p>
              </div>
              <Link to="/properties?type=commercial" className="btn-outline">All Commercial <ChevronRight size={15} /></Link>
            </div>
            {commercialLoading ? <SkeletonGrid count={4} /> : commercialProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Layers size={48} style={{ color: 'var(--slate-dim)', marginBottom: 16 }} />
                <h3 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8, fontWeight: 700 }}>No commercial properties available</h3>
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
        <section style={{ background: 'var(--ink)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(24px, 5vw, 80px)', alignItems: 'center' }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.7)' }}>Get Started</div>
                <h2 style={{fontSize: 'clamp(26px,3.2vw,42px)', fontWeight: 700, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                  Ready to Find Your<br />Next Home?
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 32, lineHeight: 1.7 }}>Join thousands of Africans who found their perfect rental through Oweru.</p>
                <Link to="/properties" className="btn-primary">Browse All Properties <ArrowRight size={15} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Verified landlords & agents', 'Secure payment processing', 'Dedicated tenant support', 'Digital contract management'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#FFFFFF', fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, background: '#FFFFFF', borderRadius: '50%', flexShrink: 0 }} />{item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ BOOKING MODAL ══ */}
      {showBookingModal && selectedProperty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setShowBookingModal(false)}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: 'clamp(20px, 4vw, 36px)', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 20, boxShadow: '0 30px 70px rgba(15,23,42,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <BookingForm property={selectedProperty} onClose={() => setShowBookingModal(false)} onSuccess={() => { setShowBookingModal(false); alert('Booking submitted! Track it under My Stays if you were logged in.'); }} />
          </div>
        </div>
      )}

      
    </div>
  );
};

export default Home;