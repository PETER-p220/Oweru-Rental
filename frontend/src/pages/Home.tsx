import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ArrowRight, ChevronRight,
  Heart, Building, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Api from '../services/api';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const VITE_STORAGE = (import.meta.env.VITE_API_URL ?? '').replace('/api', '');
const API_BASE     = import.meta.env.VITE_API_URL ?? '';

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`;

const getImage = (property: any): string => {
  if (property.images && property.images.length > 0) {
    const i = property.images[0];
    if (typeof i === 'string' && i.trim() !== '') {
      if (i.startsWith('http://') || i.startsWith('https://')) return i;
      if (i.startsWith('/')) return `${VITE_STORAGE}${i}`;
      if (i.startsWith('storage/')) return `${VITE_STORAGE}/${i}`;
      return `${VITE_STORAGE}/storage/${i}`;
    }
  }
  return PLACEHOLDER;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);

/* ── Save Button ── */
const SaveButton = ({ saved, onClick }: { saved: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      border: `1px solid ${saved ? 'var(--gold)' : 'var(--border)'}`,
      backgroundColor: saved ? 'var(--gold)' : 'transparent',
      color: saved ? 'var(--navy-900)' : 'var(--slate)',
      fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 4,
      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontFamily: 'inherit',
    }}
  >
    <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
    {saved ? 'Saved' : 'Save'}
  </button>
);

/* ── Booking Form ── */
const BookingForm = ({ property, onClose, onSuccess }: { property: any; onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({ guest_name: '', guest_email: '', guest_phone: '', check_in: '', check_out: '', special_requests: '' });
  const [loading, setLoading] = useState(false);

  const nights = () => {
    if (!formData.check_in || !formData.check_out) return 0;
    return Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / 86400000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/bnb/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id, customer_name: formData.guest_name, customer_email: formData.guest_email, customer_phone: formData.guest_phone, check_in: formData.check_in, check_out: formData.check_out, special_requests: formData.special_requests, total_amount: nights() * (property.price || 0), status: 'pending' }),
      });
      if (res.ok) onSuccess();
      else { const d = await res.json(); alert(d.message || 'Failed'); }
    } catch { alert('Network error.'); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--cream)', borderRadius: 6, fontSize: 14, marginBottom: 12, outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 8 }}><X size={20} /></button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ color: 'var(--cream)', marginBottom: 4, fontSize: 20, fontWeight: 600 }}>Book {property.title}</h2>
        <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 18 }}>{property.location}</p>
        <input required style={inp} placeholder="Your name" value={formData.guest_name} onChange={e => setFormData(p => ({ ...p, guest_name: e.target.value }))} />
        <input required type="email" style={inp} placeholder="Email" value={formData.guest_email} onChange={e => setFormData(p => ({ ...p, guest_email: e.target.value }))} />
        <input required style={inp} placeholder="Phone" value={formData.guest_phone} onChange={e => setFormData(p => ({ ...p, guest_phone: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input required type="date" style={inp} value={formData.check_in} onChange={e => setFormData(p => ({ ...p, check_in: e.target.value }))} />
          <input required type="date" style={inp} value={formData.check_out} onChange={e => setFormData(p => ({ ...p, check_out: e.target.value }))} />
        </div>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} placeholder="Special requests (optional)" value={formData.special_requests} onChange={e => setFormData(p => ({ ...p, special_requests: e.target.value }))} />
        {nights() > 0 && (
          <div style={{ background: 'var(--navy-900)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>TZS {(nights() * property.price).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--slate)' }}>{nights()} nights</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--slate)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Submitting…' : 'Book Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ── Main Component ── */
const Home = () => {
  const navigate = useNavigate();

  const [allProperties,    setAllProperties]    = useState<any[]>([]);
  const [bnbProperties,    setBnbProperties]    = useState<any[]>([]);
  const [oweruProperties,  setOweruProperties]  = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [bnbLoading,       setBnbLoading]       = useState(true);
  const [oweruLoading,     setOweruLoading]     = useState(true);
  const [savedProperties,  setSavedProperties]  = useState<Set<number>>(new Set());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const [searchTerm,   setSearchTerm]   = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange,   setPriceRange]   = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadAllProperties();
    loadBnbProperties();
    loadOweruProperties();
    loadSavedProperties();
  }, []);

  const loadAllProperties = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/api/public/properties?per_page=100`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const list: any[] = json?.data?.data ?? json?.data ?? (Array.isArray(json) ? json : []);
      setAllProperties(list);
    } catch { setAllProperties([]); }
    finally { setLoading(false); }
  };

  const loadBnbProperties = async () => {
    try {
      setBnbLoading(true);
      for (const url of [`${API_BASE}/api/public/bnb`, `${API_BASE}/api/public/bnb/search`]) {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          setBnbProperties((Array.isArray(json) ? json : json?.data || []).slice(0, 6));
          return;
        }
      }
    } catch { /* silent */ }
    finally { setBnbLoading(false); }
  };

  const loadOweruProperties = async () => {
    try {
      setOweruLoading(true);
      const res = await fetch(`${API_BASE}/api/public/properties?type=oweru_rental&per_page=20`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        const list: any[] = json?.data?.data ?? json?.data ?? [];
        if (list.length > 0) { setOweruProperties(list.slice(0, 6)); return; }
      }
      setOweruProperties([]);
    } catch { setOweruProperties([]); }
    finally { setOweruLoading(false); }
  };

  const loadSavedProperties = async () => {
    try {
      const res = await Api.getSavedProperties();
      const ids = (Array.isArray(res.data) ? res.data : []).map((item: any) => item.property?.id ?? item.id).filter(Boolean);
      setSavedProperties(new Set(ids));
    } catch { /* silent */ }
  };

  const handleSaveProperty = async (propertyId: number) => {
    try {
      if (savedProperties.has(propertyId)) {
        await Api.unsaveProperty(propertyId).catch(() => Api.publicUnsaveProperty(propertyId));
        setSavedProperties(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
      } else {
        await Api.saveProperty(propertyId).catch(() => Api.publicSaveProperty(propertyId));
        setSavedProperties(prev => new Set(prev).add(propertyId));
      }
    } catch { /* silent */ }
  };

  const filteredProperties = allProperties.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchText = !term ||
      (p.title || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      (p.address || '').toLowerCase().includes(term);
    const matchType  = !propertyType || p.type === propertyType;
    const price = Number(p.price ?? 0);
    let matchPrice = true;
    if (priceRange === '0-500')    matchPrice = price <= 500000;
    if (priceRange === '500-1000') matchPrice = price > 500000 && price <= 1000000;
    if (priceRange === '1000+')    matchPrice = price > 1000000;
    return matchText && matchType && matchPrice;
  });

  const handleSearch = () => {
    setSearchActive(true);
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const clearSearch = () => {
    setSearchTerm(''); setPropertyType(''); setPriceRange('');
    setSearchActive(false);
    setActiveFilter('all');
  };

  const scrollToSection = (sectionId: string) => {         
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveFilter(sectionId);
    }
  };

  const hasFilters = searchTerm || propertyType || priceRange;

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: '#0F172A', color: '#F8F8F9', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy-900:#0F172A; --navy-800:#162035; --navy-700:#1E2D4A;
          --gold:#C89128; --gold-lt:#D4A843; --gold-dim:rgba(200,145,40,0.12);
          --cream:#F8F8F9; --slate:#94A3B8; --border:rgba(200,145,40,0.18);
        }

        /* Hero */
        .hero { position:relative; min-height:100vh; display:flex; align-items:center; overflow:hidden; }
        .hero-bg { position:absolute; inset:0; background-image:url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1800&q=80"); background-size:cover; background-position:center 40%; animation:hero-zoom 18s ease-in-out infinite alternate; }
        @keyframes hero-zoom { from{transform:scale(1.04)} to{transform:scale(1.10)} }
        .hero-overlay { position:absolute; inset:0; background:linear-gradient(115deg,rgba(15,23,42,0.93) 0%,rgba(15,23,42,0.78) 45%,rgba(22,32,53,0.55) 100%); }
        .hero-geo { position:absolute; inset:0; background-image: repeating-linear-gradient(60deg,transparent,transparent 40px,rgba(200,145,40,0.025) 40px,rgba(200,145,40,0.025) 41px), repeating-linear-gradient(-60deg,transparent,transparent 40px,rgba(200,145,40,0.025) 40px,rgba(200,145,40,0.025) 41px); pointer-events:none; }
        .hero-content { position:relative; z-index:2; max-width:1200px; margin:0 auto; padding:80px 24px 60px; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; width:100%; }
        .hero-badge { display:inline-flex; align-items:center; gap:8px; background:var(--gold-dim); border:1px solid var(--border); color:var(--gold); padding:6px 14px; font-size:10px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:28px; }
        .hero-dot { width:6px; height:6px; background:#4ade80; border-radius:50%; animation:blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero-title { font-size:clamp(32px,5.5vw,54px); font-weight:300; line-height:1.08; letter-spacing:-0.03em; color:var(--cream); margin-bottom:14px; }
        .hero-title strong { font-weight:700; }
        .hero-sub { font-size:15px; font-weight:300; line-height:1.7; color:rgba(248,248,249,0.62); margin-bottom:32px; }

        /* Search card */
        .search-card { background:rgba(22,32,53,0.90); border:1px solid var(--border); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); padding:28px; border-radius:6px; position:relative; overflow:hidden; box-shadow:0 32px 64px rgba(0,0,0,0.5); }
        .search-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--gold),var(--gold-lt)); }
        .s-input,.s-select { width:100%; padding:11px 14px; background:var(--navy-900); border:1px solid var(--border); color:var(--cream); font-size:13px; outline:none; font-family:inherit; border-radius:4px; transition:border-color 0.2s; }
        .s-input:focus,.s-select:focus { border-color:rgba(200,145,40,0.55); }
        .s-input::placeholder { color:var(--slate); }
        .s-select option { background:var(--navy-900); }
        .s-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }

        /* Buttons */
        .btn-gold { display:inline-flex; align-items:center; gap:8px; background:var(--gold); color:var(--navy-900); padding:14px 26px; font-size:13px; font-weight:700; letter-spacing:0.08em; text-decoration:none; text-transform:uppercase; border:none; cursor:pointer; transition:all 0.2s; border-radius:3px; font-family:inherit; }
        .btn-gold:hover { background:var(--gold-lt); }
        .btn-outline { display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--cream); padding:13px 26px; font-size:13px; font-weight:600; letter-spacing:0.06em; text-decoration:none; text-transform:uppercase; border:1px solid rgba(248,248,249,0.2); cursor:pointer; transition:all 0.2s; border-radius:3px; }
        .btn-outline:hover { border-color:var(--gold); color:var(--gold); }
        .btn-ghost { display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--gold); padding:10px 20px; font-size:13px; font-weight:600; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; border:1px solid var(--border); cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .btn-ghost:hover { background:var(--gold-dim); }

        /* Cards */
        .prop-card,.bnb-card,.oweru-card { background:var(--navy-800); border:1px solid var(--border); overflow:hidden; transition:all 0.3s; cursor:pointer; }
        .prop-card:hover,.bnb-card:hover,.oweru-card:hover { border-color:rgba(200,145,40,0.5); transform:translateY(-4px); box-shadow:0 16px 40px rgba(15,23,42,0.6); }
        .result-card { background:var(--navy-800); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:all 0.3s; }
        .result-card:hover { border-color:rgba(200,145,40,0.5); transform:translateY(-3px); box-shadow:0 12px 32px rgba(15,23,42,0.5); }

        /* Layout */
        .section { max-width:1200px; margin:0 auto; padding:80px 48px; }
        .section-hdr { display:grid; grid-template-columns:1fr auto; gap:40px; align-items:end; margin-bottom:48px; }
        .section-tag { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:600; letter-spacing:0.22em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; background:var(--gold-dim); padding:4px 12px; border:1px solid var(--border); }
        .section-title { font-size:clamp(26px,3vw,40px); font-weight:700; line-height:1.1; letter-spacing:-0.02em; color:var(--cream); }
        .section-title span { color:var(--gold); }
        .skeleton { animation:shimmer 1.5s ease-in-out infinite; background:var(--navy-700); border-radius:8px; }
        @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.9} 100%{opacity:0.4} }
        .prop-img { width:100%; display:block; object-fit:cover; }
        .oweru-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:24px; }
        .hero-btns { display:flex; gap:14px; flex-wrap:wrap; }

        /* ── RESPONSIVE ── */
        @media(max-width:900px) {
          .hero-content { grid-template-columns:1fr; gap:36px; padding:64px 20px 48px; }
          .section { padding:56px 20px; }
          .section-hdr { grid-template-columns:1fr; gap:14px; }
          .s-grid { grid-template-columns:1fr; }
        }
        @media(max-width:600px) {
          .hero-content { padding:48px 16px 40px; }
          .section { padding:44px 16px; }
          .search-card { padding:20px 16px; }
          .hero-title { font-size:clamp(26px,8vw,38px); }
          .hero-sub { font-size:14px; }
          .btn-gold, .btn-outline { padding:12px 18px; font-size:12px; }
          .oweru-grid { grid-template-columns:1fr; }
          .section-hdr { margin-bottom:28px; }
        }

        /* Quick filters */
        .quick-filters { position:sticky; top:0; z-index:100; background:var(--navy-800); border-bottom:1px solid var(--border); }
        .filter-btn { display:flex; align-items:center; gap:6px; padding:10px 16px; background:transparent; color:var(--cream); border:1px solid var(--border); border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .filter-btn:hover { border-color:var(--gold); color:var(--gold); }
        .filter-btn.active { background:var(--gold); color:var(--navy-900); border-color:var(--gold); }
        .filter-icon { font-size:16px; }

        /* Stats bar — 4-col on desktop, 2x2 on mobile */
        .stats-bar { background:var(--navy-800); border-bottom:1px solid var(--border); }
        .stats-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); border-left:1px solid var(--border); }
        @media(max-width:700px) { .stats-inner { grid-template-columns:repeat(2,1fr); } }
        .stat-cell { text-align:center; padding:28px 16px; border-right:1px solid var(--border); }
        @media(max-width:700px) {
          .stat-cell:nth-child(2) { border-right:none; }
          .stat-cell:nth-child(3) { border-top:1px solid var(--border); }
        }

        /* Featured grid */
        .prop-grid { display:grid; grid-template-columns:1fr; gap:14px; }
        @media(min-width:600px) { .prop-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
        @media(min-width:900px) { .prop-grid { grid-template-columns:repeat(3,1fr); gap:18px; } }
        @media(min-width:1200px) { .prop-grid { grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:20px; } }

        /* Result cards grid */
        .result-grid { display:grid; grid-template-columns:1fr; gap:14px; }
        @media(min-width:600px) { .result-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
        @media(min-width:900px) { .result-grid { grid-template-columns:repeat(3,1fr); gap:18px; } }
        @media(min-width:1200px) { .result-grid { grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:20px; } }

        /* CTA section 2-col → 1-col */
        .cta-grid { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
        @media(max-width:800px) { .cta-grid { grid-template-columns:1fr; gap:40px; } }

        /* BnB grid */
        .bnb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:24px; }
        @media(max-width:500px) { .bnb-grid { grid-template-columns:1fr; } }
      `}</style>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-geo" />
        <div className="hero-content">
          {/* Left */}
          <div>
            <div className="hero-badge">
              <span className="hero-dot" /> Tanzania's Premier Rental Platform
            </div>
            <h1 className="hero-title">Find Your<br /><strong>Perfect Rental Property</strong></h1>
            <p className="hero-sub">Connect with trusted landlords and professional agents across Tanzania.</p>
            <div className="hero-btns">
              <Link to="/properties" className="btn-gold">Browse All <ArrowRight size={15} /></Link>
              <Link to="/register"   className="btn-outline">Create Account <ChevronRight size={14} /></Link>
            </div>
          </div>

          {/* Right — search card */}
          <div className="search-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div style={{ width: 38, height: 38, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-900)', borderRadius: 3, flexShrink: 0 }}>
                <Search size={18} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)' }}>Search Properties</div>
                <div style={{ fontSize: 12, color: 'var(--slate)' }}>Results appear below instantly</div>
              </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 10 }}>
              <input
                className="s-input"
                type="text"
                placeholder="Location, name, neighbourhood…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ paddingRight: searchTerm ? 36 : 14 }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="s-grid">
              <select className="s-select" value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
              </select>
              <select className="s-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                <option value="">All Prices</option>
                <option value="0-500">Under 500K TZS</option>
                <option value="500-1000">500K – 1M TZS</option>
                <option value="1000+">Above 1M TZS</option>
              </select>
            </div>

            <button onClick={handleSearch} className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
              <Search size={15} /> Search
            </button>

            {hasFilters && (
              <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--slate)', fontSize: 12, cursor: 'pointer', margin: '10px auto 0', fontFamily: 'inherit' }}>
                <X size={11} /> Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ══ QUICK FILTERS ══ */}
      {!searchActive && (
        <section style={{ background: 'var(--navy-800)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Properties', icon: '🏠' },
                { id: 'featured', label: 'Featured', icon: '⭐' },
                { id: 'bnb', label: 'Airbnbs', icon: '🏝️' },
                { id: 'oweru', label: 'Oweru Special', icon: '👑' },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => scrollToSection(filter.id === 'all' ? 'search-results' : filter.id === 'featured' ? 'featured' : filter.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    background: activeFilter === filter.id ? 'var(--gold)' : 'transparent',
                    color: activeFilter === filter.id ? 'var(--navy-900)' : 'var(--cream)',
                    border: `1px solid ${activeFilter === filter.id ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ SEARCH RESULTS ══ */}
      {searchActive && (
        <section id="search-results" style={{ background: 'var(--navy-700)', borderTop: '2px solid var(--gold)', borderBottom: '1px solid var(--border)' }}>
          <div className="section" style={{ paddingTop: 48, paddingBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 3, height: 20, background: 'var(--gold)', borderRadius: 2 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>Search Results</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)' }}>
                  {loading ? 'Searching…' : `${filteredProperties.length} propert${filteredProperties.length !== 1 ? 'ies' : 'y'} found`}
                  {searchTerm && <span style={{ fontWeight: 300, color: 'var(--slate)', fontSize: 16 }}> for "{searchTerm}"</span>}
                </h2>
              </div>
              <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--slate)', padding: '8px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit' }}>
                <X size={12} /> Clear
              </button>
            </div>

            {loading ? (
              <div className="result-grid">
                {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 320 }} />)}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Search size={40} style={{ color: 'var(--gold)', opacity: 0.4, marginBottom: 16 }} />
                <h3 style={{ color: 'var(--cream)', fontSize: 20, marginBottom: 8 }}>No properties found</h3>
                <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 20 }}>Try a different location, type, or price range.</p>
                <button onClick={clearSearch} className="btn-ghost">Clear filters</button>
              </div>
            ) : (
              <>
                <div className="result-grid">
                  {filteredProperties.map(p => (
                    <div key={p.id} className="result-card">
                      <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <img className="prop-img" src={getImage(p)} alt={p.title} style={{ height: 190 }}
                          onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                        <div style={{ padding: 18 }}>
                          {p.type && <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 5 }}>{p.type}</div>}
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)', marginBottom: 6, lineHeight: 1.3 }}>{p.title}</div>
                          <div style={{ color: 'var(--slate)', fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />{p.location || p.address}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 14 }}>
                            {formatPrice(p.price)}<span style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 400 }}>/mo</span>
                          </div>
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/property/${p.id}`); }}
                            style={{ width: '100%', background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', padding: '10px', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            View Details
                          </button>
                        </div>
                      </Link>
                      <div style={{ padding: '0 18px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <SaveButton saved={savedProperties.has(p.id)} onClick={() => handleSaveProperty(p.id)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <Link to="/properties" className="btn-ghost">View all listings <ArrowRight size={14} /></Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ══ STATS BAR ══ */}
      {!searchActive && (
        <div className="stats-bar">
          <div className="stats-inner">
            {[{ num: '1,247', lbl: 'Active Listings' }, { num: '3,842', lbl: 'Registered Users' }, { num: '892', lbl: 'Available Now' }, { num: '24 hr', lbl: 'Avg. Response' }].map(s => (
              <div key={s.lbl} className="stat-cell">
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>{s.num}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--slate)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ FEATURED LISTINGS ══ */}
      {!searchActive && (
        <section id="featured" style={{ background: 'var(--navy-900)', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1800&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            pointerEvents: 'none'
          }} />
          <div className="section">
            <div className="section-hdr">
              <div>
                <div className="section-tag">Featured Listings</div>
                <h2 className="section-title">Popular <span>Properties</span></h2>
              </div>
              {allProperties.length > 6 && (
                <Link to="/properties" className="btn-ghost">View All <ArrowRight size={15} /></Link>
              )}
            </div>
            {loading ? (
              <div className="prop-grid">
                {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 340 }} />)}
              </div>
            ) : (
              <div className="prop-grid">
                {allProperties.slice(0, 6).map(p => (
                  <div key={p.id} className="prop-card" style={{ borderRadius: 12 }}>
                    <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <img className="prop-img" src={getImage(p)} alt={p.title} style={{ height: 200 }}
                        onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                      <div style={{ padding: 20 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>{p.title}</div>
                        <div style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} style={{ color: 'var(--gold)' }} />{p.location || p.address}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                          {formatPrice(p.price)}<span style={{ fontSize: 12, color: 'var(--slate)' }}>/month</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); e.preventDefault(); navigate(`/property/${p.id}`); }}
                          style={{ width: '100%', background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', padding: '13px', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 6, cursor: 'pointer', marginTop: 16, fontFamily: 'inherit' }}>
                          View Details
                        </button>
                      </div>
                    </Link>
                    <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                      <SaveButton saved={savedProperties.has(p.id)} onClick={() => handleSaveProperty(p.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ BNB SECTION ══ */}
      {!searchActive && (
        <section id="bnb" style={{ background: 'var(--navy-800)', borderTop: '1px solid var(--border)', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1800&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            pointerEvents: 'none'
          }} />
          <div className="section">
            <div className="section-hdr">
              <div>
                <div className="section-tag">Vacation Rentals</div>
                <h2 className="section-title">Premium <span>BNB Properties</span></h2>
              </div>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--slate)', maxWidth: 280, textAlign: 'right' }}>Handpicked short-term rentals.</p>
            </div>
            {bnbLoading ? (
              <div className="bnb-grid">
                {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 380 }} />)}
              </div>
            ) : bnbProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--slate)' }}>
                <Building size={40} style={{ color: 'var(--gold)', opacity: 0.4, marginBottom: 16 }} />
                <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>No BNB properties yet</h3>
                <p style={{ fontSize: 14 }}>Short-term rentals will appear here soon.</p>
              </div>
            ) : (
              <div className="bnb-grid">
                {bnbProperties.map((p: any) => (
                  <div key={p.id} className="bnb-card" style={{ borderRadius: 12 }}>
                    <img className="prop-img" src={getImage(p)} alt={p.title} style={{ height: 220 }}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                    <div style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 10 }}>{p.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--slate)', fontSize: 13, marginBottom: 10 }}>
                        <MapPin size={12} style={{ color: 'var(--gold)' }} />{p.location}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                        {formatPrice(p.price)}<span style={{ fontSize: 12, color: 'var(--slate)' }}>/night</span>
                      </div>
                      <button onClick={() => { setSelectedProperty(p); setShowBookingModal(true); }}
                        style={{ width: '100%', marginTop: 16, background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', padding: '12px', fontWeight: 600, fontSize: 13, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ OWERU PACKAGES ══ */}
      {!searchActive && (
        <section id="oweru" style={{ background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)', borderTop: '1px solid var(--border)', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1800&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            pointerEvents: 'none'
          }} />
          <div className="section">
            <div className="section-hdr">
              <div>
                <div className="section-tag">Exclusive Offers</div>
                <h2 className="section-title">Oweru <span>Special Packages</span></h2>
              </div>
              <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--slate)', maxWidth: 280, textAlign: 'right' }}>Premium properties handpicked by Oweru.</p>
            </div>
            {oweruLoading ? (
              <div className="oweru-grid">{[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 360 }} />)}</div>
            ) : oweruProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--slate)' }}>
                <Building size={40} style={{ color: 'var(--gold)', opacity: 0.4, marginBottom: 16 }} />
                <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>No Oweru packages yet</h3>
                <p style={{ fontSize: 14 }}>Premium properties will appear here soon.</p>
              </div>
            ) : (
              <div className="oweru-grid">
                {oweruProperties.map((p: any) => (
                  <div key={p.id} className="oweru-card" onClick={() => navigate(`/property/${p.id}`)} style={{ borderRadius: 12 }}>
                    <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
                      <img className="prop-img" src={getImage(p)} alt={p.title} style={{ height: 210 }}
                        onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }} />
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--gold)', color: 'var(--navy-900)', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>OWERU</div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--cream)', marginBottom: 10, lineHeight: 1.3 }}>{p.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: 'var(--slate)', fontSize: 13 }}>
                        <MapPin size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />{p.location || p.address || 'Tanzania'}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 18 }}>
                        {formatPrice(p.price)} <span style={{ fontSize: 13, color: 'var(--slate)', fontWeight: 400 }}>/month</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); navigate(`/property/${p.id}`); }}
                        style={{ width: '100%', background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', padding: '13px', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ CTA ══ */}
      {!searchActive && (
        <section style={{ background: 'var(--navy-900)', borderTop: '1px solid var(--border)' }}>
          <div className="section">
            <div className="cta-grid">
              <div>
                <div className="section-tag">Get Started</div>
                <h2 style={{ fontSize: 'clamp(26px,3.5vw,48px)', fontWeight: 700, color: 'var(--cream)', marginBottom: 16, lineHeight: 1.1 }}>
                  Ready to Find Your <strong>Next Home?</strong>
                </h2>
                <p style={{ fontSize: 15, color: 'var(--slate)', marginBottom: 32, lineHeight: 1.7 }}>
                  Join thousands of Tanzanians who found their perfect rental through Oweru.
                </p>
                <Link to="/properties" className="btn-gold">Browse All Properties <ArrowRight size={15} /></Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Verified landlords & agents', 'Secure payment processing', 'Dedicated tenant support', 'Digital contract management'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--navy-800)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--cream)', fontSize: 14 }}>
                    <div style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ BOOKING MODAL ══ */}
      {showBookingModal && selectedProperty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'var(--navy-800)', border: '1px solid var(--border)', padding: 36, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 12 }}>
            <BookingForm
              property={selectedProperty}
              onClose={() => setShowBookingModal(false)}
              onSuccess={() => { setShowBookingModal(false); alert('Booking submitted! The owner will contact you soon.'); }}
            />
          </div>
        </div>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ background: 'var(--navy-900)', borderTop: '1px solid var(--border)', padding: '28px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <img src={LOGO} alt="OWERU" style={{ height: 22 }} />
          <div style={{ color: 'var(--slate)', fontSize: 13 }}>&copy; 2026 Oweru. Tanzania.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;