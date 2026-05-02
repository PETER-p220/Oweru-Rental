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
    
    // If less than 1000, use regular number formatting with TZS prefix
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
    return `TZS ${formatted}`;
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

      {/* ── Recent Activity ───────────────────────────────────────────── */}
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
    </div>
  );
};

export default AdminDashboard;
                       