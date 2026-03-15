import { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, TrendingUp, Calendar, Building, Users, Eye, CheckCircle, Clock, AlertCircle, BarChart3, Download, FileText, Receipt, Star, Target, Award, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import Api from '../../services/api';

interface Commission {
  id: number;
  agentId: number;
  agentName: string;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  ownerId: number;
  ownerName: string;
  type: 'percentage' | 'fixed';
  amount: number;
  salePrice: number;
  commissionRate?: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  createdDate: string;
  approvedDate?: string;
  paidDate?: string;
  paymentMethod?: {
    type: 'bank_transfer' | 'mobile_money' | 'cash' | 'check';
    details: string;
  };
  transactionId?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  notes?: string;
  contractId?: number;
  contractType: 'rental' | 'sale';
  property: {
    id: number;
    title: string;
    location: string;
    price: number;
    type: string;
    status: string;
  };
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
  };
}

interface CommissionStats {
  total: number;
  pending: number;
  approved: number;
  paid: number;
  cancelled: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  avgCommission: number;
  thisMonth: number;
  lastMonth: number;
  topProperties: Array<{
    propertyId: number;
    title: string;
    commissions: number;
    totalAmount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    commissions: number;
    amount: number;
  }>;
}

const MyCommissions = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdDate');

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockCommissions: Commission[] = [
        {
          id: 1,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 1,
          propertyTitle: 'Modern 3-Bedroom Penthouse',
          propertyLocation: 'Masaki, Dar es Salaam',
          ownerId: 1,
          ownerName: 'John Doe',
          type: 'percentage',
          amount: 5,
          salePrice: 2500000,
          commissionRate: 5,
          commissionAmount: 125000,
          status: 'paid',
          createdDate: '2024-03-01T10:30:00Z',
          approvedDate: '2024-03-02T14:15:00Z',
          paidDate: '2024-03-03T09:30:00Z',
          paymentMethod: {
            type: 'bank_transfer',
            details: 'CRDB Bank - **** **** **** 1234'
          },
          transactionId: 'TXN-2024-03-001',
          invoiceUrl: '/invoices/commission-1.pdf',
          receiptUrl: '/receipts/commission-1.pdf',
          notes: 'Commission for successful rental of penthouse property',
          contractId: 1,
          contractType: 'rental',
          property: {
            id: 1,
            title: 'Modern 3-Bedroom Penthouse',
            location: 'Masaki, Dar es Salaam',
            price: 2500000,
            type: 'penthouse',
            status: 'rented'
          },
          owner: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+255123456789',
            company: 'Premium Properties Ltd'
          }
        },
        {
          id: 2,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 2,
          propertyTitle: 'Cozy 1-Bedroom Apartment',
          propertyLocation: 'Mikocheni B, Dar es Salaam',
          ownerId: 2,
          ownerName: 'Jane Smith',
          type: 'fixed',
          amount: 50000,
          salePrice: 450000,
          commissionAmount: 50000,
          status: 'approved',
          createdDate: '2024-03-10T09:15:00Z',
          approvedDate: '2024-03-12T16:30:00Z',
          paymentMethod: {
            type: 'mobile_money',
            details: 'M-Pesa - **** **** **** 5678'
          },
          transactionId: 'TXN-2024-03-002',
          invoiceUrl: '/invoices/commission-2.pdf',
          notes: 'Fixed commission for apartment rental',
          contractId: 2,
          contractType: 'rental',
          property: {
            id: 2,
            title: 'Cozy 1-Bedroom Apartment',
            location: 'Mikocheni B, Dar es Salaam',
            price: 450000,
            type: 'apartment',
            status: 'rented'
          },
          owner: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '+255987654321',
            company: 'QuickRent Properties'
          }
        },
        {
          id: 3,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 3,
          propertyTitle: 'Spacious Family Home',
          propertyLocation: 'Upanga, Dar es Salaam',
          ownerId: 3,
          ownerName: 'Michael Brown',
          type: 'percentage',
          amount: 4,
          salePrice: 1800000,
          commissionRate: 4,
          commissionAmount: 72000,
          status: 'pending',
          createdDate: '2024-03-15T14:20:00Z',
          notes: 'Commission for family home rental',
          contractId: 3,
          contractType: 'rental',
          property: {
            id: 3,
            title: 'Spacious Family Home',
            location: 'Upanga, Dar es Salaam',
            price: 1800000,
            type: 'house',
            status: 'active'
          },
          owner: {
            id: 3,
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael@example.com',
            phone: '+255555666777',
            company: 'Family Homes Ltd'
          }
        },
        {
          id: 4,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 4,
          propertyTitle: 'Luxury Executive Villa',
          propertyLocation: 'Oyster Bay, Dar es Salaam',
          ownerId: 4,
          ownerName: 'Robert Williams',
          type: 'percentage',
          amount: 6,
          salePrice: 4500000,
          commissionRate: 6,
          commissionAmount: 270000,
          status: 'cancelled',
          createdDate: '2024-02-20T16:45:00Z',
          notes: 'Commission cancelled due to contract termination',
          contractId: 4,
          contractType: 'sale',
          property: {
            id: 4,
            title: 'Luxury Executive Villa',
            location: 'Oyster Bay, Dar es Salaam',
            price: 4500000,
            type: 'villa',
            status: 'sold'
          },
          owner: {
            id: 4,
            firstName: 'Robert',
            lastName: 'Williams',
            email: 'robert@example.com',
            phone: '+255777888999',
            company: 'Luxury Estates'
          }
        },
        {
          id: 5,
          agentId: 1,
          agentName: 'John Agent',
          propertyId: 5,
          propertyTitle: 'Modern Studio with City View',
          propertyLocation: 'Msasani, Dar es Salaam',
          ownerId: 5,
          ownerName: 'Sarah Johnson',
          type: 'fixed',
          amount: 40000,
          salePrice: 380000,
          commissionAmount: 40000,
          status: 'paid',
          createdDate: '2024-02-15T11:20:00Z',
          approvedDate: '2024-02-16T10:45:00Z',
          paidDate: '2024-02-17T13:30:00Z',
          paymentMethod: {
            type: 'cash',
            details: 'Cash payment received'
          },
          transactionId: 'TXN-2024-02-005',
          invoiceUrl: '/invoices/commission-5.pdf',
          receiptUrl: '/receipts/commission-5.pdf',
          notes: 'Fixed commission for studio sale',
          contractId: 5,
          contractType: 'sale',
          property: {
            id: 5,
            title: 'Modern Studio with City View',
            location: 'Msasani, Dar es Salaam',
            price: 380000,
            type: 'studio',
            status: 'sold'
          },
          owner: {
            id: 5,
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@example.com',
            phone: '+255444555666',
            company: 'City Living Properties'
          }
        }
      ];

      const mockStats: CommissionStats = {
        total: 5,
        pending: 1,
        approved: 1,
        paid: 2,
        cancelled: 1,
        totalAmount: 517000,
        pendingAmount: 72000,
        approvedAmount: 50000,
        paidAmount: 165000,
        avgCommission: 103400,
        thisMonth: 245000,
        lastMonth: 185000,
        topProperties: [
          { propertyId: 4, title: 'Luxury Executive Villa', commissions: 1, totalAmount: 270000 },
          { propertyId: 1, title: 'Modern 3-Bedroom Penthouse', commissions: 1, totalAmount: 125000 },
          { propertyId: 3, title: 'Spacious Family Home', commissions: 1, totalAmount: 72000 }
        ],
        monthlyTrend: [
          { month: 'Jan', commissions: 3, amount: 185000 },
          { month: 'Feb', commissions: 4, amount: 245000 },
          { month: 'Mar', commissions: 5, amount: 517000 }
        ]
      };
      
      setCommissions(mockCommissions);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [commissionsRes, statsRes] = await Promise.all([
      //   Api.getCommissions(),
      //   Api.getCommissionStats()
      // ]);
      // 
      // if (commissionsRes.data) setCommissions(commissionsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load commissions:', e);
      setError('Failed to load commissions');
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
      case 'approved': return '#3b82f6';
      case 'paid': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'paid': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredAndSortedCommissions = commissions
    .filter(commission => {
      const matchesSearch = commission.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           commission.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           commission.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           commission.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
      const matchesType = typeFilter === 'all' || commission.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdDate':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'amount':
          return b.commissionAmount - a.commissionAmount;
        case 'status':
          const statusOrder = { pending: 0, approved: 1, paid: 2, cancelled: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading commissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <DollarSign size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            My Commissions
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
              {stats.total} commissions
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Track your commission earnings and payment status
        </p>
      </div>

      {/* Commission Stats */}
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
              Total Commissions
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

      {/* Monthly Trend */}
      {stats && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', marginBottom: '16px' }}>
            Monthly Trend
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                This Month:
              </div>
              <div style={{ color: '#c9a84c', fontSize: '18px', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                {fmt(stats.thisMonth)}
              </div>
              {stats.thisMonth > stats.lastMonth && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                  <ArrowUp size={16} />
                  <span style={{ fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                    {Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)}%
                  </span>
                </div>
              )}
              {stats.thisMonth < stats.lastMonth && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                  <ArrowDown size={16} />
                  <span style={{ fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                    {Math.round(((stats.lastMonth - stats.thisMonth) / stats.lastMonth) * 100)}%
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                Last Month:
              </div>
              <div style={{ color: '#7a7060', fontSize: '18px', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                {fmt(stats.lastMonth)}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {stats.monthlyTrend.map((month) => (
              <div key={month.month} style={{
                backgroundColor: 'rgba(201, 168, 76, 0.03)',
                border: '1px solid rgba(201, 168, 76, 0.08)',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                  {month.month}
                </div>
                <div style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                  {fmt(month.amount)}
                </div>
                <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                  {month.commissions} commissions
                </div>
              </div>
            ))}
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
              placeholder="Search commissions..."
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
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
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
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
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
            <option value="status">Status</option>
            <option value="property">Property Name</option>
          </select>
        </div>
      </div>

      {/* Commissions List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Commissions List
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredAndSortedCommissions.length} commissions
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedCommissions.map((commission) => {
            const StatusIcon = getStatusIcon(commission.status);
            
            return (
              <div
                key={commission.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(201, 168, 76, 0.06)',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  {/* Commission Icon */}
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
                    <DollarSign size={24} style={{ color: '#c9a84c' }} />
                  </div>

                  {/* Commission Details */}
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
                          {commission.propertyTitle}
                        </h4>
                        <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                          {commission.propertyLocation}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: `${getStatusColor(commission.status)}15`,
                            border: `1px solid ${getStatusColor(commission.status)}30`,
                            color: getStatusColor(commission.status),
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
                            {commission.status}
                          </div>
                          <div style={{ color: '#c9a84c', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {fmt(commission.commissionAmount)}
                          </div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            {commission.type === 'percentage' ? `${commission.commissionRate}%` : fmt(commission.amount)}
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
                            {fmt(commission.salePrice)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Commission Earned
                          </div>
                          <div style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                            {fmt(commission.commissionAmount)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Owner
                          </div>
                          <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {commission.ownerName}
                          </div>
                          {commission.owner.company && (
                            <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                              {commission.owner.company}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                            Contract Type
                          </div>
                          <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            {commission.contractType}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {commission.paymentMethod && (
                      <div style={{
                        backgroundColor: 'rgba(201, 168, 76, 0.03)',
                        border: '1px solid rgba(201, 168, 76, 0.08)',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                          Payment Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                          <div>
                            <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                              Payment Method
                            </div>
                            <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                              {commission.paymentMethod.details}
                            </div>
                          </div>
                          {commission.transactionId && (
                            <div>
                              <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                                Transaction ID
                              </div>
                              <div style={{ color: '#38bdf8', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                                {commission.transactionId}
                              </div>
                            </div>
                          )}
                          {commission.notes && (
                            <div>
                              <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                                Notes
                              </div>
                              <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                                {commission.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                      {commission.invoiceUrl && (
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
                      {commission.receiptUrl && (
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
                          <Receipt size={14} />
                          Download Receipt
                        </button>
                      )}
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(201, 168, 76, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: '#7a7060' }} />
                        <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                          Created: {formatDate(commission.createdDate)}
                        </span>
                      </div>
                      {commission.approvedDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={12} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            Approved: {formatDate(commission.approvedDate)}
                          </span>
                        </div>
                      )}
                      {commission.paidDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={12} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            Paid: {formatDate(commission.paidDate)}
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

        {filteredAndSortedCommissions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <DollarSign size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No commissions found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or wait for new commissions to be generated
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

export default MyCommissions;
