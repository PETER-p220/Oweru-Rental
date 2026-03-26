import { Link } from 'react-router-dom';
import { Search, Home as HomeIcon, Users, Shield, TrendingUp, ArrowRight, MapPin, Star, ChevronRight, Bed, Bath, Square, DollarSign, Building } from 'lucide-react';
import { useState, useEffect } from 'react';
import Api from '../services/api';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const Home = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    activeListings: 0,
    avgResponseTime: '24 hr'
  });

  // Load properties on component mount
  useEffect(() => {
    loadProperties();
    loadStats();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      console.log('Loading properties from API...');
      const response = await Api.getProperties();
      console.log('API Response:', response);
      
      // Backend returns { data: [...], pagination: {...} }
      const propertiesData = response.data?.data ?? response.data ?? [];
      console.log('Properties data:', propertiesData);
      
      setProperties(propertiesData);
      
      // Set featured properties (first 6)
      const featured = propertiesData.slice(0, 6);
      console.log('Featured properties:', featured);
      setFeaturedProperties(featured);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setFeaturedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // You can create a stats endpoint or use mock data
      setStats({
        totalProperties: 1247,
        totalUsers: 3842,
        activeListings: 892,
        avgResponseTime: '24 hr'
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: '#0a0a0a', color: '#f5f0e8', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #c9a84c;
          --gold-light: #e8c97a;
          --dark: #0a0a0a;
          --dark-2: #111111;
          --dark-3: #1a1a1a;
          --cream: #f5f0e8;
          --muted: #8a8070;
          --border: rgba(201,168,76,0.15);
        }

        .sans { font-family: 'DM Sans', sans-serif; }

        /* Hero */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(201,168,76,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 20% 80%, rgba(201,168,76,0.04) 0%, transparent 50%),
            linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 60%, #0d0c08 100%);
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .hero-number {
          position: absolute;
          right: 8%;
          top: 50%;
          transform: translateY(-50%);
          font-size: clamp(180px, 22vw, 320px);
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1px rgba(201,168,76,0.08);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.05em;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 40px 80px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          width: 100%;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 24px;
        }

        .hero-eyebrow::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--gold);
        }

        .hero-title {
          font-size: clamp(42px, 5vw, 72px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--cream);
          margin-bottom: 24px;
        }

        .hero-title em {
          font-style: italic;
          color: var(--gold-light);
          font-weight: 300;
        }

        .hero-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
          margin-bottom: 40px;
          max-width: 420px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--gold);
          color: #0a0a0a;
          padding: 14px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }

        .btn-primary:hover {
          background: var(--gold-light);
          gap: 16px;
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--cream);
          padding: 14px 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-decoration: none;
          border-bottom: 1px solid rgba(245,240,232,0.2);
          transition: all 0.25s ease;
        }

        .btn-ghost:hover {
          color: var(--gold);
          border-color: var(--gold);
          gap: 12px;
        }

        /* Search Panel */
        .search-panel {
          background: rgba(26,26,26,0.8);
          border: 1px solid var(--border);
          backdrop-filter: blur(20px);
          padding: 32px;
          position: relative;
        }

        .search-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .search-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-label::before { content: '//'; color: var(--gold); }

        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.12);
          color: var(--cream);
          padding: 12px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          margin-bottom: 12px;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input::placeholder { color: rgba(138,128,112,0.6); }
        .search-input:focus { border-color: rgba(201,168,76,0.4); }

        .search-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .search-select {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.12);
          color: var(--muted);
          padding: 12px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s;
        }

        .search-select:focus { border-color: rgba(201,168,76,0.4); color: var(--cream); }

        .search-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--gold);
          color: #0a0a0a;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-btn:hover { background: var(--gold-light); }

        .search-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .search-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: var(--muted);
          padding: 4px 10px;
          border: 1px solid rgba(201,168,76,0.1);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .search-tag:hover { color: var(--gold); border-color: rgba(201,168,76,0.4); }

        /* Stats bar */
        .stats-bar {
          background: var(--dark-3);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 28px 40px;
        }

        .stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        .stat-item {
          text-align: center;
          padding: 0 24px;
          border-right: 1px solid var(--border);
        }

        .stat-item:last-child { border-right: none; }

        .stat-number {
          font-size: 32px;
          font-weight: 300;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* Features */
        .section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 40px;
        }

        .section-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: end;
          margin-bottom: 64px;
        }

        .section-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-eyebrow::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .section-title {
          font-size: clamp(32px, 3.5vw, 48px);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--cream);
        }

        .section-title em { font-style: italic; color: var(--gold-light); }

        .section-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
          align-self: end;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .feature-card {
          background: var(--dark-2);
          padding: 40px 32px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .feature-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }

        .feature-card:hover { background: rgba(26,26,26,0.9); }
        .feature-card:hover::after { transform: scaleX(1); }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 24px;
          color: var(--gold);
        }

        .feature-number {
          position: absolute;
          top: 16px;
          right: 20px;
          font-size: 11px;
          font-family: 'DM Sans', sans-serif;
          color: rgba(201,168,76,0.2);
          letter-spacing: 0.1em;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .feature-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.65;
          color: var(--muted);
        }

        /* How it works */
        .how-section {
          background: var(--dark-3);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .how-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 80px;
          align-items: start;
        }

        .how-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .how-step {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 24px;
          padding: 32px 0;
          border-bottom: 1px solid var(--border);
          align-items: start;
        }

        .how-step:last-child { border-bottom: none; }

        .step-num {
          font-size: 11px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.1em;
          padding-top: 4px;
        }

        .step-title {
          font-size: 20px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .step-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.65;
          color: var(--muted);
        }

        /* Visual accent panel */
        .how-visual {
          position: sticky;
          top: 80px;
          background: rgba(201,168,76,0.04);
          border: 1px solid var(--border);
          padding: 48px;
          text-align: center;
        }

        .visual-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        .visual-ring {
          width: 100px;
          height: 100px;
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .visual-ring::before {
          content: '';
          position: absolute;
          inset: 8px;
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 50%;
        }

        .visual-inner {
          font-size: 28px;
          font-weight: 300;
          color: var(--gold);
          letter-spacing: -0.03em;
        }

        .visual-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .visual-divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, var(--gold), transparent);
          margin: 0 auto 32px;
        }

        .visual-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .visual-stat {
          background: var(--dark-2);
          padding: 20px;
        }

        .visual-stat-num {
          font-size: 22px;
          font-weight: 300;
          color: var(--gold-light);
          margin-bottom: 4px;
        }

        .visual-stat-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.08em;
        }

        /* CTA */
        .cta-section {
          position: relative;
          overflow: hidden;
          border-top: 1px solid var(--border);
        }

        .cta-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 100% at 100% 50%, rgba(201,168,76,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 80% at 0% 50%, rgba(201,168,76,0.04) 0%, transparent 50%);
        }

        .cta-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 40px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .cta-title {
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--cream);
          margin-bottom: 20px;
        }

        .cta-title em { font-style: italic; color: var(--gold-light); }

        .cta-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
          margin-bottom: 40px;
        }

        .cta-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cta-card {
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.15);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-card:hover {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.35);
          transform: translateX(4px);
        }

        .cta-card-icon {
          width: 44px;
          height: 44px;
          background: rgba(201,168,76,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--gold);
        }

        .cta-card-title {
          font-size: 17px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .cta-card-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--muted);
        }

        .cta-card-arrow {
          margin-left: auto;
          color: var(--gold);
          opacity: 0;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }

        .cta-card:hover .cta-card-arrow { opacity: 1; }

        /* Footer bar */
        .footer-bar {
          border-top: 1px solid var(--border);
          padding: 24px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-logo {
          font-size: 20px;
          font-weight: 300;
          color: var(--cream);
          letter-spacing: 0.05em;
        }

        .footer-logo span { color: var(--gold); }

        .footer-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }

        .footer-links a {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover { color: var(--gold); }

        .footer-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(138,128,112,0.5);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-content { grid-template-columns: 1fr; gap: 48px; padding: 100px 24px 60px; }
          .hero-number { display: none; }
          .section { padding: 70px 24px; }
          .section-header { grid-template-columns: 1fr; gap: 20px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .how-grid { grid-template-columns: 1fr; }
          .how-visual { display: none; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--border); }
          .stat-item { border-right: none; padding: 20px; background: var(--dark-3); }
          .cta-inner { grid-template-columns: 1fr; gap: 40px; padding: 70px 24px; }
          .footer-bar { flex-direction: column; gap: 20px; text-align: center; padding: 24px; }
          .footer-links { flex-wrap: wrap; justify-content: center; gap: 16px; }
        }

        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .search-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-number">TZ</div>

        <div className="hero-content">
          <div>
            <div className="hero-eyebrow">Tanzania's Premier Rental Platform</div>
            <h1 className="hero-title">
              Find Your <em>Perfect</em><br />
              Rental Property
            </h1>
            <p className="hero-subtitle">
              Connect with trusted landlords and professional agents. Browse verified 
              properties and manage your rental seamlessly with Oweru.
            </p>
            <div className="hero-actions">
              <Link to="/properties" className="btn-primary">
                Browse Properties
                <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="btn-ghost">
                Create Account
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-label">Search Properties</div>
            <input
              type="text"
              placeholder="Location, district, neighbourhood..."
              className="search-input"
            />
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
            <button className="search-btn">
              <Search size={16} />
              Search Properties
            </button>
            <div className="search-tags">
              <span className="search-tag">Dar es Salaam</span>
              <span className="search-tag">Arusha</span>
              <span className="search-tag">Mwanza</span>
              <span className="search-tag">Dodoma</span>
              <span className="search-tag">Studio</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-inner">
          {[
            { num: stats.totalProperties.toLocaleString(), lbl: 'Active Listings' },
            { num: stats.totalUsers.toLocaleString(), lbl: 'Registered Users' },
            { num: stats.activeListings.toLocaleString(), lbl: 'Available Now' },
            { num: stats.avgResponseTime, lbl: 'Avg. Response' },
          ].map((s) => (
            <div key={s.lbl} className="stat-item">
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Properties */}
      <section style={{ background: 'var(--dark-2)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Featured Listings</div>
              <h2 className="section-title">
                Popular<br />
                <em>Properties</em>
              </h2>
            </div>
            <Link to="/properties" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--muted)' }}>
              Loading featured properties...
            </div>
          ) : featuredProperties.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginBottom: '40px'
            }}>
              {featuredProperties.map((property) => (
                <Link 
                  key={property.id} 
                  to={`/property/${property.id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    background: 'var(--dark)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gold)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {(property.images && property.images.length > 0) ? (
                    <div style={{ 
                      height: '200px', 
                      backgroundImage: `url(${property.images[0]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: '#1a1a1a'
                    }} />
                  ) : (
                    <div style={{ 
                      height: '200px', 
                      background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      <Building size={32} />
                    </div>
                  )}
                  <div style={{ padding: '20px' }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '400', 
                      color: 'var(--cream)', 
                      marginBottom: '8px',
                      lineHeight: '1.3'
                    }}>
                      {property.title}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      marginBottom: '12px',
                      color: 'var(--muted)',
                      fontSize: '14px',
                      fontFamily: "'DM Sans', sans-serif"
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bed size={14} />
                        {property.bedrooms} bed
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bath size={14} />
                        {property.bathrooms} bath
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Square size={14} />
                        {property.area} sqm
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: 'var(--muted)',
                        fontSize: '13px',
                        fontFamily: "'DM Sans', sans-serif"
                      }}>
                        <MapPin size={14} />
                        {property.location}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '500', 
                      color: 'var(--gold)' 
                    }}>
                      {formatPrice(property.price)}
                      <span style={{ 
                        fontSize: '14px', 
                        color: 'var(--muted)', 
                        fontWeight: '300',
                        marginLeft: '4px'
                      }}>
                        /month
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--muted)' }}>
              <HomeIcon size={48} style={{ color: 'var(--gold)', marginBottom: '16px' }} />
              <h3 style={{ color: 'var(--cream)', fontSize: '18px', marginBottom: '8px' }}>
                No featured properties available
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
                Check back later for new listings or browse all properties.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'var(--dark)' }}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">Why Oweru</div>
              <h2 className="section-title">
                Built for the<br />
                <em>Modern Tenant</em>
              </h2>
            </div>
            <p className="section-desc">
              We make property rental simple, secure, and transparent for 
              every party involved — tenants, landlords, and agents alike.
            </p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: <Search size={20} />,
                title: 'Smart Search',
                desc: 'Find properties that match your exact requirements with advanced filters for location, price, and amenities.',
              },
              {
                icon: <Shield size={20} />,
                title: 'Verified Listings',
                desc: 'Every property is vetted by our team to ensure accuracy, prevent fraud, and protect your interests.',
              },
              {
                icon: <Users size={20} />,
                title: 'Trusted Network',
                desc: 'Connect directly with verified landlords and professional real estate agents across Tanzania.',
              },
              {
                icon: <TrendingUp size={20} />,
                title: 'Agent Dashboard',
                desc: 'Track leads, conversions, and earnings. Grow your agency with real-time analytics and insights.',
              },
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

      {/* How It Works */}
      <section className="how-section">
        <div className="section">
          <div className="how-grid">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 20 }}>Process</div>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                How<br /><em>Oweru Works</em>
              </h2>
              <div className="how-steps">
                {[
                  {
                    num: '01',
                    title: 'Browse & Apply',
                    desc: 'Search for properties that fit your needs and submit your rental application entirely online.',
                  },
                  {
                    num: '02',
                    title: 'Get Approved',
                    desc: 'Landlords review your application and approve qualified tenants quickly through our platform.',
                  },
                  {
                    num: '03',
                    title: 'Pay & Move In',
                    desc: 'Securely pay your first month\'s rent and deposit through our trusted payment system.',
                  },
                ].map((step) => (
                  <div key={step.num} className="how-step">
                    <div className="step-num">{step.num}</div>
                    <div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="how-visual">
              <div className="visual-badge">
                <div className="visual-ring">
                  <div className="visual-inner">TZ</div>
                </div>
              </div>
              <div className="visual-divider" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                  Platform at a Glance
                </div>
              </div>
              <div className="visual-stats">
                {[
                  { num: '3 min', lbl: 'Avg. Apply Time' },
                  { num: '24 hr', lbl: 'Response Rate' },
                  { num: '100%', lbl: 'Secure Payments' },
                  { num: '5★',   lbl: 'Avg. Rating' },
                ].map((v) => (
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

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="cta-inner">
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 20 }}>Get Started</div>
            <h2 className="cta-title">
              Ready to Find<br />
              Your <em>Next Home?</em>
            </h2>
            <p className="cta-desc">
              Join thousands of Tanzanians who have found their perfect rental 
              property through Oweru's trusted platform.
            </p>
            <Link to="/properties" className="btn-primary">
              Browse All Properties
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="cta-right">
            {[
              {
                to: '/properties',
                icon: <HomeIcon size={18} />,
                title: 'For Tenants',
                desc: 'Browse thousands of verified rental listings',
              },
              {
                to: '/landlord',
                icon: <Shield size={18} />,
                title: 'For Landlords',
                desc: 'List your property and find qualified tenants fast',
              },
              {
                to: '/agents',
                icon: <TrendingUp size={18} />,
                title: 'For Agents',
                desc: 'Grow your business with our agent dashboard',
              },
            ].map((card) => (
              <Link key={card.title} to={card.to} className="cta-card">
                <div className="cta-card-icon">{card.icon}</div>
                <div>
                  <div className="cta-card-title">{card.title}</div>
                  <div className="cta-card-desc">{card.desc}</div>
                </div>
                <ChevronRight size={16} className="cta-card-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="footer-bar">
          <div className="footer-logo">
            <img src={LOGO} alt="OWERU" style={{ height: '20px', width: 'auto' }} />
          </div>
          <ul className="footer-links">
            {['Properties', 'Landlords', 'Agents', 'About', 'Contact'].map((l) => (
              <li key={l}><Link to={`/${l.toLowerCase()}`}>{l}</Link></li>
            ))}
          </ul>
          <div className="footer-copy">© 2025 Oweru. Tanzania.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;