import { useState, useEffect } from 'react';
import { Receipt, Search, Filter, Download, Eye, Calendar, DollarSign, TrendingUp, Users, Building, CheckCircle, Clock, AlertCircle, BarChart3, FileText } from 'lucide-react';
import Api from '../../services/api';

interface Payout {
  id: number;
  agentId: number;
  agentName: string;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  commissionType: 'percentage' | 'fixed';
  commissionAmount: number;
  salePrice: number;
  commissionEarned: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  createdDate: string;
  processedDate?: string;
  paidDate?: string;
  paymentMethod: {
    type: 'bank_transfer' | 'mobile_money' | 'cash' | 'check';
    details: string;
  };
  transactionId?: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  notes?: string;
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
  };
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    type: string;
    status: string;
  };
}

interface PayoutStats {
  total: number;
  pending: number;
  processing: number;
  paid: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  avgProcessingTime: number;
  monthlyEarnings: number;
}

const PayoutHistory = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdDate');

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockPayouts: Payout[] = [
        {
          id: 1,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 1,
          propertyTitle: 'Modern 3-Bedroom Penthouse',
          propertyLocation: 'Masaki, Dar es Salaam',
          commissionType: 'percentage',
          commissionAmount: 5,
          salePrice: 2500000,
          commissionEarned: 125000,
          status: 'paid',
          createdDate: '2024-03-01',
          processedDate: '2024-03-02',
          paidDate: '2024-03-03',
          paymentMethod: {
            type: 'bank_transfer',
            details: 'CRDB Bank - **** **** **** 1234'
          },
          transactionId: 'TXN-2024-03-001',
          receiptUrl: '/receipts/payout-1.pdf',
          invoiceUrl: '/invoices/payout-1.pdf',
          notes: 'Commission for successful sale of penthouse property',
          owner: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+255123456789',
            company: 'Premium Properties Ltd'
          },
          property: {
            id: 1,
            title: 'Modern 3-Bedroom Penthouse',
            location: 'Masaki, Dar es Salaam',
            price: 2500000,
            type: 'penthouse',
            status: 'sold'
          }
        },
        {
          id: 2,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 2,
          propertyTitle: 'Cozy 1-Bedroom Apartment',
          propertyLocation: 'Mikocheni B, Dar es Salaam',
          commissionType: 'fixed',
          commissionAmount: 50000,
          salePrice: 450000,
          commissionEarned: 50000,
          status: 'processing',
          createdDate: '2024-03-10',
          processedDate: '2024-03-12',
          paymentMethod: {
            type: 'mobile_money',
            details: 'M-Pesa - **** **** **** 5678'
          },
          transactionId: 'TXN-2024-03-002',
          receiptUrl: '/receipts/payout-2.pdf',
          invoiceUrl: '/invoices/payout-2.pdf',
          notes: 'Fixed commission for apartment rental',
          owner: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '+255987654321',
            company: 'QuickRent Properties'
          },
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
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 3,
          propertyTitle: 'Spacious Family Home',
          propertyLocation: 'Upanga, Dar es Salaam',
          commissionType: 'percentage',
          commissionAmount: 4,
          salePrice: 1800000,
          commissionEarned: 72000,
          status: 'pending',
          createdDate: '2024-03-15',
          paymentMethod: {
            type: 'check',
            details: 'Check #123456'
          },
          notes: 'Commission for family home sale',
          owner: {
            id: 3,
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael@example.com',
            phone: '+255555666777',
            company: 'Family Homes Ltd'
          },
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
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 4,
          propertyTitle: 'Luxury Executive Villa',
          propertyLocation: 'Oyster Bay, Dar es Salaam',
          commissionType: 'percentage',
          commissionAmount: 6,
          salePrice: 4500000,
          commissionEarned: 270000,
          status: 'failed',
          createdDate: '2024-02-20',
          processedDate: '2024-02-22',
          paymentMethod: {
            type: 'bank_transfer',
            details: 'NBC Bank - **** **** **** 9012'
          },
          transactionId: 'TXN-2024-02-004',
          notes: 'Payment failed due to incorrect bank details',
          owner: {
            id: 4,
            firstName: 'Robert',
            lastName: 'Williams',
            email: 'robert@example.com',
            phone: '+255777888999',
            company: 'Luxury Estates'
          },
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
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 5,
          propertyTitle: 'Modern Studio with City View',
          propertyLocation: 'Msasani, Dar es Salaam',
          commissionType: 'fixed',
          commissionAmount: 40000,
          salePrice: 380000,
          commissionEarned: 40000,
          status: 'paid',
          createdDate: '2024-02-15',
          processedDate: '2024-02-16',
          paidDate: '2024-02-17',
          paymentMethod: {
            type: 'cash',
            details: 'Cash payment received'
          },
          transactionId: 'TXN-2024-02-005',
          receiptUrl: '/receipts/payout-5.pdf',
          invoiceUrl: '/invoices/payout-5.pdf',
          notes: 'Fixed commission for studio sale',
          owner: {
            id: 5,
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@example.com',
            phone: '+255444555666',
            company: 'City Living Properties'
          },
          property: {
            id: 5,
            title: 'Modern Studio with City View',
            location: 'Msasani, Dar es Salaam',
            price: 380000,
            type: 'studio',
            status: 'sold'
          }
        }
      ];

      const mockStats: PayoutStats = {
        total: 5,
        pending: 1,
        processing: 1,
        paid: 2,
        failed: 1,
        totalAmount: 557000,
        pendingAmount: 122000,
        avgProcessingTime: 2.5,
        monthlyEarnings: 365000
      };
      
      setPayouts(mockPayouts);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [payoutsRes, statsRes] = await Promise.all([
      //   Api.getPayouts(),
      //   Api.getPayoutStats()
      // ]);
      // 
      // if (payoutsRes.data) setPayouts(payoutsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load payout history:', e);
      setError('Failed to load payout history');
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
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'paid': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return Eye;
      case 'paid': return CheckCircle;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredAndSortedPayouts = payouts
    .filter(payout => {
      const matchesSearch = payout.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payout.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payout.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payout.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payout.owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payout.owner.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
      
      const matchesMonth = monthFilter === 'all' || 
        (new Date(payout.createdDate).getMonth() === new Date().getMonth() && 
         new Date(payout.createdDate).getFullYear() === new Date().getFullYear());
      
      return matchesSearch && matchesStatus && matchesMonth;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdDate':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'amount':
          return b.commissionEarned - a.commissionEarned;
        case 'property':
          return a.propertyTitle.localeCompare(b.propertyTitle);
        case 'status':
          return a.status.localeCompare(b.status);
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading payout history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Receipt size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Payout History
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
              {stats.total} payouts
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Track your commission payouts and payment history
        </p>
      </div>

      {/* Payout Stats */}
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
              Total Payouts
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
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.paid}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paid
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
              {fmt(stats.totalAmount)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Earned
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
              placeholder="Search payouts..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
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
            <option value="all">All Time</option>
            <option value="current">This Month</option>
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
            <option value="amount">Highest Amount</option>
            <option value="property">Property Name</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Payouts List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Payout History
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredAndSortedPayouts.length} payouts
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedPayouts.map((payout) => {
            const StatusIcon = getStatusIcon(payout.status);
            
            return (
              <div
                key={payout.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(201, 168, 76, 0.06)',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  {/* Payout Icon */}
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
                    <Receipt size={24} style={{ color: '#c9a84c' }} />
                  </div>

                  {/* Payout Details */}
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
                          {payout.propertyTitle}
                        </h4>
                        <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                          {payout.propertyLocation}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: `${getStatusColor(payout.status)}15`,
                            border: `1px solid ${getStatusColor(payout.status)}30`,
                            color: getStatusColor(payout.status),
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <StatusIcon size={10} />
                            {payout.status}
                          </div>
                          <div style={{ color: '#c9a84c', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {fmt(payout.commissionEarned)}
                          </div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payout.commissionType === 'percentage' ? `${payout.commissionAmount}%` : fmt(payout.commissionAmount)} commission
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Commission Details */}
                    <div style={{
                      backgroundColor: 'rgba(201, 168, 76, 0.03)',
                      border: '1px solid rgba(201, 168, 76, 0.08)',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Sale Price
                          </div>
                          <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                            {fmt(payout.salePrice)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Commission Earned
                          </div>
                          <div style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                            {fmt(payout.commissionEarned)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Owner
                          </div>
                          <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payout.owner.firstName} {payout.owner.lastName}
                          </div>
                          {payout.owner.company && (
                            <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                              {payout.owner.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div style={{
                      backgroundColor: 'rgba(201, 168, 76, 0.03)',
                      border: '1px solid rgba(201, 168, 76, 0.08)',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Payment Method
                          </div>
                          <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payout.paymentMethod.details}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Transaction ID
                          </div>
                          <div style={{ color: '#38bdf8', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payout.transactionId || 'N/A'}
                          </div>
                        </div>
                        {payout.notes && (
                          <div>
                            <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                              Notes
                            </div>
                            <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                              {payout.notes}
                            </div>
                          </div>
                        )}
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
                        View Details
                      </button>
                      {payout.receiptUrl && (
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
                          <Download size={14} />
                          Download Receipt
                        </button>
                      )}
                      {payout.invoiceUrl && (
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
                          <FileText size={14} />
                          Download Invoice
                        </button>
                      )}
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: '#7a7060' }} />
                        <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          Created: {formatDate(payout.createdDate)}
                        </span>
                      </div>
                      {payout.paidDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={12} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            Paid: {formatDate(payout.paidDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSortedPayouts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Receipt size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No payouts found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or wait for new payouts to be processed
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

export default PayoutHistory;
