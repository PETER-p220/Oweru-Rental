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
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23e8f0fe'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%231a56db'%3ENo Image%3C/text%3E%3C/svg%3E`;
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

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/public/properties`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: any[] = json.data?.data ?? json.data ?? json ?? [];
      setFeaturedProperties(Array.isArray(list) ? list.slice(0, 6) : []);
    } catch {
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBnbProperties = async () => {
    try {
      setBnbLoading(true);
      const newUrl = `${API_BASE}/api/public/bnb`;
      try {
        const res = await fetch(newUrl, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          let list: any[] = Array.isArray(json) ? json : json?.data && Array.isArray(json.data) ? json.data : [];
          setBnbProperties(list.slice(0, 6));
          return;
        }
      } catch {}

      const oldUrl = `${API_BASE}/api/public/bnb/search`;
      const res = await fetch(oldUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Both endpoints failed`);
      const json = await res.json();
      let list: any[] = Array.isArray(json) ? json : json?.data && Array.isArray(json.data) ? json.data : [];
      setBnbProperties(list.slice(0, 6));
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
    } catch {}
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
    } catch {}
  };

  return (
    <div style={{ fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", background: '#f8fafc', color: '#1e293b', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --blue-900:#0f2d6e;
          --blue-800:#1a3f8f;
          --blue-700:#1d4ed8;
          --blue-600:#2563eb;
          --blue-500:#3b82f6;
          --blue-400:#60a5fa;
          --blue-200:#bfdbfe;
          --blue-100:#dbeafe;
          --blue-50:#eff6ff;
          --white:#ffffff;
          --gray-50:#f8fafc;
          --gray-100:#f1f5f9;
          --gray-200:#e2e8f0;
          --gray-300:#cbd5e1;
          --gray-400:#94a3b8;
          --gray-500:#64748b;
          --gray-600:#475569;
          --gray-700:#334155;
          --gray-800:#1e293b;
          --gray-900:#0f172a;
          --shadow-sm:0 1px 3px rgba(15,45,110,0.08),0 1px 2px rgba(15,45,110,0.06);
          --shadow-md:0 4px 12px rgba(15,45,110,0.10),0 2px 4px rgba(15,45,110,0.06);
          --shadow-lg:0 10px 30px rgba(15,45,110,0.12),0 4px 8px rgba(15,45,110,0.06);
        }

        .hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden;background:linear-gradient(135deg,var(--blue-900) 0%,var(--blue-800) 40%,var(--blue-700) 100%)}
        .hero-pattern{position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,0.06) 1px,transparent 0);background-size:32px 32px;pointer-events:none}
        .hero-glow{position:absolute;right:-10%;top:-20%;width:60%;height:80%;background:radial-gradient(ellipse,rgba(96,165,250,0.15) 0%,transparent 65%);pointer-events:none}
        .hero-content{position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:120px 48px 80px;display:grid;grid-template-columns:1.1fr 1fr;gap:80px;align-items:center;width:100%}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:var(--blue-200);padding:6px 14px;border-radius:100px;font-size:12px;font-weight:500;letter-spacing:0.04em;margin-bottom:28px;backdrop-filter:blur(8px)}
        .hero-badge-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;flex-shrink:0}
        .hero-title{font-size:clamp(40px,4.5vw,64px);font-weight:700;line-height:1.08;letter-spacing:-0.03em;color:var(--white);margin-bottom:20px}
        .hero-title span{color:var(--blue-400)}
        .hero-subtitle{font-size:17px;font-weight:400;line-height:1.65;color:rgba(255,255,255,0.7);margin-bottom:40px;max-width:460px}
        .hero-actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap}

        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--white);color:var(--blue-700);padding:13px 24px;font-size:14px;font-weight:600;text-decoration:none;border:none;cursor:pointer;border-radius:8px;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
        .btn-primary:hover{background:var(--blue-50);gap:12px;box-shadow:0 4px 16px rgba(0,0,0,0.2)}
        .btn-outline{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);color:var(--white);padding:13px 24px;font-size:14px;font-weight:500;text-decoration:none;border:1px solid rgba(255,255,255,0.25);cursor:pointer;border-radius:8px;transition:all 0.2s ease;backdrop-filter:blur(8px)}
        .btn-outline:hover{background:rgba(255,255,255,0.18);gap:12px}

        .search-card{background:var(--white);border-radius:16px;padding:32px;box-shadow:var(--shadow-lg);border:1px solid var(--gray-200)}
        .search-card-header{display:flex;align-items:center;gap:10px;margin-bottom:24px}
        .search-card-icon{width:36px;height:36px;background:var(--blue-600);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--white)}
        .search-card-title{font-size:16px;font-weight:600;color:var(--gray-900)}
        .search-card-sub{font-size:13px;color:var(--gray-500);margin-top:2px}
        .search-input{width:100%;background:var(--gray-50);border:1.5px solid var(--gray-200);color:var(--gray-800);padding:11px 14px;font-size:14px;font-weight:400;margin-bottom:12px;outline:none;border-radius:8px;transition:border-color 0.2s,box-shadow 0.2s;font-family:inherit}
        .search-input::placeholder{color:var(--gray-400)}
        .search-input:focus{border-color:var(--blue-500);box-shadow:0 0 0 3px rgba(59,130,246,0.12)}
        .search-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .search-select{width:100%;background:var(--gray-50);border:1.5px solid var(--gray-200);color:var(--gray-600);padding:11px 14px;font-size:14px;font-weight:400;outline:none;cursor:pointer;border-radius:8px;appearance:none;transition:all 0.2s;font-family:inherit}
        .search-select:focus{border-color:var(--blue-500);box-shadow:0 0 0 3px rgba(59,130,246,0.12);color:var(--gray-800)}
        .search-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--blue-600);color:var(--white);padding:13px;font-size:14px;font-weight:600;border:none;cursor:pointer;border-radius:8px;transition:all 0.2s;margin-top:4px;font-family:inherit}
        .search-btn:hover{background:var(--blue-700)}
        .search-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
        .search-tag{font-size:12px;color:var(--blue-600);padding:4px 12px;border:1.5px solid var(--blue-200);border-radius:100px;cursor:pointer;transition:all 0.2s;text-decoration:none;background:var(--blue-50);font-weight:500}
        .search-tag:hover{background:var(--blue-100);border-color:var(--blue-400)}

        .stats-bar{background:var(--white);border-bottom:1px solid var(--gray-200);box-shadow:var(--shadow-sm)}
        .stats-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
        .stat-item{text-align:center;padding:28px 24px;border-right:1px solid var(--gray-200);position:relative}
        .stat-item:last-child{border-right:none}
        .stat-number{font-size:30px;font-weight:700;color:var(--blue-600);line-height:1;margin-bottom:6px;letter-spacing:-0.02em}
        .stat-label{font-size:12px;font-weight:500;letter-spacing:0.06em;text-transform:uppercase;color:var(--gray-400)}

        .section{max-width:1200px;margin:0 auto;padding:80px 48px}
        .section-header{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;margin-bottom:48px}
        .section-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--blue-600);margin-bottom:12px;background:var(--blue-50);padding:4px 12px;border-radius:100px}
        .section-title{font-size:clamp(26px,3vw,38px);font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:var(--gray-900)}
        .section-title span{color:var(--blue-600)}
        .section-desc{font-size:15px;font-weight:400;line-height:1.7;color:var(--gray-500);max-width:360px;text-align:right}

        .btn-secondary{display:inline-flex;align-items:center;gap:8px;background:var(--white);color:var(--blue-600);padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none;border:1.5px solid var(--blue-200);cursor:pointer;border-radius:8px;transition:all 0.2s}
        .btn-secondary:hover{background:var(--blue-50);border-color:var(--blue-400);gap:12px}

        .features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
        .feature-card{background:var(--white);padding:32px 28px;border-radius:12px;border:1px solid var(--gray-200);position:relative;overflow:hidden;transition:all 0.3s;box-shadow:var(--shadow-sm)}
        .feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue-500),var(--blue-400));transform:scaleX(0);transform-origin:left;transition:transform 0.35s ease;border-radius:3px 3px 0 0}
        .feature-card:hover{border-color:var(--blue-200);box-shadow:var(--shadow-md);transform:translateY(-3px)}
        .feature-card:hover::before{transform:scaleX(1)}
        .feature-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:var(--blue-50);border:1.5px solid var(--blue-100);border-radius:10px;margin-bottom:20px;color:var(--blue-600)}
        .feature-number{position:absolute;top:16px;right:18px;font-size:11px;font-weight:600;color:var(--blue-200);letter-spacing:0.08em}
        .feature-title{font-size:17px;font-weight:600;color:var(--gray-900);margin-bottom:10px;letter-spacing:-0.01em}
        .feature-desc{font-size:14px;font-weight:400;line-height:1.65;color:var(--gray-500)}

        .how-section{background:var(--white);border-top:1px solid var(--gray-200);border-bottom:1px solid var(--gray-200)}
        .how-grid{display:grid;grid-template-columns:1fr 2fr;gap:80px;align-items:start}
        .how-steps{display:flex;flex-direction:column;gap:0}
        .how-step{display:grid;grid-template-columns:56px 1fr;gap:20px;padding:32px 0;border-bottom:1px solid var(--gray-100);align-items:start}
        .how-step:last-child{border-bottom:none}
        .step-num{width:40px;height:40px;background:var(--blue-600);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--white);flex-shrink:0;margin-top:4px}
        .step-title{font-size:18px;font-weight:600;color:var(--gray-900);margin-bottom:8px;letter-spacing:-0.01em}
        .step-desc{font-size:14px;font-weight:400;line-height:1.65;color:var(--gray-500)}
        .how-visual{position:sticky;top:80px;background:linear-gradient(135deg,var(--blue-900),var(--blue-700));border-radius:16px;padding:40px;color:var(--white);box-shadow:var(--shadow-lg)}
        .visual-inner{font-size:42px;font-weight:700;letter-spacing:-0.03em}
        .visual-sub{font-size:13px;font-weight:500;color:var(--blue-300);letter-spacing:0.06em;text-transform:uppercase;margin-top:4px}
        .visual-divider{width:100%;height:1px;background:rgba(255,255,255,0.1);margin:28px 0}
        .visual-stats{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .visual-stat{background:rgba(255,255,255,0.08);border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.1)}
        .visual-stat-num{font-size:22px;font-weight:700;color:var(--white);margin-bottom:4px;letter-spacing:-0.02em}
        .visual-stat-lbl{font-size:11px;color:var(--blue-300);font-weight:500;letter-spacing:0.06em;text-transform:uppercase}

        .cta-section{background:linear-gradient(135deg,var(--blue-900) 0%,var(--blue-800) 50%,var(--blue-700) 100%);position:relative;overflow:hidden}
        .cta-pattern{position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,0.05) 1px,transparent 0);background-size:40px 40px}
        .cta-inner{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:100px 48px;display:grid;grid-template-columns:1.2fr 1fr;gap:80px;align-items:center}
        .cta-title{font-size:clamp(32px,3.5vw,50px);font-weight:700;line-height:1.1;letter-spacing:-0.02em;color:var(--white);margin-bottom:16px}
        .cta-title span{color:var(--blue-300)}
        .cta-desc{font-size:16px;font-weight:400;line-height:1.7;color:rgba(255,255,255,0.65);margin-bottom:36px}
        .cta-right{display:flex;flex-direction:column;gap:14px}
        .cta-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;text-decoration:none;transition:all 0.25s;backdrop-filter:blur(8px)}
        .cta-card:hover{background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.3);transform:translateX(4px)}
        .cta-card-icon{width:44px;height:44px;background:rgba(255,255,255,0.12);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--blue-300)}
        .cta-card-title{font-size:16px;font-weight:600;color:var(--white);margin-bottom:3px}
        .cta-card-desc{font-size:13px;font-weight:400;color:rgba(255,255,255,0.6)}
        .cta-card-arrow{margin-left:auto;color:rgba(255,255,255,0.4);transition:all 0.2s;flex-shrink:0}
        .cta-card:hover .cta-card-arrow{color:var(--white);transform:translateX(2px)}

        .footer{background:var(--gray-900);border-top:1px solid var(--gray-700)}
        .footer-bar{max-width:1200px;margin:0 auto;padding:28px 48px;display:flex;align-items:center;justify-content:space-between}
        .footer-links{display:flex;gap:28px;list-style:none}
        .footer-links a{font-size:13px;font-weight:500;color:var(--gray-400);text-decoration:none;transition:color 0.2s}
        .footer-links a:hover{color:var(--white)}
        .footer-copy{font-size:12px;color:var(--gray-600)}

        .rental-card{transition:all 0.25s}
        .rental-card:hover{border-color:var(--blue-300)!important;box-shadow:var(--shadow-md)!important;transform:translateY(-4px)}
        .bnb-card{transition:all 0.25s}
        .bnb-card:hover{border-color:var(--blue-300)!important;box-shadow:var(--shadow-md)!important;transform:translateY(-4px)}

        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        .skeleton{animation:pulse 1.5s ease-in-out infinite;background:var(--gray-200);border-radius:10px}

        @media(max-width:900px){
          .hero-content{grid-template-columns:1fr;gap:40px;padding:100px 24px 60px}
          .section{padding:60px 24px}
          .section-header{grid-template-columns:1fr;gap:16px}
          .section-desc{text-align:left;max-width:100%}
          .features-grid{grid-template-columns:1fr 1fr}
          .how-grid{grid-template-columns:1fr}
          .how-visual{position:static}
          .stats-inner{grid-template-columns:repeat(2,1fr)}
          .stat-item{border-right:none;border-bottom:1px solid var(--gray-200)}
          .cta-inner{grid-template-columns:1fr;gap:40px;padding:60px 24px}
          .footer-bar{flex-direction:column;gap:20px;text-align:center;padding:24px}
          .footer-links{flex-wrap:wrap;justify-content:center}
        }
        @media(max-width:600px){
          .features-grid{grid-template-columns:1fr}
          .search-row{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-pattern" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Tanzania's Premier Rental Platform
            </div>
            <h1 className="hero-title">
              Find Your<br />
              <span>Perfect Rental</span><br />
              Property
            </h1>
            <p className="hero-subtitle">
              Connect with trusted landlords and professional agents. Browse verified
              properties and manage your rental seamlessly with Oweru.
            </p>
            <div className="hero-actions">
              <Link to="/properties" className="btn-primary">Browse Properties <ArrowRight size={16} /></Link>
              <Link to="/register" className="btn-outline">Create Account <ChevronRight size={14} /></Link>
            </div>
          </div>

          <div className="search-card">
            <div className="search-card-header">
              <div className="search-card-icon"><Search size={18} /></div>
              <div>
                <div className="search-card-title">Search Properties</div>
                <div className="search-card-sub">Find your perfect match</div>
              </div>
            </div>
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
              {['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Studio'].map(tag => (
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
      <section style={{ background: 'var(--gray-50)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Featured Listings</div>
              <h2 className="section-title">Popular <span>Properties</span></h2>
            </div>
            <Link to="/properties" className="btn-secondary">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 340 }} />)}
            </div>
          ) : featuredProperties.length === 0 ? (
            <EmptyState icon={<HomeIcon size={48} />} title="No featured properties yet"
              desc="Check back later or browse all properties." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {featuredProperties.map((p: any) => (
                <div key={p.id} className="rental-card"
                  style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{
                      height: 200,
                      backgroundImage: `url(${getImage(p)})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: 'var(--blue-50)',
                    }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, color: 'var(--gray-500)', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={14} />{p.bedrooms} bed</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={14} />{p.bathrooms} bath</span>
                        {p.area && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Square size={14} />{p.area} sqm</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-400)', fontSize: 13, marginBottom: 10 }}>
                        <MapPin size={13} />{p.location}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue-600)' }}>
                        {formatPrice(p.price)}
                        <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4 }}>/month</span>
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

      {/* ── BNB / Vacation Rentals ── */}
      <section style={{ background: 'var(--white)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Vacation Rentals</div>
              <h2 className="section-title">Premium <span>BNB Properties</span></h2>
            </div>
            <p className="section-desc">
              Handpicked short-term rentals perfect for getaways, business trips, or extended stays.
            </p>
          </div>

          {bnbLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
              {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 380 }} />)}
            </div>
          ) : bnbProperties.length === 0 ? (
            <EmptyState icon={<Building size={48} />} title="No BNB properties yet"
              desc="Check back later for vacation rentals." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
              {bnbProperties.map((p: any) => (
                <div key={p.id} className="bnb-card"
                  style={{ background: 'var(--white)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--gray-200)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getImage(p)}
                      alt={p.title}
                      style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23eff6ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%231d4ed8'%3ENo Image%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--blue-600)', color: 'var(--white)', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                      {p.type || 'BNB'}
                    </div>
                    {p.average_rating ? (
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', color: '#f59e0b', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                        ★ {Number(p.average_rating).toFixed(1)}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-400)', fontSize: 13, marginBottom: 12 }}>
                      <MapPin size={13} />{p.location}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 13, color: 'var(--gray-500)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={14} />{p.bedrooms ?? '—'} beds</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={14} />{p.bathrooms ?? '—'} baths</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={14} />{p.max_guests ?? p.bnb_details?.max_guests ?? 2} guests
                      </span>
                    </div>

                    {p.bnb_details?.amenities_bnb ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {Object.entries(p.bnb_details.amenities_bnb)
                          .filter(([, v]) => v).slice(0, 4)
                          .map(([k]) => (
                            <span key={k} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: 'var(--blue-50)', color: 'var(--blue-700)', fontWeight: 600, textTransform: 'capitalize', border: '1px solid var(--blue-100)' }}>{k}</span>
                          ))}
                      </div>
                    ) : Array.isArray(p.amenities) && p.amenities.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {p.amenities.slice(0, 4).map((a: string) => (
                          <span key={a} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: 'var(--blue-50)', color: 'var(--blue-700)', fontWeight: 600, textTransform: 'capitalize', border: '1px solid var(--blue-100)' }}>{a}</span>
                        ))}
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue-600)' }}>
                          {formatPrice(p.price)}
                          <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4 }}>/night</span>
                        </div>
                        {(p.min_stay ?? p.bnb_details?.min_stay ?? 0) > 1 && (
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                            Min {p.min_stay ?? p.bnb_details?.min_stay} nights
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedProperty(p); setShowBookingModal(true); }}
                        style={{ background: 'var(--blue-600)', color: 'var(--white)', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-700)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--blue-600)')}
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
      <section style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Why Oweru</div>
              <h2 className="section-title">Built for the <span>Modern Tenant</span></h2>
            </div>
            <p className="section-desc">Simple, secure, and transparent rental for every party involved.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: <Search size={20} />,     title: 'Smart Search',      desc: 'Find properties matching your exact requirements with advanced filters and AI-powered recommendations.' },
              { icon: <Shield size={20} />,     title: 'Verified Listings', desc: 'Every property is vetted by our team to prevent fraud and fully protect your interests.' },
              { icon: <Users size={20} />,      title: 'Trusted Network',   desc: 'Connect directly with verified landlords and professional agents across Tanzania.' },
              { icon: <TrendingUp size={20} />, title: 'Agent Dashboard',   desc: 'Track leads, conversions, and earnings with real-time analytics and reporting.' },
            ].map((f, i) => (
              <div key={f.title} className="feature-card">
                <div className="feature-number">0{i + 1}</div>
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
              <div className="section-eyebrow" style={{ marginBottom: 16 }}>Process</div>
              <h2 className="section-title" style={{ marginBottom: 48 }}>How <span>Oweru Works</span></h2>
              <div className="how-steps">
                {[
                  { num: '1', title: 'Browse & Apply',  desc: 'Search for properties that fit your needs and submit your rental application entirely online.' },
                  { num: '2', title: 'Get Approved',    desc: 'Landlords review your application and approve qualified tenants quickly and securely.' },
                  { num: '3', title: 'Pay & Move In',   desc: "Securely pay your first month's rent and deposit through our trusted payment system." },
                ].map(s => (
                  <div key={s.num} className="how-step">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div className="step-num">{s.num}</div>
                    </div>
                    <div>
                      <div className="step-title">{s.title}</div>
                      <div className="step-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-visual">
              <div style={{ marginBottom: 8 }}>
                <div className="visual-inner">Oweru</div>
                <div className="visual-sub">Platform Overview</div>
              </div>
              <div className="visual-divider" />
              <div className="visual-stats">
                {[
                  { num: '3 min', lbl: 'Avg. Apply Time' },
                  { num: '24 hr', lbl: 'Response Rate' },
                  { num: '100%', lbl: 'Secure Payments' },
                  { num: '5★',   lbl: 'Avg. Rating' },
                ].map(v => (
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
        <div className="cta-pattern" />
        <div className="cta-inner">
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 20, background: 'rgba(255,255,255,0.12)', color: 'var(--blue-200)' }}>Get Started</div>
            <h2 className="cta-title">Ready to Find<br />Your <span>Next Home?</span></h2>
            <p className="cta-desc">Join thousands of Tanzanians who have found their perfect rental property through Oweru.</p>
            <Link to="/properties" className="btn-primary">Browse All Properties <ArrowRight size={16} /></Link>
          </div>
          <div className="cta-right">
            {[
              { to: '/properties', icon: <HomeIcon size={18} />,   title: 'For Tenants',   desc: 'Browse thousands of verified rental listings' },
              { to: '/landlord',   icon: <Shield size={18} />,     title: 'For Landlords', desc: 'List your property and find qualified tenants fast' },
              { to: '/agents',     icon: <TrendingUp size={18} />, title: 'For Agents',    desc: 'Grow your business with our agent dashboard' },
            ].map(c => (
              <Link key={c.title} to={c.to} className="cta-card">
                <div className="cta-card-icon">{c.icon}</div>
                <div>
                  <div className="cta-card-title">{c.title}</div>
                  <div className="cta-card-desc">{c.desc}</div>
                </div>
                <ChevronRight size={16} className="cta-card-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      {showBookingModal && selectedProperty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--white)', borderRadius: 16, padding: 36, maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(15,23,42,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--gray-900)', fontSize: 22, fontWeight: 700 }}>Book {selectedProperty.title}</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: 14 }}>
                  {selectedProperty.location} · {formatPrice(selectedProperty.price)}/night
                </p>
              </div>
              <button onClick={() => setShowBookingModal(false)}
                style={{ background: 'var(--gray-100)', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 20, lineHeight: 1, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
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
      <footer className="footer">
        <div className="footer-bar">
          <img src={LOGO} alt="OWERU" style={{ height: 22, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <ul className="footer-links">
            {['Properties', 'Landlords', 'Agents', 'About', 'Contact'].map(l => (
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
  <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--gray-400)' }}>
    <div style={{ color: 'var(--blue-400)', marginBottom: 16 }}>{icon}</div>
    <h3 style={{ color: 'var(--gray-700)', fontSize: 18, marginBottom: 8, fontWeight: 600 }}>{title}</h3>
    <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>{desc}</p>
  </div>
);

const SaveButton = ({ saved, onClick }: { saved: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px', borderRadius: 8,
      border: `1.5px solid ${saved ? 'var(--blue-500)' : 'var(--gray-200)'}`,
      backgroundColor: saved ? 'var(--blue-600)' : 'transparent',
      color: saved ? 'var(--white)' : 'var(--gray-600)',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all 0.2s ease', fontFamily: 'inherit',
    }}
    onMouseEnter={e => { if (!saved) { e.currentTarget.style.backgroundColor = 'var(--blue-50)'; e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.color = 'var(--blue-600)'; } }}
    onMouseLeave={e => { if (!saved) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-600)'; } }}
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
    guest_name: '', guest_email: '', check_in: '', check_out: '', guest_count: '1', special_requests: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const maxGuests = property.max_guests ?? property.bnb_details?.max_guests ?? 10;

  const set = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrors({});

    const errs: Record<string, string> = {};
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
      const res = await fetch(`${API_BASE}/api/public/bnb/bookings`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
    width: '100%', padding: 11,
    backgroundColor: 'var(--gray-50)',
    border: `1.5px solid ${errors[field] ? '#ef4444' : 'var(--gray-200)'}`,
    borderRadius: 8, color: 'var(--gray-800)', fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
  });
  const lbl: React.CSSProperties = { display: 'block', marginBottom: 7, fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', fontFamily: 'inherit' };
  const err: React.CSSProperties = { color: '#ef4444', fontSize: 12, marginTop: 4 };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Your Name *</label>
          <input type="text" value={formData.guest_name} onChange={e => set('guest_name', e.target.value)} style={inp('guest_name')} placeholder="John Doe" />
          {errors.guest_name && <div style={err}>{errors.guest_name}</div>}
        </div>
        <div>
          <label style={lbl}>Your Email *</label>
          <input type="email" value={formData.guest_email} onChange={e => set('guest_email', e.target.value)} style={inp('guest_email')} placeholder="john@example.com" />
          {errors.guest_email && <div style={err}>{errors.guest_email}</div>}
        </div>
        <div>
          <label style={lbl}>Number of Guests *</label>
          <input type="number" min="1" max={maxGuests} value={formData.guest_count} onChange={e => set('guest_count', e.target.value)} style={inp('guest_count')} />
          {errors.guest_count && <div style={err}>{errors.guest_count}</div>}
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Max {maxGuests} guests</div>
        </div>
        <div>
          <label style={lbl}>Check-in Date *</label>
          <input type="date" value={formData.check_in} onChange={e => set('check_in', e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp('check_in')} />
          {errors.check_in && <div style={err}>{errors.check_in}</div>}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Check-out Date *</label>
          <input type="date" value={formData.check_out} onChange={e => set('check_out', e.target.value)} min={formData.check_in || new Date().toISOString().split('T')[0]} style={inp('check_out')} />
          {errors.check_out && <div style={err}>{errors.check_out}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Special Requests</label>
        <textarea value={formData.special_requests} onChange={e => set('special_requests', e.target.value)} rows={3}
          style={{ ...inp('special_requests'), resize: 'vertical' }} placeholder="Any special requests or notes..." />
      </div>

      {errors.submit && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={err}>{errors.submit}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '12px 20px', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 8, color: 'var(--gray-700)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          style={{ padding: '12px 24px', background: 'var(--blue-600)', border: 'none', borderRadius: 8, color: 'var(--white)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
          {loading ? 'Submitting…' : 'Submit Booking Request'}
        </button>
      </div>
    </form>
  );
};

export default Home;