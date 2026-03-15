import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building, Home, Heart, Filter, X, FileText, Bell, Users, ArrowRight } from 'lucide-react';
import Api from '../services/api';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  image: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'tenant' | 'landlord' | 'agent';
  emailVerifiedAt?: string;
}

const TenantDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProperties: 0, savedProperties: 0, applications: 0, messages: 0 });

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) try { setUser(JSON.parse(raw)); } catch {}

    // Mock data
    setStats({ totalProperties: 145, savedProperties: 12, applications: 8, messages: 3 });
    setProperties([
      { id: 1, title: 'Modern 2-Bedroom Apartment', location: 'Masaki, Dar es Salaam', price: 800000, bedrooms: 2, bathrooms: 2, area: 120, type: 'apartment', image: null },
      { id: 2, title: 'Cozy Studio in Mikocheni',   location: 'Mikocheni, Dar es Salaam', price: 350000, bedrooms: 1, bathrooms: 1, area: 45,  type: 'studio',    image: null },
      { id: 3, title: 'Spacious House with Garden', location: 'Upanga, Dar es Salaam',   price: 1500000,bedrooms: 3, bathrooms: 2, area: 200, type: 'house',     image: null },
      { id: 4, title: 'Executive Villa, Oyster Bay', location: 'Oyster Bay, Dar es Salaam', price: 3200000, bedrooms: 4, bathrooms: 3, area: 340, type: 'villa', image: null },
      { id: 5, title: '1-Bedroom Apt in Kinondoni', location: 'Kinondoni, Dar es Salaam', price: 420000, bedrooms: 1, bathrooms: 1, area: 60, type: 'apartment', image: null },
      { id: 6, title: 'Penthouse Studio, Msasani',  location: 'Msasani, Dar es Salaam',  price: 650000, bedrooms: 1, bathrooms: 1, area: 55, type: 'studio',    image: null },
    ]);
    setLoading(false);
  }, []);

  const toggleSave = (id: number) => setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const fmt = (n: number) => `${(n / 1000).toFixed(0)}K TZS`;

  const visible = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || p.type === filterType;
    return matchSearch && matchType;
  });

  const statCards = [
    { icon: Home,     label: 'Listings',     value: stats.totalProperties },
    { icon: Heart,    label: 'Saved',        value: stats.savedProperties },
    { icon: FileText, label: 'Applications', value: stats.applications },
    { icon: Bell,     label: 'Messages',     value: stats.messages },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <div style={{ width: 32, height: 32, border: '1px solid rgba(201,168,76,0.3)', borderTop: '1px solid #c9a84c', borderRadius: '50%', animation: 'td-spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes td-spin { to { transform: rotate(360deg); } }

        .td-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #c9a84c; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .td-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(201,168,76,0.15); }

        .td-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 300;
          letter-spacing: -0.02em; color: #f5f0e8;
          margin-bottom: 20px;
        }
        .td-section-title em { font-style: italic; color: #e8c97a; }

        /* Stats */
        .td-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: rgba(201,168,76,0.15);
          border: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 40px;
        }
        .td-stat {
          background: #111; padding: 22px;
          position: relative; overflow: hidden; transition: background 0.2s;
        }
        .td-stat:hover { background: rgba(20,20,16,0.9); }
        .td-stat::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: linear-gradient(90deg, #c9a84c, transparent);
          transform: scaleX(0); transform-origin: left; transition: transform 0.4s;
        }
        .td-stat:hover::after { transform: scaleX(1); }
        .td-stat-icon {
          width: 30px; height: 30px;
          background: rgba(201,168,76,0.07); border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #c9a84c; margin-bottom: 14px;
        }
        .td-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px; font-weight: 300;
          letter-spacing: -0.03em; color: #f5f0e8; line-height: 1; margin-bottom: 4px;
        }
        .td-stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase; color: #8a8070;
        }

        /* Search bar */
        .td-search-bar {
          display: flex; gap: 8px; margin-bottom: 32px; flex-wrap: wrap;
        }
        .td-search-wrap {
          flex: 1; min-width: 200px;
          display: flex; align-items: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.12);
          transition: border-color 0.2s;
        }
        .td-search-wrap:focus-within { border-color: rgba(201,168,76,0.35); }
        .td-search-icon { padding: 0 12px; color: #8a8070; display: flex; align-items: center; }
        .td-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #f5f0e8; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300; padding: 10px 12px 10px 0;
        }
        .td-search-input::placeholder { color: rgba(138,128,112,0.4); }
        .td-filter-select {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.12);
          color: #8a8070; padding: 10px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; outline: none; cursor: pointer; min-width: 130px;
        }
        .td-filter-select:focus { border-color: rgba(201,168,76,0.35); color: #f5f0e8; }

        /* Property grid */
        .td-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.12);
        }
        .td-card {
          background: #111; display: flex; flex-direction: column;
          transition: background 0.2s; position: relative; overflow: hidden;
        }
        .td-card:hover { background: rgba(18,18,14,0.98); }
        .td-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: linear-gradient(90deg, #c9a84c, transparent);
          transform: scaleX(0); transform-origin: left; transition: transform 0.4s;
        }
        .td-card:hover::after { transform: scaleX(1); }

        .td-img {
          aspect-ratio: 4/3;
          background: rgba(201,168,76,0.04);
          border-bottom: 1px solid rgba(201,168,76,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(201,168,76,0.2); position: relative;
        }
        .td-save-btn {
          position: absolute; top: 10px; right: 10px;
          width: 28px; height: 28px;
          background: rgba(10,10,10,0.8);
          border: 1px solid rgba(201,168,76,0.2);
          color: #8a8070; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          opacity: 0;
        }
        .td-card:hover .td-save-btn { opacity: 1; }
        .td-save-btn.saved { color: #c9a84c; border-color: rgba(201,168,76,0.5); opacity: 1; }
        .td-save-btn:hover { color: #c9a84c; }

        .td-type-badge {
          position: absolute; bottom: 10px; left: 10px;
          background: rgba(10,10,10,0.8); border: 1px solid rgba(201,168,76,0.2);
          color: #c9a84c; font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 0.15em;
          text-transform: uppercase; padding: 3px 8px;
        }

        .td-body { padding: 18px; flex: 1; display: flex; flex-direction: column; }
        .td-location {
          display: flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 7px;
        }
        .td-prop-title {
          font-size: 15px; font-weight: 400; color: #f5f0e8;
          letter-spacing: -0.01em; margin-bottom: 10px; line-height: 1.3;
        }
        .td-specs {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0;
          border-top: 1px solid rgba(201,168,76,0.07);
          border-bottom: 1px solid rgba(201,168,76,0.07);
          margin-bottom: 14px;
        }
        .td-spec {
          display: flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif; font-size: 11px;
          font-weight: 300; color: #8a8070;
        }
        .td-spec svg { color: #c9a84c; }
        .td-spec-div { width: 1px; height: 12px; background: rgba(201,168,76,0.15); }

        .td-footer { display: flex; align-items: center; justify-content: space-between; }
        .td-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 300; color: #c9a84c;
        }
        .td-price span {
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          font-weight: 300; color: rgba(138,128,112,0.55);
        }
        .td-view-link {
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(201,168,76,0.5); text-decoration: none;
          display: flex; align-items: center; gap: 4px;
          transition: color 0.2s; opacity: 0;
        }
        .td-card:hover .td-view-link { opacity: 1; color: #c9a84c; }

        /* Quick links */
        .td-quick { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 40px; }
        .td-quick-link {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.15);
          color: #8a8070; text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 400;
          letter-spacing: 0.08em; text-transform: uppercase;
          transition: all 0.2s;
        }
        .td-quick-link:hover { color: #f5f0e8; border-color: rgba(201,168,76,0.4); }

        @media (max-width: 900px) {
          .td-stats { grid-template-columns: 1fr 1fr; }
          .td-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .td-stats { grid-template-columns: 1fr; }
          .td-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Stats */}
        <div className="td-eyebrow">Welcome back{user?.first_name ? `, ${user.first_name}` : ''}</div>
        <div className="td-stats">
          {statCards.map(s => (
            <div key={s.label} className="td-stat">
              <div className="td-stat-icon"><s.icon size={13} /></div>
              <div className="td-stat-value">{s.value}</div>
              <div className="td-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="td-eyebrow">Browse Properties</div>
        <h2 className="td-section-title">Find Your <em>Rental</em></h2>

        <div className="td-search-bar">
          <div className="td-search-wrap">
            <span className="td-search-icon"><Search size={14} /></span>
            <input
              className="td-search-input"
              placeholder="Search by location or name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="td-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
          </select>
        </div>

        {/* Grid */}
        <div className="td-grid">
          {visible.map(p => (
            <div key={p.id} className="td-card">
              <div className="td-img">
                <Home size={32} />
                <button
                  className={`td-save-btn${savedIds.includes(p.id) ? ' saved' : ''}`}
                  onClick={() => toggleSave(p.id)}
                >
                  <Heart size={12} fill={savedIds.includes(p.id) ? 'currentColor' : 'none'} />
                </button>
                <div className="td-type-badge">{p.type}</div>
              </div>
              <div className="td-body">
                <div className="td-location">
                  <MapPin size={10} style={{ color: '#c9a84c' }} />
                  {p.location}
                </div>
                <div className="td-prop-title">{p.title}</div>
                <div className="td-specs">
                  <div className="td-spec"><Home size={11} />{p.bedrooms} Beds</div>
                  <div className="td-spec-div" />
                  <div className="td-spec"><Users size={11} />{p.bathrooms} Baths</div>
                  <div className="td-spec-div" />
                  <div className="td-spec"><MapPin size={11} />{p.area}m²</div>
                </div>
                <div className="td-footer">
                  <div className="td-price">{fmt(p.price)}<span>/mo</span></div>
                  <Link to={`/property/${p.id}`} className="td-view-link">
                    View <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="td-quick">
          <Link to="/properties"        className="td-quick-link"><Search size={12} />All Properties</Link>
          <Link to="/saved-properties"  className="td-quick-link"><Heart size={12} />Saved ({savedIds.length})</Link>
          <Link to="/applications"      className="td-quick-link"><FileText size={12} />My Applications</Link>
        </div>

      </div>
    </>
  );
};

export default TenantDashboard;