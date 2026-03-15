import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Search, Filter, MapPin, Bed, Bath, Square, DollarSign, Eye, Edit, Trash2, Users, Calendar, TrendingUp, AlertCircle, CheckCircle, X, Home } from 'lucide-react';
import Api from '../../services/api';

interface Property {
  id: number;
  title: string;
  location: string;
  address: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image?: string | null;
  description: string;
  amenities: string[];
  status: 'available' | 'rented' | 'maintenance' | 'listed';
  listedDate: string;
  views: number;
  inquiries: number;
  currentTenant?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contractStart: string;
    contractEnd: string;
  };
  documents: {
    images: string[];
    floorPlan: string;
    certificates: string[];
  };
}

interface PropertyStats {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  totalValue: number;
  monthlyRevenue: number;
  avgOccupancy: number;
  pendingInquiries: number;
}

const MyProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('listedDate');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockProperties: Property[] = [
        {
          id: 1,
          title: 'Modern 2-Bedroom Apartment',
          location: 'Masaki, Dar es Salaam',
          address: '123 Kimweri Avenue, Masaki',
          price: 800000,
          type: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          area: 120,
          image: null,
          description: 'Beautiful modern apartment in the heart of Masaki with stunning city views and premium finishes.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Gym', 'Pool', 'Balcony'],
          status: 'rented',
          listedDate: '2024-01-15',
          views: 245,
          inquiries: 18,
          currentTenant: {
            id: 1,
            firstName: 'Peter',
            lastName: 'Mushy',
            email: 'mushyp420@gmail.com',
            phone: '0753511713',
            contractStart: '2024-01-01',
            contractEnd: '2024-12-31'
          },
          documents: {
            images: ['property1-1.jpg', 'property1-2.jpg'],
            floorPlan: 'property1-floor.jpg',
            certificates: ['occupancy-cert.pdf', 'safety-cert.pdf']
          }
        },
        {
          id: 2,
          title: 'Cozy Studio in Mikocheni',
          location: 'Mikocheni, Dar es Salaam',
          address: '456 Nyerere Road, Mikocheni',
          price: 350000,
          type: 'studio',
          bedrooms: 1,
          bathrooms: 1,
          area: 45,
          image: null,
          description: 'Perfect studio for young professionals. Close to public transport and shopping centers.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Kitchenette'],
          status: 'available',
          listedDate: '2024-02-20',
          views: 189,
          inquiries: 12,
          documents: {
            images: ['property2-1.jpg'],
            floorPlan: 'property2-floor.jpg',
            certificates: ['occupancy-cert.pdf']
          }
        },
        {
          id: 3,
          title: 'Spacious House with Garden',
          location: 'Upanga, Dar es Salaam',
          address: '789 Independence Avenue, Upanga',
          price: 1500000,
          type: 'house',
          bedrooms: 3,
          bathrooms: 2,
          area: 200,
          image: null,
          description: 'Lovely family home with private garden. Perfect for families looking for space and comfort.',
          amenities: ['Garden', 'Parking', 'Security', 'Storage', 'Terrace'],
          status: 'maintenance',
          listedDate: '2023-12-01',
          views: 367,
          inquiries: 25,
          documents: {
            images: ['property3-1.jpg', 'property3-2.jpg', 'property3-3.jpg'],
            floorPlan: 'property3-floor.jpg',
            certificates: ['occupancy-cert.pdf', 'safety-cert.pdf', 'building-permit.pdf']
          }
        },
        {
          id: 4,
          title: 'Executive Villa, Oyster Bay',
          location: 'Oyster Bay, Dar es Salaam',
          address: '321 Ocean View Drive, Oyster Bay',
          price: 3200000,
          type: 'villa',
          bedrooms: 4,
          bathrooms: 3,
          area: 340,
          image: null,
          description: 'Luxurious villa with ocean views, private pool, and premium finishes. Ideal for executives.',
          amenities: ['Pool', 'Garden', 'Security', 'Parking', 'Gym', 'Maid Room', 'Ocean View'],
          status: 'available',
          listedDate: '2024-03-01',
          views: 523,
          inquiries: 8,
          documents: {
            images: ['property4-1.jpg', 'property4-2.jpg'],
            floorPlan: 'property4-floor.jpg',
            certificates: ['occupancy-cert.pdf', 'safety-cert.pdf', 'luxury-cert.pdf']
          }
        }
      ];

      const mockStats: PropertyStats = {
        total: 4,
        available: 2,
        rented: 1,
        maintenance: 1,
        totalValue: 5850000,
        monthlyRevenue: 800000,
        avgOccupancy: 75,
        pendingInquiries: 20
      };
      
      setProperties(mockProperties);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [propertiesRes, statsRes] = await Promise.all([
      //   Api.getLandlordProperties(),
      //   Api.getPropertyStats()
      // ]);
      // 
      // if (propertiesRes.data) setProperties(propertiesRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load properties:', e);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId: number) => {
    try {
      // await Api.deleteProperty(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (e) {
      setError('Failed to delete property');
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
      case 'available': return '#10b981';
      case 'rented': return '#3b82f6';
      case 'maintenance': return '#f59e0b';
      case 'listed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircle;
      case 'rented': return Users;
      case 'maintenance': return AlertCircle;
      case 'listed': return Home;
      default: return Home;
    }
  };

  const filteredAndSortedProperties = properties
    .filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'listedDate':
          return new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'views':
          return b.views - a.views;
        case 'inquiries':
          return b.inquiries - a.inquiries;
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building size={28} style={{ color: '#c9a84c' }} />
            <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
              My Properties
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
                {stats.total} properties
              </span>
            )}
          </div>
          
          <Link
            to="/dashboard/properties/add"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#c9a84c',
              color: '#080808',
              textDecoration: 'none',
              borderRadius: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            Add Property
          </Link>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage your rental properties and track their performance
        </p>
      </div>

      {/* Property Stats */}
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
              Total Properties
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
              {stats.available}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available
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
              {stats.rented}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rented
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
              {fmt(stats.monthlyRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly Revenue
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
              placeholder="Search properties..."
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
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="listed">Listed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
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
            <option value="listedDate">Recently Listed</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="views">Most Viewed</option>
            <option value="inquiries">Most Inquiries</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {filteredAndSortedProperties.map((property) => {
          const StatusIcon = getStatusIcon(property.status);
          
          return (
            <div
              key={property.id}
              style={{
                backgroundColor: '#0e0e0e',
                border: '1px solid rgba(201, 168, 76, 0.12)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Property Image/Placeholder */}
              <div style={{ 
                height: '200px', 
                backgroundColor: 'rgba(201, 168, 76, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Building size={48} style={{ color: '#c9a84c' }} />
                
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: `${getStatusColor(property.status)}15`,
                  border: `1px solid ${getStatusColor(property.status)}30`,
                  color: getStatusColor(property.status),
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <StatusIcon size={10} />
                  {property.status}
                </div>

                {/* Action Buttons */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(201, 168, 76, 0.9)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteProperty(property.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Property Details */}
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ 
                    color: '#e8e4dc', 
                    fontSize: '16px', 
                    fontFamily: 'DM Sans, sans-serif', 
                    fontWeight: '500',
                    margin: '0 0 8px',
                    lineHeight: '1.3'
                  }}>
                    {property.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <MapPin size={14} style={{ color: '#7a7060' }} />
                    <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                      {property.location}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Bed size={14} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {property.bedrooms}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Bath size={14} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {property.bathrooms}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Square size={14} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {property.area}m²
                      </span>
                    </div>
                  </div>

                  <p style={{ 
                    color: '#7a7060', 
                    fontSize: '13px', 
                    fontFamily: 'DM Sans, sans-serif', 
                    lineHeight: '1.4',
                    margin: '0 0 12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {property.description}
                  </p>
                </div>

                {/* Current Tenant Info */}
                {property.currentTenant && (
                  <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Users size={14} style={{ color: '#3b82f6' }} />
                      <span style={{ color: '#3b82f6', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        Current Tenant
                      </span>
                    </div>
                    <div style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                      {property.currentTenant.firstName} {property.currentTenant.lastName}
                    </div>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                      {formatDate(property.currentTenant.contractStart)} - {formatDate(property.currentTenant.contractEnd)}
                    </div>
                  </div>
                )}

                {/* Price and Stats */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(201, 168, 76, 0.12)' }}>
                  <div>
                    <div style={{ color: '#c9a84c', fontSize: '20px', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                      {fmt(property.price)}
                    </div>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                      per month
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {property.views}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {property.inquiries}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Listed Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                  <Calendar size={12} style={{ color: '#7a7060' }} />
                  <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                    Listed on {formatDate(property.listedDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedProperties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Building size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No properties found</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
            Try adjusting your filters or add your first property
          </p>
          <Link
            to="/dashboard/properties/add"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#c9a84c',
              color: '#080808',
              textDecoration: 'none',
              borderRadius: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            Add Your First Property
          </Link>
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

export default MyProperties;
