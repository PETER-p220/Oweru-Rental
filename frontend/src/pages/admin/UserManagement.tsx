import { useState, useEffect } from 'react';
import { Users, Search, Filter, Plus, Edit, Trash2, Eye, Shield, CheckCircle, Clock, AlertTriangle, X, UserPlus, Mail, Phone, Calendar, Building, DollarSign, BarChart3, MoreVertical, Ban, RefreshCw, Download } from 'lucide-react';
import Api from '../../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'agent' | 'landlord' | 'tenant';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  propertiesCount: number;
  transactionsCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  permissions?: string[];
  notes?: string;
}

interface CreateUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'agent' | 'landlord' | 'tenant';
  status: 'active' | 'inactive' | 'suspended';
  password: string;
  confirmPassword: string;
  notes?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  admins: number;
  agents: number;
  landlords: number;
  tenants: number;
  newThisMonth: number;
  activeThisMonth: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'tenant',
    status: 'active',
    password: '',
    confirmPassword: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateUserForm>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
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
          profileCompleted: true,
          permissions: ['view_properties', 'make_payments'],
          notes: 'Regular tenant, good payment history'
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
          profileCompleted: true,
          permissions: ['manage_properties', 'view_tenants', 'receive_payments'],
          notes: 'Property owner with 3 properties'
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
          profileCompleted: true,
          permissions: ['manage_listings', 'view_analytics', 'manage_commissions'],
          notes: 'Top performing agent'
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
          profileCompleted: false,
          permissions: [],
          notes: 'Registered but never completed profile'
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
          profileCompleted: true,
          permissions: ['admin_full_access'],
          notes: 'System administrator'
        }
      ];

      const mockStats: UserStats = {
        total: 5,
        active: 4,
        inactive: 1,
        suspended: 0,
        admins: 1,
        agents: 1,
        landlords: 1,
        tenants: 2,
        newThisMonth: 2,
        activeThisMonth: 4
      };
      
      setUsers(mockUsers);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [usersRes, statsRes] = await Promise.all([
      //   Api.getUsers(),
      //   Api.getUserStats()
      // ]);
      // 
      // if (usersRes.data) setUsers(usersRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load users:', e);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateUserForm> = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Mock user creation
      const newUser: User = {
        id: users.length + 1,
        ...formData,
        registrationDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString(),
        propertiesCount: 0,
        transactionsCount: 0,
        emailVerified: false,
        phoneVerified: false,
        profileCompleted: false,
        permissions: getDefaultPermissions(formData.role)
      };
      
      setUsers([...users, newUser]);
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'tenant',
        status: 'active',
        password: '',
        confirmPassword: '',
        notes: ''
      });
      setFormErrors({});
      
      // Uncomment when API is ready:
      // await Api.createUser(formData);
      
    } catch (e) {
      console.error('Failed to create user:', e);
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      password: '',
      confirmPassword: '',
      notes: user.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Mock user update
      const updatedUsers = users.map(user => 
        user.id === selectedUser?.id 
          ? { ...user, ...formData, permissions: getDefaultPermissions(formData.role) }
          : user
      );
      
      setUsers(updatedUsers);
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'tenant',
        status: 'active',
        password: '',
        confirmPassword: '',
        notes: ''
      });
      setFormErrors({});
      
      // Uncomment when API is ready:
      // await Api.updateUser(selectedUser.id, formData);
      
    } catch (e) {
      console.error('Failed to update user:', e);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setLoading(true);
      
      // Mock user deletion
      setUsers(users.filter(user => user.id !== userId));
      
      // Uncomment when API is ready:
      // await Api.deleteUser(userId);
      
    } catch (e) {
      console.error('Failed to delete user:', e);
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      setLoading(true);
      
      // Mock status update
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      );
      
      setUsers(updatedUsers);
      
      // Uncomment when API is ready:
      // await Api.updateUserStatus(userId, newStatus);
      
    } catch (e) {
      console.error('Failed to update user status:', e);
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['admin_full_access', 'manage_users', 'manage_properties', 'manage_transactions', 'view_analytics', 'system_settings'];
      case 'agent':
        return ['manage_listings', 'view_analytics', 'manage_commissions', 'qr_codes', 'share_tracking'];
      case 'landlord':
        return ['manage_properties', 'view_tenants', 'receive_payments', 'property_reports'];
      case 'tenant':
        return ['view_properties', 'make_payments', 'view_contracts', 'send_messages'];
      default:
        return [];
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone.includes(searchTerm);
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-TZ', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={28} style={{ color: '#c9a84c' }} />
            <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
              User Management
            </h1>
            {stats && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: 'rgba(201, 168, 76, 0.1)',
                color: '#c9a84c',
                borderRadius: '999px',
                fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: '600'
              }}>
                {stats.total} users
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#c9a84c',
              color: '#080808',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage system users and their roles
        </p>
      </div>

      {/* User Stats */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Users
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.active}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(139, 92, 246, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#8b5cf6', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.admins}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admins
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#c9a84c', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.agents}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Agents
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(59, 130, 246, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.landlords}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Landlords
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.tenants}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tenants
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(245, 158, 11, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.newThisMonth}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New This Month
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ color: '#7a7060' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e8e4dc',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e8e4dc',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="landlord">Landlord</option>
            <option value="tenant">Tenant</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e8e4dc',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Users List
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredUsers.length} users
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredUsers.map((user) => (
            <div key={user.id} style={{
              padding: '20px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(201, 168, 76, 0.06)',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%',
                    backgroundColor: 'rgba(201, 168, 76, 0.1)',
                    border: '1px solid rgba(201, 168, 76, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={20} style={{ color: '#c9a84c' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
                      {user.firstName} {user.lastName}
                    </h4>
                    <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      {user.email}
                    </div>
                    <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      {user.phone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: `${getRoleColor(user.role)}15`,
                        border: `1px solid ${getRoleColor(user.role)}30`,
                        color: getRoleColor(user.role),
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {user.role}
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: `${getStatusColor(user.status)}15`,
                        border: `1px solid ${getStatusColor(user.status)}30`,
                        color: getStatusColor(user.status),
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {user.status}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                      Properties: {user.propertiesCount} | Transactions: {user.transactionsCount}
                    </div>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                      Last login: {formatDate(user.lastLogin)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {user.emailVerified && (
                        <CheckCircle size={12} style={{ color: '#10b981' }} title="Email verified" />
                      )}
                      {user.phoneVerified && (
                        <CheckCircle size={12} style={{ color: '#10b981' }} title="Phone verified" />
                      )}
                      {user.profileCompleted && (
                        <CheckCircle size={12} style={{ color: '#10b981' }} title="Profile completed" />
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(201, 168, 76, 0.1)',
                        border: '1px solid rgba(201, 168, 76, 0.2)',
                        color: '#c9a84c',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          borderRadius: '4px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <Ban size={14} />
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, 'active')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          borderRadius: '4px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle size={14} />
                        Activate
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No users found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or add a new user
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateModal || showEditModal) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: '#e8e4dc', fontSize: '20px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: 0 }}>
                {showEditModal ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    role: 'tenant',
                    status: 'active',
                    password: '',
                    confirmPassword: '',
                    notes: ''
                  });
                  setFormErrors({});
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e8e4dc',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={showEditModal ? handleUpdate : handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#e8e4dc',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {formErrors.firstName && (
                      <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {formErrors.firstName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#e8e4dc',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {formErrors.lastName && (
                      <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {formErrors.lastName}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#e8e4dc',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {formErrors.email && (
                    <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                      {formErrors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#e8e4dc',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {formErrors.phone && (
                    <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                      {formErrors.phone}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#e8e4dc',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="tenant">Tenant</option>
                      <option value="landlord">Landlord</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#e8e4dc',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {(showCreateModal || (showEditModal && !selectedUser)) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                        Password
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#e8e4dc',
                          borderRadius: '4px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      {formErrors.password && (
                        <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          {formErrors.password}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#e8e4dc',
                          borderRadius: '4px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      {formErrors.confirmPassword && (
                        <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          {formErrors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#e8e4dc',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        role: 'tenant',
                        status: 'active',
                        password: '',
                        confirmPassword: '',
                        notes: ''
                      });
                      setFormErrors({});
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(201, 168, 76, 0.2)',
                      color: '#7a7060',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#c9a84c',
                      color: '#080808',
                      border: 'none',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }
                  </button>
                </div>
              </div>
            </form>
          </div>
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

export default UserManagement;
