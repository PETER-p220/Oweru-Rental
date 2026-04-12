import React, { useState, useEffect } from 'react';
import {
  Users, Building, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Activity, MapPin,
  UserCheck, CreditCard, Shield
} from 'lucide-react';
import Api from '../../services/api';

/* 
   ADMIN DASHBOARD STYLE TOKENS
*/
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

const serif = {
  fontFamily: "'Playfair Display', 'Georgia', serif",
};

const body = {
  fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
};

const card = {
  background: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: 24,
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalRevenue: 0,
    activeListings: 0,
    pendingApplications: 0,
    systemHealth: 'good'
  });

  const [oweruProperties, setOweruProperties] = useState<any[]>([]);
  const [loadingOweru, setLoadingOweru] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quickForm, setQuickForm] = useState({
    title: '',
    location: '',
    price: '',
    description: '',
    bedrooms: '',
    bathrooms: ''
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    status: string;
  }>>([]);

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadOweruProperties();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load users
      const usersResponse = await Api.getUsers();
      const users = usersResponse?.data || [];
      
      // Load properties
      const propertiesResponse = await Api.getProperties();
      const properties = propertiesResponse?.data || [];
      
      // Load transactions
      const transactionsResponse = await Api.getAdminTransactions();
      const transactions = transactionsResponse?.data || [];

      // Calculate stats
      setStats({
        totalUsers: users.length,
        totalProperties: properties.length,
        totalRevenue: transactions.reduce((sum: number, transaction: any) => {
          const amount = typeof transaction.amount === 'number' && !isNaN(transaction.amount) ? transaction.amount : 0;
          return sum + amount;
        }, 0),
        activeListings: properties.filter((p: any) => p.available).length,
        pendingApplications: 0,
        systemHealth: 'good'
      });

      setTransactions(transactions);

      // Generate recent activity
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
          message: `New user registered: ${user.name}`,
          time: formatTimeAgo(user.created_at || user.createdAt),
          status: 'success'
        }));

      // Add recent properties
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
    } finally {
      setLoading(false);
    }
  };

  const loadOweruProperties = async () => {
    try {
      setLoadingOweru(true);
      const response = await Api.getAdminProperties();
      const oweruProperties = response?.data?.filter((p: any) => p.type === 'oweru_rental') || [];
      setOweruProperties(oweruProperties);
    } catch (error) {
      console.error('Failed to load Oweru properties:', error);
    } finally {
      setLoadingOweru(false);
    }
  };

  const addOweruProperty = async (propertyData: any) => {
    try {
      await Api.createAdminProperty(propertyData);
      await loadOweruProperties();
    } catch (error) {
      console.error('Failed to add Oweru property:', error);
      alert('Failed to add property. Please try again.');
    }
  };

  const deleteOweruProperty = async (id: string) => {
    try {
      await Api.deleteAdminProperty(parseInt(id));
      await loadOweruProperties();
    } catch (error) {
      console.error('Failed to delete Oweru property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

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
    const numAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    if (!numAmount || numAmount === 0) return 'TZS 0';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: t.cream,
        ...body
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 16 }}>Loading Admin Dashboard...</div>
          <div style={{ fontSize: 14, color: t.muted }}>Please wait</div>
        </div>
      </div>
    );
  }

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

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 8, 
              background: t.gold, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Users size={24} style={{ color: t.dark }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Users</div>
              <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
                {stats.totalUsers}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 8, 
              background: t.green, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Building size={24} style={{ color: t.dark }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Properties</div>
              <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
                {stats.totalProperties}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 8, 
              background: '#2563eb', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <DollarSign size={24} style={{ color: t.dark }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Revenue</div>
              <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 8, 
              background: '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <TrendingUp size={24} style={{ color: t.dark }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Active Listings</div>
              <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: t.cream }}>
                {stats.activeListings}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
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

      {/* Oweru Rental Properties Section */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
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
              background: t.gold,
              color: t.dark,
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Building size={16} />
            {showAddForm ? 'Cancel' : 'Add Oweru Property'}
          </button>
        </div>

        {/* Inline Add Form */}
        {showAddForm && (
          <div style={{
            background: t.dark3,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: '20px',
            marginTop: '20px'
          }}>
            <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.cream, margin: '0 0 16px' }}>
              Add New Oweru Property
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  autoComplete="off"
                  required
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                  placeholder="Enter property title"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: t.dark2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.cream,
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  autoComplete="off"
                  required
                  value={quickForm.location}
                  onChange={(e) => setQuickForm({ ...quickForm, location: e.target.value })}
                  placeholder="e.g., Dar es Salaam, Arusha"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: t.dark2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.cream,
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>
                Description *
              </label>
              <textarea
                name="description"
                required
                value={quickForm.description}
                onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                rows={3}
                placeholder="Describe the property features, amenities, and location..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: t.dark2,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.cream,
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  name="price"
                  autoComplete="off"
                  required
                  min="0"
                  step="1000"
                  value={quickForm.price}
                  onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
                  placeholder="e.g., 500000"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: t.dark2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.cream,
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  min="0"
                  value={quickForm.bedrooms}
                  onChange={(e) => setQuickForm({ ...quickForm, bedrooms: e.target.value })}
                  placeholder="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: t.dark2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.cream,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px' }}>
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  min="0"
                  value={quickForm.bathrooms}
                  onChange={(e) => setQuickForm({ ...quickForm, bathrooms: e.target.value })}
                  placeholder="2"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: t.dark2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.cream,
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setQuickForm({
                    title: '',
                    location: '',
                    price: '',
                    description: '',
                    bedrooms: '',
                    bathrooms: ''
                  });
                  setShowAddForm(false);
                }}
                style={{
                  background: 'transparent',
                  color: t.muted,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (quickForm.title && quickForm.location && quickForm.price && quickForm.description) {
                    await addOweruProperty({
                      title: quickForm.title,
                      location: quickForm.location,
                      price: parseFloat(quickForm.price),
                      description: quickForm.description,
                      type: 'oweru_rental',
                      featured: true,
                      available: true,
                      bedrooms: parseInt(quickForm.bedrooms) || undefined,
                      bathrooms: parseInt(quickForm.bathrooms) || undefined
                    });
                    
                    // Reset form
                    setQuickForm({
                      title: '',
                      location: '',
                      price: '',
                      description: '',
                      bedrooms: '',
                      bathrooms: ''
                    });
                    setShowAddForm(false);
                  } else {
                    alert('Please fill in all required fields: Title, Location, Price, and Description');
                  }
                }}
                style={{
                  background: t.gold,
                  color: t.dark,
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Add Property
              </button>
            </div>
          </div>
        )}

        {loadingOweru ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>
            Loading Oweru properties...
          </div>
        ) : oweruProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: t.muted }}>
            <Building size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>No Oweru properties yet</div>
            <div style={{ fontSize: 14 }}>Add properties to feature on homepage</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {oweruProperties.map((property) => (
              <div key={property.id} style={{
                background: t.dark3,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: 200,
                  background: `linear-gradient(135deg, ${t.dark2}, ${t.dark3})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: t.muted
                }}>
                  <Building size={48} style={{ opacity: 0.3 }} />
                </div>
                
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.cream, margin: 0 }}>
                      {property.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        background: t.gold,
                        color: t.dark,
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Oweru Rental
                      </span>
                      {property.featured && (
                        <span style={{
                          background: t.green,
                          color: t.dark,
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p style={{ 
                    ...body, 
                    fontSize: 14, 
                    color: t.muted, 
                    margin: '0 0 12px',
                    lineHeight: 1.5 
                  }}>
                    {property.description}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} style={{ color: t.gold }} />
                        <span style={{ ...body, fontSize: 14, color: t.cream }}>
                          {property.location}
                        </span>
                      </div>
                      {property.bedrooms && (
                        <span style={{ ...body, fontSize: 14, color: t.cream }}>
                          {property.bedrooms} bed
                        </span>
                      )}
                    </div>
                    <div style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.gold }}>
                      {formatCurrency(property.price)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this Oweru property?')) {
                          deleteOweruProperty(property.id);
                        }
                      }}
                      style={{
                        background: 'transparent',
                        color: t.red,
                        border: `1px solid ${t.red}`,
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <div style={{ color: getStatusColor(activity.status) }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...body, fontSize: 14, color: t.cream, fontWeight: 600 }}>
                    {activity.message}
                  </div>
                  <div style={{ ...body, fontSize: 12, color: t.muted }}>
                    {activity.time}
                  </div>
                </div>
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
    </div>
  );
};

export default AdminDashboard;
