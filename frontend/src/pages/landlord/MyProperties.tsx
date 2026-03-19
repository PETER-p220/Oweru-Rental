import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Search, Filter, MapPin, Bed, Bath, Square, DollarSign, Eye, Edit, Trash2, Users, Calendar, TrendingUp, AlertCircle, CheckCircle, X, Home, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [carouselStates, setCarouselStates] = useState<Record<number, number>>({});

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch real properties from API
      const response = await Api.getOwnerProperties();
      
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      let transformedProperties: Property[] = [];
      
      if (response.data) {
        console.log('Raw property data:', response.data[0]); // Debug first property
        // Transform API data to match our interface
        transformedProperties = response.data.map((property: any) => ({
          id: property.id,
          title: property.title,
          location: property.location,
          address: property.address || '',
          price: parseFloat(property.price),
          type: property.type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          image: property.images && property.images.length > 0 
            ? (property.images[0].startsWith('http') ? property.images[0] : `${import.meta.env.VITE_API_URL}/storage/${property.images[0]}`)
            : null,
          description: property.description,
          amenities: property.amenities || [],
          status: property.available ? 'available' : 'rented', // Simplified status
          listedDate: property.created_at ? new Date(property.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          views: 0, // Add view count if available in API
          inquiries: 0, // Add inquiry count if available in API
          currentTenant: property.tenant || null,
          documents: {
            images: property.images ? property.images.map((img: string) => 
              img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL}/storage/${img}`
            ) : [],
            floorPlan: '',
            certificates: []
          }
        }));
        
        console.log('Transformed property:', transformedProperties[0]); // Debug transformed
        setProperties(transformedProperties);
      }
      
      // Load stats if available
      try {
        const statsResponse = await Api.getOwnerAnalytics();
        if (statsResponse.data) {
          const transformedStats: PropertyStats = {
            total: statsResponse.data.property_performance?.total_properties || 0,
            available: statsResponse.data.property_performance?.available_properties || 0,
            rented: statsResponse.data.property_performance?.occupied_properties || 0,
            maintenance: 0,
            totalValue: 0,
            monthlyRevenue: statsResponse.data.financial_metrics?.monthly_revenue || 0,
            avgOccupancy: statsResponse.data.property_performance?.occupancy_rate || 0,
            pendingInquiries: 0
          };
          setStats(transformedStats);
        }
      } catch (statsError) {
        console.warn('Could not load stats:', statsError);
        // Set default stats if stats API fails
        setStats({
          total: transformedProperties.length || 0,
          available: transformedProperties.filter(p => p.status === 'available').length || 0,
          rented: transformedProperties.filter(p => p.status === 'rented').length || 0,
          maintenance: 0,
          totalValue: 0,
          monthlyRevenue: 0,
          avgOccupancy: 0,
          pendingInquiries: 0
        });
      }
      
    } catch (err: any) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties. Please try again.');
      setProperties([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId: number) => {
    try {
      await Api.deleteOwnerProperty(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      // Refresh properties list to get updated stats
      loadProperties();
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
            to="/dashboard/landlord/add-property"
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
              {/* Property Image Carousel */}
              <div style={{ 
                height: '200px', 
                backgroundColor: 'rgba(201, 168, 76, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {property.documents.images.length > 0 ? (
                  <>
                    {/* Carousel Images */}
                    <div style={{
                      display: 'flex',
                      transition: 'transform 0.3s ease',
                      transform: `translateX(-${(carouselStates[property.id] || 0) * 100}%)`
                    }}>
                      {property.documents.images.map((image, index) => (
                        <img
                          key={index}
                          src={image.startsWith('http') ? image : `http://localhost:8000${image}`}
                          alt={`${property.title} - Image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-property.jpg';
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Carousel Controls */}
                    {property.documents.images.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const currentIndex = carouselStates[property.id] || 0;
                            const newIndex = currentIndex === 0 ? property.documents.images.length - 1 : currentIndex - 1;
                            setCarouselStates(prev => ({ ...prev, [property.id]: newIndex }));
                          }}
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 2
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        <button
                          onClick={() => {
                            const currentIndex = carouselStates[property.id] || 0;
                            const newIndex = currentIndex === property.documents.images.length - 1 ? 0 : currentIndex + 1;
                            setCarouselStates(prev => ({ ...prev, [property.id]: newIndex }));
                          }}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 2
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                        
                        {/* Image Indicators */}
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '4px',
                          zIndex: 2
                        }}>
                          {property.documents.images.map((_, index) => (
                            <div
                              key={index}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: (carouselStates[property.id] || 0) === index ? '#c9a84c' : 'rgba(255, 255, 255, 0.5)',
                                transition: 'background-color 0.3s ease'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <Building size={48} style={{ color: '#c9a84c' }} />
                )}
                
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
                    onClick={() => {
                      // Test the original route with EditPropertySimple
                      console.log('Edit button clicked, property ID:', property.id);
                      window.location.href = `/dashboard/landlord/properties/${property.id}/edit`;
                    }}
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MyProperties;
