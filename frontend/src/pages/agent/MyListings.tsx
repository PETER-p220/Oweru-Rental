import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Search, Filter, MapPin, Bed, Bath, Square, DollarSign, Eye, Edit, Trash2, Users, Calendar, TrendingUp, Star, MoreVertical, Home, QrCode, Share2, Link2, Receipt, BarChart3 } from 'lucide-react';
import Api from '../../services/api';

interface Listing {
  id: number;
  title: string;
  location: string;
  address: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  description: string;
  amenities: string[];
  status: 'active' | 'inactive' | 'pending' | 'sold';
  listedDate: string;
  views: number;
  inquiries: number;
  shares: number;
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
  };
  commission: {
    type: 'percentage' | 'fixed';
    amount: number;
    paid: boolean;
  };
  qrCode: string;
  trackingLink: string;
  featured: boolean;
}

interface ListingStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  sold: number;
  totalViews: number;
  totalInquiries: number;
  totalShares: number;
  avgCommission: number;
  pendingPayouts: number;
}

const MyListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('listedDate');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockListings: Listing[] = [
        {
          id: 1,
          title: 'Modern 3-Bedroom Penthouse',
          location: 'Masaki, Dar es Salaam',
          address: '786 Ocean View Drive, Masaki',
          price: 2500000,
          type: 'penthouse',
          bedrooms: 3,
          bathrooms: 2,
          area: 280,
          images: [],
          description: 'Luxurious penthouse with stunning ocean views, private terrace, and premium finishes throughout.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Gym', 'Pool', 'Terrace', 'Ocean View', 'Maid Room'],
          status: 'active',
          listedDate: '2024-01-15',
          views: 892,
          inquiries: 34,
          shares: 156,
          owner: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+255123456789',
            company: 'Premium Properties Ltd'
          },
          commission: {
            type: 'percentage',
            amount: 5,
            paid: false
          },
          qrCode: 'QR-123456789',
          trackingLink: 'https://oweru.com/track/123456789',
          featured: true
        },
        {
          id: 2,
          title: 'Cozy 1-Bedroom Apartment',
          location: 'Mikocheni B, Dar es Salaam',
          address: '234 Nyerere Road, Mikocheni B',
          price: 450000,
          type: 'apartment',
          bedrooms: 1,
          bathrooms: 1,
          area: 55,
          images: [],
          description: 'Perfect starter apartment in prime location. Close to shopping centers and public transport.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Kitchenette', 'Balcony'],
          status: 'active',
          listedDate: '2024-02-20',
          views: 567,
          inquiries: 23,
          shares: 89,
          owner: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '+255987654321',
            company: 'QuickRent Properties'
          },
          commission: {
            type: 'fixed',
            amount: 50000,
            paid: true
          },
          qrCode: 'QR-987654321',
          trackingLink: 'https://oweru.com/track/987654321',
          featured: false
        },
        {
          id: 3,
          title: 'Spacious Family Home',
          location: 'Upanga, Dar es Salaam',
          address: '567 Independence Avenue, Upanga',
          price: 1800000,
          type: 'house',
          bedrooms: 4,
          bathrooms: 3,
          area: 320,
          images: [],
          description: 'Beautiful family home with garden, perfect for families. Close to schools and amenities.',
          amenities: ['Garden', 'Parking', 'Security', 'Storage', 'Terrace', 'Play Area'],
          status: 'active',
          listedDate: '2024-03-01',
          views: 445,
          inquiries: 18,
          shares: 67,
          owner: {
            id: 3,
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael@example.com',
            phone: '+255555666777',
            company: 'Family Homes Ltd'
          },
          commission: {
            type: 'percentage',
            amount: 4,
            paid: false
          },
          qrCode: 'QR-555666777',
          trackingLink: 'https://oweru.com/track/555666777',
          featured: false
        },
        {
          id: 4,
          title: 'Luxury Executive Villa',
          location: 'Oyster Bay, Dar es Salaam',
          address: '890 Beach Road, Oyster Bay',
          price: 4500000,
          type: 'villa',
          bedrooms: 5,
          bathrooms: 4,
          area: 450,
          images: [],
          description: 'Ultra-luxury villa with private beach access, infinity pool, and world-class amenities.',
          amenities: ['Pool', 'Garden', 'Security', 'Parking', 'Gym', 'Maid Room', 'Beach Access', 'Ocean View', 'Home Theater'],
          status: 'sold',
          listedDate: '2023-12-01',
          views: 1234,
          inquiries: 67,
          shares: 234,
          owner: {
            id: 4,
            firstName: 'Robert',
            lastName: 'Williams',
            email: 'robert@example.com',
            phone: '+255777888999',
            company: 'Luxury Estates'
          },
          commission: {
            type: 'percentage',
            amount: 6,
            paid: true
          },
          qrCode: 'QR-777888999',
          trackingLink: 'https://oweru.com/track/777888999',
          featured: true
        },
        {
          id: 5,
          title: 'Modern Studio with City View',
          location: 'Msasani, Dar es Salaam',
          address: '123 Kimweri Avenue, Msasani',
          price: 380000,
          type: 'studio',
          bedrooms: 1,
          bathrooms: 1,
          area: 48,
          images: [],
          description: 'Modern studio with amazing city views. Perfect for young professionals.',
          amenities: ['Air Conditioning', 'Security', 'Parking', 'Balcony', 'City View'],
          status: 'pending',
          listedDate: '2024-03-10',
          views: 234,
          inquiries: 8,
          shares: 45,
          owner: {
            id: 5,
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@example.com',
            phone: '+255444555666',
            company: 'City Living Properties'
          },
          commission: {
            type: 'fixed',
            amount: 40000,
            paid: false
          },
          qrCode: 'QR-444555666',
          trackingLink: 'https://oweru.com/track/444555666',
          featured: false
        }
      ];

      const mockStats: ListingStats = {
        total: 5,
        active: 3,
        inactive: 0,
        pending: 1,
        sold: 1,
        totalViews: 3372,
        totalInquiries: 150,
        totalShares: 591,
        avgCommission: 4.8,
        pendingPayouts: 2
      };
      
      setListings(mockListings);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [listingsRes, statsRes] = await Promise.all([
      //   Api.getAgentListings(),
      //   Api.getListingStats()
      // ]);
      // 
      // if (listingsRes.data) setListings(listingsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load listings:', e);
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (listingId: number) => {
    try {
      // await Api.deleteListing(listingId);
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (e) {
      setError('Failed to delete listing');
    }
  };

  const generateQRCode = async (listingId: number) => {
    try {
      // await Api.generateQRCode(listingId);
      // Refresh listings to get new QR code
      loadListings();
    } catch (e) {
      setError('Failed to generate QR code');
    }
  };

  const shareListing = async (listingId: number) => {
    try {
      // await Api.shareListing(listingId);
      // Update share count
      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, shares: l.shares + 1 } : l
      ));
    } catch (e) {
      setError('Failed to share listing');
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
    'day': 'numeric' 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'pending': return '#f59e0b';
      case 'sold': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Home;
      case 'inactive': return Eye;
      case 'pending': return Calendar;
      case 'sold': return TrendingUp;
      default: return Home;
    }
  };

  const filteredAndSortedListings = listings
    .filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           listing.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
      const matchesType = typeFilter === 'all' || listing.type === typeFilter;
      
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
        case 'shares':
          return b.shares - a.shares;
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Building size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            My Listings
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
              {stats.total} listings
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage your property listings and track their performance
        </p>
      </div>

      {/* Listing Stats */}
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
              Total Listings
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
              {stats.pending}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending
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
              {stats.sold}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sold
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
              {fmt(stats.totalViews)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Views
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
              placeholder="Search listings..."
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
            <option value="sold">Sold</option>
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
            <option value="penthouse">Penthouse</option>
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
            <option value="shares">Most Shared</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {filteredAndSortedListings.map((listing) => {
          const StatusIcon = getStatusIcon(listing.status);
          
          return (
            <div
              key={listing.id}
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
                  backgroundColor: `${getStatusColor(listing.status)}15`,
                  border: `1px solid ${getStatusColor(listing.status)}30`,
                  color: getStatusColor(listing.status),
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <StatusIcon size={10} />
                  {listing.status}
                </div>

                {/* Featured Badge */}
                {listing.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#f59e0b15',
                    border: '1px solid #f59e0b30',
                    color: '#f59e0b',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <Star size={10} />
                    Featured
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: listing.featured ? '60px' : '12px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => generateQRCode(listing.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(56, 189, 248, 0.9)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <QrCode size={14} />
                  </button>
                  <button
                    onClick={() => shareListing(listing.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Share2 size={14} />
                  </button>
                  <button
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
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteListing(listing.id)}
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
                    {listing.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <MapPin size={14} style={{ color: '#7a7060' }} />
                    <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                      {listing.location}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Bed size={14} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.bedrooms}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Bath size={14} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.bathrooms}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Square size={14} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.area}m²
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
                    {listing.description}
                  </p>
                </div>

                {/* Owner & Commission Info */}
                <div style={{
                  backgroundColor: 'rgba(201, 168, 76, 0.03)',
                  border: '1px solid rgba(201, 168, 76, 0.08)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                        Owner
                      </div>
                      <div style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.owner.firstName} {listing.owner.lastName}
                      </div>
                      {listing.owner.company && (
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          {listing.owner.company}
                        </div>
                      )}
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: `${listing.commission.paid ? '#10b98115' : '#f59e0b15'}`,
                      border: `${listing.commission.paid ? '1px solid #10b98130' : '1px solid #f59e0b30'}`,
                      color: listing.commission.paid ? '#10b981' : '#f59e0b',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {listing.commission.type === 'percentage' ? `${listing.commission.amount}%` : fmt(listing.commission.amount)} - {listing.commission.paid ? 'Paid' : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Price and Stats */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(201, 168, 76, 0.12)' }}>
                  <div>
                    <div style={{ color: '#c9a84c', fontSize: '20px', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                      {fmt(listing.price)}
                    </div>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                      per month
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.views}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.inquiries}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Share2 size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.shares}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Listed Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                  <Calendar size={12} style={{ color: '#7a7060' }} />
                  <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                    Listed on {formatDate(listing.listedDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedListings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Building size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No listings found</h3>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
            Try adjusting your filters or add your first listing
          </p>
          <Link
            to="/dashboard/listings/add"
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
            Add Your First Listing
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

export default MyListings;
