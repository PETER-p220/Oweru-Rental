import { useState, useEffect } from 'react';
import {
  Home, Calendar, DollarSign, Users, Star, TrendingUp, Bed, Bath, Wifi,
  Car, Dumbbell, Wind, Utensils, Monitor, Tv, Shirt, MapPin,
  Plus, Search, Filter, Eye, Edit, Trash2, BarChart3, PieChart,
  MessageSquare, Settings, Bell, ChevronRight, Clock, CheckCircle,
  AlertCircle, XCircle, Award, Heart, Share2, Download
} from 'lucide-react';
import Api from '../../services/api';

/* ─────────────────────────────────────────────────────────────
   BNB DASHBOARD STYLE TOKENS
───────────────────────────────────────────────────────────── */
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
   BNB DASHBOARD COMPONENT
───────────────────────────────────────────────────────────── */
const BnbDashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    averageRating: 0,
    activeListings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Array<{
    id: number;
    property_id: number;
    guest_id: number;
    check_in: string;
    check_out: string;
    total_price: number;
    status: string;
    created_at: string;
    property?: {
      id: number;
      title: string;
      location: string;
    };
    guest?: {
      id: number;
      name: string;
      email: string;
    };
  }>>([]);
  const [topProperties, setTopProperties] = useState<Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    location: string;
    images: string[];
    bedrooms: number;
    bathrooms: number;
    average_rating?: number;
    reviews_count?: number;
    bnb_details?: {
      max_guests: number;
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
    };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [analyticsResponse, bookingsResponse, propertiesResponse] = await Promise.all([
        Api.getBnbAnalytics(),
        Api.getBnbBookings(),
        Api.getBnbProperties(),
      ]);

      const analytics = analyticsResponse.data || {};
      const bookings = bookingsResponse.data || [];
      const properties = propertiesResponse.data || [];

      setStats({
        totalProperties: analytics.totalProperties || 0,
        totalBookings: analytics.totalBookings || 0,
        totalRevenue: analytics.totalRevenue || 0,
        occupancyRate: analytics.occupancyRate || 0,
        averageRating: analytics.averageRating || 0,
        activeListings: analytics.activeListings || 0,
      });

      setRecentBookings(bookings.slice(0, 5));
      setTopProperties(properties.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return t.green;
      case 'pending': return t.orange;
      case 'cancelled': return t.red;
      case 'completed': return t.blue;
      default: return t.muted;
    }
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      case 'completed': return <Award size={16} />;
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
            BNB Dashboard
          </h1>
          <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>
            Manage your Airbnb properties and bookings
          </p>
        </div>
        <button
          style={{ ...button, backgroundColor: t.gold, color: t.dark }}
        >
          <Plus size={16} />
          Add New Property
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.gold}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Home size={24} style={{ color: t.gold }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Properties</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {stats.totalProperties}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.blue}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Calendar size={24} style={{ color: t.blue }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Bookings</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {stats.totalBookings}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.green}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={24} style={{ color: t.green }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Revenue</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.purple}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={24} style={{ color: t.purple }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Occupancy Rate</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {stats.occupancyRate}%
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.orange}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Star size={24} style={{ color: t.orange }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Average Rating</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {stats.averageRating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.green}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={24} style={{ color: t.green }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Active Listings</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {stats.activeListings}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings & Top Properties */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Bookings */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.cream, margin: 0 }}>
              Recent Bookings
            </h2>
            <button style={{ ...button, backgroundColor: `${t.gold}20`, color: t.gold }}>
              View All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recentBookings.length === 0 ? (
              <div style={{ ...body, textAlign: 'center', color: t.muted, padding: '40px' }}>
                No recent bookings
              </div>
            ) : (
              recentBookings.map((booking: any) => (
                <div key={booking.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: t.dark3,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${t.gold}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Calendar size={20} style={{ color: t.gold }} />
                    </div>
                    <div>
                      <div style={{ ...body, fontWeight: 500, color: t.cream, marginBottom: 4 }}>
                        {booking.property?.title || 'Property'}
                      </div>
                      <div style={{ ...body, fontSize: 12, color: t.muted }}>
                        {booking.guest?.name} • {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ ...body, fontWeight: 500, color: t.cream }}>
                        {formatCurrency(booking.total_price)}
                      </div>
                      <div style={{ 
                        ...body, 
                        fontSize: 12, 
                        color: getBookingStatusColor(booking.status),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {getBookingStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Properties */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.cream, margin: 0 }}>
              Top Properties
            </h2>
            <button style={{ ...button, backgroundColor: `${t.gold}20`, color: t.gold }}>
              View All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topProperties.length === 0 ? (
              <div style={{ ...body, textAlign: 'center', color: t.muted, padding: '40px' }}>
                No properties yet
              </div>
            ) : (
              topProperties.map((property: any) => (
                <div key={property.id} style={{ 
                  padding: '16px',
                  backgroundColor: t.dark3,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {property.images?.[0] && (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ ...body, fontWeight: 500, color: t.cream, marginBottom: 4 }}>
                        {property.title}
                      </div>
                      <div style={{ ...body, fontSize: 12, color: t.muted, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} />
                          {property.location}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bed size={12} />
                            {property.bedrooms} beds
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bath size={12} />
                            {property.bathrooms} baths
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={12} />
                            {property.bnb_details?.max_guests || 2} guests
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ ...body, fontWeight: 600, color: t.gold }}>
                      {formatCurrency(property.price)}/night
                    </div>
                    <div style={{ 
                      ...body, 
                      fontSize: 12, 
                      color: t.green,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Star size={12} />
                      {property.average_rating || '4.5'} ({property.reviews_count || 0})
                    </div>
                  </div>
                  
                  {property.bnb_details?.amenities_bnb && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
                            fontSize: 10,
                            color: t.gold
                          }}>
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BnbDashboard;
