import { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Phone, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, Clock, MessageSquare, Eye, Building, TrendingUp, Home } from 'lucide-react';
import Api from '../../services/api';

interface Tenant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  currentProperty: {
    id: number;
    title: string;
    address: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
  };
  contract: {
    id: number;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    paymentDueDay: number;
    status: 'active' | 'expired' | 'terminating';
    lastPaymentDate?: string;
    nextPaymentDue?: string;
    lateFee: number;
  };
  paymentHistory: {
    totalPaid: number;
    totalPending: number;
    onTimePayments: number;
    latePayments: number;
    averagePaymentDelay: number;
  };
  documents: {
    idProof: string;
    contract: string;
    references: string[];
  };
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  notes?: string;
}

interface TenantStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  monthlyRevenue: number;
  avgTenancyDuration: number;
  pendingPayments: number;
  expiringContracts: number;
}

const MyTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('joinedDate');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockTenants: Tenant[] = [
        {
          id: 1,
          firstName: 'Peter',
          lastName: 'Mushy',
          email: 'mushyp420@gmail.com',
          phone: '0753511713',
          idNumber: '1234567890123',
          emergencyContact: {
            name: 'Jane Mushy',
            phone: '0753511714',
            relationship: 'Spouse'
          },
          currentProperty: {
            id: 1,
            title: 'Modern 2-Bedroom Apartment',
            address: '123 Kimweri Avenue, Masaki',
            type: 'apartment',
            bedrooms: 2,
            bathrooms: 2,
            area: 120
          },
          contract: {
            id: 1,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            monthlyRent: 800000,
            securityDeposit: 1600000,
            paymentDueDay: 1,
            status: 'active',
            lastPaymentDate: '2024-03-01',
            nextPaymentDue: '2024-04-01',
            lateFee: 50000
          },
          paymentHistory: {
            totalPaid: 2400000,
            totalPending: 800000,
            onTimePayments: 2,
            latePayments: 1,
            averagePaymentDelay: 2
          },
          documents: {
            idProof: 'id-proof-1.pdf',
            contract: 'contract-1.pdf',
            references: ['reference-1.pdf', 'reference-2.pdf']
          },
          status: 'active',
          joinedDate: '2024-01-01',
          notes: 'Excellent tenant, always pays on time. Very cooperative.'
        },
        {
          id: 2,
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          phone: '+255123456789',
          idNumber: '9876543210987',
          emergencyContact: {
            name: 'Bob Johnson',
            phone: '+255123456790',
            relationship: 'Brother'
          },
          currentProperty: {
            id: 2,
            title: 'Cozy Studio in Mikocheni',
            address: '456 Nyerere Road, Mikocheni',
            type: 'studio',
            bedrooms: 1,
            bathrooms: 1,
            area: 45
          },
          contract: {
            id: 2,
            startDate: '2024-02-15',
            endDate: '2025-02-14',
            monthlyRent: 350000,
            securityDeposit: 700000,
            paymentDueDay: 15,
            status: 'active',
            lastPaymentDate: '2024-03-15',
            nextPaymentDue: '2024-04-15',
            lateFee: 25000
          },
          paymentHistory: {
            totalPaid: 700000,
            totalPending: 350000,
            onTimePayments: 2,
            latePayments: 0,
            averagePaymentDelay: 0
          },
          documents: {
            idProof: 'id-proof-2.pdf',
            contract: 'contract-2.pdf',
            references: ['reference-3.pdf']
          },
          status: 'active',
          joinedDate: '2024-02-15',
          notes: 'Young professional, very clean and respectful.'
        },
        {
          id: 3,
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael@example.com',
          phone: '+255987654321',
          idNumber: '4567890123456',
          emergencyContact: {
            name: 'Sarah Brown',
            phone: '+255987654322',
            relationship: 'Wife'
          },
          currentProperty: {
            id: 3,
            title: 'Spacious House with Garden',
            address: '789 Independence Avenue, Upanga',
            type: 'house',
            bedrooms: 3,
            bathrooms: 2,
            area: 200
          },
          contract: {
            id: 3,
            startDate: '2023-06-01',
            endDate: '2024-05-31',
            monthlyRent: 1500000,
            securityDeposit: 3000000,
            paymentDueDay: 1,
            status: 'terminating',
            lastPaymentDate: '2024-03-01',
            nextPaymentDue: '2024-04-01',
            lateFee: 75000
          },
          paymentHistory: {
            totalPaid: 18000000,
            totalPending: 1500000,
            onTimePayments: 9,
            latePayments: 1,
            averagePaymentDelay: 1
          },
          documents: {
            idProof: 'id-proof-3.pdf',
            contract: 'contract-3.pdf',
            references: ['reference-4.pdf', 'reference-5.pdf']
          },
          status: 'active',
          joinedDate: '2023-06-01',
          notes: 'Family tenant, moving out at end of contract. Very reliable.'
        },
        {
          id: 4,
          firstName: 'Sarah',
          lastName: 'Williams',
          email: 'sarah@example.com',
          phone: '+255555666777',
          idNumber: '7890123456789',
          emergencyContact: {
            name: 'David Williams',
            phone: '+255555666778',
            relationship: 'Husband'
          },
          currentProperty: {
            id: 4,
            title: 'Executive Villa, Oyster Bay',
            address: '321 Ocean View Drive, Oyster Bay',
            type: 'villa',
            bedrooms: 4,
            bathrooms: 3,
            area: 340
          },
          contract: {
            id: 4,
            startDate: '2024-03-01',
            endDate: '2026-02-28',
            monthlyRent: 3200000,
            securityDeposit: 6400000,
            paymentDueDay: 1,
            status: 'active',
            lastPaymentDate: '2024-03-01',
            nextPaymentDue: '2024-04-01',
            lateFee: 100000
          },
          paymentHistory: {
            totalPaid: 3200000,
            totalPending: 3200000,
            onTimePayments: 1,
            latePayments: 0,
            averagePaymentDelay: 0
          },
          documents: {
            idProof: 'id-proof-4.pdf',
            contract: 'contract-4.pdf',
            references: ['reference-6.pdf', 'reference-7.pdf']
          },
          status: 'active',
          joinedDate: '2024-03-01',
          notes: 'High-end tenant, executive professional. Excellent references.'
        }
      ];

      const mockStats: TenantStats = {
        total: 4,
        active: 4,
        pending: 0,
        inactive: 0,
        monthlyRevenue: 5350000,
        avgTenancyDuration: 8.5,
        pendingPayments: 2,
        expiringContracts: 1
      };
      
      setTenants(mockTenants);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [tenantsRes, statsRes] = await Promise.all([
      //   Api.getLandlordTenants(),
      //   Api.getTenantStats()
      // ]);
      // 
      // if (tenantsRes.data) setTenants(tenantsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load tenants:', e);
      setError('Failed to load tenants');
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

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'expired': return '#ef4444';
      case 'terminating': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPaymentStatusColor = (pending: number, total: number) => {
    if (pending === 0) return '#10b981';
    if (pending > 0 && pending < total) return '#f59e0b';
    return '#ef4444';
  };

  const filteredAndSortedTenants = tenants
    .filter(tenant => {
      const matchesSearch = tenant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.currentProperty.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'joinedDate':
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        case 'name':
          return a.firstName.localeCompare(b.firstName);
        case 'rent':
          return b.contract.monthlyRent - a.contract.monthlyRent;
        case 'property':
          return a.currentProperty.title.localeCompare(b.currentProperty.title);
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Users size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            My Tenants
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
              {stats.total} tenants
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage your tenants and track rental performance
        </p>
      </div>

      {/* Tenant Stats */}
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
              Total Tenants
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
              {fmt(stats.monthlyRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly Revenue
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
              {stats.pendingPayments}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Payments
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
              placeholder="Search tenants..."
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
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
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
            <option value="joinedDate">Recently Joined</option>
            <option value="name">Name</option>
            <option value="rent">Rent Amount</option>
            <option value="property">Property</option>
          </select>
        </div>
      </div>

      {/* Tenants List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Tenants List
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredAndSortedTenants.length} tenants
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedTenants.map((tenant) => (
            <div
              key={tenant.id}
              style={{
                padding: '20px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 168, 76, 0.06)',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                {/* Tenant Avatar */}
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
                  <Users size={24} style={{ color: '#c9a84c' }} />
                </div>

                {/* Tenant Details */}
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
                        {tenant.firstName} {tenant.lastName}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {tenant.email}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} style={{ color: '#7a7060' }} />
                          <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {tenant.phone}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={14} style={{ color: '#7a7060' }} />
                        <span style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          {tenant.currentProperty.title}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: `${getContractStatusColor(tenant.contract.status)}15`,
                        border: `1px solid ${getContractStatusColor(tenant.contract.status)}30`,
                        color: getContractStatusColor(tenant.contract.status),
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {tenant.contract.status}
                      </div>
                    </div>
                  </div>

                  {/* Contract Details */}
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
                          Monthly Rent
                        </div>
                        <div style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {fmt(tenant.contract.monthlyRent)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Contract Period
                        </div>
                        <div style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          {formatDate(tenant.contract.startDate)} - {formatDate(tenant.contract.endDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Payment Status
                        </div>
                        <div style={{ 
                          color: getPaymentStatusColor(tenant.paymentHistory.totalPending, tenant.contract.monthlyRent), 
                          fontSize: '13px', 
                          fontFamily: 'DM Sans, sans-serif' 
                        }}>
                          {tenant.paymentHistory.totalPending > 0 ? `${tenant.paymentHistory.totalPending} pending` : 'Up to date'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                          Payment History
                        </div>
                        <div style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                          {tenant.paymentHistory.onTimePayments}/{tenant.paymentHistory.onTimePayments + tenant.paymentHistory.latePayments} on time
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
                      <FileText size={14} />
                      View Contract
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
                      <MessageSquare size={14} />
                      Send Message
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
                      Payment History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedTenants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No tenants found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or add properties to start attracting tenants
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

export default MyTenants;
