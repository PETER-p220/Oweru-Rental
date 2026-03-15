import { useState, useEffect } from 'react';
import { Share2, Link2, Search, Filter, Eye, Copy, CheckCircle, TrendingUp, Calendar, Users, Building, DollarSign, BarChart3, Download, Mail, MessageSquare, Facebook, Twitter, Linkedin } from 'lucide-react';
import Api from '../../services/api';

interface TrackingLink {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  link: string;
  shortLink: string;
  clicks: number;
  uniqueClicks: number;
  shares: number;
  leads: number;
  conversions: number;
  createdDate: string;
  lastClicked: string;
  status: 'active' | 'inactive' | 'expired';
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    type: string;
    status: string;
  };
  campaign: {
    name: string;
    source: string;
    medium: string;
  };
}

interface TrackingStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  totalClicks: number;
  totalShares: number;
  totalLeads: number;
  totalConversions: number;
  avgConversionRate: number;
  topPerforming: TrackingLink[];
}

const ShareAndTrack = () => {
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdDate');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    loadTrackingLinks();
  }, []);

  const loadTrackingLinks = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockTrackingLinks: TrackingLink[] = [
        {
          id: 1,
          propertyId: 1,
          propertyTitle: 'Modern 3-Bedroom Penthouse',
          propertyLocation: 'Masaki, Dar es Salaam',
          link: 'https://oweru.com/property/1?ref=agent123',
          shortLink: 'https://oweru.com/p/abc123',
          clicks: 892,
          uniqueClicks: 456,
          shares: 156,
          leads: 34,
          conversions: 3,
          createdDate: '2024-01-15',
          lastClicked: '2024-03-20',
          status: 'active',
          property: {
            id: 1,
            title: 'Modern 3-Bedroom Penthouse',
            location: 'Masaki, Dar es Salaam',
            price: 2500000,
            type: 'penthouse',
            status: 'active'
          },
          campaign: {
            name: 'Spring Campaign',
            source: 'facebook',
            medium: 'social_media'
          }
        },
        {
          id: 2,
          propertyId: 2,
          propertyTitle: 'Cozy 1-Bedroom Apartment',
          propertyLocation: 'Mikocheni B, Dar es Salaam',
          link: 'https://oweru.com/property/2?ref=agent456',
          shortLink: 'https://oweru.com/p/def456',
          clicks: 567,
          uniqueClicks: 234,
          shares: 89,
          leads: 23,
          conversions: 2,
          createdDate: '2024-02-20',
          lastClicked: '2024-03-18',
          status: 'active',
          property: {
            id: 2,
            title: 'Cozy 1-Bedroom Apartment',
            location: 'Mikocheni B, Dar es Salaam',
            price: 450000,
            type: 'apartment',
            status: 'active'
          },
          campaign: {
            name: 'Email Newsletter',
            source: 'email',
            medium: 'newsletter'
          }
        },
        {
          id: 3,
          propertyId: 3,
          propertyTitle: 'Spacious Family Home',
          propertyLocation: 'Upanga, Dar es Salaam',
          link: 'https://oweru.com/property/3?ref=agent789',
          shortLink: 'https://oweru.com/p/ghi789',
          clicks: 445,
          uniqueClicks: 189,
          shares: 67,
          leads: 18,
          conversions: 1,
          createdDate: '2024-03-01',
          lastClicked: '2024-03-19',
          status: 'active',
          property: {
            id: 3,
            title: 'Spacious Family Home',
            location: 'Upanga, Dar es Salaam',
            price: 1800000,
            type: 'house',
            status: 'active'
          },
          campaign: {
            name: 'Website Banner',
            source: 'website',
            medium: 'banner'
          }
        },
        {
          id: 4,
          propertyId: 4,
          propertyTitle: 'Luxury Executive Villa',
          propertyLocation: 'Oyster Bay, Dar es Salaam',
          link: 'https://oweru.com/property/4?ref=agent012',
          shortLink: 'https://oweru.com/p/jkl012',
          clicks: 1234,
          uniqueClicks: 567,
          shares: 234,
          leads: 67,
          conversions: 5,
          createdDate: '2023-12-01',
          lastClicked: '2024-03-17',
          status: 'expired',
          property: {
            id: 4,
            title: 'Luxury Executive Villa',
            location: 'Oyster Bay, Dar es Salaam',
            price: 4500000,
            type: 'villa',
            status: 'sold'
          },
          campaign: {
            name: 'Instagram Campaign',
            source: 'instagram',
            medium: 'social_media'
          }
        },
        {
          id: 5,
          propertyId: 5,
          propertyTitle: 'Modern Studio with City View',
          propertyLocation: 'Msasani, Dar es Salaam',
          link: 'https://oweru.com/property/5?ref=agent345',
          shortLink: 'https://oweru.com/p/mno345',
          clicks: 234,
          uniqueClicks: 123,
          shares: 45,
          leads: 8,
          conversions: 0,
          createdDate: '2024-03-10',
          lastClicked: '2024-03-16',
          status: 'inactive',
          property: {
            id: 5,
            title: 'Modern Studio with City View',
            location: 'Msasani, Dar es Salaam',
            price: 380000,
            type: 'studio',
            status: 'pending'
          },
          campaign: {
            name: 'Twitter Campaign',
            source: 'twitter',
            medium: 'social_media'
          }
        }
      ];

      const mockStats: TrackingStats = {
        total: 5,
        active: 3,
        inactive: 1,
        expired: 1,
        totalClicks: 3372,
        totalShares: 591,
        totalLeads: 150,
        totalConversions: 11,
        avgConversionRate: 7.3,
        topPerforming: mockTrackingLinks.sort((a, b) => b.conversions - a.conversions).slice(0, 3)
      };
      
      setTrackingLinks(mockTrackingLinks);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [linksRes, statsRes] = await Promise.all([
      //   Api.getTrackingLinks(),
      //   Api.getTrackingStats()
      // ]);
      // 
      // if (linksRes.data) setTrackingLinks(linksRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load tracking links:', e);
      setError('Failed to load tracking links');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const shareOnSocial = async (platform: string, link: string) => {
    try {
      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
      };
      
      if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      }
    } catch (e) {
      console.error('Failed to share on social:', e);
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
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredAndSortedLinks = trackingLinks
    .filter(link => {
      const matchesSearch = link.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.shortLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdDate':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'clicks':
          return b.clicks - a.clicks;
        case 'leads':
          return b.leads - a.leads;
        case 'conversions':
          return b.conversions - a.conversions;
        case 'property':
          return a.propertyTitle.localeCompare(b.propertyTitle);
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading tracking links...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Share2 size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Share & Track
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
              {stats.total} links
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Create and track sharing links for your property listings
        </p>
      </div>

      {/* Tracking Stats */}
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
              Total Links
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
            border: '1px solid rgba(56, 189, 248, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#38bdf8', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.totalClicks}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Clicks
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
              {stats.totalConversions}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conversions
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
              placeholder="Search tracking links..."
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
            <option value="expired">Expired</option>
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
            <option value="createdDate">Recently Created</option>
            <option value="clicks">Most Clicks</option>
            <option value="leads">Most Leads</option>
            <option value="conversions">Most Conversions</option>
            <option value="property">Property Name</option>
          </select>
        </div>
      </div>

      {/* Tracking Links List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Tracking Links
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredAndSortedLinks.length} links
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedLinks.map((link) => (
            <div
              key={link.id}
              style={{
                padding: '20px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 168, 76, 0.06)',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                {/* Link Icon */}
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
                  <Link2 size={24} style={{ color: '#c9a84c' }} />
                </div>

                {/* Link Details */}
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
                        {link.propertyTitle}
                      </h4>
                      <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                        {link.propertyLocation}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: `${getStatusColor(link.status)}15`,
                          border: `1px solid ${getStatusColor(link.status)}30`,
                          color: getStatusColor(link.status),
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {link.status}
                        </div>
                        <div style={{ color: '#c9a84c', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          {fmt(link.property.price)}
                        </div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          Campaign: {link.campaign.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Links */}
                  <div style={{
                    backgroundColor: 'rgba(201, 168, 76, 0.03)',
                    border: '1px solid rgba(201, 168, 76, 0.08)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                      Tracking Links
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', minWidth: '60px' }}>
                          Full URL:
                        </div>
                        <div style={{ 
                          flex: 1,
                          color: '#e8e4dc', 
                          fontSize: '12px', 
                          fontFamily: 'DM Sans, sans-serif',
                          wordBreak: 'break-all'
                        }}>
                          {link.link}
                        </div>
                        <button
                          onClick={() => copyToClipboard(link.link)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: copiedLink === link.link ? '#10b981' : 'rgba(201, 168, 76, 0.1)',
                            border: copiedLink === link.link ? '1px solid #10b981' : '1px solid rgba(201, 168, 76, 0.2)',
                            color: copiedLink === link.link ? '#ffffff' : '#c9a84c',
                            borderRadius: '4px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedLink === link.link ? <CheckCircle size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', minWidth: '60px' }}>
                          Short URL:
                        </div>
                        <div style={{ 
                          flex: 1,
                          color: '#38bdf8', 
                          fontSize: '12px', 
                          fontFamily: 'DM Sans, sans-serif',
                          wordBreak: 'break-all'
                        }}>
                          {link.shortLink}
                        </div>
                        <button
                          onClick={() => copyToClipboard(link.shortLink)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: copiedLink === link.shortLink ? '#10b981' : 'rgba(56, 189, 248, 0.1)',
                            border: copiedLink === link.shortLink ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.2)',
                            color: copiedLink === link.shortLink ? '#ffffff' : '#38bdf8',
                            borderRadius: '4px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedLink === link.shortLink ? <CheckCircle size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div style={{
                    backgroundColor: 'rgba(201, 168, 76, 0.03)',
                    border: '1px solid rgba(201, 168, 76, 0.08)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Total Clicks
                        </div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {link.clicks}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Unique Clicks
                        </div>
                        <div style={{ color: '#38bdf8', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {link.uniqueClicks}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Shares
                        </div>
                        <div style={{ color: '#f59e0b', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {link.shares}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Leads
                        </div>
                        <div style={{ color: '#10b981', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {link.leads}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Conversions
                        </div>
                        <div style={{ color: '#ef4444', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {link.conversions}
                        </div>
                      </div>
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
                      <Eye size={14} />
                      View Analytics
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => shareOnSocial('facebook', link.shortLink)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Facebook size={14} />
                      </button>
                      <button
                        onClick={() => shareOnSocial('twitter', link.shortLink)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(29, 161, 242, 0.1)',
                          border: '1px solid rgba(29, 161, 242, 0.2)',
                          color: '#1da1f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Twitter size={14} />
                      </button>
                      <button
                        onClick={() => shareOnSocial('linkedin', link.shortLink)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 119, 181, 0.1)',
                          border: '1px solid rgba(0, 119, 181, 0.2)',
                          color: '#0077b5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Linkedin size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        Created: {formatDate(link.createdDate)}
                      </span>
                    </div>
                    {link.lastClicked && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={12} style={{ color: '#7a7060' }} />
                        <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          Last clicked: {formatDate(link.lastClicked)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedLinks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Share2 size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No tracking links found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
              Try adjusting your filters or create your first tracking link
            </p>
            <button style={{
              display: 'inline-flex',
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
            }}>
              <Link2 size={16} />
              Create Tracking Link
            </button>
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

export default ShareAndTrack;
