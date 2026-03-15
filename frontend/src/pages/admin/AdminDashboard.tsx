import { useState, useEffect } from 'react';
import { Shield, Users, Building, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3, Settings, Activity, FileText, Database, Lock, Eye, Search, Filter, Calendar, Download, RefreshCw, MoreVertical, UserPlus, UserMinus, Edit, Trash2, Ban, Check, X } from 'lucide-react';
import Api from '../../services/api';

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalListings: number;
  totalTransactions: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingApprovals: number;
  totalRevenue: number;
  monthlyGrowth: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  recentActivity: Array<{
    id: number;
    type: 'user_registration' | 'property_added' | 'transaction_completed' | 'system_alert';
    description: string;
    timestamp: string;
    user?: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'tenant' | 'landlord' | 'agent' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  propertiesCount: number;
  transactionsCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
}

interface SystemAlert {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'transactions' | 'system' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockStats: AdminStats = {
        totalUsers: 1247,
        totalProperties: 456,
        totalListings: 324,
        totalTransactions: 1892,
        activeUsers: 1089,
        inactiveUsers: 158,
        pendingApprovals: 23,
        totalRevenue: 45678000,
        monthlyGrowth: 12.5,
        systemHealth: 'healthy',
        recentActivity: [
          {
            id: 1,
            type: 'user_registration',
            description: 'New user registered: John Doe',
            timestamp: '2024-03-20T10:30:00Z',
            user: 'john.doe@example.com',
            status: 'success'
          },
          {
            id: 2,
            type: 'property_added',
            description: 'New property listed: Modern Apartment in Masaki',
            timestamp: '2024-03-20T09:15:00Z',
            user: 'agent@example.com',
            status: 'success'
          },
          {
            id: 3,
            type: 'system_alert',
            description: 'Database backup completed successfully',
            timestamp: '2024-03-20T08:00:00Z',
            status: 'success'
          },
          {
            id: 4,
            type: 'transaction_completed',
            description: 'Rent payment processed: TZS 450,000',
            timestamp: '2024-03-19T16:45:00Z',
            user: 'tenant@example.com',
            status: 'success'
          },
          {
            id: 5,
            type: 'system_alert',
            description: 'High server load detected',
            timestamp: '2024-03-19T14:20:00Z',
            status: 'warning'
          }
        ]
      };

      const mockUsers: User[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+255123456789',
          role: 'tenant',
          status: 'active',
          registrationDate: '2024-01-15',
          lastLogin: '2024-03-20T10:30:00Z',
          propertiesCount: 1,
          transactionsCount: 6,
          emailVerified: true,
          phoneVerified: true,
          profileCompleted: true
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+255987654321',
          role: 'landlord',
          status: 'active',
          registrationDate: '2024-02-01',
          lastLogin: '2024-03-19T16:45:00Z',
          propertiesCount: 3,
          transactionsCount: 12,
          emailVerified: true,
          phoneVerified: false,
          profileCompleted: true
        },
        {
          id: 3,
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@example.com',
          phone: '+255555666777',
          role: 'agent',
          status: 'active',
          registrationDate: '2024-01-20',
          lastLogin: '2024-03-20T09:15:00Z',
          propertiesCount: 8,
          transactionsCount: 24,
          emailVerified: true,
          phoneVerified: true,
          profileCompleted: true
        },
        {
          id: 4,
          firstName: 'Sarah',
          lastName: 'Williams',
          email: 'sarah.williams@example.com',
          phone: '+255444555666',
          role: 'tenant',
          status: 'inactive',
          registrationDate: '2024-03-01',
          lastLogin: '2024-03-10T14:30:00Z',
          propertiesCount: 0,
          transactionsCount: 0,
          emailVerified: false,
          phoneVerified: false,
          profileCompleted: false
        },
        {
          id: 5,
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@oweru.com',
          phone: '+255777888999',
          role: 'admin',
          status: 'active',
          registrationDate: '2023-12-01',
          lastLogin: '2024-03-20T11:00:00Z',
          propertiesCount: 0,
          transactionsCount: 0,
          emailVerified: true,
          phoneVerified: true,
          profileCompleted: true
        }
      ];

      const mockAlerts: SystemAlert[] = [
        {
          id: 1,
          type: 'warning',
          title: 'High Server Load',
          message: 'CPU usage exceeded 80% threshold',
          timestamp: '2024-03-19T14:20:00Z',
          resolved: false,
          severity: 'medium'
        },
        {
          id: 2,
          type: 'error',
          title: 'Database Connection Failed',
          message: 'Unable to connect to backup database',
          timestamp: '2024-03-19T12:15:00Z',
          resolved: true,
          severity: 'high'
        },
        {
          id: 3,
          type: 'info',
          title: 'System Update Available',
          message: 'New version 2.1.0 is available for deployment',
          timestamp: '2024-03-18T10:00:00Z',
          resolved: false,
          severity: 'low'
        },
        {
          id: 4,
          type: 'success',
          title: 'Backup Completed',
          message: 'Daily backup completed successfully',
          timestamp: '2024-03-20T08:00:00Z',
          resolved: true,
          severity: 'low'
        }
      ];
      
      setStats(mockStats);
      setUsers(mockUsers);
      setAlerts(mockAlerts);
      
      // Uncomment when API is ready:
      // const [statsRes, usersRes, alertsRes] = await Promise.all([
      //   Api.getAdminStats(),
      //   Api.getUsers(),
      //   Api.getSystemAlerts()
      // ]);
      // 
      // if (statsRes.data) setStats(statsRes.data);
      // if (usersRes.data) setUsers(usersRes.data);
      // if (alertsRes.data) setAlerts(alertsRes.data);
    } catch (e) {
      console.error('Failed to load admin data:', e);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { 
    style: 'currency', 
    currency: 'TZS', 
    minimumFractionDigits: 0 
  }).format(n);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-TZ', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'success': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Activity;
      case 'success': return CheckCircle;
      default: return Activity;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#8b5cf6';
      case 'agent': return '#c9a84c';
      case 'landlord': return '#3b82f6';
      case 'tenant': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e8e4dc', 
            borderTop: '3px solid #c9a84c', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Shield size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Admin Dashboard
          </h1>
          <div style={{
            padding: '4px 12px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            borderRadius: '999px',
            fontSize: '12px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: '600'
          }}>
            Administrator
          </div>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          System administration and management
        </p>
      </div>

      {/* System Health Status */}
      {stats && (
        <div style={{
          backgroundColor: stats.systemHealth === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 
                         stats.systemHealth === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                         'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${stats.systemHealth === 'healthy' ? 'rgba(16, 185, 129, 0.2)' : 
                             stats.systemHealth === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 
                             'rgba(239, 68, 68, 0.2)'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {stats.systemHealth === 'healthy' ? (
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          ) : stats.systemHealth === 'warning' ? (
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
          ) : (
            <X size={20} style={{ color: '#ef4444' }} />
          )}
          <div>
            <div style={{ 
              color: stats.systemHealth === 'healthy' ? '#10b981' : 
                     stats.systemHealth === 'warning' ? '#f59e0b' : 
                     '#ef4444',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '500'
            }}>
              System Status: {stats.systemHealth === 'healthy' ? 'Healthy' : 
                            stats.systemHealth === 'warning' ? 'Warning' : 'Critical'}
            </div>
            <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
              All systems operational
            </div>
          </div>
        </div>
      )}

      {/* Admin Stats */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(139, 92, 246, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Users
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.totalProperties}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Properties
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.totalTransactions}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transactions
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(56, 189, 248, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(stats.totalRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Revenue
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(245, 158, 11, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.pendingApprovals}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Approvals
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(239, 68, 68, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.monthlyGrowth}%
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly Growth
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '24px',
        display: 'flex',
        gap: '4px'
      }}>
        {['overview', 'users', 'properties', 'transactions', 'system', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#c9a84c' : 'transparent',
              border: activeTab === tab ? '1px solid #c9a84c' : '1px solid rgba(201, 168, 76, 0.12)',
              color: activeTab === tab ? '#080808' : '#7a7060',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Activity */}
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: '0 0 16px' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.recentActivity.map((activity) => {
                const ActivityIcon = activity.type === 'user_registration' ? UserPlus :
                                   activity.type === 'property_added' ? Building :
                                   activity.type === 'transaction_completed' ? DollarSign :
                                   activity.type === 'system_alert' ? Activity : Activity;
                
                return (
                  <div key={activity.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(201, 168, 76, 0.03)',
                    borderRadius: '6px'
                  }}>
                    <ActivityIcon size={16} style={{ 
                      color: activity.status === 'success' ? '#10b981' : 
                             activity.status === 'warning' ? '#f59e0b' : '#ef4444' 
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        {activity.description}
                      </div>
                      <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Alerts */}
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: '0 0 16px' }}>
              System Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.type);
                
                return (
                  <div key={alert.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: `${getAlertColor(alert.type)}15`,
                    border: `1px solid ${getAlertColor(alert.type)}30`,
                    borderRadius: '6px'
                  }}>
                    <AlertIcon size={16} style={{ color: getAlertColor(alert.type) }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {alert.title}
                      </div>
                      <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {alert.message}
                      </div>
                      <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {formatDate(alert.timestamp)}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: alert.resolved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: alert.resolved ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                      color: alert.resolved ? '#10b981' : '#f59e0b',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: '500'
                    }}>
                      {alert.resolved ? 'Resolved' : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <Users size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>User Management</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
            Navigate to <strong>/dashboard/users</strong> for full user management features
          </p>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(201, 168, 76, 0.1)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '6px',
            color: '#c9a84c',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Full user management with role assignment coming soon
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <Building size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>Properties Management</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
            Property management features coming soon
          </p>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <DollarSign size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>Transactions Management</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
            Transaction management features coming soon
          </p>
        </div>
      )}

      {activeTab === 'system' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <Settings size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>System Settings</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
            System configuration features coming soon
          </p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <Lock size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>Admin Settings</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
            Admin configuration features coming soon
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
