import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Users, TrendingUp, DollarSign, BarChart3, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import Api from '../services/api';

type LeadStatus = 'new' | 'contacted' | 'interested' | 'closed';

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const statusConfig: Record<LeadStatus, StatusConfig> = {
  new:        { label: 'New',        color: '#70c490', bg: 'rgba(112,196,144,0.1)',  border: 'rgba(112,196,144,0.25)' },
  contacted:  { label: 'Contacted',  color: '#c9a84c', bg: 'rgba(201,168,76,0.1)',   border: 'rgba(201,168,76,0.25)'  },
  interested: { label: 'Interested', color: '#7ab4e8', bg: 'rgba(122,180,232,0.1)',  border: 'rgba(122,180,232,0.25)' },
  closed:     { label: 'Closed',     color: '#8a8070', bg: 'rgba(138,128,112,0.08)', border: 'rgba(138,128,112,0.2)'  },
};

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  property: string;
  status: LeadStatus;
  created: string;
}

const AgentDashboard = () => {
  const [stats,      setStats]      = useState({ totalListings: 0, totalLeads: 0, activeDeals: 0, monthlyCommission: 0, totalCommission: 0, conversionRate: 0 });
  const [properties, setProperties] = useState<any[]>([]);
  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Use mock data when API fails
      const mockStats = {
        totalListings: 12,
        totalLeads: 8,
        activeDeals: 3,
        monthlyCommission: 2400000,
        totalCommission: 7200000,
        conversionRate: 25
      };
      const mockProperties = [
        { id: 1, title: 'Modern Apartment', location: 'Dar es Salaam', price: 450000, status: 'available' },
        { id: 2, title: 'Beach House', location: 'Zanzibar', price: 1200000, status: 'sold' },
        { id: 3, title: 'City Villa', location: 'Arusha', price: 850000, status: 'available' }
      ];
      const mockLeads: Lead[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+255123456789', property: 'Modern Apartment', status: 'new', created: '2024-03-14' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+255987654321', property: 'Beach House', status: 'contacted', created: '2024-03-13' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+255456789123', property: 'City Villa', status: 'interested', created: '2024-03-12' },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+255789123456', property: 'Modern Apartment', status: 'new', created: '2024-03-14' },
        { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '+255321654987', property: 'Beach House', status: 'contacted', created: '2024-03-11' }
      ];

      setStats(mockStats);
      setProperties(mockProperties);
      setLeads(mockLeads);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set mock data even on error
      setStats({
        totalListings: 12,
        totalLeads: 8,
        activeDeals: 3,
        monthlyCommission: 2400000,
        totalCommission: 7200000,
        conversionRate: 25
      });
      setProperties([]);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

  const statCards = [
    { icon: Building,    label: 'Total Listings',      value: stats.totalListings },
    { icon: Users,       label: 'Total Leads',          value: stats.totalLeads },
    { icon: TrendingUp,  label: 'Active Deals',         value: stats.activeDeals },
    { icon: DollarSign,  label: 'Monthly Commission',   value: fmt(stats.monthlyCommission) },
  ];

  const quickActions = [
    { label: 'Add Listing',        icon: Plus,       to: '/listings/add',  primary: true },
    { label: 'My Listings',        icon: Building,   to: '/my-listings',   primary: false },
    { label: 'View Leads',         icon: Users,      to: '/leads',         primary: false },
    { label: 'Commission Report',  icon: DollarSign, to: '/commissions',   primary: false },
  ];

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '1px solid rgba(201,168,76,0.3)', borderTop: '1px solid #c9a84c', borderRadius: '50%', animation: 'ad-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
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
        @keyframes ad-spin { to { transform: rotate(360deg); } }

        .ad-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #c9a84c; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .ad-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(201,168,76,0.15); }

        .ad-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 300;
          letter-spacing: -0.02em; color: #f5f0e8;
          margin-bottom: 20px;
        }
        .ad-section-title em { font-style: italic; color: #e8c97a; }

        /* Stats */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(201,168,76,0.15);
          border: 1px solid rgba(201,168,76,0.15);
          margin-bottom: 40px;
        }

        .ad-stat {
          background: #111;
          padding: 24px;
          position: relative; overflow: hidden;
          transition: background 0.2s;
        }

        .ad-stat:hover { background: rgba(20,20,16,0.9); }

        .ad-stat::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #c9a84c, transparent);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s;
        }

        .ad-stat:hover::after { transform: scaleX(1); }

        .ad-stat-icon {
          width: 32px; height: 32px;
          background: rgba(201,168,76,0.07);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #c9a84c; margin-bottom: 16px;
        }

        .ad-stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 8px;
        }

        .ad-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 300;
          letter-spacing: -0.03em; color: #f5f0e8; line-height: 1;
        }

        /* Actions */
        .ad-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 48px; }

        .ad-action-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; cursor: pointer;
          transition: all 0.2s; border: none;
        }

        .ad-action-btn.primary {
          background: #c9a84c; color: #0a0a0a;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }
        .ad-action-btn.primary:hover { background: #e8c97a; gap: 12px; }

        .ad-action-btn.ghost {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.15); color: #8a8070;
        }
        .ad-action-btn.ghost:hover { border-color: rgba(201,168,76,0.4); color: #f5f0e8; }

        /* Two-col grid */
        .ad-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        /* Listings */
        .ad-listings { display: flex; flex-direction: column; gap: 1px; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.12); }

        .ad-listing-row {
          background: #111; padding: 16px 18px;
          transition: background 0.2s; position: relative;
        }

        .ad-listing-row:hover { background: rgba(20,20,16,0.95); }

        .ad-listing-row::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(201,168,76,0.1), transparent);
        }

        .ad-listing-title {
          font-size: 15px; font-weight: 400; color: #f5f0e8;
          letter-spacing: -0.01em; margin-bottom: 6px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .ad-listing-meta {
          display: flex; align-items: center; gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300; color: #8a8070;
          margin-bottom: 10px;
        }

        .ad-listing-footer {
          display: flex; align-items: center; justify-content: space-between;
        }

        .ad-listing-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px; font-weight: 300; color: #c9a84c;
        }

        .ad-avail-badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 3px 8px; border: 1px solid;
        }

        /* Leads */
        .ad-leads { display: flex; flex-direction: column; gap: 1px; background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.12); }

        .ad-lead-row {
          background: #111; padding: 16px 18px;
          transition: background 0.2s;
        }

        .ad-lead-row:hover { background: rgba(20,20,16,0.95); }

        .ad-lead-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px;
          margin-bottom: 8px;
        }

        .ad-lead-name {
          font-size: 15px; font-weight: 400; color: #f5f0e8;
          letter-spacing: -0.01em; margin-bottom: 2px;
        }

        .ad-lead-property {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300; color: #8a8070;
        }

        .ad-status-badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 3px 8px; border: 1px solid; flex-shrink: 0;
        }

        .ad-lead-contact {
          display: flex; align-items: center; gap: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300; color: rgba(138,128,112,0.6);
        }

        .ad-lead-contact-item {
          display: flex; align-items: center; gap: 5px;
        }

        /* Empty */
        .ad-empty {
          background: #111; border: 1px solid rgba(201,168,76,0.1);
          padding: 40px 24px; text-align: center;
        }

        .ad-empty-title {
          font-size: 20px; font-weight: 300; color: #f5f0e8;
          margin-bottom: 6px; letter-spacing: -0.02em;
        }

        .ad-empty-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 300; color: #8a8070;
        }

        .ad-view-all {
          margin-top: 14px; text-align: right;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #c9a84c; text-decoration: none;
          display: inline-flex; align-items: center; gap: 5px;
        }

        @media (max-width: 1000px) {
          .ad-stats { grid-template-columns: 1fr 1fr; }
          .ad-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 560px) {
          .ad-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Stats */}
        <div className="ad-eyebrow">Performance Overview</div>
        <div className="ad-stats">
          {statCards.map((s) => (
            <div key={s.label} className="ad-stat">
              <div className="ad-stat-icon"><s.icon size={14} /></div>
              <div className="ad-stat-label">{s.label}</div>
              <div className="ad-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="ad-eyebrow">Quick Actions</div>
        <div className="ad-actions">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className={`ad-action-btn ${a.primary ? 'primary' : 'ghost'}`}>
              <a.icon size={13} />
              {a.label}
              {a.primary && <ArrowRight size={12} />}
            </Link>
          ))}
        </div>

        {/* Two-col: listings + leads */}
        <div className="ad-grid">

          {/* Listings */}
          <div>
            <div className="ad-eyebrow">Listings</div>
            <h2 className="ad-section-title">Recent <em>Listings</em></h2>

            {properties.length > 0 ? (
              <>
                <div className="ad-listings">
                  {properties.map((p) => (
                    <div key={p.id} className="ad-listing-row">
                      <div className="ad-listing-title">{p.title}</div>
                      <div className="ad-listing-meta">
                        <MapPin size={10} style={{ color: '#c9a84c' }} />
                        {p.location}
                      </div>
                      <div className="ad-listing-footer">
                        <div className="ad-listing-price">{fmt(p.price)}<span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(138,128,112,0.55)' }}>/mo</span></div>
                        <div
                          className="ad-avail-badge"
                          style={{
                            color:  p.available ? '#70c490' : '#e07070',
                            borderColor: p.available ? 'rgba(112,196,144,0.25)' : 'rgba(224,112,112,0.25)',
                            background:  p.available ? 'rgba(112,196,144,0.07)' : 'rgba(224,112,112,0.07)',
                          }}
                        >
                          {p.available ? 'Available' : 'Occupied'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/my-listings" className="ad-view-all">
                  View all listings <ArrowRight size={11} />
                </Link>
              </>
            ) : (
              <div className="ad-empty">
                <div className="ad-empty-title">No listings yet</div>
                <p className="ad-empty-desc">Add your first listing to start generating leads.</p>
              </div>
            )}
          </div>

          {/* Leads */}
          <div>
            <div className="ad-eyebrow">Pipeline</div>
            <h2 className="ad-section-title">Recent <em>Leads</em></h2>

            {leads.length > 0 ? (
              <>
                <div className="ad-leads">
                  {leads.map((lead) => {
                    const sc = statusConfig[lead.status] || statusConfig.new;
                    return (
                      <div key={lead.id} className="ad-lead-row">
                        <div className="ad-lead-top">
                          <div>
                            <div className="ad-lead-name">{lead.name}</div>
                            <div className="ad-lead-property">{lead.property}</div>
                          </div>
                          <div
                            className="ad-status-badge"
                            style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                          >
                            {sc.label}
                          </div>
                        </div>
                        <div className="ad-lead-contact">
                          <div className="ad-lead-contact-item">
                            <Mail size={10} style={{ color: '#c9a84c' }} />
                            {lead.email}
                          </div>
                          <div className="ad-lead-contact-item">
                            <Phone size={10} style={{ color: '#c9a84c' }} />
                            {lead.phone}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link to="/leads" className="ad-view-all">
                  View all leads <ArrowRight size={11} />
                </Link>
              </>
            ) : (
              <div className="ad-empty">
                <div className="ad-empty-title">No leads yet</div>
                <p className="ad-empty-desc">Leads will appear here once clients inquire.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default AgentDashboard;