import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Filter, MapPin, Home, X, DollarSign, Bed, Bath, Square, Calendar, Eye, Star, Trash2, Building, CheckCircle } from 'lucide-react';
import Api from '../../services/api';

interface SavedProperty {
  id: number;
  title: string;
  location: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  image: string | null;
  description: string;
  amenities: string[];
  landlord: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
  };
  availability: 'available' | 'rented' | 'maintenance';
  listedDate: string;
  savedDate: string;
  views: number;
  rating?: number;
  reviews?: number;
}

interface SavedStats {
  totalSaved: number;
  available: number;
  rented: number;
  averagePrice: number;
  recentlySaved: number;
}

const SavedProperties = () => {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [stats, setStats] = useState<SavedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('savedDate');

  useEffect(() => {
    loadSavedProperties();
  }, []);

  const loadSavedProperties = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockProperties: SavedProperty[] = [
        {
          id: 1,
          title: 'Modern 2-Bedroom Apartment',
          location: 'Masaki, Dar es Salaam',
          address: '123 Kimweri Avenue, Masaki',
          price: 800000,
          bedrooms: 2,
          bathrooms: 2,
          area: 120,
          type: 'apartment',
          image: null,
          description: 'Beautiful modern apartment in the heart of Masaki with stunning city views and premium finishes.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Gym', 'Pool', 'Balcony'],
          landlord: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'landlord@example.com',
            phone: '+255123456789',
            company: 'Doe Properties Ltd'
          },
          availability: 'available',
          listedDate: '2024-01-15',
          savedDate: '2024-02-01',
          views: 245,
          rating: 4.5,
          reviews: 12
        },
        {
          id: 2,
          title: 'Cozy Studio in Mikocheni',
          location: 'Mikocheni, Dar es Salaam',
          address: '456 Nyerere Road, Mikocheni',
          price: 350000,
          bedrooms: 1,
          bathrooms: 1,
          area: 45,
          type: 'studio',
          image: null,
          description: 'Perfect studio for young professionals. Close to public transport and shopping centers.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Kitchenette'],
          landlord: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '+255987654321'
          },
          availability: 'available',
          listedDate: '2024-02-20',
          savedDate: '2024-02-10',
          views: 189,
          rating: 4.2,
          reviews: 8
        },
        {
          id: 3,
          title: 'Spacious House with Garden',
          location: 'Upanga, Dar es Salaam',
          address: '789 Independence Avenue, Upanga',
          price: 1500000,
          bedrooms: 3,
          bathrooms: 2,
          area: 200,
          type: 'house',
          image: null,
          description: 'Lovely family home with private garden. Perfect for families looking for space and comfort.',
          amenities: ['Garden', 'Parking', 'Security', 'Storage', 'Terrace'],
          landlord: {
            id: 3,
            firstName: 'Michael',
            lastName: 'Johnson',
            email: 'michael@example.com',
            phone: '+255555123456'
          },
          availability: 'rented',
          listedDate: '2023-12-01',
          savedDate: '2024-01-15',
          views: 367,
          rating: 4.7,
          reviews: 15
        },
        {
          id: 4,
          title: 'Executive Villa, Oyster Bay',
          location: 'Oyster Bay, Dar es Salaam',
          address: '321 Ocean View Drive, Oyster Bay',
          price: 3200000,
          bedrooms: 4,
          bathrooms: 3,
          area: 340,
          type: 'villa',
          image: null,
          description: 'Luxurious villa with ocean views, private pool, and premium finishes. Ideal for executives.',
          amenities: ['Pool', 'Garden', 'Security', 'Parking', 'Gym', 'Maid Room', 'Ocean View'],
          landlord: {
            id: 4,
            firstName: 'Robert',
            lastName: 'Williams',
            email: 'robert@example.com',
            phone: '+255777888999',
            company: 'Luxury Homes Ltd'
          },
          availability: 'available',
          listedDate: '2024-03-01',
          savedDate: '2024-03-05',
          views: 523,
          rating: 4.9,
          reviews: 22
        },
        {
          id: 5,
          title: '1-Bedroom Apt in Kinondoni',
          location: 'Kinondoni, Dar es Salaam',
          address: '654 Morogoro Road, Kinondoni',
          price: 420000,
          bedrooms: 1,
          bathrooms: 1,
          area: 60,
          type: 'apartment',
          image: null,
          description: 'Affordable apartment in convenient location. Close to schools and shopping areas.',
          amenities: ['Air Conditioning', 'Security', 'Parking'],
          landlord: {
            id: 5,
            firstName: 'Sarah',
            lastName: 'Brown',
            email: 'sarah@example.com',
            phone: '+255444555666'
          },
          availability: 'maintenance',
          listedDate: '2024-02-15',
          savedDate: '2024-02-20',
          views: 156,
          rating: 4.0,
          reviews: 6
        },
        {
          id: 6,
          title: 'Penthouse Studio, Msasani',
          location: 'Msasani, Dar es Salaam',
          address: '987 Beach Road, Msasani',
          price: 650000,
          bedrooms: 1,
          bathrooms: 1,
          area: 55,
          type: 'studio',
          image: null,
          description: 'Stunning penthouse studio with ocean views and modern amenities.',
          amenities: ['Ocean View', 'Air Conditioning', 'Security', 'Parking', 'Rooftop Access'],
          landlord: {
            id: 6,
            firstName: 'David',
            lastName: 'Lee',
            email: 'david@example.com',
            phone: '+255333222111'
          },
          availability: 'available',
          listedDate: '2024-02-25',
          savedDate: '2024-03-01',
          views: 298,
          rating: 4.6,
          reviews: 11
        }
      ];

      const mockStats: SavedStats = {
        totalSaved: 6,
        available: 4,
        rented: 1,
        averagePrice: 1036667,
        recentlySaved: 2
      };
      
      setProperties(mockProperties);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [propertiesRes, statsRes] = await Promise.all([
      //   Api.getSavedProperties(),
      //   Api.getSavedPropertiesStats()
      // ]);
      // 
      // if (propertiesRes.data) setProperties(propertiesRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load saved properties:', e);
      setError('Failed to load saved properties');
    } finally {
      setLoading(false);
    }
  };

  const removeSavedProperty = async (propertyId: number) => {
    try {
      // await Api.removeSavedProperty(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (e) {
      setError('Failed to remove saved property');
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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return '#10b981';
      case 'rented': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return CheckCircle;
      case 'rented': return X;
      case 'maintenance': return Calendar;
      default: return Calendar;
    }
  };

  const filteredAndSortedProperties = properties
    .filter(property => {
      const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || property.type === typeFilter;
      const matchesAvailability = availabilityFilter === 'all' || property.availability === availabilityFilter;
      
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const [min, max] = priceFilter.split('-').map(Number);
        matchesPrice = property.price >= min && property.price <= max;
      }
      
      return matchesSearch && matchesType && matchesAvailability && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'savedDate':
          return new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'views':
          return b.views - a.views;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading saved properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Heart size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Saved Properties
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
              {stats.totalSaved} saved
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Properties you've saved for future reference
        </p>
      </div>

      {/* Saved Stats */}
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
              {stats.totalSaved}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Saved
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
            border: '1px solid rgba(239, 68, 68, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
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
              {fmt(stats.averagePrice)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Average Price
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
              placeholder="Search saved properties..."
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
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
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
            <option value="all">All Prices</option>
            <option value="0-500000">Under 500K</option>
            <option value="500000-1000000">500K - 1M</option>
            <option value="1000000-2000000">1M - 2M</option>
            <option value="2000000-9999999">Above 2M</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
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
            <option value="savedDate">Recently Saved</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="views">Most Viewed</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {filteredAndSortedProperties.map((property) => {
          const AvailabilityIcon = getAvailabilityIcon(property.availability);
          
          return (
            <div
              key={property.id}
              style={{
                backgroundColor: '#0e0e0e',
                border: '1px solid rgba(201, 168, 76, 0.12)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
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
                
                {/* Availability Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: `${getAvailabilityColor(property.availability)}15`,
                  border: `1px solid ${getAvailabilityColor(property.availability)}30`,
                  color: getAvailabilityColor(property.availability),
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <AvailabilityIcon size={10} />
                  {property.availability}
                </div>

                {/* Remove from Saved Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSavedProperty(property.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
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
                  <X size={16} />
                </button>
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

                {/* Price and Actions */}
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
                    {property.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={12} style={{ color: '#c9a84c' }} />
                        <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          {property.rating}
                        </span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {property.views}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Saved Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                  <Heart size={12} style={{ color: '#c9a84c' }} />
                  <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                    Saved on {formatDate(property.savedDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedProperties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Heart size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No saved properties found</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
            Try adjusting your filters or browse available properties
          </p>
          <Link
            to="/properties"
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
            <Search size={16} />
            Browse Properties
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

export default SavedProperties;
