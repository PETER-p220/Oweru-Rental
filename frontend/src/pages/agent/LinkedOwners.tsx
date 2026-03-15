import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Filter, Mail, Phone, Building, Eye, MoreVertical, Plus, MapPin, Home, DollarSign, Calendar, Star, TrendingUp } from 'lucide-react';
import Api from '../../services/api';

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  totalProperties: number;
  activeListings: number;
  soldProperties: number;
  totalRevenue: number;
  avgCommission: number;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  totalReviews: number;
  properties: Array<{
    id: number;
    title: string;
    location: string;
    price: number;
    status: string;
    listedDate: string;
  }>;
}

interface OwnerStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  totalProperties: number;
  totalRevenue: number;
  avgCommission: number;
  newThisMonth: number;
}

const LinkedOwners = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('joinDate');

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockOwners: Owner[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+255123456789',
          company: 'Premium Properties Ltd',
          totalProperties: 8,
          activeListings: 5,
          soldProperties: 3,
          totalRevenue: 45000000,
          avgCommission: 4.5,
          joinDate: '2024-01-15',
          lastActive: '2024-03-20',
          status: 'active',
          rating: 4.8,
          totalReviews: 12,
          properties: [
            {
              id: 1,
              title: 'Modern 3-Bedroom Penthouse',
              location: 'Masaki, Dar es Salaam',
              price: 2500000,
              status: 'active',
              listedDate: '2024-01-15'
            },
            {
              id: 2,
              title: 'Cozy 1-Bedroom Apartment',
              location: 'Mikocheni B, Dar es Salaam',
              price: 450000,
              status: 'active',
              listedDate: '2024-02-20'
            }
          ]
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+255987654321',
          company: 'QuickRent Properties',
          totalProperties: 5,
          activeListings: 3,
          soldProperties: 2,
          totalRevenue: 28000000,
          avgCommission: 5.0,
          joinDate: '2024-02-01',
          lastActive: '2024-03-18',
          status: 'active',
          rating: 4.6,
          totalReviews: 8,
          properties: [
            {
              id: 3,
              title: 'Spacious Family Home',
              location: 'Upanga, Dar es Salaam',
              price: 1800000,
              status: 'active',
              listedDate: '2024-03-01'
            }
          ]
        },
        {
          id: 3,
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael@example.com',
          phone: '+255555666777',
          company: 'Family Homes Ltd',
          totalProperties: 12,
          activeListings: 8,
          soldProperties: 4,
          totalRevenue: 62000000,
          avgCommission: 4.2,
          joinDate: '2023-12-01',
          lastActive: '2024-03-19',
          status: 'active',
          rating: 4.9,
          totalReviews: 15,
          properties: [
            {
              id: 4,
              title: 'Luxury Executive Villa',
              location: 'Oyster Bay, Dar es Salaam',
              price: 4500000,
              status: 'sold',
              listedDate: '2023-12-01'
            }
          ]
        },
        {
          id: 4,
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com',
          phone: '+255444555666',
          company: 'City Living Properties',
          totalProperties: 3,
          activeListings: 2,
          soldProperties: 1,
          totalRevenue: 15000000,
          avgCommission: 4.8,
          joinDate: '2024-03-01',
          lastActive: '2024-03-17',
          status: 'pending',
          rating: 4.5,
          totalReviews: 4,
          properties: [
            {
              id: 5,
              title: 'Modern Studio with City View',
              location: 'Msasani, Dar es Salaam',
              price: 380000,
              status: 'pending',
              listedDate: '2024-03-10'
            }
          ]
        }
      ];

      const mockStats: OwnerStats = {
        total: 4,
        active: 3,
        inactive: 0,
        pending: 1,
        totalProperties: 28,
        totalRevenue: 150000000,
        avgCommission: 4.6,
        newThisMonth: 2
      };
      
      setOwners(mockOwners);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [ownersRes, statsRes] = await Promise.all([
      //   Api.getLinkedOwners(),
      //   Api.getOwnerStats()
      // ]);
      // 
      // if (ownersRes.data) setOwners(ownersRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load owners:', e);
      setError('Failed to load owners');
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
    day: 'numeric' 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const filteredAndSortedOwners = owners
    .filter(owner => {
      const matchesSearch = owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (owner.company && owner.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || owner.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'properties':
          return b.totalProperties - a.totalProperties;
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading linked owners...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Users size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Linked Owners
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
              {stats.total} owners
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage your relationships with property owners and track your collaborations
        </p>
      </div>

      {/* Owner Stats */}
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
              Total Owners
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

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(56, 189, 248, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#38bdf8', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(stats.totalRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Revenue
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ color: '#7a7060' }} />
            <input
              type="text"
              placeholder="Search owners..."
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
            <option value="pending">Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
            <option value="joinDate">Recently Joined</option>
            <option value="name">Name</option>
            <option value="properties">Most Properties</option>
            <option value="revenue">Highest Revenue</option>
            <option value="rating">Best Rating</option>
          </select>
        </div>
      </div>

      {/* Owners List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Owners List
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredAndSortedOwners.length} owners
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedOwners.map((owner) => (
            <div
              key={owner.id}
              style={{
                padding: '20px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 168, 76, 0.06)',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                {/* Owner Avatar */}
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  backgroundColor: 'rgba(201, 168, 76, 0.1)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={24} style={{ color: '#c9a84c' }} />
                </div>

                {/* Owner Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ 
                        color: '#e8e4dc', 
                        fontSize: '16px', 
                        fontFamily: 'DM Sans, sans-serif', 
                        fontWeight: '500',
                        margin: '0 0 4px'
                      }}>
                        {owner.firstName} {owner.lastName}
                      </h4>
                      {owner.company && (
                        <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                          {owner.company}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {owner.email}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {owner.phone}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: `${getStatusColor(owner.status)}15`,
                          border: `1px solid ${getStatusColor(owner.status)}30`,
                          color: getStatusColor(owner.status),
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {owner.status}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} style={{ color: '#f59e0b' }} />
                          <span style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {owner.rating}
                          </span>
                          <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            ({owner.totalReviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Owner Stats */}
                  <div style={{
                    backgroundColor: 'rgba(201, 168, 76, 0.03)',
                    border: '1px solid rgba(201, 168, 76, 0.08)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Total Properties
                        </div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {owner.totalProperties}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Active Listings
                        </div>
                        <div style={{ color: '#10b981', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {owner.activeListings}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Sold Properties
                        </div>
                        <div style={{ color: '#38bdf8', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {owner.soldProperties}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Total Revenue
                        </div>
                        <div style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {fmt(owner.totalRevenue)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Avg Commission
                        </div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {owner.avgCommission}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Properties */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      Recent Properties
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {owner.properties.slice(0, 2).map((property) => (
                        <div key={property.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '4px'
                        }}>
                          <div>
                            <div style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                              {property.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={12} style={{ color: '#7a7060' }} />
                              <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                                {property.location}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#c9a84c', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                              {fmt(property.price)}
                            </div>
                            <div style={{
                              padding: '2px 6px',
                              backgroundColor: `${property.status === 'active' ? '#10b98115' : property.status === 'sold' ? '#38bdf815' : '#f59e0b15'}`,
                              border: `${property.status === 'active' ? '1px solid #10b98130' : property.status === 'sold' ? '1px solid #38bdf830' : '1px solid #f59e0b30'}`,
                              color: property.status === 'active' ? '#10b981' : property.status === 'sold' ? '#38bdf8' : '#f59e0b',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {property.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button style={{
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
                    }}>
                      <Building size={14} />
                      View Properties
                    </button>
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      color: '#38bdf8',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      <Mail size={14} />
                      Send Message
                    </button>
                    <button style={{
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
                    }}>
                      <Eye size={14} />
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedOwners.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No owners found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or start connecting with property owners
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LinkedOwners;
