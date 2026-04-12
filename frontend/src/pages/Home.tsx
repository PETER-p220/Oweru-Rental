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

const getImage = (property: any): string => {
  if (property.images?.length) {
    const i = property.images[0];
    return i.startsWith('http') ? i : `${VITE_STORAGE}/storage/${i}`;
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`;
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

  const [stats] = useState({ totalProperties: 1247, totalUsers: 3842, activeListings: 892, avgResponseTime: '24 hr' });

  useEffect(() => {
    loadFeaturedProperties();
    loadBnbProperties();
    loadOweruProperties();
    loadSavedProperties();
  }, []);

  const loadOweruProperties = async () => {
    try {
      setOweruLoading(true);
      const res = await fetch(`${API_BASE}/api/public/properties?oweru_rental=true`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: any[] = json.data?.data ?? json.data ?? json ?? [];
      // Filter for Oweru rental properties
      const oweruList = Array.isArray(list) ? list.filter(p => p.type === 'oweru_rental' || p.oweru_rental === true).slice(0, 6) : [];
      setOweruProperties(oweruList);
    } catch { setOweruProperties([]); }
    finally { setOweruLoading(false); }
  };

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/public/properties`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: any[] = json.data?.data ?? json.data ?? json ?? [];
      setFeaturedProperties(Array.isArray(list) ? list.slice(0, 6) : []);
    } catch { setFeaturedProperties([]); }
    finally { setLoading(false); }
  };

  const loadBnbProperties = async () => {
    try {
      setBnbLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/public/bnb`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          const list: any[] = Array.isArray(json) ? json : json?.data && Array.isArray(json.data) ? json.data : [];
          setBnbProperties(list.slice(0, 6)); return;
        }
      } catch {}
      const res = await fetch(`${API_BASE}/api/public/bnb/search`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Both endpoints failed');
      const json = await res.json();
      const list: any[] = Array.isArray(json) ? json : json?.data && Array.isArray(json.data) ? json.data : [];
      setBnbProperties(list.slice(0, 6));
    } catch { setBnbProperties([]); }
    finally { setBnbLoading(false); }
  };

  const loadSavedProperties = async () => {
    try {
      const res = await Api.getSavedProperties();
      const ids = (Array.isArray(res.data) ? res.data : []).map((item: any) => item.property?.id ?? item.id).filter(Boolean);
      setSavedProperties(new Set(ids));
    } catch {}
  };

  const handleSaveProperty = async (propertyId: number) => {
    try {
      if (savedProperties.has(propertyId)) {
        try { await Api.unsaveProperty(propertyId); } catch { await Api.publicUnsaveProperty(propertyId); }
        setSavedProperties(prev => { const n = new Set(prev); n.delete(propertyId); return n; });
      } else {
        try { await Api.saveProperty(propertyId); } catch { await Api.publicSaveProperty(propertyId); }
        setSavedProperties(prev => new Set(prev).add(propertyId));
      }
    } catch {}
  };

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: '#0F172A', color: '#F8F8F9', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy-900: #0F172A;
          --navy-800: #162035;
          --navy-700: #1E2D4A;
          --navy-600: #253660;
          --gold:     #C89128;
          --gold-lt:  #D4A843;
          --gold-dim: rgba(200,145,40,0.12);
          --cream:    #F8F8F9;
          --slate:    #94A3B8;
          --border:   rgba(200,145,40,0.18);
          --shadow:   0 4px 24px rgba(15,23,42,0.5);
        }

        /* ── Hero ── */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 60%, #1a2840 100%);
        }

        .hero-geo {
          position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px),
            repeating-linear-gradient(-60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px);
          pointer-events: none;
        }

        .hero-glow {
          position: absolute;
          right: -10%; top: -20%;
          width: 60%; height: 80%;
          background: radial-gradient(ellipse, rgba(200,145,40,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        .hero-content {
          position: relative; z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 48px 80px;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 80px;
          align-items: center;
          width: 100%;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          color: var(--gold);
          padding: 6px 14px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .hero-badge-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; flex-shrink: 0; }

        .hero-title {
          font-size: clamp(40px, 4.5vw, 64px);
          font-weight: 300;
          line-height: 1.06;
          letter-spacing: -0.025em;
          color: var(--cream);
          margin-bottom: 20px;
        }

        .hero-title strong { font-weight: 800; color: var(--gold); display: block; }

        .hero-sub {
          font-size: 16px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--slate);
          margin-bottom: 40px;
          max-width: 440px;
        }

        .hero-actions { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }

        .btn-gold {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold);
          color: var(--navy-900);
          padding: 14px 26px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-gold:hover { background: var(--gold-lt); gap: 12px; }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--cream);
          padding: 13px 26px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-decoration: none;
          text-transform: uppercase;
          border: 1px solid rgba(248,248,249,0.2);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover { border-color: var(--gold); color: var(--gold); }

        /* search card */
        .search-card {
          background: var(--navy-800);
          border: 1px solid var(--border);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .search-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
        }

        .search-card-hdr {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .search-card-icon {
          width: 38px; height: 38px;
          background: var(--gold);
          display: flex; align-items: center; justify-content: center;
          color: var(--navy-900);
          flex-shrink: 0;
        }

        .search-card-title { font-size: 16px; font-weight: 600; color: var(--cream); }
        .search-card-sub { font-size: 12px; color: var(--slate); margin-top: 2px; }

        .search-input {
          width: 100%;
          background: var(--navy-900);
          border: 1px solid var(--border);
          color: var(--cream);
          padding: 11px 14px;
          font-size: 14px;
          font-weight: 400;
          margin-bottom: 12px;
          outline: none;
          font-family: 'Jost', sans-serif;
          transition: border-color 0.2s;
        }

        .search-input::placeholder { color: rgba(148,163,184,0.4); }
        .search-input:focus { border-color: var(--gold); }

        .search-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }

        .search-select {
          width: 100%;
          background: var(--navy-900);
          border: 1px solid var(--border);
          color: var(--slate);
          padding: 11px 14px;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          cursor: pointer;
          appearance: none;
          font-family: 'Jost', sans-serif;
          transition: all 0.2s;
        }

        .search-select:focus { border-color: var(--gold); color: var(--cream); }

        .search-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--gold);
          color: var(--navy-900);
          padding: 13px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          margin-top: 4px;
          font-family: 'Jost', sans-serif;
          transition: background 0.2s;
        }

        .search-btn:hover { background: var(--gold-lt); }

        .search-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }

        .search-tag {
          font-size: 11px;
          font-weight: 500;
          color: var(--gold);
          padding: 4px 12px;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
          background: var(--gold-dim);
          text-decoration: none;
        }

        .search-tag:hover { background: rgba(200,145,40,0.25); border-color: rgba(200,145,40,0.4); }

        /* stats bar */
        .stats-bar { background: var(--navy-800); border-bottom: 1px solid var(--border); }

        .stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-left: 1px solid var(--border);
        }

        .stat-item {
          text-align: center;
          padding: 28px 24px;
          border-right: 1px solid var(--border);
          position: relative;
        }

        .stat-num { font-size: 32px; font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: 6px; letter-spacing: -0.02em; }
        .stat-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--slate); }

        /* sections */
        .section { max-width: 1200px; margin: 0 auto; padding: 80px 48px; }

        .section-hdr {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 40px;
          align-items: end;
          margin-bottom: 48px;
        }

        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 12px;
          background: var(--gold-dim);
          padding: 4px 12px;
          border: 1px solid var(--border);
        }

        .section-title { font-size: clamp(26px, 3vw, 40px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: var(--cream); }
        .section-title span { color: var(--gold); }

        .section-desc { font-size: 14px; font-weight: 300; line-height: 1.7; color: var(--slate); max-width: 320px; text-align: right; }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--gold);
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-ghost:hover { background: var(--gold-dim); border-color: rgba(200,145,40,0.4); gap: 12px; }

        /* property cards */
        .prop-card {
          background: var(--navy-800);
          border: 1px solid var(--border);
          overflow: hidden;
          transition: all 0.3s;
        }

        .prop-card:hover { border-color: rgba(200,145,40,0.5); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,23,42,0.6); }

        .bnb-card {
          background: var(--navy-800);
          border: 1px solid var(--border);
          overflow: hidden;
          transition: all 0.3s;
        }

        .bnb-card:hover { border-color: rgba(200,145,40,0.5); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,23,42,0.6); }

        /* features */
        .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); }

        .feat-card {
          background: var(--navy-800);
          padding: 36px 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .feat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s;
        }

        .feat-card:hover { background: rgba(200,145,40,0.04); }
        .feat-card:hover::before { transform: scaleX(1); }

        .feat-num {
          position: absolute; top: 18px; right: 22px;
          font-size: 11px; font-weight: 600;
          color: rgba(200,145,40,0.2); letter-spacing: 0.08em;
        }

        .feat-icon {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          margin-bottom: 20px;
          color: var(--gold);
        }

        .feat-title { font-size: 17px; font-weight: 600; color: var(--cream); margin-bottom: 10px; }
        .feat-desc { font-size: 14px; font-weight: 300; line-height: 1.65; color: var(--slate); }

        /* how it works */
        .how-section { background: var(--navy-800); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }

        .how-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; align-items: start; }

        .how-steps { display: flex; flex-direction: column; }

        .how-step {
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 20px;
          padding: 32px 0;
          border-bottom: 1px solid var(--border);
          align-items: start;
        }

        .how-step:last-child { border-bottom: none; }

        .step-num {
          width: 40px; height: 40px;
          background: var(--gold);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800;
          color: var(--navy-900);
          flex-shrink: 0;
          margin-top: 4px;
        }

        .step-title { font-size: 18px; font-weight: 600; color: var(--cream); margin-bottom: 8px; }
        .step-desc { font-size: 14px; font-weight: 300; line-height: 1.65; color: var(--slate); }

        .how-visual {
          position: sticky; top: 80px;
          background: var(--navy-900);
          border: 1px solid var(--border);
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .how-visual::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--gold);
        }

        .visual-big { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; color: var(--cream); }
        .visual-sub { font-size: 10px; font-weight: 600; color: var(--gold); letter-spacing: 0.22em; text-transform: uppercase; margin-top: 4px; }
        .visual-div { width: 100%; height: 1px; background: var(--border); margin: 28px 0; }

        .visual-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); }

        .visual-stat { background: var(--navy-800); padding: 18px; }
        .visual-stat-num { font-size: 22px; font-weight: 700; color: var(--gold); margin-bottom: 4px; }
        .visual-stat-lbl { font-size: 10px; color: var(--slate); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }

        /* CTA */
        .cta-section {
          background: var(--navy-900);
          border-top: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(200,145,40,0.06) 0%, transparent 60%);
          bottom: -200px; left: -100px;
          pointer-events: none;
        }

        .cta-inner {
          position: relative; z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 48px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .cta-title {
          font-size: clamp(32px, 3.5vw, 52px);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--cream);
          margin-bottom: 16px;
        }

        .cta-title strong { font-weight: 800; color: var(--gold); }

        .cta-desc { font-size: 16px; font-weight: 300; line-height: 1.7; color: var(--slate); margin-bottom: 36px; }

        .cta-right { display: flex; flex-direction: column; gap: 1px; }

        .cta-card {
          background: var(--navy-800);
          border: 1px solid var(--border);
          border-bottom: none;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          transition: all 0.25s;
          position: relative;
        }

        .cta-card:last-child { border-bottom: 1px solid var(--border); }

        .cta-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--gold);
          transform: scaleY(0);
          transition: transform 0.3s;
        }

        .cta-card:hover { background: rgba(200,145,40,0.05); }
        .cta-card:hover::before { transform: scaleY(1); }

        .cta-icon {
          width: 42px; height: 42px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--gold);
        }

        .cta-card-title { font-size: 15px; font-weight: 600; color: var(--cream); margin-bottom: 3px; }
        .cta-card-desc { font-size: 13px; font-weight: 300; color: var(--slate); }
        .cta-arrow { margin-left: auto; color: rgba(200,145,40,0.4); transition: all 0.2s; flex-shrink: 0; }
        .cta-card:hover .cta-arrow { color: var(--gold); transform: translateX(3px); }

        /* footer */
        .footer { background: var(--navy-900); border-top: 1px solid var(--border); }
        .footer-bar {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-links { display: flex; gap: 28px; list-style: none; }
        .footer-links a { font-size: 13px; font-weight: 500; color: var(--slate); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--gold); }
        .footer-copy { font-size: 12px; color: rgba(148,163,184,0.5); }

        /* skeleton */
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        .skeleton { animation: shimmer 1.5s ease-in-out infinite; background: var(--navy-700); }

        @media (max-width: 900px) {
          .hero-content { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
          .section { padding: 60px 24px; }
          .section-hdr { grid-template-columns: 1fr; gap: 16px; }
          .section-desc { text-align: left; max-width: 100%; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .how-grid { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2) { border-right: none; }
          .cta-inner { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
          .footer-bar { flex-direction: column; gap: 20px; text-align: center; padding: 24px; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }

        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .search-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-geo" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Tanzania's Premier Rental Platform
            </div>
            <h1 className="hero-title">
              Find Your<br />
              <strong>Perfect Rental Property</strong>
            </h1>
            <p className="hero-sub">
              Connect with trusted landlords and professional agents. Browse verified
              properties and manage your rental seamlessly with Oweru.
            </p>
            <div className="hero-actions">
              <Link to="/properties" className="btn-gold">Browse Properties <ArrowRight size={15} /></Link>
              <Link to="/register" className="btn-outline">Create Account <ChevronRight size={14} /></Link>
            </div>
          </div>

          <div className="search-card">
            <div className="search-card-hdr">
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
              <Search size={15} /> Search Properties
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
              <div className="stat-num">{s.num}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured Listings ── */}
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
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 340, border: '1px solid var(--border)' }} />)}
            </div>
          ) : featuredProperties.length === 0 ? (
            <EmptyState icon={<HomeIcon size={40} />} title="No featured properties yet" desc="Check back later or browse all properties." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
              {featuredProperties.map((p: any) => (
                <div key={p.id} className="prop-card">
                  <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ height: 200, backgroundImage: `url(${getImage(p)})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'var(--navy-700)' }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, color: 'var(--slate)', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={13} />{p.bedrooms} bed</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={13} />{p.bathrooms} bath</span>
                        {p.area && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Square size={13} />{p.area} sqm</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--slate)', fontSize: 13, marginBottom: 10 }}>
                        <MapPin size={12} />{p.location}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                        {formatPrice(p.price)}
                        <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 400, marginLeft: 4 }}>/month</span>
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

      {/* ── BNB ── */}
      <section style={{ background: 'var(--navy-800)', borderTop: '1px solid var(--border)' }}>
        <div className="section">
          <div className="section-hdr">
            <div>
              <div className="section-tag">Vacation Rentals</div>
              <h2 className="section-title">Premium <span>BNB Properties</span></h2>
            </div>
            <p className="section-desc">Handpicked short-term rentals perfect for getaways, business trips, or extended stays.</p>
          </div>

          {bnbLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 380, border: '1px solid var(--border)' }} />)}
            </div>
          ) : bnbProperties.length === 0 ? (
            <EmptyState icon={<Building size={40} />} title="No BNB properties yet" desc="Check back later for vacation rentals." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
              {bnbProperties.map((p: any) => (
                <div key={p.id} className="bnb-card">
                  <div style={{ position: 'relative' }}>
                    <img
                      src={getImage(p)}
                      alt={p.title}
                      style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`; }}
                    />
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--gold)', color: 'var(--navy-900)', padding: '4px 10px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.06em' }}>
                      {p.type || 'BNB'}
                    </div>
                    {p.average_rating ? (
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15,23,42,0.85)', color: 'var(--gold)', padding: '4px 10px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border)' }}>
                        ★ {Number(p.average_rating).toFixed(1)}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--slate)', fontSize: 13, marginBottom: 12 }}>
                      <MapPin size={12} />{p.location}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 13, color: 'var(--slate)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={13} />{p.bedrooms ?? '—'} beds</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={13} />{p.bathrooms ?? '—'} baths</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} />{p.max_guests ?? p.bnb_details?.max_guests ?? 2} guests</span>
                    </div>

                    {(p.bnb_details?.amenities_bnb ? Object.entries(p.bnb_details.amenities_bnb).filter(([, v]) => v).slice(0, 4) : (Array.isArray(p.amenities) ? p.amenities.slice(0, 4).map((a: string) => [a]) : [])).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {(p.bnb_details?.amenities_bnb
                          ? Object.entries(p.bnb_details.amenities_bnb).filter(([, v]) => v).slice(0, 4).map(([k]) => k)
                          : (Array.isArray(p.amenities) ? p.amenities.slice(0, 4) : [])
                        ).map((a: string) => (
                          <span key={a} style={{ fontSize: 10, padding: '3px 10px', background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 600, textTransform: 'capitalize', border: '1px solid var(--border)', letterSpacing: '0.06em' }}>{a}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                          {formatPrice(p.price)}
                          <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 400, marginLeft: 4 }}>/night</span>
                        </div>
                        {(p.min_stay ?? p.bnb_details?.min_stay ?? 0) > 1 && (
                          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>Min {p.min_stay ?? p.bnb_details?.min_stay} nights</div>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedProperty(p); setShowBookingModal(true); }}
                        style={{ background: 'var(--gold)', color: 'var(--navy-900)', border: 'none', padding: '10px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Jost, sans-serif', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-lt)')}
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
      <section style={{ background: 'var(--navy-900)', borderTop: '1px solid var(--border)' }}>
        <div className="section">
          <div className="section-hdr">
            <div>
              <div className="section-tag">Why Oweru</div>
              <h2 className="section-title">Built for the <span>Modern Tenant</span></h2>
            </div>
            <p className="section-desc">Simple, secure, and transparent rental for every party involved.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: <Search size={20} />,     title: 'Smart Search',      desc: 'Find properties matching your exact requirements with advanced filters and AI-powered recommendations.', n: '01' },
              { icon: <Shield size={20} />,     title: 'Verified Listings', desc: 'Every property is vetted by our team to prevent fraud and fully protect your interests.', n: '02' },
              { icon: <Users size={20} />,      title: 'Trusted Network',   desc: 'Connect directly with verified landlords and professional agents across Tanzania.', n: '03' },
              { icon: <TrendingUp size={20} />, title: 'Agent Dashboard',   desc: 'Track leads, conversions, and earnings with real-time analytics and reporting.', n: '04' },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div className="feat-num">{f.n}</div>
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
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
              <div className="section-tag" style={{ marginBottom: 16 }}>Process</div>
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
              <div>
                <div className="visual-big">Oweru</div>
                <div className="visual-sub">Platform Overview</div>
              </div>
              <div className="visual-div" />
              <div className="visual-stats">
                {[
                  { num: '3 min', lbl: 'Avg. Apply Time' },
                  { num: '24 hr', lbl: 'Response Rate' },
                  { num: '100%',  lbl: 'Secure Payments' },
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
        <div className="cta-inner">
          <div>
            <div className="section-tag" style={{ marginBottom: 20 }}>Get Started</div>
            <h2 className="cta-title">Ready to Find Your <strong>Next Home?</strong></h2>
            <p className="cta-desc">Join thousands of Tanzanians who have found their perfect rental property through Oweru.</p>
            <Link to="/properties" className="btn-gold">Browse All Properties <ArrowRight size={15} /></Link>
          </div>
          <div className="cta-right">
            {[
              { to: '/properties', icon: <HomeIcon size={18} />,   title: 'For Tenants',   desc: 'Browse thousands of verified rental listings' },
              { to: '/landlord',   icon: <Shield size={18} />,     title: 'For Landlords', desc: 'List your property and find qualified tenants fast' },
              { to: '/agents',     icon: <TrendingUp size={18} />, title: 'For Agents',    desc: 'Grow your business with our agent dashboard' },
            ].map(c => (
              <Link key={c.title} to={c.to} className="cta-card">
                <div className="cta-icon">{c.icon}</div>
                <div>
                  <div className="cta-card-title">{c.title}</div>
                  <div className="cta-card-desc">{c.desc}</div>
                </div>
                <ChevronRight size={16} className="cta-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      {showBookingModal && selectedProperty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--navy-800)', border: '1px solid var(--border)', padding: 36, maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--cream)', fontSize: 22, fontWeight: 700 }}>Book {selectedProperty.title}</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--slate)', fontSize: 14 }}>
                  {selectedProperty.location} · {formatPrice(selectedProperty.price)}/night
                </p>
              </div>
              <button onClick={() => setShowBookingModal(false)}
                style={{ background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--slate)', cursor: 'pointer', fontSize: 20, lineHeight: 1, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}>×</button>
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
          <img src={LOGO} alt="OWERU" style={{ height: 22, width: 'auto' }} />
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

/* ── Sub-components ── */
const EmptyState = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--slate)' }}>
    <div style={{ color: 'var(--gold)', marginBottom: 16, opacity: 0.5 }}>{icon}</div>
    <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8, fontWeight: 600 }}>{title}</h3>
    <p style={{ fontSize: 14, color: 'var(--slate)' }}>{desc}</p>
  </div>
);

const SaveButton = ({ saved, onClick }: { saved: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      border: `1px solid ${saved ? 'var(--gold)' : 'var(--border)'}`,
      backgroundColor: saved ? 'var(--gold)' : 'transparent',
      color: saved ? 'var(--navy-900)' : 'var(--slate)',
      fontSize: 12, fontWeight: 700,
      cursor: 'pointer',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all 0.2s ease', fontFamily: 'Jost, sans-serif',
    }}
  >
    <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
    {saved ? 'Saved' : 'Save'}
  </button>
);

const BookingForm = ({ property, onClose, onSuccess }: { property: any; onClose: () => void; onSuccess: () => void; }) => {
  const [formData, setFormData] = useState({ guest_name: '', guest_email: '', check_in: '', check_out: '', guest_count: '1', special_requests: '' });
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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) errs.guest_email = 'Valid email required';
    if (!formData.check_in)  errs.check_in  = 'Check-in date is required';
    if (!formData.check_out) errs.check_out = 'Check-out date is required';
    if (formData.check_in && formData.check_out && new Date(formData.check_out) <= new Date(formData.check_in)) errs.check_out = 'Check-out must be after check-in';
    if (parseInt(formData.guest_count) > maxGuests) errs.guest_count = `Maximum ${maxGuests} guests`;

    if (Object.keys(errs).length) { setErrors(errs); setLoading(false); return; }

    try {
      const res = await fetch(`${API_BASE}/api/public/bnb/bookings`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id, guest_name: formData.guest_name, guest_email: formData.guest_email, check_in: formData.check_in, check_out: formData.check_out, guests: parseInt(formData.guest_count), special_requests: formData.special_requests || null }),
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); if (body.errors) { setErrors(body.errors); return; } throw new Error('Booking failed'); }
      onSuccess();
    } catch { setErrors({ submit: 'Failed to create booking. Please try again.' }); }
    finally { setLoading(false); }
  };

  const fieldStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: 11,
    background: 'var(--navy-900)',
    border: `1px solid ${errors[field] ? '#ef4444' : 'var(--border)'}`,
    color: 'var(--cream)', fontSize: 14, fontFamily: 'Jost, sans-serif', outline: 'none',
  });

  const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.16em', textTransform: 'uppercase' };
  const err: React.CSSProperties = { color: '#ef4444', fontSize: 12, marginTop: 4 };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Your Name *</label>
          <input type="text" value={formData.guest_name} onChange={e => set('guest_name', e.target.value)} style={fieldStyle('guest_name')} placeholder="John Doe" />
          {errors.guest_name && <div style={err}>{errors.guest_name}</div>}
        </div>
        <div>
          <label style={lbl}>Your Email *</label>
          <input type="email" value={formData.guest_email} onChange={e => set('guest_email', e.target.value)} style={fieldStyle('guest_email')} placeholder="john@example.com" />
          {errors.guest_email && <div style={err}>{errors.guest_email}</div>}
        </div>
        <div>
          <label style={lbl}>Guests *</label>
          <input type="number" min="1" max={maxGuests} value={formData.guest_count} onChange={e => set('guest_count', e.target.value)} style={fieldStyle('guest_count')} />
          {errors.guest_count && <div style={err}>{errors.guest_count}</div>}
        </div>
        <div>
          <label style={lbl}>Check-in *</label>
          <input type="date" value={formData.check_in} onChange={e => set('check_in', e.target.value)} min={new Date().toISOString().split('T')[0]} style={fieldStyle('check_in')} />
          {errors.check_in && <div style={err}>{errors.check_in}</div>}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Check-out *</label>
          <input type="date" value={formData.check_out} onChange={e => set('check_out', e.target.value)} min={formData.check_in || new Date().toISOString().split('T')[0]} style={fieldStyle('check_out')} />
          {errors.check_out && <div style={err}>{errors.check_out}</div>}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Special Requests</label>
        <textarea value={formData.special_requests} onChange={e => set('special_requests', e.target.value)} rows={3} style={{ ...fieldStyle('special_requests'), resize: 'vertical' }} placeholder="Any notes…" />
      </div>
      {errors.submit && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', padding: 12, marginBottom: 16 }}><div style={err}>{errors.submit}</div></div>}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--slate)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          style={{ padding: '12px 24px', background: 'var(--gold)', border: 'none', color: 'var(--navy-900)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Jost, sans-serif' }}>
          {loading ? 'Submitting…' : 'Submit Booking'}
        </button>
      </div>
    </form>
  );
};

export default Home;