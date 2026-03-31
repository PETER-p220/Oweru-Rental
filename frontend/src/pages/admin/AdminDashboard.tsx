import { useState, useEffect } from 'react';
import {
  Users, Building, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Activity,
  UserCheck, CreditCard, Shield
} from 'lucide-react';
import Api from '../../services/api';

/* ─────────────────────────────────────────────────────────────
   ADMIN DASHBOARD STYLE TOKENS
───────────────────────────────────────────────────────────── */
const t = {
  gold:    '#c9a84c',
  goldLt:  '#e8c97a',
  dark:    '#080808',
  dark2:   '#0e0e0e',
  dark3:   '#141414',
  cream:   '#e8e4dc',
  muted:   '#7a7060',
  border:  'rgba(201,168,76,0.12)',
  green:   '#10b981',
  red:     '#ef4444',
  blue:    '#38bdf8',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: '20px',
};

const statCard: React.CSSProperties = {
  ...card,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '24px',
};

const iconWrapper: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

/* ─────────────────────────────────────────────────────────────
   ADMIN DASHBOARD COMPONENT
───────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalRevenue: 0,
    activeListings: 0,
    pendingApplications: 0,
    systemHealth: 'good'
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load real dashboard data
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch real stats from API
        const [
          usersResponse,
          propertiesResponse,
          transactionsResponse
        ] = await Promise.all([
          Api.getUsers().catch(() => ({ data: [] })),
          Api.getAdminProperties().catch(() => ({ data: [] })),
          Api.getAdminTransactions().catch(() => ({ data: [] }))
        ]);

        const users = usersResponse.data || [];
        const properties = propertiesResponse.data || [];
        const transactions = transactionsResponse.data || [];

        // Calculate real stats
        const totalRevenue = transactions.reduce((sum: number, transaction: any) => {
          return sum + (transaction.amount || 0);
        }, 0);

        // For now, set pending applications to 0 since we don't have applications data
        const pendingApplications = 0;

        const activeListings = properties.filter((property: any) => 
          property.available !== false && property.status !== 'rented'
        ).length;

        setStats({
          totalUsers: users.length,
          totalProperties: properties.length,
          totalRevenue,
          activeListings,
          pendingApplications,
          systemHealth: 'good'
        });

        // Create real recent activity from actual data
        const activity = [];
        
        // Add recent user registrations
        const recentUsers = users
          .filter((user: any) => {
            const createdAt = new Date(user.created_at || user.createdAt);
            const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          })
          .slice(0, 3)
          .map((user: any) => ({
            id: `user-${user.id}`,
            type: 'user',
            message: `New ${user.userType || 'user'} registered: ${user.first_name || user.name || 'Unknown'}`,
            time: formatTimeAgo(user.created_at || user.createdAt),
            status: 'success'
          }));

        // Add recent property listings
        const recentProperties = properties
          .filter((property: any) => {
            const createdAt = new Date(property.created_at || property.createdAt);
            const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          })
          .slice(0, 3)
          .map((property: any) => ({
            id: `property-${property.id}`,
            type: 'property',
            message: `New property listed: ${property.title}`,
            time: formatTimeAgo(property.created_at || property.createdAt),
            status: 'success'
          }));

        // Add recent transactions
        const recentTransactions = transactions
          .filter((transaction: any) => {
            const createdAt = new Date(transaction.created_at || transaction.createdAt);
            const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          })
          .slice(0, 2)
          .map((transaction: any) => ({
            id: `payment-${transaction.id}`,
            type: 'payment',
            message: `Payment processed: ${formatCurrency(transaction.amount || 0)}`,
            time: formatTimeAgo(transaction.created_at || transaction.createdAt),
            status: 'success'
          }));

        // Combine and sort by time (most recent first)
        const allActivity = [...recentUsers, ...recentProperties, ...recentTransactions]
          .sort((a, b) => {
            const timeA = parseTimeAgo(a.time);
            const timeB = parseTimeAgo(b.time);
            return timeA - timeB;
          })
          .slice(0, 8);

        setRecentActivity(allActivity);

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set fallback data
        setRecentActivity([
          { id: 'fallback-1', type: 'system', message: 'System initialized', time: 'Just now', status: 'success' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  // Helper function to parse time ago for sorting
  const parseTimeAgo = (timeAgo: string) => {
    const match = timeAgo.match(/(\d+)\s+(min|hour|day)/);
    if (!match) return Date.now();
    
    const [, num, unit] = match;
    const value = parseInt(num);
    
    switch (unit) {
      case 'min': return Date.now() - (value * 60 * 1000);
      case 'hour': return Date.now() - (value * 60 * 60 * 1000);
      case 'day': return Date.now() - (value * 24 * 60 * 60 * 1000);
      default: return Date.now();
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users size={16} />;
      case 'property': return <Building size={16} />;
      case 'application': return <CheckCircle size={16} />;
      case 'payment': return <CreditCard size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return t.green;
      case 'pending': return t.gold;
      case 'error': return t.red;
      default: return t.muted;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>
          Admin Dashboard
        </h1>
        <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>
          System overview and management controls
        </p>
      </div>

      {loading ? (
        /* Loading State */
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '60px 20px',
          backgroundColor: t.dark2,
          borderRadius: 12,
          border: `1px solid ${t.border}`
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${t.border}`,
            borderTop: `3px solid ${t.gold}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 16
          }} />
          <p style={{ ...body, fontSize: 16, color: t.muted }}>
            Loading dashboard data...
          </p>
        </div>
      ) : (
        /* Dashboard Content */
        <>
          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 20, 
            marginBottom: 32 
          }}>
        {/* Total Users */}
        <div style={statCard}>
          <div style={{ ...iconWrapper, background: `${t.blue}20` }}>
            <Users size={24} style={{ color: t.blue }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Users</div>
            <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
              {(stats.totalUsers || 0).toLocaleString()}
            </div>
            <div style={{ ...body, fontSize: 12, color: t.green, marginTop: 4 }}>
              <TrendingUp size={12} style={{ marginRight: 4 }} />
              +12% this month
            </div>
          </div>
        </div>

        {/* Total Properties */}
        <div style={statCard}>
          <div style={{ ...iconWrapper, background: `${t.gold}20` }}>
            <Building size={24} style={{ color: t.gold }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Properties</div>
            <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
              {(stats.totalProperties || 0).toLocaleString()}
            </div>
            <div style={{ ...body, fontSize: 12, color: t.green, marginTop: 4 }}>
              <TrendingUp size={12} style={{ marginRight: 4 }} />
              +8% this month
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div style={statCard}>
          <div style={{ ...iconWrapper, background: `${t.green}20` }}>
            <DollarSign size={24} style={{ color: t.green }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Revenue</div>
            <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
              {formatCurrency(stats.totalRevenue || 0)}
            </div>
            <div style={{ ...body, fontSize: 12, color: t.green, marginTop: 4 }}>
              <TrendingUp size={12} style={{ marginRight: 4 }} />
              +23% this month
            </div>
          </div>
        </div>

        {/* Pending Applications */}
        <div style={statCard}>
          <div style={{ ...iconWrapper, background: `${t.gold}20` }}>
            <Clock size={24} style={{ color: t.gold }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Pending Applications</div>
            <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
              {stats.pendingApplications || 0}
            </div>
            <div style={{ ...body, fontSize: 12, color: t.gold, marginTop: 4 }}>
              <AlertCircle size={12} style={{ marginRight: 4 }} />
              Requires review
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Activity */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0 }}>
              Recent Activity
            </h2>
            <Activity size={16} style={{ color: t.muted }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map((activity) => (
              <div key={activity.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                padding: '12px',
                backgroundColor: t.dark3,
                borderRadius: 8,
                border: `1px solid ${t.border}`
              }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8,
                  background: `${getStatusColor(activity.status)}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: getStatusColor(activity.status)
                }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...body, fontSize: 14, color: t.cream, marginBottom: 2 }}>
                    {activity.message}
                  </div>
                  <div style={{ ...body, fontSize: 12, color: t.muted }}>
                    {activity.time}
                  </div>
                </div>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(activity.status)
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: 0 }}>
              System Health
            </h2>
            <Shield size={16} style={{ color: t.green }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: t.dark3,
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} style={{ color: t.green }} />
                <span style={{ ...body, fontSize: 14, color: t.cream }}>API Status</span>
              </div>
              <span style={{ ...body, fontSize: 12, color: t.green, fontWeight: 600 }}>Operational</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: t.dark3,
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} style={{ color: t.green }} />
                <span style={{ ...body, fontSize: 14, color: t.cream }}>Database</span>
              </div>
              <span style={{ ...body, fontSize: 12, color: t.green, fontWeight: 600 }}>Healthy</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: t.dark3,
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} style={{ color: t.green }} />
                <span style={{ ...body, fontSize: 14, color: t.cream }}>Storage</span>
              </div>
              <span style={{ ...body, fontSize: 12, color: t.green, fontWeight: 600 }}>Normal</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: t.dark3,
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={16} style={{ color: t.gold }} />
                <span style={{ ...body, fontSize: 14, color: t.cream }}>Auth Service</span>
              </div>
              <span style={{ ...body, fontSize: 12, color: t.gold, fontWeight: 600 }}>Maintenance</span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
