import { useState, useEffect } from 'react';
import { QrCode, Search, Download, Share2, Eye, Copy, CheckCircle, AlertCircle, Building, Plus, Filter, Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';
import Api from '../../services/api';

interface QRCodeData {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  qrCode: string;
  trackingLink: string;
  scans: number;
  uniqueScans: number;
  shares: number;
  leads: number;
  conversions: number;
  createdDate: string;
  lastScanned: string;
  status: 'active' | 'inactive' | 'expired';
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    type: string;
    status: string;
  }; 
}

interface QRCodeStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  totalScans: number;
  totalLeads: number;
  totalConversions: number;
  avgConversionRate: number;
  topPerforming: QRCodeData[];
}

const QRCodes = () => {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [stats, setStats] = useState<QRCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdDate');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockQRCodes: QRCodeData[] = [
        {
          id: 1,
          propertyId: 1,
          propertyTitle: 'Modern 3-Bedroom Penthouse',
          propertyLocation: 'Masaki, Dar es Salaam',
          qrCode: 'QR-123456789',
          trackingLink: 'https://oweru.com/track/123456789',
          scans: 892,
          uniqueScans: 456,
          shares: 156,
          leads: 34,
          conversions: 3,
          createdDate: '2024-01-15',
          lastScanned: '2024-03-20',
          status: 'active',
          property: {
            id: 1,
            title: 'Modern 3-Bedroom Penthouse',
            location: 'Masaki, Dar es Salaam',
            price: 2500000,
            type: 'penthouse',
            status: 'active'
          }
        },
        {
          id: 2,
          propertyId: 2,
          propertyTitle: 'Cozy 1-Bedroom Apartment',
          propertyLocation: 'Mikocheni B, Dar es Salaam',
          qrCode: 'QR-987654321',
          trackingLink: 'https://oweru.com/track/987654321',
          scans: 567,
          uniqueScans: 234,
          shares: 89,
          leads: 23,
          conversions: 2,
          createdDate: '2024-02-20',
          lastScanned: '2024-03-18',
          status: 'active',
          property: {
            id: 2,
            title: 'Cozy 1-Bedroom Apartment',
            location: 'Mikocheni B, Dar es Salaam',
            price: 450000,
            type: 'apartment',
            status: 'active'
          }
        },
        {
          id: 3,
          propertyId: 3,
          propertyTitle: 'Spacious Family Home',
          propertyLocation: 'Upanga, Dar es Salaam',
          qrCode: 'QR-555666777',
          trackingLink: 'https://oweru.com/track/555666777',
          scans: 445,
          uniqueScans: 189,
          shares: 67,
          leads: 18,
          conversions: 1,
          createdDate: '2024-03-01',
          lastScanned: '2024-03-19',
          status: 'active',
          property: {
            id: 3,
            title: 'Spacious Family Home',
            location: 'Upanga, Dar es Salaam',
            price: 1800000,
            type: 'house',
            status: 'active'
          }
        },
        {
          id: 4,
          propertyId: 4,
          propertyTitle: 'Luxury Executive Villa',
          propertyLocation: 'Oyster Bay, Dar es Salaam',
          qrCode: 'QR-777888999',
          trackingLink: 'https://oweru.com/track/777888999',
          scans: 1234,
          uniqueScans: 567,
          shares: 234,
          leads: 67,
          conversions: 5,
          createdDate: '2023-12-01',
          lastScanned: '2024-03-17',
          status: 'expired',
          property: {
            id: 4,
            title: 'Luxury Executive Villa',
            location: 'Oyster Bay, Dar es Salaam',
            price: 4500000,
            type: 'villa',
            status: 'sold'
          }
        },
        {
          id: 5,
          propertyId: 5,
          propertyTitle: 'Modern Studio with City View',
          propertyLocation: 'Msasani, Dar es Salaam',
          qrCode: 'QR-444555666',
          trackingLink: 'https://oweru.com/track/444555666',
          scans: 234,
          uniqueScans: 123,
          shares: 45,
          leads: 8,
          conversions: 0,
          createdDate: '2024-03-10',
          lastScanned: '2024-03-16',
          status: 'inactive',
          property: {
            id: 5,
            title: 'Modern Studio with City View',
            location: 'Msasani, Dar es Salaam',
            price: 380000,
            type: 'studio',
            status: 'pending'
          }
        }
      ];

      const mockStats: QRCodeStats = {
        total: 5,
        active: 3,
        inactive: 1,
        expired: 1,
        totalScans: 3372,
        totalLeads: 150,
        totalConversions: 11,
        avgConversionRate: 7.3,
        topPerforming: mockQRCodes.sort((a, b) => b.conversions - a.conversions).slice(0, 3)
      };
      
      setQRCodes(mockQRCodes);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [qrCodesRes, statsRes] = await Promise.all([
      //   Api.getQRCodes(),
      //   Api.getQRCodeStats()
      // ]);
      // 
      // if (qrCodesRes.data) setQRCodes(qrCodesRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load QR codes:', e);
      setError('Failed to load QR codes');
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

  const downloadQRCode = async (qrCodeId: number) => {
    try {
      // await Api.downloadQRCode(qrCodeId);
      console.log('Downloading QR code:', qrCodeId);
    } catch (e) {
      console.error('Failed to download QR code:', e);
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

  const filteredAndSortedQRCodes = qrCodes
    .filter(qrCode => {
      const matchesSearch = qrCode.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           qrCode.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           qrCode.trackingLink.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || qrCode.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdDate':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'scans':
          return b.scans - a.scans;
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <QrCode size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            QR Codes
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
              {stats.total} QR codes
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Generate and track QR codes for your property listings
        </p>
      </div>

      {/* QR Code Stats */}
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
              Total QR Codes
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
              {stats.totalScans}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Scans
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
              placeholder="Search QR codes..."
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
            <option value="scans">Most Scans</option>
            <option value="leads">Most Leads</option>
            <option value="conversions">Most Conversions</option>
            <option value="property">Property Name</option>
          </select>
        </div>
      </div>

      {/* QR Codes List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            QR Codes List
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredAndSortedQRCodes.length} QR codes
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedQRCodes.map((qrCode) => (
            <div
              key={qrCode.id}
              style={{
                padding: '20px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 168, 76, 0.06)',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                {/* QR Code Visual */}
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '8px',
                  backgroundColor: 'rgba(201, 168, 76, 0.1)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <QrCode size={32} style={{ color: '#c9a84c' }} />
                </div>

                {/* QR Code Details */}
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
                        {qrCode.propertyTitle}
                      </h4>
                      <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                        {qrCode.propertyLocation}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: `${getStatusColor(qrCode.status)}15`,
                          border: `1px solid ${getStatusColor(qrCode.status)}30`,
                          color: getStatusColor(qrCode.status),
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {qrCode.status}
                        </div>
                        <div style={{ color: '#c9a84c', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          {fmt(qrCode.property.price)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Link */}
                  <div style={{
                    backgroundColor: 'rgba(201, 168, 76, 0.03)',
                    border: '1px solid rgba(201, 168, 76, 0.08)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                      Tracking Link
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        flex: 1,
                        color: '#e8e4dc', 
                        fontSize: '13px', 
                        fontFamily: 'DM Sans, sans-serif',
                        wordBreak: 'break-all'
                      }}>
                        {qrCode.trackingLink}
                      </div>
                      <button
                        onClick={() => copyToClipboard(qrCode.trackingLink)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: copiedLink === qrCode.trackingLink ? '#10b981' : 'rgba(201, 168, 76, 0.1)',
                          border: copiedLink === qrCode.trackingLink ? '1px solid #10b981' : '1px solid rgba(201, 168, 76, 0.2)',
                          color: copiedLink === qrCode.trackingLink ? '#ffffff' : '#c9a84c',
                          borderRadius: '4px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {copiedLink === qrCode.trackingLink ? (
                          <>
                            <CheckCircle size={12} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
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
                          Total Scans
                        </div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {qrCode.scans}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Unique Scans
                        </div>
                        <div style={{ color: '#38bdf8', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {qrCode.uniqueScans}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Leads
                        </div>
                        <div style={{ color: '#f59e0b', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {qrCode.leads}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Conversions
                        </div>
                        <div style={{ color: '#10b981', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {qrCode.conversions}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => downloadQRCode(qrCode.id)}
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
                      <Download size={14} />
                      Download QR
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
                      <Share2 size={14} />
                      Share
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

                  {/* Dates */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                        Created: {formatDate(qrCode.createdDate)}
                      </span>
                    </div>
                    {qrCode.lastScanned && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={12} style={{ color: '#7a7060' }} />
                        <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          Last scanned: {formatDate(qrCode.lastScanned)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedQRCodes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <QrCode size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No QR codes found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
              Try adjusting your filters or generate your first QR code
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
              <Plus size={16} />
              Generate QR Code
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

export default QRCodes;
