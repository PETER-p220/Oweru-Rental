import { useState, useEffect } from 'react';
import {
  Search, Download, Eye, Edit, Plus,
  Bed, Bath, Users, Star, MapPin, Wifi, Car,
  Dumbbell, Wind, Utensils, Monitor, Tv, Shirt,
  Home, BarChart3, RefreshCw, ImageIcon, CheckCircle, AlertCircle,
  XCircle
} from 'lucide-react';
import Api from '../../services/api';

/* ─────────────────────────────────────────────────────────────
   BNB PROPERTIES STYLE TOKENS
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
  orange:  '#f59e0b',
  purple:  '#a78bfa',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: t.dark2,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  padding: '20px',
};

const button: React.CSSProperties = {
  ...body,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s',
};

/* ─────────────────────────────────────────────────────────────
   BNB PROPERTIES COMPONENT
───────────────────────────────────────────────────────────── */
const BnbProperties = () => {
  const [properties, setProperties] = useState<Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    location: string;
    address: string;
    type: string;
    property_type: 'rental' | 'bnb';
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    images: string[];
    owner_id: number;
    status: 'available' | 'occupied' | 'maintenance';
    created_at: string;
    updated_at: string;
    average_rating?: number;
    reviews_count?: number;
    bnb_details?: {
      max_guests: number;
      min_stay: number;
      instant_book: boolean;
      cancellation_policy: string;
      house_rules: string[];
      check_in_time: string;
      check_out_time: string;
      cleaning_fee: number;
      service_fee: number;
      security_deposit: number;
      weekly_discount: number;
      monthly_discount: number;
      amenities_bnb: {
        wifi: boolean;
        kitchen: boolean;
        parking: boolean;
        pool: boolean;
        gym: boolean;
        ac: boolean;
        heating: boolean;
        workspace: boolean;
        tv: boolean;
        washer: boolean;
      };
      location_highlights: string[];
      safety_items: string[];
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProperty, setSelectedProperty] = useState<{
    id: number;
    title: string;
    description: string;
    price: number;
    location: string;
    address: string;
    type: string;
    property_type: 'rental' | 'bnb';
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    images: string[];
    owner_id: number;
    status: 'available' | 'occupied' | 'maintenance';
    created_at: string;
    updated_at: string;
    average_rating?: number;
    reviews_count?: number;
    bnb_details?: {
      max_guests: number;
      min_stay: number;
      instant_book: boolean;
      cancellation_policy: string;
      house_rules: string[];
      check_in_time: string;
      check_out_time: string;
      cleaning_fee: number;
      service_fee: number;
      security_deposit: number;
      weekly_discount: number;
      monthly_discount: number;
      amenities_bnb: {
        wifi: boolean;
        kitchen: boolean;
        parking: boolean;
        pool: boolean;
        gym: boolean;
        ac: boolean;
        heating: boolean;
        workspace: boolean;
        tv: boolean;
        washer: boolean;
      };
      location_highlights: string[];
      safety_items: string[];
    };
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const response = await Api.getBnbProperties(filters);
      setProperties(response.data || []);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return t.green;
      case 'occupied': return t.red;
      case 'maintenance': return t.orange;
      default: return t.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle size={16} />;
      case 'occupied': return <XCircle size={16} />;
      case 'maintenance': return <AlertCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi size={16} />;
      case 'parking': return <Car size={16} />;
      case 'pool': return <Home size={16} />;
      case 'gym': return <Dumbbell size={16} />;
      case 'kitchen': return <Utensils size={16} />;
      case 'workspace': return <Monitor size={16} />;
      case 'tv': return <Tv size={16} />;
      case 'washer': return <Shirt size={16} />;
      case 'ac': return <Wind size={16} />;
      default: return <Star size={16} />;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedProperties = [...properties].sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (aValue < bValue) return -1 * modifier;
    if (aValue > bValue) return 1 * modifier;
    return 0;
  });

  const filteredProperties = sortedProperties.filter((property: any) => {
    const matchesSearch = !searchTerm || 
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (property: any) => {
    setSelectedProperty(property);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Title', 'Location', 'Price', 'Bedrooms', 'Bathrooms', 'Max Guests', 'Status', 'Rating', 'Created'],
      ...filteredProperties.map((p: any) => [
        p.id,
        p.title,
        p.location,
        p.price,
        p.bedrooms,
        p.bathrooms,
        p.bnb_details?.max_guests || 2,
        p.status,
        p.average_rating || 'N/A',
        p.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bnb-properties-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px',
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
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>
            BNB Properties
          </h1>
          <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>
            Manage your Airbnb property listings
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ ...button, backgroundColor: t.gold, color: t.dark }}
          >
            <Plus size={16} />
            Add Property
          </button>
          <button
            onClick={handleExport}
            style={{ ...button, backgroundColor: `${t.green}20`, color: t.green }}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={loadProperties}
            style={{ ...button, backgroundColor: `${t.blue}20`, color: t.blue }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: t.muted 
              }} />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...body,
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  backgroundColor: t.dark3,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  color: t.cream,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: t.dark3,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              color: t.cream,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {filteredProperties.length === 0 ? (
          <div style={{ 
            ...card, 
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px'
          }}>
            <Home size={48} style={{ color: t.muted, marginBottom: 16 }} />
            <div style={{ ...serif, fontSize: 20, color: t.cream, marginBottom: 8 }}>
              No properties found
            </div>
            <div style={{ ...body, color: t.muted, marginBottom: 24 }}>
              Start by adding your first Airbnb property
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ ...button, backgroundColor: t.gold, color: t.dark }}
            >
              <Plus size={16} />
              Add Your First Property
            </button>
          </div>
        ) : (
          filteredProperties.map((property: any) => (
            <div key={property.id} style={card}>
              {/* Property Image */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                {property.images?.[0] ? (
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 8,
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
                    backgroundColor: t.dark3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px dashed ${t.border}`
                  }}>
                    <ImageIcon size={48} style={{ color: t.muted }} />
                  </div>
                )}
                
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  backgroundColor: `${getStatusColor(property.status)}20`,
                  borderRadius: 20,
                  color: getStatusColor(property.status),
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  {getStatusIcon(property.status)}
                  {property.status}
                </div>

                {/* Rating Badge */}
                {property.average_rating && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 20,
                    color: t.gold,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    <Star size={12} fill={t.gold} />
                    {property.average_rating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.cream, margin: '0 0 8px' }}>
                  {property.title}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <MapPin size={14} style={{ color: t.muted }} />
                  <span style={{ ...body, fontSize: 14, color: t.muted }}>
                    {property.location}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Bed size={14} style={{ color: t.muted }} />
                    <span style={{ ...body, fontSize: 14, color: t.cream }}>
                      {property.bedrooms} beds
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Bath size={14} style={{ color: t.muted }} />
                    <span style={{ ...body, fontSize: 14, color: t.cream }}>
                      {property.bathrooms} baths
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} style={{ color: t.muted }} />
                    <span style={{ ...body, fontSize: 14, color: t.cream }}>
                      {property.bnb_details?.max_guests || 2} guests
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                {property.bnb_details?.amenities_bnb && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {Object.entries(property.bnb_details.amenities_bnb)
                      .filter(([_, enabled]) => enabled)
                      .slice(0, 4)
                      .map(([amenity]) => (
                        <div key={amenity} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          backgroundColor: `${t.gold}20`,
                          borderRadius: 4,
                          fontSize: 12,
                          color: t.gold
                        }}>
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </div>
                      ))}
                  </div>
                )}

                {/* Description */}
                <p style={{ 
                  ...body, 
                  fontSize: 14, 
                  color: t.muted, 
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {property.description}
                </p>
              </div>

              {/* Price and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.gold }}>
                    {formatCurrency(property.price)}
                  </div>
                  <div style={{ ...body, fontSize: 12, color: t.muted }}>
                    per night
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleViewDetails(property)}
                    style={{
                      ...button,
                      padding: '8px',
                      backgroundColor: `${t.blue}20`,
                      color: t.blue,
                      borderRadius: 6,
                    }}
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    style={{
                      ...button,
                      padding: '8px',
                      backgroundColor: `${t.gold}20`,
                      color: t.gold,
                      borderRadius: 6,
                    }}
                    title="Edit Property"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Property Details Modal */}
      {showDetails && selectedProperty && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{ ...card, maxWidth: 800, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream, margin: 0 }}>
                {selectedProperty.title}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: t.muted,
                  cursor: 'pointer',
                }}
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Property Images */}
            {selectedProperty.images && selectedProperty.images.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {selectedProperty.images.map((image: string, index: number) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`${selectedProperty.title} ${index + 1}`}
                      style={{
                        width: '100%',
                        height: 150,
                        borderRadius: 8,
                        objectFit: 'cover'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Property Info */}
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Property Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Location</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedProperty.location}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Price</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {formatCurrency(selectedProperty.price)}/night
                    </div>
                  </div>
                  <div>
                    <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: getStatusColor(selectedProperty.status) }}>
                      {getStatusIcon(selectedProperty.status)}
                      {selectedProperty.status}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Capacity
                </h3>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bed size={16} style={{ color: t.muted }} />
                    <span style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedProperty.bedrooms} bedrooms
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bath size={16} style={{ color: t.muted }} />
                    <span style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedProperty.bathrooms} bathrooms
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} style={{ color: t.muted }} />
                    <span style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedProperty.bnb_details?.max_guests || 2} guests max
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Amenities
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedProperty.bnb_details?.amenities_bnb && Object.entries(selectedProperty.bnb_details.amenities_bnb)
                    .filter(([_, enabled]) => enabled)
                    .map(([amenity]) => (
                      <div key={amenity} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        backgroundColor: `${t.gold}20`,
                        borderRadius: 8,
                        color: t.gold
                      }}>
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Description
                </h3>
                <p style={{ ...body, fontSize: 14, color: t.cream, lineHeight: 1.6 }}>
                  {selectedProperty.description}
                </p>
              </div>

              {selectedProperty.bnb_details && (
                <div>
                  <h3 style={{ ...serif, fontSize: 18, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                    BNB Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Minimum Stay</div>
                      <div style={{ ...body, fontSize: 14, color: t.cream }}>
                        {selectedProperty.bnb_details.min_stay || 1} nights
                      </div>
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Check-in</div>
                      <div style={{ ...body, fontSize: 14, color: t.cream }}>
                        {selectedProperty.bnb_details.check_in_time || '3:00 PM'}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Check-out</div>
                      <div style={{ ...body, fontSize: 14, color: t.cream }}>
                        {selectedProperty.bnb_details.check_out_time || '11:00 AM'}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 4 }}>Instant Book</div>
                      <div style={{ ...body, fontSize: 14, color: t.cream }}>
                        {selectedProperty.bnb_details.instant_book ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BnbProperties;
