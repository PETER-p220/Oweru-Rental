import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, FileText, Users, BarChart3, DollarSign, MapPin, ArrowRight, TrendingUp, Eye } from 'lucide-react';
import Api from '../services/api';

interface Property {
  id: number;
  title: string;
  images?: string[];
  location: string;
  price: number;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  type?: string;
}

const LandlordDashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0, totalApplications: 0, activeTenants: 0,
    monthlyRevenue: 0, totalRevenue: 0, occupancyRate: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sr, pr] = await Promise.all([Api.getDashboardData(), Api.getMyProperties()]);
      if (sr.data) {
        // Handle optional properties with defaults
        setStats({
          ...sr.data,
          // Provide default values for optional properties
          activeTenants: sr.data.activeTenants || 0,
          monthlyRevenue: sr.data.monthlyRevenue || 0,
          totalRevenue: sr.data.totalRevenue || 0,
          occupancyRate: sr.data.occupancyRate || 0,
        });
      }
      if (pr.data) setProperties(pr.data.slice(0, 5));
    } catch (e) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

  const statCards = [
    { icon: Building,   label: 'Total Properties',   value: stats.totalProperties,                 suffix: '',  trend: null },
    { icon: FileText,   label: 'Applications',        value: stats.totalApplications,               suffix: '',  trend: '+3 this week' },
    { icon: Users,      label: 'Active Tenants',      value: stats.activeTenants,                   suffix: '',  trend: null },
    { icon: DollarSign, label: 'Monthly Revenue',     value: fmt(stats.monthlyRevenue),             suffix: '',  trend: `${stats.occupancyRate || 0}% occupancy` },
  ];

  const quickActions = [
    { label: 'Add Property',       icon: Plus,      to: '/properties/add',  primary: true },
    { label: 'My Properties',      icon: Building,  to: '/my-properties',   primary: false },
    { label: 'Applications',       icon: FileText,  to: '/applications',    primary: false },
    { label: 'Analytics',          icon: BarChart3, to: '/analytics',       primary: false },
  ];

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '1px solid rgba(201,168,76,0.3)', borderTop: '1px solid #c9a84c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8a8070', fontWeight: 300 }}>Loading dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#e07070', marginBottom: 20 }}>{error}</p>
          <button onClick={loadDashboardData} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c', padding: '10px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ld-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #c9a84c; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .ld-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(201,168,76,0.15); }

        .ld-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 300;
          letter-spacing: -0.02em; color: #f5f0e8;
          margin-bottom: 20px;
        }
        .ld-section-title em { font-style: italic; color: #e8c97a; }

        /* Stat cards */
        .ld-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(201,168,76,0.15);
          border: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 40px;
        }

        .ld-stat {
          background: #111;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }

        .ld-stat:hover { background: rgba(20,20,16,0.9); }

        .ld-stat::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #c9a84c, transparent);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s;
        }

        .ld-stat:hover::after { transform: scaleX(1); }

        .ld-stat-icon {
          width: 32px; height: 32px;
          background: rgba(201,168,76,0.07);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #c9a84c; margin-bottom: 16px;
        }

        .ld-stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 8px;
        }

        .ld-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 300;
          letter-spacing: -0.03em; color: #f5f0e8;
          line-height: 1; margin-bottom: 6px;
        }

        .ld-stat-trend {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300;
          color: rgba(138,128,112,0.55);
          letter-spacing: 0.04em;
        }

        /* Quick actions */
        .ld-actions {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .ld-action-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; cursor: pointer;
          transition: all 0.2s; border: none;
        }

        .ld-action-btn.primary {
          background: #c9a84c; color: #0a0a0a;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }

        .ld-action-btn.primary:hover { background: #e8c97a; gap: 12px; }

        .ld-action-btn.ghost {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.15);
          color: #8a8070;
        }

        .ld-action-btn.ghost:hover { border-color: rgba(201,168,76,0.4); color: #f5f0e8; }

        /* Property list */
        .ld-prop-list { display: flex; flex-direction: column; gap: 1px; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.12); }

        .ld-prop-row {
          background: #111;
          display: flex; align-items: center; gap: 20px;
          padding: 18px 20px;
          transition: background 0.2s;
          position: relative;
        }

        .ld-prop-row:hover { background: rgba(20,20,16,0.95); }

        .ld-prop-img {
          width: 80px; height: 56px;
          background: rgba(201,168,76,0.05);
          border: 1px solid rgba(201,168,76,0.1);
          object-fit: cover;
          flex-shrink: 0;
          filter: brightness(0.8) saturate(0.7);
        }

        .ld-prop-info { flex: 1; min-width: 0; }

        .ld-prop-title {
          font-size: 15px; font-weight: 400;
          color: #f5f0e8; letter-spacing: -0.01em;
          margin-bottom: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .ld-prop-meta {
          display: flex; align-items: center; gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300; color: #8a8070;
        }

        .ld-prop-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 300;
          color: #c9a84c; letter-spacing: -0.02em;
          flex-shrink: 0;
        }

        .ld-prop-price span {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 300; color: rgba(138,128,112,0.55);
        }

        .ld-prop-btns {
          display: flex; gap: 6px; flex-shrink: 0;
          opacity: 0; transition: opacity 0.2s;
        }

        .ld-prop-row:hover .ld-prop-btns { opacity: 1; }

        .ld-prop-btn {
          padding: 5px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; transition: all 0.2s;
        }

        .ld-prop-btn.outline {
          border: 1px solid rgba(201,168,76,0.2);
          color: #8a8070; background: transparent;
        }

        .ld-prop-btn.outline:hover { border-color: rgba(201,168,76,0.5); color: #f5f0e8; }

        .ld-prop-btn.gold {
          background: rgba(201,168,76,0.12);
          border: 1px solid rgba(201,168,76,0.25);
          color: #c9a84c;
        }

        .ld-prop-btn.gold:hover { background: rgba(201,168,76,0.2); }

        /* Empty */
        .ld-empty {
          text-align: center; padding: 56px 24px;
          background: #111; border: 1px solid rgba(201,168,76,0.1);
        }

        .ld-empty-icon {
          width: 52px; height: 52px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #c9a84c; margin: 0 auto 20px;
        }

        .ld-empty-title {
          font-size: 22px; font-weight: 300;
          color: #f5f0e8; margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .ld-empty-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300;
          color: #8a8070; margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .ld-stats { grid-template-columns: 1fr 1fr; }
          .ld-prop-btns { opacity: 1; }
        }

        @media (max-width: 560px) {
          .ld-stats { grid-template-columns: 1fr; }
          .ld-prop-row { flex-wrap: wrap; }
          .ld-prop-img { display: none; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Stats */}
        <div className="ld-eyebrow">Overview</div>
        <div className="ld-stats">
          {statCards.map((s) => (
            <div key={s.label} className="ld-stat">
              <div className="ld-stat-icon"><s.icon size={14} /></div>
              <div className="ld-stat-label">{s.label}</div>
              <div className="ld-stat-value">{s.value}</div>
              {s.trend && <div className="ld-stat-trend">{s.trend}</div>}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="ld-eyebrow">Quick Actions</div>
        <div className="ld-actions" style={{ marginBottom: 48 }}>
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className={`ld-action-btn ${a.primary ? 'primary' : 'ghost'}`}>
              <a.icon size={13} />
              {a.label}
              {a.primary && <ArrowRight size={12} />}
            </Link>
          ))}
        </div>

        {/* Recent properties */}
        <div className="ld-eyebrow">Recent Properties</div>
        <h2 className="ld-section-title">Your <em>Listings</em></h2>

        {properties.length > 0 ? (
          <div className="ld-prop-list">
            {properties.map((p) => (
              <div key={p.id} className="ld-prop-row">
                <div className="ld-prop-img" style={{ background: 'rgba(201,168,76,0.05)' }}>
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={p.title} className="ld-prop-img" />
                  )}
                </div>
                <div className="ld-prop-info">
                  <div className="ld-prop-title">{p.title}</div>
                  <div className="ld-prop-meta">
                    <MapPin size={10} style={{ color: '#c9a84c' }} />
                    {p.location}
                    <span style={{ color: 'rgba(138,128,112,0.3)' }}>·</span>
                    {p.bedrooms}bd · {p.bathrooms}ba · {p.area}m²
                  </div>
                </div>
                <div className="ld-prop-price">
                  {fmt(p.price)}<span>/mo</span>
                </div>
                <div className="ld-prop-btns">
                  <Link to={`/properties/${p.id}/edit`} className="ld-prop-btn outline">Edit</Link>
                  <Link to={`/properties/${p.id}`}       className="ld-prop-btn gold">View</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ld-empty">
            <div className="ld-empty-icon"><Building size={20} /></div>
            <div className="ld-empty-title">No properties yet</div>
            <p className="ld-empty-desc">Add your first listing to start attracting tenants.</p>
            <Link to="/properties/add" className="ld-action-btn primary" style={{ display: 'inline-flex' }}>
              <Plus size={13} /> Add Property <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {properties.length > 0 && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Link to="/my-properties" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c9a84c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              View all properties <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default LandlordDashboard;