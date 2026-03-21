import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, CreditCard, FileCheck2, FileText, Shield, Users } from 'lucide-react';
import Api from '../../services/api';

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0e0e0e',
  border: '1px solid rgba(201,168,76,0.12)',
  borderRadius: 12,
  padding: 20,
};

const linkCardStyle: React.CSSProperties = {
  ...cardStyle,
  display: 'block',
  textDecoration: 'none',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
};

const statValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: '#e8e4dc',
  fontFamily: 'DM Sans, sans-serif',
  lineHeight: 1.1,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#7a7060',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'DM Sans, sans-serif',
  marginTop: 8,
};

const quickLinks = [
  { to: '/dashboard/admin/users', label: 'Users', icon: Users, color: '#3b82f6' },
  { to: '/dashboard/admin/properties', label: 'Properties', icon: Building2, color: '#10b981' },
  { to: '/dashboard/admin/transactions', label: 'Transactions', icon: CreditCard, color: '#c9a84c' },
  { to: '/dashboard/admin/contracts', label: 'Contracts', icon: FileText, color: '#8b5cf6' },
  { to: '/dashboard/admin/verification', label: 'Verification', icon: FileCheck2, color: '#f59e0b' },
  { to: '/dashboard/admin/alerts', label: 'Alerts', icon: AlertTriangle, color: '#ef4444' },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState<any>(null);
  const [propertyStats, setPropertyStats] = useState<any>(null);
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [contractStats, setContractStats] = useState<any>(null);
  const [verificationStats, setVerificationStats] = useState<any>(null);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [
          userStatsRes,
          propertyStatsRes,
          transactionStatsRes,
          contractStatsRes,
          verificationStatsRes,
          alertStatsRes,
          usersRes,
          alertsRes,
          transactionsRes,
        ] = await Promise.all([
          Api.getUserStats(),
          Api.getAdminPropertyStats(),
          Api.getAdminTransactionStats(),
          Api.getAdminContractStats(),
          Api.getVerificationStats(),
          Api.getAlertStats(),
          Api.getUsers(),
          Api.getAlerts(),
          Api.getAdminTransactions(),
        ]);

        setUserStats(userStatsRes.data);
        setPropertyStats(propertyStatsRes.data);
        setTransactionStats(transactionStatsRes.data);
        setContractStats(contractStatsRes.data);
        setVerificationStats(verificationStatsRes.data);
        setAlertStats(alertStatsRes.data);
        setUsers((usersRes.data || []).slice(0, 5));
        setAlerts((alertsRes.data || []).slice(0, 5));
        setTransactions((transactionsRes.data || []).slice(0, 5));
      } catch (err) {
        console.error(err);
        setError('Failed to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const systemHealth = useMemo(() => {
    const critical = Number(alertStats?.criticalAlerts || 0);
    const active = Number(alertStats?.activeAlerts || 0);
    if (critical > 0) return { label: 'Needs Attention', color: '#ef4444' };
    if (active > 0) return { label: 'Monitoring', color: '#f59e0b' };
    return { label: 'Healthy', color: '#10b981' };
  }, [alertStats]);

  if (loading) {
    return <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading admin dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Shield size={24} style={{ color: '#c9a84c' }} />
            <h1 style={{ margin: 0, color: '#e8e4dc', fontSize: 28, fontWeight: 600 }}>Admin Dashboard</h1>
          </div>
          <p style={{ margin: 0, color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
            Live platform operations across users, listings, money flow, contracts, and system alerts.
          </p>
        </div>

        <div style={{ ...cardStyle, minWidth: 220 }}>
          <div style={{ color: systemHealth.color, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
            System Status: {systemHealth.label}
          </div>
          <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginTop: 6 }}>
            {alertStats?.activeAlerts || 0} active alerts, {verificationStats?.pendingRequests || 0} pending verifications.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Link to="/dashboard/admin/users" style={linkCardStyle}>
          <div style={statValueStyle}>{userStats?.total ?? 0}</div>
          <div style={statLabelStyle}>Total Users</div>
        </Link>
        <Link to="/dashboard/admin/properties" style={linkCardStyle}>
          <div style={statValueStyle}>{propertyStats?.total_properties ?? 0}</div>
          <div style={statLabelStyle}>Properties</div>
        </Link>
        <Link to="/dashboard/admin/transactions" style={linkCardStyle}>
          <div style={statValueStyle}>{transactionStats?.total_transactions ?? 0}</div>
          <div style={statLabelStyle}>Transactions</div>
        </Link>
        <Link to="/dashboard/admin/contracts" style={linkCardStyle}>
          <div style={statValueStyle}>{contractStats?.activeContracts ?? 0}</div>
          <div style={statLabelStyle}>Active Contracts</div>
        </Link>
        <Link to="/dashboard/admin/verification" style={linkCardStyle}>
          <div style={statValueStyle}>{verificationStats?.pendingRequests ?? 0}</div>
          <div style={statLabelStyle}>Pending Verification</div>
        </Link>
        <Link to="/dashboard/admin/alerts" style={linkCardStyle}>
          <div style={{ ...statValueStyle, color: (alertStats?.criticalAlerts || 0) > 0 ? '#ef4444' : '#e8e4dc' }}>
            {alertStats?.activeAlerts ?? 0}
          </div>
          <div style={statLabelStyle}>Active Alerts</div>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
        {quickLinks.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} style={linkCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} style={{ color }} />
                <span style={{ color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{label}</span>
              </div>
              <ArrowRight size={16} style={{ color: '#7a7060' }} />
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#e8e4dc' }}>Recent Users</h3>
            <Link to="/dashboard/admin/users" style={{ color: '#c9a84c', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Open users</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map((user) => (
              <div key={user.id} style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10, padding: 14 }}>
                <div style={{ color: '#e8e4dc', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>{user.first_name} {user.last_name}</div>
                <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>{user.email}</div>
                <div style={{ color: user.is_active ? '#10b981' : '#ef4444', fontSize: 12, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>
                  {user.user_type} • {user.is_active ? 'active' : 'inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e8e4dc' }}>Latest Alerts</h3>
              <Link to="/dashboard/admin/alerts" style={{ color: '#c9a84c', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Open alerts</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.map((alert) => (
                <div key={alert.id} style={{ borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f59e0b' : '#3b82f6'}`, paddingLeft: 12 }}>
                  <div style={{ color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{alert.title}</div>
                  <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>{alert.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#e8e4dc' }}>Latest Transactions</h3>
              <Link to="/dashboard/admin/transactions" style={{ color: '#c9a84c', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Open transactions</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transactions.map((transaction) => (
                <div key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(201,168,76,0.08)', paddingBottom: 10 }}>
                  <div>
                    <div style={{ color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{transaction.description}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>{transaction.user?.name}</div>
                  </div>
                  <div style={{ color: '#c9a84c', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
                    TZS {Number(transaction.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
