import React, { useState, useEffect } from 'react';
import {
  Users, Building, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Activity, MapPin,
  UserCheck, CreditCard, Shield
} from 'lucide-react';
import Api from '../../services/api';

// ── Color tokens matching Home.jsx ──────────────────────────────────────────
const t = {
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  dark:    '#0F172A',   // navy-900 — page background
  dark2:   '#162035',   // navy-800 — card background
  dark3:   '#1E2D4A',   // navy-700 — inner elements / inputs
  cream:   '#F8F8F9',
  muted:   '#94A3B8',   // slate
  border:  'rgba(200,145,40,0.18)',
  green:   '#10b981',
  red:     '#ef4444',
};

const serif = { fontFamily: "'Playfair Display', 'Georgia', serif" };
const body  = { fontFamily: "'Jost', 'DM Sans', 'Helvetica Neue', sans-serif" };

const card: React.CSSProperties = {
  background: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: 24,
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalProperties: 0, totalRevenue: 0,
    activeListings: 0, pendingApplications: 0, systemHealth: 'good'
  });
  const [oweruProperties, setOweruProperties] = useState<any[]>([]);
  const [loadingOweru, setLoadingOweru] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: '', location: '', price: '', description: '',
    bedrooms: '', bathrooms: '', area: ''
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string; type: string; message: string; time: string; status: string
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => { loadDashboardData(); loadOweruProperties(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const usersResponse        = await Api.getUsers();
      const users                = usersResponse?.data || [];
      const propertiesResponse   = await Api.getProperties();
      const properties           = propertiesResponse?.data || [];
      const transactionsResponse = await Api.getAdminTransactions();
      const txns                 = transactionsResponse?.data || [];

      setStats({
        totalUsers:           users.length,
        totalProperties:      properties.length,
        totalRevenue:         txns.reduce((sum: number, tx: any) =>
          sum + (typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0), 0),
        activeListings:       properties.filter((p: any) => p.available).length,
        pendingApplications:  0,
        systemHealth:         'good',
      });
      setTransactions(txns);

      const recentUsers = users
        .filter((u: any) => {
          const d = (Date.now() - new Date(u.created_at || u.createdAt).getTime()) / 86400000;
          return d <= 7;
        })
        .slice(0, 3)
        .map((u: any) => ({
          id: `user-${u.id}`, type: 'user',
          message: `New user registered: ${u.name}`,
          time: formatTimeAgo(u.created_at || u.createdAt), status: 'success',
        }));

      const recentProperties = properties
        .filter((p: any) => {
          const d = (Date.now() - new Date(p.created_at || p.createdAt).getTime()) / 86400000;
          return d <= 7;
        })
        .slice(0, 3)
        .map((p: any) => ({
          id: `property-${p.id}`, type: 'property',
          message: `New property listed: ${p.title}`,
          time: formatTimeAgo(p.created_at || p.createdAt), status: 'success',
        }));

      const recentTransactions = txns
        .filter((tx: any) => {
          const d = (Date.now() - new Date(tx.created_at || tx.createdAt).getTime()) / 86400000;
          return d <= 7;
        })
        .slice(0, 2)
        .map((tx: any) => ({
          id: `payment-${tx.id}`, type: 'payment',
          message: `Payment processed: ${formatCurrency(tx.amount || 0)}`,
          time: formatTimeAgo(tx.created_at || tx.createdAt), status: 'success',
        }));

      setRecentActivity(
        [...recentUsers, ...recentProperties, ...recentTransactions]
          .sort((a, b) => parseTimeAgo(a.time) - parseTimeAgo(b.time))
          .slice(0, 8)
      );
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOweruProperties = async () => {
    try {
      setLoadingOweru(true);
      const response = await Api.getAdminProperties();
      setOweruProperties((response?.data || []).filter((p: any) => p.type === 'oweru_rental'));
    } catch (error) {
      console.error('Failed to load Oweru properties:', error);
    } finally {
      setLoadingOweru(false);
    }
  };

  const addOweruProperty = async (data: any) => {
    try {
      await Api.createAdminProperty(data);
      await loadOweruProperties();
    } catch {
      alert('Failed to add property.');
    }
  };

  const deleteOweruProperty = async (id: string) => {
    try {
      await Api.deleteAdminProperty(parseInt(id));
      await loadOweruProperties();
    } catch {
      alert('Failed to delete property.');
    }
  };

  const formatTimeAgo = (d: string) => {
    if (!d) return 'Unknown time';
    const ms   = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs  = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    if (mins < 60) return `${mins} min ago`;
    if (hrs  < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const parseTimeAgo = (s: string) => {
    const m = s.match(/(\d+)\s+(min|hour|day)/);
    if (!m) return Date.now();
    const v = parseInt(m[1]);
    return Date.now() - (m[2] === 'min' ? v * 60000 : m[2] === 'hour' ? v * 3600000 : v * 86400000);
  };

  const formatCurrency = (amount: number) => {
    const n = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    if (!n) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency', currency: 'TZS',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
  };

  const formatLargeCurrency = (amount: number) => {
    const n = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    if (!n) return 'TZS 0';
    
    // Define abbreviations
    const abbreviations = [
      { value: 1e9, symbol: 'B' }, // Billion
      { value: 1e6, symbol: 'M' }, // Million  
      { value: 1e3, symbol: 'K' }, // Thousand
    ];
    
    // Find the right abbreviation
    for (const { value, symbol } of abbreviations) {
      if (n >= value) {
        const formatted = (n / value).toFixed(1);
        return `TZS ${formatted}${symbol}`;
      }
    }
    
    // If less than 1000, use regular formatting
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency', currency: 'TZS',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
  };

  const getActivityIcon = (type: string) =>
    ({ user: <Users size={16} />, property: <Building size={16} />,
       application: <CheckCircle size={16} />, payment: <CreditCard size={16} /> }[type]
    ?? <Activity size={16} />);

  const getStatusColor = (status: string) =>
    ({ success: t.green, pending: t.gold, error: t.red }[status] ?? t.muted);

  // ── Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: t.dark, color: t.cream, ...body,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 16, color: t.cream }}>
            Loading Admin Dashboard…
          </div>
          <div style={{ fontSize: 14, color: t.muted }}>Please wait</div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: t.dark,
    border: `1px solid ${t.border}`,
    borderRadius: 6, color: t.cream, fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: "'Jost', 'DM Sans', sans-serif",
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', background: t.dark, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Playfair+Display:wght@600&display=swap');

        * { box-sizing: border-box; }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .admin-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .admin-form-grid-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .admin-bottom-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .admin-oweru-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .admin-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .admin-card-flex {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          gap: 16px;
        }

        /* Input / textarea focus ring */
        .admin-input:focus {
          border-color: rgba(200,145,40,0.55) !important;
        }

        /* Stat card hover */
        .admin-stat-card:hover {
          border-color: rgba(200,145,40,0.45) !important;
          transform: translateY(-2px);
          transition: all 0.2s;
        }

        /* Activity item */
        .admin-activity-item:hover {
          border-color: rgba(200,145,40,0.35) !important;
        }

        @media (max-width: 900px) {
          .admin-bottom-grid     { grid-template-columns: 1fr; }
          .admin-form-grid-4     { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .admin-stats-grid      { grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .admin-form-grid-2     { grid-template-columns: 1fr; }
          .admin-form-grid-4     { grid-template-columns: 1fr 1fr; }
          .admin-oweru-grid      { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .admin-stats-grid      { grid-template-columns: 1fr; gap: 10px; }
          .admin-form-grid-4     { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          ...serif, fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 600,
          color: t.cream, margin: '0 0 8px',
        }}>
          Admin Dashboard
        </h1>
        <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>
          System overview and management controls
        </p>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────────── */}
      <div className="admin-stats-grid">
        {[
          { label: 'Total Users',          value: stats.totalUsers,                    icon: Users,      bg: t.gold   },
          { label: 'Total Properties',     value: stats.totalProperties,               icon: Building,   bg: t.green  },
          { label: 'Total Revenue',        value: formatLargeCurrency(stats.totalRevenue),  icon: DollarSign, bg: '#2563eb' },
          { label: 'Active Listings',      value: stats.activeListings,               icon: TrendingUp, bg: t.green  },
          { label: 'Pending Applications', value: stats.pendingApplications || 0,      icon: AlertCircle, bg: t.gold  },
        ].map(({ label, value, icon: Icon, bg }) => (
          <div key={label} style={card} className="admin-stat-card">
            <div className="admin-card-flex">
              <div style={{
                width: 48, height: 48, borderRadius: 8, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={24} style={{ color: t.dark }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...body, fontSize: 13, color: t.muted, marginBottom: 4 }}>{label}</div>
                <div style={{
                  ...serif, fontSize: 'clamp(20px, 3vw, 28px)',
                  fontWeight: 600, color: t.cream,
                }}>
                  {value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Oweru properties section ─────────────────────────────────── */}
      <div style={{ ...card, marginBottom: 24 }}>

        {/* Section header */}
        <div className="admin-section-header">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: t.gold,
              background: t.goldDim, padding: '4px 12px',
              border: `1px solid ${t.border}`, marginBottom: 8,
            }}>
              Oweru Rentals
            </div>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: '0 0 4px' }}>
              Oweru Rental Properties
            </h2>
            <p style={{ ...body, fontSize: 14, color: t.muted, margin: 0 }}>
              Manage properties that appear on homepage
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: t.gold, color: t.dark, border: 'none', borderRadius: 8,
              padding: '10px 18px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap', letterSpacing: '0.04em',
              fontFamily: "'Jost', sans-serif",
            }}
          >
            <Building size={16} />
            {showAddForm ? 'Cancel' : 'Add Property'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div style={{
            background: t.dark3,
            border: `1px solid ${t.border}`,
            borderRadius: 8, padding: '20px', marginTop: '20px',
          }}>
            {/* Gold top bar */}
            <div style={{ height: 2, background: `linear-gradient(90deg, ${t.gold}, ${t.goldLt})`, borderRadius: '2px 2px 0 0', marginBottom: 16 }} />

            <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.cream, margin: '0 0 16px' }}>
              Add New Oweru Property
            </h3>

            <div className="admin-form-grid-2">
              {[
                { key: 'title',    label: 'Title *',                      placeholder: 'Enter property title',        type: 'text' },
                { key: 'location', label: 'Location *',                   placeholder: 'e.g., Dar es Salaam, Arusha', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '6px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={(quickForm as any)[key]}
                    onChange={e => setQuickForm({ ...quickForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={inputStyle}
                    className="admin-input"
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '6px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Description *
              </label>
              <textarea
                value={quickForm.description}
                onChange={e => setQuickForm({ ...quickForm, description: e.target.value })}
                rows={3}
                placeholder="Describe the property features…"
                style={{ ...inputStyle, resize: 'vertical' }}
                className="admin-input"
              />
            </div>

            <div className="admin-form-grid-4">
              {[
                { key: 'price',     label: 'Price (TZS) *', placeholder: '500000', type: 'number' },
                { key: 'bedrooms',  label: 'Bedrooms',       placeholder: '3',      type: 'number' },
                { key: 'bathrooms', label: 'Bathrooms',      placeholder: '2',      type: 'number' },
                { key: 'area',      label: 'Size (sq m) *',  placeholder: '85',     type: 'number' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '6px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={(quickForm as any)[key]}
                    onChange={e => setQuickForm({ ...quickForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={inputStyle}
                    className="admin-input"
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 4 }}>
              <button
                onClick={() => {
                  setQuickForm({ title: '', location: '', price: '', description: '', bedrooms: '', bathrooms: '', area: '' });
                  setShowAddForm(false);
                }}
                style={{
                  background: 'transparent', color: t.muted,
                  border: `1px solid ${t.border}`, borderRadius: 6,
                  padding: '9px 18px', fontSize: 13, cursor: 'pointer',
                  fontFamily: "'Jost', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (quickForm.title && quickForm.location && quickForm.price && quickForm.description && quickForm.area) {
                    await addOweruProperty({
                      title:     quickForm.title,
                      location:  quickForm.location,
                      price:     parseFloat(quickForm.price),
                      description: quickForm.description,
                      type:      'oweru_rental',
                      featured:  true,
                      available: true,
                      bedrooms:  parseInt(quickForm.bedrooms)  || undefined,
                      bathrooms: parseInt(quickForm.bathrooms) || undefined,
                      area:      parseFloat(quickForm.area),
                    });
                    setQuickForm({ title: '', location: '', price: '', description: '', bedrooms: '', bathrooms: '', area: '' });
                    setShowAddForm(false);
                  } else {
                    alert('Please fill in all required fields');
                  }
                }}
                style={{
                  background: t.gold, color: t.dark, border: 'none', borderRadius: 6,
                  padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.06em', fontFamily: "'Jost', sans-serif",
                }}
              >
                Add Property
              </button>
            </div>
          </div>
        )}

        {/* Properties grid */}
        {loadingOweru ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>
            Loading Oweru properties…
          </div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 40px', color: t.muted }}>
            <Building size={48} style={{ opacity: 0.25, marginBottom: 16, display: 'block', margin: '0 auto 16px', color: t.gold }} />
            <div style={{ fontSize: 16, marginBottom: 8, color: t.cream }}>No Oweru properties yet</div>
            <div style={{ fontSize: 14 }}>Add properties to feature on homepage</div>
          </div>
        ) : (
          <div className="admin-oweru-grid">
            {oweruProperties.map((property) => (
              <div key={property.id} style={{
                background: t.dark3,
                border: `1px solid ${t.border}`,
                borderRadius: 10, overflow: 'hidden',
                transition: 'all 0.3s',
              }}>
                {/* Image placeholder */}
                <div style={{
                  height: 160,
                  background: `linear-gradient(135deg, ${t.dark2}, ${t.dark3})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <Building size={40} style={{ opacity: 0.2, color: t.gold }} />
                  {/* OWERU badge — matches Home.jsx oweru section badge */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: t.gold, color: t.dark,
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  }}>
                    OWERU
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ ...serif, fontSize: 15, fontWeight: 600, color: t.cream, margin: 0 }}>
                      {property.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {property.featured && (
                        <span style={{ background: t.green, color: '#fff', padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ ...body, fontSize: 13, color: t.muted, margin: '0 0 12px', lineHeight: 1.6 }}>
                    {property.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} style={{ color: t.gold, flexShrink: 0 }} />
                      <span style={{ ...body, fontSize: 13, color: t.cream }}>{property.location}</span>
                    </div>
                    <div style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold }}>
                      {formatCurrency(property.price)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {property.bedrooms && (
                      <span style={{ fontSize: 12, color: t.muted, background: t.dark2, padding: '3px 8px', borderRadius: 4, border: `1px solid ${t.border}` }}>
                        {property.bedrooms} bd
                      </span>
                    )}
                    {property.bathrooms && (
                      <span style={{ fontSize: 12, color: t.muted, background: t.dark2, padding: '3px 8px', borderRadius: 4, border: `1px solid ${t.border}` }}>
                        {property.bathrooms} ba
                      </span>
                    )}
                    {property.area && (
                      <span style={{ fontSize: 12, color: t.muted, background: t.dark2, padding: '3px 8px', borderRadius: 4, border: `1px solid ${t.border}` }}>
                        {property.area} m²
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => { if (confirm('Delete this Oweru property?')) deleteOweruProperty(property.id); }}
                    style={{
                      marginTop: 14, background: 'transparent', color: t.red,
                      border: `1px solid ${t.red}`, borderRadius: 6,
                      padding: '7px 14px', fontSize: 12, cursor: 'pointer',
                      fontFamily: "'Jost', sans-serif", transition: 'all 0.2s',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom grid: Activity + Health ───────────────────────────── */}
      <div className="admin-bottom-grid">

        {/* Recent Activity */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: t.gold,
                background: t.goldDim, padding: '3px 10px',
                border: `1px solid ${t.border}`, marginBottom: 6,
              }}>
                Live Feed
              </div>
              <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0 }}>
                Recent Activity
              </h2>
            </div>
            <Activity size={16} style={{ color: t.muted }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: t.muted }}>
                <Clock size={28} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px', color: t.gold }} />
                <div style={{ fontSize: 14 }}>No recent activity</div>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="admin-activity-item"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', backgroundColor: t.dark3,
                    borderRadius: 8, border: `1px solid ${t.border}`,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ color: getStatusColor(activity.status), flexShrink: 0 }}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      ...body, fontSize: 14, color: t.cream, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {activity.message}
                    </div>
                    <div style={{ ...body, fontSize: 12, color: t.muted }}>
                      {activity.time}
                    </div>
                  </div>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: getStatusColor(activity.status), flexShrink: 0,
                  }} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: t.gold,
                background: t.goldDim, padding: '3px 10px',
                border: `1px solid ${t.border}`, marginBottom: 6,
              }}>
                Status
              </div>
              <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0 }}>
                System Health
              </h2>
            </div>
            <Shield size={16} style={{ color: t.green }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <CheckCircle size={16} style={{ color: t.green }} />,  label: 'Storage',      status: 'Normal',      color: t.green },
              { icon: <UserCheck   size={16} style={{ color: t.gold }}  />,  label: 'Auth Service', status: 'Maintenance', color: t.gold  },
            ].map(({ icon, label, status, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', backgroundColor: t.dark3,
                borderRadius: 8, border: `1px solid ${t.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {icon}
                  <span style={{ ...body, fontSize: 14, color: t.cream }}>{label}</span>
                </div>
                <span style={{ ...body, fontSize: 12, color, fontWeight: 700, letterSpacing: '0.04em' }}>
                  {status}
                </span>
              </div>
            ))}

            {/* Summary card — matches Home.jsx stat-cell style */}
            <div style={{
              marginTop: 8, padding: '16px', background: t.dark3,
              border: `1px solid ${t.border}`, borderRadius: 8, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                Overall
              </div>
              <div style={{ ...serif, fontSize: 22, fontWeight: 600, color: t.gold, marginBottom: 4 }}>
                Good
              </div>
              <div style={{ fontSize: 12, color: t.muted }}>All systems operational</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;