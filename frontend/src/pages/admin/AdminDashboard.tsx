import React, { useState, useEffect } from 'react';
import {
  Users, Building, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Activity, MapPin,
  UserCheck, CreditCard, Shield
} from 'lucide-react';
import Api from '../../services/api';

const t = {
  gold:    '#c9a84c',
  goldLt:  '#e8c97a',
  dark:    '#080808',
  dark2:   '#0e0e0e',
  dark3:   '#141414',
  cream:   '#e8e4dc',
  muted:   '#7a7060',
  border:  'rgba(37,99,235,0.12)',
  green:   '#10b981',
  red:     '#ef4444'
};

const serif = { fontFamily: "'Playfair Display', 'Georgia', serif" };
const body  = { fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" };

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
  const [quickForm, setQuickForm] = useState({ title: '', location: '', price: '', description: '', bedrooms: '', bathrooms: '', area: '' });
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; type: string; message: string; time: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => { loadDashboardData(); loadOweruProperties(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const usersResponse = await Api.getUsers();
      const users = usersResponse?.data || [];
      const propertiesResponse = await Api.getProperties();
      const properties = propertiesResponse?.data || [];
      const transactionsResponse = await Api.getAdminTransactions();
      const transactions = transactionsResponse?.data || [];

      setStats({
        totalUsers: users.length,
        totalProperties: properties.length,
        totalRevenue: transactions.reduce((sum: number, t: any) => sum + (typeof t.amount === 'number' && !isNaN(t.amount) ? t.amount : 0), 0),
        activeListings: properties.filter((p: any) => p.available).length,
        pendingApplications: 0,
        systemHealth: 'good'
      });
      setTransactions(transactions);

      const recentUsers = users.filter((u: any) => { const d = (Date.now() - new Date(u.created_at || u.createdAt).getTime()) / 86400000; return d <= 7; }).slice(0, 3).map((u: any) => ({ id: `user-${u.id}`, type: 'user', message: `New user registered: ${u.name}`, time: formatTimeAgo(u.created_at || u.createdAt), status: 'success' }));
      const recentProperties = properties.filter((p: any) => { const d = (Date.now() - new Date(p.created_at || p.createdAt).getTime()) / 86400000; return d <= 7; }).slice(0, 3).map((p: any) => ({ id: `property-${p.id}`, type: 'property', message: `New property listed: ${p.title}`, time: formatTimeAgo(p.created_at || p.createdAt), status: 'success' }));
      const recentTransactions = transactions.filter((t: any) => { const d = (Date.now() - new Date(t.created_at || t.createdAt).getTime()) / 86400000; return d <= 7; }).slice(0, 2).map((t: any) => ({ id: `payment-${t.id}`, type: 'payment', message: `Payment processed: ${formatCurrency(t.amount || 0)}`, time: formatTimeAgo(t.created_at || t.createdAt), status: 'success' }));

      setRecentActivity([...recentUsers, ...recentProperties, ...recentTransactions].sort((a, b) => parseTimeAgo(a.time) - parseTimeAgo(b.time)).slice(0, 8));
    } catch (error) { console.error('Failed to load dashboard data:', error); }
    finally { setLoading(false); }
  };

  const loadOweruProperties = async () => {
    try {
      setLoadingOweru(true);
      const response = await Api.getAdminProperties();
      setOweruProperties((response?.data || []).filter((p: any) => p.type === 'oweru_rental'));
    } catch (error) { console.error('Failed to load Oweru properties:', error); }
    finally { setLoadingOweru(false); }
  };

  const addOweruProperty = async (data: any) => { try { await Api.createAdminProperty(data); await loadOweruProperties(); } catch (error) { alert('Failed to add property.'); } };
  const deleteOweruProperty = async (id: string) => { try { await Api.deleteAdminProperty(parseInt(id)); await loadOweruProperties(); } catch (error) { alert('Failed to delete property.'); } };

  const formatTimeAgo = (d: string) => {
    if (!d) return 'Unknown time';
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000), hrs = Math.floor(ms / 3600000), days = Math.floor(ms / 86400000);
    if (mins < 60) return `${mins} min ago`;
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const parseTimeAgo = (t: string) => {
    const m = t.match(/(\d+)\s+(min|hour|day)/);
    if (!m) return Date.now();
    const v = parseInt(m[1]);
    return Date.now() - (m[2] === 'min' ? v * 60000 : m[2] === 'hour' ? v * 3600000 : v * 86400000);
  };

  const formatCurrency = (amount: number) => {
    const n = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    if (!n) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  };

  const getActivityIcon = (type: string) => ({ user: <Users size={16} />, property: <Building size={16} />, application: <CheckCircle size={16} />, payment: <CreditCard size={16} /> }[type] ?? <Activity size={16} />);
  const getStatusColor = (status: string) => ({ success: t.green, pending: t.gold, error: t.red }[status] ?? t.muted);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: t.cream, ...body }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 16 }}>Loading Admin Dashboard...</div>
          <div style={{ fontSize: 14, color: t.muted }}>Please wait</div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: t.dark2, border: `1px solid ${t.border}`,
    borderRadius: 6, color: t.cream, fontSize: '14px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
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

        @media (max-width: 900px) {
          .admin-bottom-grid {
            grid-template-columns: 1fr;
          }
          .admin-form-grid-4 {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .admin-stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }
          .admin-form-grid-2 {
            grid-template-columns: 1fr;
          }
          .admin-form-grid-4 {
            grid-template-columns: 1fr 1fr;
          }
          .admin-oweru-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .admin-stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .admin-form-grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...serif, fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>Admin Dashboard</h1>
        <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>System overview and management controls</p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {[
          { label: 'Total Users',          value: stats.totalUsers,              icon: Users,      bg: t.gold   },
          { label: 'Total Properties',     value: stats.totalProperties,         icon: Building,   bg: t.green  },
          { label: 'Total Revenue',        value: formatCurrency(stats.totalRevenue), icon: DollarSign, bg: '#2563eb' },
          { label: 'Active Listings',      value: stats.activeListings,          icon: TrendingUp, bg: '#10b981' },
          { label: 'Pending Applications', value: stats.pendingApplications || 0, icon: AlertCircle, bg: t.gold  },
        ].map(({ label, value, icon: Icon, bg }) => (
          <div key={label} style={card}>
            <div className="admin-card-flex">
              <div style={{ width: 48, height: 48, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={24} style={{ color: t.dark }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...body, fontSize: 13, color: t.muted, marginBottom: 4 }}>{label}</div>
                <div style={{ ...serif, fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 600, color: t.cream }}>{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Oweru Properties Section */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div className="admin-section-header">
          <div>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: '0 0 4px' }}>Oweru Rental Properties</h2>
            <p style={{ ...body, fontSize: 14, color: t.muted, margin: 0 }}>Manage properties that appear on homepage</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ background: t.gold, color: t.dark, border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            <Building size={16} />{showAddForm ? 'Cancel' : 'Add Property'}
          </button>
        </div>

        {showAddForm && (
          <div style={{ background: t.dark3, border: `1px solid ${t.border}`, borderRadius: 8, padding: '20px', marginTop: '20px' }}>
            <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.cream, margin: '0 0 16px' }}>Add New Oweru Property</h3>

            <div className="admin-form-grid-2">
              {[
                { key: 'title', label: 'Title *', placeholder: 'Enter property title', type: 'text' },
                { key: 'location', label: 'Location *', placeholder: 'e.g., Dar es Salaam, Arusha', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>{label}</label>
                  <input type={type} value={(quickForm as any)[key]} onChange={e => setQuickForm({ ...quickForm, [key]: e.target.value })} placeholder={placeholder} style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>Description *</label>
              <textarea value={quickForm.description} onChange={e => setQuickForm({ ...quickForm, description: e.target.value })} rows={3} placeholder="Describe the property features..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div className="admin-form-grid-4">
              {[
                { key: 'price', label: 'Price (TZS) *', placeholder: '500000', type: 'number' },
                { key: 'bedrooms', label: 'Bedrooms', placeholder: '3', type: 'number' },
                { key: 'bathrooms', label: 'Bathrooms', placeholder: '2', type: 'number' },
                { key: 'area', label: 'Size (sq m) *', placeholder: '85', type: 'number' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>{label}</label>
                  <input type={type} value={(quickForm as any)[key]} onChange={e => setQuickForm({ ...quickForm, [key]: e.target.value })} placeholder={placeholder} style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => { setQuickForm({ title: '', location: '', price: '', description: '', bedrooms: '', bathrooms: '', area: '' }); setShowAddForm(false); }} style={{ background: 'transparent', color: t.muted, border: `1px solid ${t.border}`, borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (quickForm.title && quickForm.location && quickForm.price && quickForm.description && quickForm.area) {
                  await addOweruProperty({ title: quickForm.title, location: quickForm.location, price: parseFloat(quickForm.price), description: quickForm.description, type: 'oweru_rental', featured: true, available: true, bedrooms: parseInt(quickForm.bedrooms) || undefined, bathrooms: parseInt(quickForm.bathrooms) || undefined, area: parseFloat(quickForm.area) });
                  setQuickForm({ title: '', location: '', price: '', description: '', bedrooms: '', bathrooms: '', area: '' }); setShowAddForm(false);
                } else { alert('Please fill in all required fields'); }
              }} style={{ background: t.gold, color: t.dark, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Add Property</button>
            </div>
          </div>
        )}

        {loadingOweru ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>Loading Oweru properties...</div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>
            <Building size={48} style={{ opacity: 0.3, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>No Oweru properties yet</div>
            <div style={{ fontSize: 14 }}>Add properties to feature on homepage</div>
          </div>
        ) : (
          <div className="admin-oweru-grid">
            {oweruProperties.map((property) => (
              <div key={property.id} style={{ background: t.dark3, border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: 160, background: `linear-gradient(135deg, ${t.dark2}, ${t.dark3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted }}>
                  <Building size={40} style={{ opacity: 0.3 }} />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ ...serif, fontSize: 15, fontWeight: 600, color: t.cream, margin: 0 }}>{property.title}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ background: t.gold, color: t.dark, padding: '3px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Oweru</span>
                      {property.featured && <span style={{ background: t.green, color: t.dark, padding: '3px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Featured</span>}
                    </div>
                  </div>
                  <p style={{ ...body, fontSize: 13, color: t.muted, margin: '0 0 10px', lineHeight: 1.5 }}>{property.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} style={{ color: t.gold }} />
                      <span style={{ ...body, fontSize: 13, color: t.cream }}>{property.location}</span>
                    </div>
                    <div style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold }}>{formatCurrency(property.price)}</div>
                  </div>
                  <button onClick={() => { if (confirm('Delete this Oweru property?')) deleteOweruProperty(property.id); }} style={{ background: 'transparent', color: t.red, border: `1px solid ${t.red}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom grid: Activity + Health */}
      <div className="admin-bottom-grid">
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0 }}>Recent Activity</h2>
            <Activity size={16} style={{ color: t.muted }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map((activity) => (
              <div key={activity.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', backgroundColor: t.dark3, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <div style={{ color: getStatusColor(activity.status), flexShrink: 0 }}>{getActivityIcon(activity.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...body, fontSize: 14, color: t.cream, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.message}</div>
                  <div style={{ ...body, fontSize: 12, color: t.muted }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0 }}>System Health</h2>
            <Shield size={16} style={{ color: t.green }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: <CheckCircle size={16} style={{ color: t.green }} />, label: 'Storage', status: 'Normal', color: t.green },
              { icon: <UserCheck size={16} style={{ color: t.gold }} />, label: 'Auth Service', status: 'Maintenance', color: t.gold },
            ].map(({ icon, label, status, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: t.dark3, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon}<span style={{ ...body, fontSize: 14, color: t.cream }}>{label}</span></div>
                <span style={{ ...body, fontSize: 12, color, fontWeight: 600 }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;