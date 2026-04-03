import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Square, ArrowRight, ChevronRight,
  Heart, Users, Home as HomeIcon, Shield, TrendingUp, Building,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Api from '../services/api';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';
const API_BASE     = import.meta.env.VITE_API_URL ?? '';

/* ── helpers ── */
const getImage = (property: any): string => {
  if (property.images?.length) {
    const i = property.images[0];
    return i.startsWith('http') ? i : `${VITE_STORAGE}/storage/${i}`;
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%238a8070'%3ENo Image%3C/text%3E%3C/svg%3E`;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);

/* ────────────────────────────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();

  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [bnbProperties,      setBnbProperties]      = useState<any[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [bnbLoading,         setBnbLoading]         = useState(true);
  const [showBookingModal,   setShowBookingModal]   = useState(false);
  const [selectedProperty,   setSelectedProperty]   = useState<any>(null);
  const [savedProperties,    setSavedProperties]    = useState<Set<number>>(new Set());

  const [stats] = useState({
    totalProperties: 1247,
    totalUsers:      3842,
    activeListings:   892,
    avgResponseTime: '24 hr',
  });

  useEffect(() => {
    loadFeaturedProperties();
    loadBnbProperties();
    loadSavedProperties();
  }, []);

  /* ── loaders ── */

  /**
   * Fetch rental properties from the PUBLIC endpoint.
   * Route: GET /public/properties  →  { data: [...], ... }
   */
  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/public/properties`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Backend may return { data: [...] } or { data: { data: [...] } }
      const list: any[] = json.data?.data ?? json.data ?? json ?? [];
      setFeaturedProperties(Array.isArray(list) ? list.slice(0, 6) : []);
    } catch {
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch BNB / vacation properties from the PUBLIC search endpoint.
   * Route: GET /public/bnb/search  →  plain array
   * (Backend: BnbPropertyController::search() returns response()->json($properties))
   */
  const loadBnbProperties = async () => {
    try {
      console.log('🔍 Loading BNB properties...');
      setBnbLoading(true);
      const url = `${API_BASE}/api/public/bnb/search`;
      console.log('🌐 Fetching from:', url);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      console.log('📡 Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        console.error('❌ Response not OK:', res.status, res.statusText);
        throw new Error(`HTTP ${res.status}`);
      }
      
      const json = await res.json();
      console.log('📦 BNB API Response:', json);
      console.log('📊 Response type:', typeof json);
      console.log('🔢 Is array?', Array.isArray(json));
      
      // search() does: return response()->json($properties)  → plain array
      const list: any[] = Array.isArray(json) ? json : (json.data ?? []);
      console.log('🏠 Final BNB list:', list);
      console.log('📈 BNB count:', list.length);
      
      setBnbProperties(list);
    } catch (error) {
      console.error('❌ Failed to load BNB properties:', error);
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
    } catch { /* not logged in – ignore */ }
  };

  const handleSaveProperty = async (propertyId: number) => {
    try {
      if (savedProperties.has(propertyId)) {
        try { await Api.unsaveProperty(propertyId); }
        catch { await Api.publicUnsaveProperty(propertyId); }
        setSavedProperties(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
      } else {
        try { await Api.saveProperty(propertyId); }
        catch { await Api.publicSaveProperty(propertyId); }
        setSavedProperties(prev => new Set(prev).add(propertyId));
      }
    } catch { /* silently ignore */ }
  };

  /* ── render ── */
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: '#0a0a0a', color: '#f5f0e8', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --gold:#c9a84c;--gold-light:#e8c97a;
          --dark:#0a0a0a;--dark-2:#111111;--dark-3:#1a1a1a;
          --cream:#f5f0e8;--muted:#8a8070;--border:rgba(201,168,76,0.15);
        }
        .sans{font-family:'DM Sans',sans-serif}

        .hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden;border-bottom:1px solid var(--border)}
        .hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 70% 50%,rgba(201,168,76,0.07) 0%,transparent 60%),radial-gradient(ellipse 50% 80% at 20% 80%,rgba(201,168,76,0.04) 0%,transparent 50%),linear-gradient(160deg,#0f0f0f 0%,#0a0a0a 60%,#0d0c08 100%)}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)}
        .hero-number{position:absolute;right:8%;top:50%;transform:translateY(-50%);font-size:clamp(180px,22vw,320px);font-weight:700;color:transparent;-webkit-text-stroke:1px rgba(201,168,76,0.08);line-height:1;user-select:none;letter-spacing:-0.05em}
        .hero-content{position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:120px 40px 80px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;width:100%}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:24px}
        .hero-eyebrow::before{content:'';width:24px;height:1px;background:var(--gold)}
        .hero-title{font-size:clamp(42px,5vw,72px);font-weight:300;line-height:1.05;letter-spacing:-0.02em;color:var(--cream);margin-bottom:24px}
        .hero-title em{font-style:italic;color:var(--gold-light);font-weight:300}
        .hero-subtitle{font-family:'DM Sans',sans-serif;font-size:16px;font-weight:300;line-height:1.7;color:var(--muted);margin-bottom:40px;max-width:420px}
        .hero-actions{display:flex;gap:16px;align-items:center;flex-wrap:wrap}

        .btn-primary{display:inline-flex;align-items:center;gap:10px;background:var(--gold);color:#0a0a0a;padding:14px 28px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border:none;cursor:pointer;transition:all 0.25s ease;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))}
        .btn-primary:hover{background:var(--gold-light);gap:16px}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--cream);padding:14px 0;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;letter-spacing:0.05em;text-decoration:none;border-bottom:1px solid rgba(245,240,232,0.2);transition:all 0.25s ease}
        .btn-ghost:hover{color:var(--gold);border-color:var(--gold);gap:12px}

        .search-panel{background:rgba(26,26,26,0.8);border:1px solid var(--border);backdrop-filter:blur(20px);padding:32px;position:relative}
        .search-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
        .search-label{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);margin-bottom:20px;display:flex;align-items:center;gap:8px}
        .search-label::before{content:'//';color:var(--gold)}
        .search-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.12);color:var(--cream);padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;margin-bottom:12px;outline:none;transition:border-color 0.2s}
        .search-input::placeholder{color:rgba(138,128,112,0.6)}
        .search-input:focus{border-color:rgba(201,168,76,0.4)}
        .search-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
        .search-select{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.12);color:var(--muted);padding:12px 16px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;outline:none;cursor:pointer;appearance:none;transition:border-color 0.2s}
        .search-select:focus{border-color:rgba(201,168,76,0.4);color:var(--cream)}
        .search-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#0a0a0a;padding:14px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border:none;cursor:pointer;transition:all 0.2s}
        .search-btn:hover{background:var(--gold-light)}
        .search-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
        .search-tag{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--muted);padding:4px 10px;border:1px solid rgba(201,168,76,0.1);cursor:pointer;transition:all 0.2s;text-decoration:none}
        .search-tag:hover{color:var(--gold);border-color:rgba(201,168,76,0.4)}

        .stats-bar{background:var(--dark-3);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:28px 40px}
        .stats-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
        .stat-item{text-align:center;padding:0 24px;border-right:1px solid var(--border)}
        .stat-item:last-child{border-right:none}
        .stat-number{font-size:32px;font-weight:300;color:var(--gold);line-height:1;margin-bottom:6px;letter-spacing:-0.02em}
        .stat-label{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)}

        .section{max-width:1200px;margin:0 auto;padding:100px 40px}
        .section-header{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:end;margin-bottom:64px}
        .section-eyebrow{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.25em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .section-eyebrow::after{content:'';flex:1;height:1px;background:var(--border)}
        .section-title{font-size:clamp(32px,3.5vw,48px);font-weight:300;line-height:1.1;letter-spacing:-0.02em;color:var(--cream)}
        .section-title em{font-style:italic;color:var(--gold-light)}
        .section-desc{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:300;line-height:1.7;color:var(--muted);align-self:end}

        .features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border)}
        .feature-card{background:var(--dark-2);padding:40px 32px;position:relative;overflow:hidden;transition:background 0.3s}
        .feature-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),transparent);transform:scaleX(0);transform-origin:left;transition:transform 0.4s ease}
        .feature-card:hover{background:rgba(26,26,26,0.9)}
        .feature-card:hover::after{transform:scaleX(1)}
        .feature-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.15);margin-bottom:24px;color:var(--gold)}
        .feature-number{position:absolute;top:16px;right:20px;font-size:11px;font-family:'DM Sans',sans-serif;color:rgba(201,168,76,0.2);letter-spacing:0.1em}
        .feature-title{font-size:20px;font-weight:400;color:var(--cream);margin-bottom:12px;letter-spacing:-0.01em}
        .feature-desc{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;line-height:1.65;color:var(--muted)}

        .how-section{background:var(--dark-3);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .how-grid{display:grid;grid-template-columns:1fr 2fr;gap:80px;align-items:start}
        .how-steps{display:flex;flex-direction:column;gap:0}
        .how-step{display:grid;grid-template-columns:48px 1fr;gap:24px;padding:32px 0;border-bottom:1px solid var(--border);align-items:start}
        .how-step:last-child{border-bottom:none}
        .step-num{font-size:11px;font-family:'DM Sans',sans-serif;font-weight:500;color:var(--gold);letter-spacing:0.1em;padding-top:4px}
        .step-title{font-size:20px;font-weight:400;color:var(--cream);margin-bottom:8px;letter-spacing:-0.01em}
        .step-desc{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:300;line-height:1.65;color:var(--muted)}
        .how-visual{position:sticky;top:80px;background:rgba(201,168,76,0.04);border:1px solid var(--border);padding:48px;text-align:center}
        .visual-badge{display:inline-flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:32px}
        .visual-ring{width:100px;height:100px;border:1px solid rgba(201,168,76,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative}
        .visual-ring::before{content:'';position:absolute;inset:8px;border:1px solid rgba(201,168,76,0.15);border-radius:50%}
        .visual-inner{font-size:28px;font-weight:300;color:var(--gold);letter-spacing:-0.03em}
        .visual-divider{width:1px;height:40px;background:linear-gradient(to bottom,var(--gold),transparent);margin:0 auto 32px}
        .visual-stats{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);border:1px solid var(--border)}
        .visual-stat{background:var(--dark-2);padding:20px}
        .visual-stat-num{font-size:22px;font-weight:300;color:var(--gold-light);margin-bottom:4px}
        .visual-stat-lbl{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--muted);letter-spacing:0.08em}

        .cta-section{position:relative;overflow:hidden;border-top:1px solid var(--border)}
        .cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 100% at 100% 50%,rgba(201,168,76,0.08) 0%,transparent 60%),radial-gradient(ellipse 40% 80% at 0% 50%,rgba(201,168,76,0.04) 0%,transparent 50%)}
        .cta-inner{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:120px 40px;display:grid;grid-template-columns:1.2fr 1fr;gap:80px;align-items:center}
        .cta-title{font-size:clamp(36px,4vw,56px);font-weight:300;line-height:1.05;letter-spacing:-0.02em;color:var(--cream);margin-bottom:20px}
        .cta-title em{font-style:italic;color:var(--gold-light)}
        .cta-desc{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:300;line-height:1.7;color:var(--muted);margin-bottom:40px}
        .cta-right{display:flex;flex-direction:column;gap:16px}
        .cta-card{background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);padding:24px;display:flex;align-items:center;gap:20px;text-decoration:none;transition:all 0.3s}
        .cta-card:hover{background:rgba(201,168,76,0.1);border-color:rgba(201,168,76,0.35);transform:translateX(4px)}
        .cta-card-icon{width:44px;height:44px;background:rgba(201,168,76,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold)}
        .cta-card-title{font-size:17px;font-weight:400;color:var(--cream);margin-bottom:4px;letter-spacing:-0.01em}
        .cta-card-desc{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;color:var(--muted)}
        .cta-card-arrow{margin-left:auto;color:var(--gold);opacity:0;transition:opacity 0.2s;flex-shrink:0}
        .cta-card:hover .cta-card-arrow{opacity:1}

        .footer-bar{border-top:1px solid var(--border);padding:24px 40px;display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto}
        .footer-links{display:flex;gap:32px;list-style:none}
        .footer-links a{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:400;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;transition:color 0.2s}
        .footer-links a:hover{color:var(--gold)}
        .footer-copy{font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(138,128,112,0.5)}

        .rental-card{transition:border-color 0.3s,transform 0.3s}
        .rental-card:hover{border-color:var(--gold)!important;transform:translateY(-4px)}
        .bnb-card{transition:border-color 0.3s,transform 0.3s}
        .bnb-card:hover{border-color:rgba(201,168,76,0.45)!important;transform:translateY(-4px)}

        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .skeleton{animation:pulse 1.5s ease-in-out infinite;background:rgba(201,168,76,0.06);border-radius:8px}

        @media(max-width:900px){
          .hero-content{grid-template-columns:1fr;gap:48px;padding:100px 24px 60px}
          .hero-number{display:none}
          .section{padding:70px 24px}
          .section-header{grid-template-columns:1fr;gap:20px}
          .features-grid{grid-template-columns:1fr 1fr}
          .how-grid{grid-template-columns:1fr}
          .how-visual{display:none}
          .stats-inner{grid-template-columns:repeat(2,1fr);gap:1px;background:var(--border)}
          .stat-item{border-right:none;padding:20px;background:var(--dark-3)}
          .cta-inner{grid-template-columns:1fr;gap:40px;padding:70px 24px}
          .footer-bar{flex-direction:column;gap:20px;text-align:center;padding:24px}
          .footer-links{flex-wrap:wrap;justify-content:center;gap:16px}
        }
        @media(max-width:600px){
          .features-grid{grid-template-columns:1fr}
          .search-row{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" /><div className="hero-grid" />
        <div className="hero-number">TZ</div>
        <div className="hero-content">
          <div>
            <div className="hero-eyebrow">Tanzania's Premier Rental Platform</div>
            <h1 className="hero-title">Find Your <em>Perfect</em><br />Rental Property</h1>
            <p className="hero-subtitle">
              Connect with trusted landlords and professional agents. Browse verified
              properties and manage your rental seamlessly with Oweru.
            </p>
            <div className="hero-actions">
              <Link to="/properties" className="btn-primary">Browse Properties <ArrowRight size={16} /></Link>
              <Link to="/register" className="btn-ghost">Create Account <ChevronRight size={14} /></Link>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-label">Search Properties</div>
            <input type="text" placeholder="Location, district, neighbourhood..." className="search-input" />
            <div className="search-row">
              <select className="search-select">
                <option value="">Property Type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
              </select>
              <select className="search-select">
                <option value="">Price Range</option>
                <option value="0-500">Under 500K TZS</option>
                <option value="500-1000">500K – 1M TZS</option>
                <option value="1000+">Above 1M TZS</option>
              </select>
            </div>
            <button className="search-btn" onClick={() => navigate('/properties')}>
              <Search size={16} /> Search Properties
            </button>
            <div className="search-tags">
              {['Dar es Salaam','Arusha','Mwanza','Dodoma','Studio'].map(tag => (
                <span key={tag} className="search-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stats-inner">
          {[
            { num: stats.totalProperties.toLocaleString(), lbl: 'Active Listings' },
            { num: stats.totalUsers.toLocaleString(),      lbl: 'Registered Users' },
            { num: stats.activeListings.toLocaleString(),  lbl: 'Available Now' },
            { num: stats.avgResponseTime,                  lbl: 'Avg. Response' },
          ].map(s => (
            <div key={s.lbl} className="stat-item">
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured Rental Properties ── */}
      <section style={{ background: 'var(--dark-2)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Featured Listings</div>
              <h2 className="section-title">Popular<br /><em>Properties</em></h2>
            </div>
            <Link to="/properties" className="btn-primary"
              style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 340 }} />)}
            </div>
          ) : featuredProperties.length === 0 ? (
            <EmptyState icon={<HomeIcon size={48} />} title="No featured properties yet"
              desc="Check back later or browse all properties." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {featuredProperties.map((p: any) => (
                <div key={p.id} className="rental-card"
                  style={{ background:'var(--dark)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                  <Link to={`/property/${p.id}`} style={{ textDecoration:'none', color:'inherit', display:'block' }}>
                    <div style={{
                      height: 200,
                      backgroundImage: `url(${getImage(p)})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: '#1a1a1a',
                    }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize:18, fontWeight:400, color:'var(--cream)', marginBottom:8, lineHeight:1.3 }}>{p.title}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12, color:'var(--muted)', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Bed size={14}/>{p.bedrooms} bed</span>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Bath size={14}/>{p.bathrooms} bath</span>
                        {p.area && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Square size={14}/>{p.area} sqm</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)', fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:8 }}>
                        <MapPin size={14}/>{p.location}
                      </div>
                      <div style={{ fontSize:20, fontWeight:500, color:'var(--gold)' }}>
                        {formatPrice(p.price)}
                        <span style={{ fontSize:14, color:'var(--muted)', fontWeight:300, marginLeft:4 }}>/month</span>
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding:'0 20px 20px', display:'flex', justifyContent:'flex-end' }}>
                    <SaveButton saved={savedProperties.has(p.id)} onClick={() => handleSaveProperty(p.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BNB / Vacation Rentals ── */}
      <section style={{ background: 'var(--dark)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Vacation Rentals</div>
              <h2 className="section-title">Premium<br /><em>BNB Properties</em></h2>
            </div>
            <p className="section-desc">
              Discover our handpicked selection of short-term rentals and vacation properties.
              Perfect for getaways, business trips, or extended stays.
            </p>
          </div>

          {bnbLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 380 }} />)}
            </div>
          ) : bnbProperties.length === 0 ? (
            <EmptyState icon={<Building size={48} />} title="No BNB properties yet"
              desc="Check back later for vacation rentals." />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
              {bnbProperties.map((p: any) => (
                <div key={p.id} className="bnb-card"
                  style={{ background:'var(--dark-2)', borderRadius:16, overflow:'hidden', border:'1px solid rgba(201,168,76,0.1)', cursor:'pointer' }}>

                  <div style={{ position:'relative' }}>
                    <img
                      src={getImage(p)}
                      alt={p.title}
                      style={{ width:'100%', height:220, objectFit:'cover', display:'block' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%238a8070'%3ENo Image%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', color:'var(--cream)', padding:'4px 10px', borderRadius:6, fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:500, textTransform:'capitalize' }}>
                      {p.type || 'BNB'}
                    </div>
                    {p.average_rating ? (
                      <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', color:'var(--gold)', padding:'4px 10px', borderRadius:6, fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                        ★ {Number(p.average_rating).toFixed(1)}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ padding:20 }}>
                    <h3 style={{ fontSize:18, fontWeight:400, color:'var(--cream)', marginBottom:8, lineHeight:1.3 }}>{p.title}</h3>

                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)', fontSize:14, fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>
                      <MapPin size={14}/>{p.location}
                    </div>

                    <div style={{ display:'flex', gap:16, marginBottom:16, fontSize:13, color:'var(--muted)', fontFamily:"'DM Sans',sans-serif" }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><Bed size={14}/>{p.bedrooms ?? '—'} beds</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><Bath size={14}/>{p.bathrooms ?? '—'} baths</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Users size={14}/>
                        {/* max_guests may be a top-level field or nested in bnb_details */}
                        {p.max_guests ?? p.bnb_details?.max_guests ?? 2} guests
                      </span>
                    </div>

                    {/* Amenity pills — support both structured and flat formats */}
                    {p.bnb_details?.amenities_bnb ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                        {Object.entries(p.bnb_details.amenities_bnb)
                          .filter(([,v]) => v).slice(0,4)
                          .map(([k]) => (
                            <span key={k} style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", padding:'3px 8px', borderRadius:4, background:'rgba(201,168,76,0.1)', color:'var(--gold)', textTransform:'capitalize' }}>{k}</span>
                          ))}
                      </div>
                    ) : Array.isArray(p.amenities) && p.amenities.length > 0 ? (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                        {p.amenities.slice(0,4).map((a: string) => (
                          <span key={a} style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", padding:'3px 8px', borderRadius:4, background:'rgba(201,168,76,0.1)', color:'var(--gold)', textTransform:'capitalize' }}>{a}</span>
                        ))}
                      </div>
                    ) : null}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:20, fontWeight:500, color:'var(--gold)' }}>
                          {formatPrice(p.price)}
                          <span style={{ fontSize:14, color:'var(--muted)', fontWeight:300, marginLeft:4 }}>/night</span>
                        </div>
                        {(p.min_stay ?? p.bnb_details?.min_stay ?? 0) > 1 && (
                          <div style={{ fontSize:12, color:'var(--muted)', fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>
                            Min {p.min_stay ?? p.bnb_details?.min_stay} nights
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedProperty(p); setShowBookingModal(true); }}
                        style={{ background:'var(--gold)', color:'var(--dark)', border:'none', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: 'var(--dark)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Why Oweru</div>
              <h2 className="section-title">Built for the<br /><em>Modern Tenant</em></h2>
            </div>
            <p className="section-desc">We make property rental simple, secure, and transparent for every party involved.</p>
          </div>
          <div className="features-grid">
            {[
              { icon:<Search size={20}/>,     title:'Smart Search',      desc:'Find properties matching your exact requirements with advanced filters.' },
              { icon:<Shield size={20}/>,     title:'Verified Listings',  desc:'Every property is vetted by our team to prevent fraud and protect your interests.' },
              { icon:<Users size={20}/>,      title:'Trusted Network',    desc:'Connect directly with verified landlords and professional agents across Tanzania.' },
              { icon:<TrendingUp size={20}/>, title:'Agent Dashboard',    desc:'Track leads, conversions, and earnings with real-time analytics.' },
            ].map((f, i) => (
              <div key={f.title} className="feature-card">
                <div className="feature-number">0{i+1}</div>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-section">
        <div className="section">
          <div className="how-grid">
            <div>
              <div className="section-eyebrow" style={{ marginBottom:20 }}>Process</div>
              <h2 className="section-title" style={{ marginBottom:48 }}>How<br /><em>Oweru Works</em></h2>
              <div className="how-steps">
                {[
                  { num:'01', title:'Browse & Apply', desc:'Search for properties that fit your needs and submit your rental application entirely online.' },
                  { num:'02', title:'Get Approved',   desc:'Landlords review your application and approve qualified tenants quickly.' },
                  { num:'03', title:'Pay & Move In',  desc:"Securely pay your first month's rent and deposit through our trusted payment system." },
                ].map(s => (
                  <div key={s.num} className="how-step">
                    <div className="step-num">{s.num}</div>
                    <div><div className="step-title">{s.title}</div><div className="step-desc">{s.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-visual">
              <div className="visual-badge"><div className="visual-ring"><div className="visual-inner">TZ</div></div></div>
              <div className="visual-divider"/>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>Platform at a Glance</div>
              <div className="visual-stats">
                {[{num:'3 min',lbl:'Avg. Apply Time'},{num:'24 hr',lbl:'Response Rate'},{num:'100%',lbl:'Secure Payments'},{num:'5★',lbl:'Avg. Rating'}].map(v => (
                  <div key={v.lbl} className="visual-stat">
                    <div className="visual-stat-num">{v.num}</div>
                    <div className="visual-stat-lbl">{v.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-bg"/>
        <div className="cta-inner">
          <div>
            <div className="section-eyebrow" style={{ marginBottom:20 }}>Get Started</div>
            <h2 className="cta-title">Ready to Find<br />Your <em>Next Home?</em></h2>
            <p className="cta-desc">Join thousands of Tanzanians who have found their perfect rental property through Oweru.</p>
            <Link to="/properties" className="btn-primary">Browse All Properties <ArrowRight size={16}/></Link>
          </div>
          <div className="cta-right">
            {[
              { to:'/properties', icon:<HomeIcon size={18}/>,   title:'For Tenants',   desc:'Browse thousands of verified rental listings' },
              { to:'/landlord',   icon:<Shield size={18}/>,     title:'For Landlords', desc:'List your property and find qualified tenants fast' },
              { to:'/agents',     icon:<TrendingUp size={18}/>, title:'For Agents',    desc:'Grow your business with our agent dashboard' },
            ].map(c => (
              <Link key={c.title} to={c.to} className="cta-card">
                <div className="cta-card-icon">{c.icon}</div>
                <div><div className="cta-card-title">{c.title}</div><div className="cta-card-desc">{c.desc}</div></div>
                <ChevronRight size={16} className="cta-card-arrow"/>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      {showBookingModal && selectedProperty && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--dark-2)', borderRadius:16, padding:32, maxWidth:600, width:'90%', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(201,168,76,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
              <div>
                <h2 style={{ margin:0, color:'var(--cream)', fontSize:24 }}>Book {selectedProperty.title}</h2>
                <p style={{ margin:'8px 0 0', color:'var(--muted)', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
                  {selectedProperty.location} · {formatPrice(selectedProperty.price)}/night
                </p>
              </div>
              <button onClick={() => setShowBookingModal(false)}
                style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:28, lineHeight:1 }}>×</button>
            </div>
            <BookingForm
              property={selectedProperty}
              onClose={() => setShowBookingModal(false)}
              onSuccess={() => { setShowBookingModal(false); alert('Booking request submitted! The property owner will contact you soon.'); }}
            />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{ borderTop:'1px solid var(--border)' }}>
        <div className="footer-bar">
          <img src={LOGO} alt="OWERU" style={{ height:20, width:'auto' }} />
          <ul className="footer-links">
            {['Properties','Landlords','Agents','About','Contact'].map(l => (
              <li key={l}><Link to={`/${l.toLowerCase()}`}>{l}</Link></li>
            ))}
          </ul>
          <div className="footer-copy">© 2025 Oweru. Tanzania.</div>
        </div>
      </footer>
    </div>
  );
};

/* ── Reusable sub-components ── */
const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div style={{ textAlign:'center', padding:'60px 40px', color:'var(--muted)' }}>
    <div style={{ color:'var(--gold)', marginBottom:16 }}>{icon}</div>
    <h3 style={{ color:'var(--cream)', fontSize:18, marginBottom:8 }}>{title}</h3>
    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>{desc}</p>
  </div>
);

const SaveButton = ({ saved, onClick }: { saved: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding:'8px 16px', borderRadius:6,
      border:`1px solid ${saved ? 'var(--gold)' : 'var(--border)'}`,
      backgroundColor: saved ? 'var(--gold)' : 'transparent',
      color: saved ? 'var(--dark)' : 'var(--cream)',
      fontSize:14, fontWeight:500, cursor:'pointer',
      display:'flex', alignItems:'center', gap:6,
      transition:'all 0.2s ease', fontFamily:"'DM Sans',sans-serif",
    }}
    onMouseEnter={e => { if (!saved) { e.currentTarget.style.backgroundColor='rgba(201,168,76,0.1)'; e.currentTarget.style.borderColor='var(--gold)'; }}}
    onMouseLeave={e => { if (!saved) { e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.style.borderColor='var(--border)'; }}}
  >
    <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
    {saved ? 'Saved' : 'Save'}
  </button>
);

/* ── Booking Form ── */
const BookingForm = ({ property, onClose, onSuccess }: {
  property: any; onClose: () => void; onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    guest_name:'', guest_email:'', check_in:'', check_out:'', guest_count:'1', special_requests:'',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string,string>>({});

  const maxGuests = property.max_guests ?? property.bnb_details?.max_guests ?? 10;

  const set = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]:'' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrors({});

    const errs: Record<string,string> = {};
    if (!formData.guest_name.trim())  errs.guest_name  = 'Name is required';
    if (!formData.guest_email.trim()) errs.guest_email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) errs.guest_email = 'Valid email is required';
    if (!formData.check_in)  errs.check_in  = 'Check-in date is required';
    if (!formData.check_out) errs.check_out = 'Check-out date is required';
    if (formData.check_in && formData.check_out && new Date(formData.check_out) <= new Date(formData.check_in))
      errs.check_out = 'Check-out must be after check-in';
    if (!formData.guest_count || parseInt(formData.guest_count) < 1) errs.guest_count = 'Valid guest count is required';
    if (parseInt(formData.guest_count) > maxGuests) errs.guest_count = `Maximum ${maxGuests} guests allowed`;

    if (Object.keys(errs).length) { setErrors(errs); setLoading(false); return; }

    try {
      // Public endpoint — no auth required
      const res = await fetch(`${API_BASE}/api/public/bnb/bookings`, {
        method: 'POST',
        headers: { Accept:'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify({
          property_id:      property.id,
          guest_name:       formData.guest_name,
          guest_email:      formData.guest_email,
          check_in:         formData.check_in,
          check_out:        formData.check_out,
          guests:           parseInt(formData.guest_count),
          special_requests: formData.special_requests || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.errors) { setErrors(body.errors); return; }
        throw new Error('Booking failed');
      }
      onSuccess();
    } catch {
      setErrors({ submit: 'Failed to create booking. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inp = (field: string): React.CSSProperties => ({
    width:'100%', padding:12,
    backgroundColor:'var(--dark)',
    border:`1px solid ${errors[field] ? '#ef4444' : 'rgba(201,168,76,0.2)'}`,
    borderRadius:8, color:'var(--cream)', fontSize:14,
    fontFamily:"'DM Sans',sans-serif", outline:'none',
  });
  const lbl: React.CSSProperties = { display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'var(--cream)', fontFamily:"'DM Sans',sans-serif" };
  const err: React.CSSProperties = { color:'#ef4444', fontSize:12, marginTop:4, fontFamily:"'DM Sans',sans-serif" };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div>
          <label style={lbl}>Your Name *</label>
          <input type="text" value={formData.guest_name} onChange={e=>set('guest_name',e.target.value)} style={inp('guest_name')} placeholder="John Doe"/>
          {errors.guest_name && <div style={err}>{errors.guest_name}</div>}
        </div>
        <div>
          <label style={lbl}>Your Email *</label>
          <input type="email" value={formData.guest_email} onChange={e=>set('guest_email',e.target.value)} style={inp('guest_email')} placeholder="john@example.com"/>
          {errors.guest_email && <div style={err}>{errors.guest_email}</div>}
        </div>
        <div>
          <label style={lbl}>Number of Guests *</label>
          <input type="number" min="1" max={maxGuests} value={formData.guest_count} onChange={e=>set('guest_count',e.target.value)} style={inp('guest_count')}/>
          {errors.guest_count && <div style={err}>{errors.guest_count}</div>}
          <div style={{ ...err, color:'var(--muted)', marginTop:4 }}>Max {maxGuests} guests</div>
        </div>
        <div>
          <label style={lbl}>Check-in Date *</label>
          <input type="date" value={formData.check_in} onChange={e=>set('check_in',e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp('check_in')}/>
          {errors.check_in && <div style={err}>{errors.check_in}</div>}
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <label style={lbl}>Check-out Date *</label>
          <input type="date" value={formData.check_out} onChange={e=>set('check_out',e.target.value)} min={formData.check_in || new Date().toISOString().split('T')[0]} style={inp('check_out')}/>
          {errors.check_out && <div style={err}>{errors.check_out}</div>}
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={lbl}>Special Requests</label>
        <textarea value={formData.special_requests} onChange={e=>set('special_requests',e.target.value)} rows={3}
          style={{ ...inp('special_requests'), resize:'vertical' }} placeholder="Any special requests or notes..."/>
      </div>

      {errors.submit && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid #ef4444', borderRadius:8, padding:12, marginBottom:16 }}>
          <div style={err}>{errors.submit}</div>
        </div>
      )}

      <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding:'12px 20px', background:'transparent', border:'1px solid rgba(201,168,76,0.3)', borderRadius:8, color:'var(--cream)', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          style={{ padding:'12px 20px', background:'var(--gold)', border:'none', borderRadius:8, color:'var(--dark)', fontSize:14, fontWeight:500, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:"'DM Sans',sans-serif" }}>
          {loading ? 'Submitting…' : 'Submit Booking Request'}
        </button>
      </div>
    </form>
  );
};

export default Home;