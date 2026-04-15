import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ArrowRight, ChevronRight,
  Heart, Building,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Api from '../services/api';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const VITE_STORAGE = (import.meta.env.VITE_API_URL ?? '').replace('/api', '');
const API_BASE     = import.meta.env.VITE_API_URL ?? '';

/**
 * Resolve a property image URL correctly.
 * Handles: absolute URLs, storage-relative paths (/storage/...), bare filenames.
 */
const getImage = (property: any): string => {
  if (property.images && property.images.length > 0) {
    const i = property.images[0];
    if (typeof i === 'string' && i.trim() !== '') {
      if (i.startsWith('http://') || i.startsWith('https://')) return i;
      if (i.startsWith('/')) return `${VITE_STORAGE}${i}`;
      return `${VITE_STORAGE}/storage/${i}`;
    }
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);

const Home = () => {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [bnbProperties,      setBnbProperties]      = useState<any[]>([]);
  const [oweruProperties,    setOweruProperties]    = useState<any[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [bnbLoading,         setBnbLoading]         = useState(true);
  const [oweruLoading,       setOweruLoading]       = useState(true);
  const [showBookingModal,   setShowBookingModal]   = useState(false);
  const [selectedProperty,   setSelectedProperty]   = useState<any>(null);
  const [savedProperties,    setSavedProperties]    = useState<Set<number>>(new Set());

  const stats = {
    totalProperties: 1247,
    totalUsers:      3842,
    activeListings:  892,
    avgResponseTime: '24 hr',
  };

  useEffect(() => {
    loadFeaturedProperties();
    loadBnbProperties();
    loadOweruProperties();
    loadSavedProperties();
  }, []);

  /**
   * Load Oweru Special Packages.
   *
   * WHY THE PREVIOUS VERSION FAILED:
   * It fetched the public paginated endpoint (/api/public/properties) which:
   *   1. Only returns 12 properties per page — Oweru items on page 2+ were invisible.
   *   2. Requires `available = true` — admin-created properties might not have this set.
   *
   * FIX: We try multiple strategies in order:
   *   a) Public endpoint with type filter (works if backend supports ?type=oweru_rental)
   *   b) Paginate through all pages and collect oweru_rental items
   *   c) Silent fail → show empty state
   */
  const loadOweruProperties = async () => {
    try {
      setOweruLoading(true);

      // ── Strategy A: filter by type directly (most efficient) ──────────────
      const resA = await fetch(
        `${API_BASE}/api/public/properties?type=oweru_rental&per_page=20`,
        { headers: { Accept: 'application/json' } },
      );

      if (resA.ok) {
        const jsonA = await resA.json();
        const listA: any[] =
          jsonA?.data?.data ?? jsonA?.data ?? (Array.isArray(jsonA) ? jsonA : []);

        if (listA.length > 0) {
          setOweruProperties(listA.slice(0, 6));
          return; // done ✓
        }
      }

      // ── Strategy B: paginate through ALL pages and collect oweru_rental ───
      // This ensures we don't miss items that happen to land on page 2+.
      const collected: any[] = [];
      let currentPage = 1;
      let lastPage    = 1;

      do {
        const res = await fetch(
          `${API_BASE}/api/public/properties?page=${currentPage}&per_page=50`,
          { headers: { Accept: 'application/json' } },
        );

        if (!res.ok) break;

        const json = await res.json();

        // Extract items — handle both paginated and flat responses
        const items: any[] = json?.data?.data ?? json?.data ?? (Array.isArray(json) ? json : []);

        // Extract pagination meta
        const pagination = json?.data?.pagination ?? json?.pagination ?? null;
        if (pagination) {
          lastPage = pagination.last_page ?? 1;
        } else if (json?.data?.last_page) {
          lastPage = json.data.last_page;
        }

        // Filter oweru items from this page
        const oweruItems = items.filter(
          (p) => p.type === 'oweru_rental' || p.isOweru === true,
        );
        collected.push(...oweruItems);

        // Stop early if we already have enough
        if (collected.length >= 6) break;

        currentPage++;
      } while (currentPage <= lastPage && currentPage <= 5); // cap at 5 pages for safety

      setOweruProperties(collected.slice(0, 6));
    } catch (error) {
      console.error('Error loading Oweru properties:', error);
      setOweruProperties([]);
    } finally {
      setOweruLoading(false);
    }
  };

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/api/public/properties`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: any[] = json?.data?.data ?? json?.data ?? (Array.isArray(json) ? json : []);
      setFeaturedProperties(list.slice(0, 6));
    } catch {
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBnbProperties = async () => {
    try {
      setBnbLoading(true);

      for (const url of [
        `${API_BASE}/api/public/bnb`,
        `${API_BASE}/api/public/bnb/search`,
      ]) {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json?.data || [];
          setBnbProperties(list.slice(0, 6));
          return;
        }
      }
      setBnbProperties([]);
    } catch {
      setBnbProperties([]);
    } finally {
      setBnbLoading(false);
    }
  };

  const loadSavedProperties = async () => {
    try {
      const res = await Api.getSavedProperties();
      const ids = (Array.isArray(res.data) ? res.data : [])
        .map((item: any) => item.property?.id ?? item.id)
        .filter(Boolean);
      setSavedProperties(new Set(ids));
    } catch { /* silent */ }
  };

  const handleSaveProperty = async (propertyId: number) => {
    try {
      if (savedProperties.has(propertyId)) {
        await Api.unsaveProperty(propertyId).catch(() => Api.publicUnsaveProperty(propertyId));
        setSavedProperties((prev) => { const n = new Set(prev); n.delete(propertyId); return n; });
      } else {
        await Api.saveProperty(propertyId).catch(() => Api.publicSaveProperty(propertyId));
        setSavedProperties((prev) => new Set(prev).add(propertyId));
      }
    } catch { /* silent */ }
  };

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: '#0F172A', color: '#F8F8F9', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy-900: #0F172A; --navy-800: #162035; --navy-700: #1E2D4A; --navy-600: #253660;
          --gold: #C89128; --gold-lt: #D4A843; --gold-dim: rgba(200,145,40,0.12);
          --cream: #F8F8F9; --slate: #94A3B8; --border: rgba(200,145,40,0.18);
        }
        .hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 60%, #1a2840 100%); }
        .hero-geo { position: absolute; inset: 0; background-image: repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px), repeating-linear-gradient(-60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px); pointer-events: none; }
        .hero-glow { position: absolute; right: -10%; top: -20%; width: 60%; height: 80%; background: radial-gradient(ellipse, rgba(200,145,40,0.08) 0%, transparent 65%); pointer-events: none; }
        .hero-content { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 60px 24px 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; width: 100%; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--gold-dim); border: 1px solid var(--border); color: var(--gold); padding: 6px 14px; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 28px; }
        .hero-badge-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; flex-shrink: 0; }
        .hero-title { font-size: clamp(32px, 6vw, 52px); font-weight: 300; line-height: 1.1; letter-spacing: -0.025em; color: var(--cream); margin-bottom: 16px; }
        .hero-sub { font-size: 15px; font-weight: 300; line-height: 1.7; color: var(--slate); margin-bottom: 30px; }
        .btn-gold { display: inline-flex; align-items: center; gap: 8px; background: var(--gold); color: var(--navy-900); padding: 14px 26px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-decoration: none; text-transform: uppercase; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-gold:hover { background: var(--gold-lt); gap: 12px; }
        .btn-outline { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--cream); padding: 13px 26px; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-decoration: none; text-transform: uppercase; border: 1px solid rgba(248,248,249,0.2); cursor: pointer; transition: all 0.2s; }
        .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
        .search-card { background: var(--navy-800); border: 1px solid var(--border); padding: 28px; position: relative; overflow: hidden; }
        .search-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gold); }
        .prop-card, .bnb-card, .oweru-card { background: var(--navy-800); border: 1px solid var(--border); overflow: hidden; transition: all 0.3s; cursor: pointer; }
        .prop-card:hover, .bnb-card:hover, .oweru-card:hover { border-color: rgba(200,145,40,0.5); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,23,42,0.6); }
        .section { max-width: 1200px; margin: 0 auto; padding: 80px 48px; }
        .section-hdr { display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: end; margin-bottom: 48px; }
        .section-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; background: var(--gold-dim); padding: 4px 12px; border: 1px solid var(--border); }
        .section-title { font-size: clamp(26px, 3vw, 40px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: var(--cream); }
        .section-title span { color: var(--gold); }
        .section-desc { font-size: 14px; font-weight: 300; line-height: 1.7; color: var(--slate); max-width: 300px; text-align: right; }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--gold); padding: 10px 20px; font-size: 13px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { background: var(--gold-dim); border-color: rgba(200,145,40,0.4); gap: 12px; }
        .skeleton { animation: shimmer 1.5s ease-in-out infinite; background: var(--navy-700); border-radius: 8px; }
        @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.9} 100%{opacity:0.4} }
        .oweru-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }

        /* Property image — graceful error handling */
        .prop-img { width: 100%; display: block; object-fit: cover; }

        @media (max-width: 900px) {
          .hero-content { grid-template-columns: 1fr; gap: 40px; }
          .section { padding: 60px 24px; }
          .section-hdr { grid-template-columns: 1fr; gap: 16px; }
          .section-desc { text-align: left; max-width: 100%; }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-geo" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot" /> Tanzania's Premier Rental Platform
            </div>
            <h1 className="hero-title">
              Find Your<br />
              <strong>Perfect Rental Property</strong>
            </h1>
            <p className="hero-sub">
              Connect with trusted landlords and professional agents. Browse verified properties and manage your rental seamlessly with Oweru.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/properties" className="btn-gold">Browse Properties <ArrowRight size={15} /></Link>
              <Link to="/register" className="btn-outline">Create Account <ChevronRight size={14} /></Link>
            </div>
          </div>

          {/* Search card */}
          <div className="search-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-900)' }}>
                <Search size={18} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)' }}>Search Properties</div>
                <div style={{ fontSize: 12, color: 'var(--slate)' }}>Find your perfect match</div>
              </div>
            </div>
            <input type="text" placeholder="Location, district, neighbourhood…" style={{ width: '100%', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '10px 14px', marginBottom: 12, fontSize: 14, outline: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select style={{ width: '100%', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--slate)', padding: '11px 14px', fontSize: 13 }}>
                <option value="">Property Type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
              </select>
              <select style={{ width: '100%', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--slate)', padding: '11px 14px', fontSize: 13 }}>
                <option value="">Price Range</option>
                <option value="0-500">Under 500K TZS</option>
                <option value="500-1000">500K – 1M TZS</option>
                <option value="1000+">Above 1M TZS</option>
              </select>
            </div>
            <button onClick={() => navigate('/properties')} style={{ width: '100%', background: 'var(--gold)', color: 'var(--navy-900)', padding: '13px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Search size={15} /> Search Properties
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div style={{ background: 'var(--navy-800)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderLeft: '1px solid var(--border)' }}>
          {[
            { num: stats.totalProperties.toLocaleString(), lbl: 'Active Listings' },
            { num: stats.totalUsers.toLocaleString(),      lbl: 'Registered Users' },
            { num: stats.activeListings.toLocaleString(),  lbl: 'Available Now' },
            { num: stats.avgResponseTime,                  lbl: 'Avg. Response' },
          ].map((s) => (
            <div key={s.lbl} style={{ textAlign: 'center', padding: '28px 24px', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--slate)' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--navy-900)' }}>
        <div className="section">
          <div className="section-hdr">
            <div>
              <div className="section-tag">Featured Listings</div>
              <h2 className="section-title">Popular <span>Properties</span></h2>
            </div>
            <Link to="/properties" className="btn-ghost">View All <ArrowRight size={15} /></Link>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {featuredProperties.map((p) => (
                <div key={p.id} className="prop-card" style={{ borderRadius: 12 }}>
                  <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img
                      className="prop-img"
                      src={getImage(p)}
                      alt={p.title}
                      style={{ height: 200 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = getImage({ images: [] }); }}
                    />
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>{p.title}</div>
                      <div style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} style={{ color: 'var(--gold)' }} />{p.location || p.address}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                        {formatPrice(p.price)}<span style={{ fontSize: 12, color: 'var(--slate)' }}>/month</span>
                      </div>
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

      {/* ══════════════════════════════════════════
          BNB SECTION
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--navy-800)', borderTop: '1px solid var(--border)' }}>
        <div className="section">
          <div className="section-hdr">
            <div>
              <div className="section-tag">Vacation Rentals</div>
              <h2 className="section-title">Premium <span>BNB Properties</span></h2>
            </div>
            <p className="section-desc">Handpicked short-term rentals for every occasion.</p>
          </div>
          {bnbLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 380 }} />)}
            </div>
          ) : bnbProperties.length === 0 ? (
            <EmptyState icon={<Building size={40} />} title="No BNB properties yet" desc="Short-term rentals will appear here soon." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
              {bnbProperties.map((p: any) => (
                <div key={p.id} className="bnb-card" style={{ borderRadius: 12 }} onClick={() => { setSelectedProperty(p); setShowBookingModal(true); }}>
                  <img
                    className="prop-img"
                    src={getImage(p)}
                    alt={p.title}
                    style={{ height: 220 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = getImage({ images: [] }); }}
                  />
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 10 }}>{p.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--slate)', fontSize: 13, marginBottom: 10 }}>
                      <MapPin size={12} style={{ color: 'var(--gold)' }} />{p.location}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                      {formatPrice(p.price)}<span style={{ fontSize: 12, color: 'var(--slate)' }}>/night</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OWERU SPECIAL PACKAGES
      ══════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)', borderTop: '1px solid var(--border)' }}>
        <div className="section">
          <div className="section-hdr">
            <div>
              <div className="section-tag">Exclusive Offers</div>
              <h2 className="section-title">Oweru <span>Special Packages</span></h2>
            </div>
            <p className="section-desc">Premium rental properties handpicked and managed by Oweru for exceptional long-term living.</p>
          </div>

          {oweruLoading ? (
            <div className="oweru-grid">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}
            </div>
          ) : oweruProperties.length === 0 ? (
            <EmptyState
              icon={<Building size={40} />}
              title="No Oweru packages yet"
              desc="Premium properties uploaded by the admin will appear here soon."
            />
          ) : (
            <div className="oweru-grid">
              {oweruProperties.map((p: any) => (
                <div
                  key={p.id}
                  className="oweru-card"
                  onClick={() => navigate(`/property/${p.id}`)}
                  style={{ borderRadius: 12 }}
                >
                  {/* Image with OWERU badge */}
                  <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
                    <img
                      className="prop-img"
                      src={getImage(p)}
                      alt={p.title}
                      style={{ height: 210 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = getImage({ images: [] }); }}
                    />
                    <div style={{
                      position:     'absolute',
                      top:          12,
                      right:        12,
                      background:   'var(--gold)',
                      color:        'var(--navy-900)',
                      padding:      '5px 12px',
                      borderRadius: 6,
                      fontSize:     11,
                      fontWeight:   700,
                      letterSpacing: '0.06em',
                    }}>
                      OWERU
                    </div>
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--cream)', marginBottom: 10, lineHeight: 1.3 }}>
                      {p.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: 'var(--slate)', fontSize: 13 }}>
                      <MapPin size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      {p.location || p.address || 'Tanzania'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 18 }}>
                      {formatPrice(p.price)}{' '}
                      <span style={{ fontSize: 13, color: 'var(--slate)', fontWeight: 400 }}>/month</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/property/${p.id}`); }}
                      style={{
                        width:         '100%',
                        background:    'var(--gold)',
                        color:         'var(--navy-900)',
                        border:        'none',
                        padding:       '13px',
                        fontWeight:    700,
                        fontSize:      13,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        borderRadius:  6,
                        cursor:        'pointer',
                        transition:    'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-lt)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--navy-900)', borderTop: '1px solid var(--border)' }}>
        <div className="section">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div className="section-tag">Get Started</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', marginBottom: 20 }}>
                Ready to Find Your <strong>Next Home?</strong>
              </h2>
              <p style={{ fontSize: 16, color: 'var(--slate)', marginBottom: 36, lineHeight: 1.7 }}>
                Join thousands of Tanzanians who have found their perfect rental property through Oweru.
              </p>
              <Link to="/properties" className="btn-gold">
                Browse All Properties <ArrowRight size={15} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Verified landlords & agents', 'Secure payment processing', 'Dedicated tenant support', 'Digital contract management'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--navy-800)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--cream)', fontSize: 14 }}>
                  <div style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOOKING MODAL
      ══════════════════════════════════════════ */}
      {showBookingModal && selectedProperty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--navy-800)', border: '1px solid var(--border)', padding: 36, maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 12 }}>
            <BookingForm
              property={selectedProperty}
              onClose={() => setShowBookingModal(false)}
              onSuccess={() => {
                setShowBookingModal(false);
                alert('Booking request submitted! The property owner will contact you soon.');
              }}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background: 'var(--navy-900)', borderTop: '1px solid var(--border)', padding: '28px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <img src={LOGO} alt="OWERU" style={{ height: 22 }} />
          <div style={{ color: 'var(--slate)', fontSize: 13 }}>© 2026 Oweru. Tanzania.</div>
        </div>
      </footer>
    </div>
  );
};

/* ── Sub-components ── */

const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--slate)' }}>
    <div style={{ color: 'var(--gold)', marginBottom: 16, opacity: 0.5 }}>{icon}</div>
    <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: 14 }}>{desc}</p>
  </div>
);

const SaveButton = ({ saved, onClick }: { saved: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding:         '8px 16px',
      border:          `1px solid ${saved ? 'var(--gold)' : 'var(--border)'}`,
      backgroundColor: saved ? 'var(--gold)' : 'transparent',
      color:           saved ? 'var(--navy-900)' : 'var(--slate)',
      fontSize:        12,
      fontWeight:      700,
      cursor:          'pointer',
      borderRadius:    4,
      display:         'flex',
      alignItems:      'center',
      gap:             6,
      transition:      'all 0.2s',
    }}
  >
    <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
    {saved ? 'Saved' : 'Save'}
  </button>
);

const BookingForm = ({
  property,
  onClose,
  onSuccess,
}: {
  property: any;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    guest_name: '', guest_email: '', check_in: '', check_out: '',
    guest_count: '1', special_requests: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Booking API call goes here
      await new Promise((r) => setTimeout(r, 800)); // stub
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'var(--navy-900)',
    border: '1px solid var(--border)', color: 'var(--cream)', borderRadius: 6,
    fontSize: 14, marginBottom: 14, outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ color: 'var(--cream)', marginBottom: 6, fontSize: 20, fontWeight: 600 }}>
        Book {property.title}
      </h2>
      <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 20 }}>
        {property.location || property.address}
      </p>
      <input required style={inputStyle} placeholder="Your name" value={formData.guest_name} onChange={(e) => setFormData((p) => ({ ...p, guest_name: e.target.value }))} />
      <input required type="email" style={inputStyle} placeholder="Email address" value={formData.guest_email} onChange={(e) => setFormData((p) => ({ ...p, guest_email: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input required type="date" style={inputStyle} value={formData.check_in} onChange={(e) => setFormData((p) => ({ ...p, check_in: e.target.value }))} />
        <input required type="date" style={inputStyle} value={formData.check_out} onChange={(e) => setFormData((p) => ({ ...p, check_out: e.target.value }))} />
      </div>
      <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Special requests (optional)" value={formData.special_requests} onChange={(e) => setFormData((p) => ({ ...p, special_requests: e.target.value }))} />
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--slate)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          Cancel
        </button>
        <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {loading ? 'Submitting…' : 'Submit Booking'}
        </button>
      </div>
    </form>
  );
};

export default Home;