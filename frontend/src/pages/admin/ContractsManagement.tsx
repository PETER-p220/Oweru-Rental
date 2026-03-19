import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Plus, Edit, Trash2, Eye, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, CheckCircle, X, AlertTriangle, Clock, User, Home, CreditCard, Banknote, Receipt, ArrowUpDown, Grid, List, BarChart3, PieChart, Activity, Users, Building, Shield, Bell, Settings, Link2, Smartphone, Wallet, DollarSign, PenTool, Stamp, Signature, Send, Archive } from 'lucide-react';
import Api from '../../services/api';

interface Contract {
  id: number;
  reference: string;
  type: 'rental' | 'sale' | 'commission' | 'service' | 'maintenance';
  status: 'draft' | 'pending' | 'active' | 'expired' | 'terminated' | 'cancelled';
  title: string;
  description: string;
  parties: {
    landlord?: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    tenant?: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    agent?: {
      id: number;
      name: string;
      email: string;
      phone: string;
      commissionRate: number;
    };
  };
  property: {
    id: number;
    title: string;
    address: string;
    type: string;
    area: number;
    bedrooms: number;
    bathrooms: number;
  };
  terms: {
    startDate: string;
    endDate: string;
    rentAmount: number;
    depositAmount: number;
    paymentFrequency: 'monthly' | 'quarterly' | 'annually';
    currency: string;
    lateFee: number;
    earlyTerminationFee: number;
  };
  documents: {
    contractFile: string;
    signedBy: string[];
    uploadedAt: string;
    fileSize: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
    version: number;
    renewalCount: number;
    terminationReason?: string;
  };
}

interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  type: 'rental' | 'sale' | 'commission' | 'service' | 'maintenance';
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  pendingContracts: number;
  totalValue: number;
  avgContractValue: number;
  contractsThisMonth: number;
  expiringThisMonth: number;
  renewalRate: number;
  terminationRate: number;
}

const ContractsManagement = () => {
  const [activeTab, setActiveTab] = useState<'contracts' | 'templates' | 'analytics'>('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'created' | 'startDate' | 'endDate' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadContractData();
  }, [activeTab]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockContracts: Contract[] = [
        {
          id: 1,
          reference: 'CON-2024-001',
          type: 'rental',
          status: 'active',
          title: 'Modern 3-Bedroom Villa Rental Agreement',
          description: 'Annual rental agreement for luxury villa in Masaki',
          parties: {
            landlord: {
              id: 1,
              name: 'John Smith',
              email: 'john.smith@example.com',
              phone: '+255 712 345 678'
            },
            tenant: {
              id: 2,
              name: 'Sarah Williams',
              email: 'sarah.williams@example.com',
              phone: '+255 723 456 789'
            },
            agent: {
              id: 3,
              name: 'Michael Johnson',
              email: 'michael.johnson@oweru.com',
              phone: '+255 714 567 890',
              commissionRate: 5
            }
          },
          property: {
            id: 1,
            title: 'Modern 3-Bedroom Villa in Masaki',
            address: 'Masaki, Dar es Salaam, Tanzania',
            type: 'villa',
            area: 350,
            bedrooms: 3,
            bathrooms: 2
          },
          terms: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T00:00:00Z',
            rentAmount: 2500000,
            depositAmount: 2500000,
            paymentFrequency: 'monthly',
            currency: 'TZS',
            lateFee: 50000,
            earlyTerminationFee: 2500000
          },
          documents: {
            contractFile: '/contracts/CON-2024-001.pdf',
            signedBy: ['John Smith', 'Sarah Williams', 'Michael Johnson'],
            uploadedAt: '2024-01-01T00:00:00Z',
            fileSize: 1048576
          },
          metadata: {
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            createdBy: 'Admin',
            lastModifiedBy: 'Admin',
            version: 1,
            renewalCount: 0
          }
        },
        {
          id: 2,
          reference: 'CON-2024-002',
          type: 'rental',
          status: 'pending',
          title: 'Cozy 2-Bedroom Apartment Rental Agreement',
          description: '6-month rental agreement for apartment in Kinondoni',
          parties: {
            landlord: {
              id: 4,
              name: 'Jane Doe',
              email: 'jane.doe@example.com',
              phone: '+255 734 567 890'
            },
            tenant: {
              id: 5,
              name: 'Mike Student',
              email: 'mike.student@example.com',
              phone: '+255 745 678 901'
            }
          },
          property: {
            id: 2,
            title: 'Cozy 2-Bedroom Apartment in Kinondoni',
            address: 'Kinondoni, Dar es Salaam, Tanzania',
            type: 'apartment',
            area: 120,
            bedrooms: 2,
            bathrooms: 1
          },
          terms: {
            startDate: '2024-04-01T00:00:00Z',
            endDate: '2024-09-30T00:00:00Z',
            rentAmount: 800000,
            depositAmount: 800000,
            paymentFrequency: 'monthly',
            currency: 'TZS',
            lateFee: 20000,
            earlyTerminationFee: 800000
          },
          documents: {
            contractFile: '/contracts/CON-2024-002.pdf',
            signedBy: ['Jane Doe'],
            uploadedAt: '2024-03-15T00:00:00Z',
            fileSize: 524288
          },
          metadata: {
            createdAt: '2024-03-15T00:00:00Z',
            updatedAt: '2024-03-15T00:00:00Z',
            createdBy: 'Admin',
            lastModifiedBy: 'Admin',
            version: 1,
            renewalCount: 0
          }
        },
        {
          id: 3,
          reference: 'CON-2024-003',
          type: 'commission',
          status: 'active',
          title: 'Agent Commission Agreement',
          description: 'Commission agreement for property agent services',
          parties: {
            agent: {
              id: 3,
              name: 'Michael Johnson',
              email: 'michael.johnson@oweru.com',
              phone: '+255 714 567 890',
              commissionRate: 5
            }
          },
          property: {
            id: 3,
            title: 'Commercial Office Space in City Center',
            address: 'City Center, Dar es Salaam, Tanzania',
            type: 'commercial',
            area: 200,
            bedrooms: 0,
            bathrooms: 2
          },
          terms: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T00:00:00Z',
            rentAmount: 1500000,
            depositAmount: 0,
            paymentFrequency: 'monthly',
            currency: 'TZS',
            lateFee: 0,
            earlyTerminationFee: 0
          },
          documents: {
            contractFile: '/contracts/CON-2024-003.pdf',
            signedBy: ['Michael Johnson', 'Admin'],
            uploadedAt: '2024-01-01T00:00:00Z',
            fileSize: 786432
          },
          metadata: {
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            createdBy: 'Admin',
            lastModifiedBy: 'Admin',
            version: 1,
            renewalCount: 0
          }
        }
      ];

      const mockTemplates: ContractTemplate[] = [
        {
          id: 1,
          name: 'Standard Rental Agreement',
          description: 'Comprehensive rental agreement template for residential properties',
          type: 'rental',
          content: 'This rental agreement is made between...',
          variables: ['{{landlord_name}}', '{{tenant_name}}', '{{property_address}}', '{{rent_amount}}', '{{deposit_amount}}', '{{start_date}}', '{{end_date}}'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Commission Agreement',
          description: 'Agent commission agreement template',
          type: 'commission',
          content: 'This commission agreement is made between...',
          variables: ['{{agent_name}}', '{{commission_rate}}', '{{property_address}}', '{{start_date}}', '{{end_date}}'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Service Agreement',
          description: 'Property management service agreement template',
          type: 'service',
          content: 'This service agreement is made between...',
          variables: ['{{client_name}}', '{{service_provider}}', '{{service_description}}', '{{service_fee}}', '{{start_date}}', '{{end_date}}'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const mockStats: ContractStats = {
        totalContracts: 3,
        activeContracts: 2,
        expiredContracts: 0,
        pendingContracts: 1,
        totalValue: 4800000,
        avgContractValue: 1600000,
        contractsThisMonth: 1,
        expiringThisMonth: 0,
        renewalRate: 85.5,
        terminationRate: 5.2
      };
      
      setContracts(mockContracts);
      setTemplates(mockTemplates);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [contractsRes, templatesRes, statsRes] = await Promise.all([
      //   Api.getContracts(),
      //   Api.getContractTemplates(),
      //   Api.getContractStats()
      // ]);
      // 
      // if (contractsRes.data) setContracts(contractsRes.data);
      // if (templatesRes.data) setTemplates(templatesRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load contract data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContract = async (contractId: number) => {
    try {
      setLoading(true);
      
      // Mock approval
      setContracts(contracts.map(c => 
        c.id === contractId ? { ...c, status: 'active' as const } : c
      ));
      
      // Uncomment when API is ready:
      // await Api.approveContract(contractId);
      
      setLoading(false);
    } catch (e) {
      console.error('Failed to approve contract:', e);
      setLoading(false);
    }
  };

  const handleTerminateContract = async (contractId: number, reason: string) => {
    if (!confirm('Are you sure you want to terminate this contract?')) return;
    
    try {
      setLoading(true);
      
      // Mock termination
      setContracts(contracts.map(c => 
        c.id === contractId ? { 
          ...c, 
          status: 'terminated' as const,
          metadata: { ...c.metadata, terminationReason: reason }
        } : c
      ));
      
      // Uncomment when API is ready:
      // await Api.terminateContract(contractId, reason);
      
      setLoading(false);
    } catch (e) {
      console.error('Failed to terminate contract:', e);
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'draft': return '#6b7280';
      case 'expired': return '#ef4444';
      case 'terminated': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'rental': return '#10b981';
      case 'sale': return '#3b82f6';
      case 'commission': return '#8b5cf6';
      case 'service': return '#f59e0b';
      case 'maintenance': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading contract data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FileText size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Contracts Management
          </h1>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage rental agreements, contracts, and legal documents
        </p>
      </div>

      {/* Contract Stats */}
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
              {stats.totalContracts}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Contracts
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
              {stats.activeContracts}
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
              {stats.pendingContracts}
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
              {fmt(stats.totalValue)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Value
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(stats.avgContractValue)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Value
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
              {stats.renewalRate}%
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Renewal Rate
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '24px',
        display: 'flex',
        gap: '4px'
      }}>
        {['contracts', 'templates', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#c9a84c' : 'transparent',
              border: activeTab === tab ? '1px solid #c9a84c' : '1px solid rgba(201, 168, 76, 0.12)',
              color: activeTab === tab ? '#080808' : '#7a7060',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
              Contracts List
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => setShowCreateContractModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#c9a84c',
                  color: '#080808',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Create Contract
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {contracts
              .filter(contract => statusFilter === 'all' || contract.status === statusFilter)
              .map((contract) => (
              <div key={contract.id} style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 168, 76, 0.06)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: `${getStatusColor(contract.status)}15`,
                  border: `1px solid ${getStatusColor(contract.status)}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={24} style={{ color: getStatusColor(contract.status) }} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
                        {contract.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} />
                          {contract.reference}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Home size={14} />
                          {contract.property.title}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                        {fmt(contract.terms.rentAmount)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: `${getStatusColor(contract.status)}15`,
                          border: `1px solid ${getStatusColor(contract.status)}30`,
                          color: getStatusColor(contract.status),
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {contract.status}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: `${getTypeColor(contract.type)}15`,
                          border: `1px solid ${getTypeColor(contract.type)}30`,
                          color: getTypeColor(contract.type),
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {contract.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {formatDate(contract.terms.startDate)} - {formatDate(contract.terms.endDate)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} />
                      {contract.parties.landlord?.name} & {contract.parties.tenant?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Receipt size={14} />
                      {contract.terms.paymentFrequency}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={14} />
                      {formatFileSize(contract.documents.fileSize)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: '500'
                    }}>
                      Signed by {contract.documents.signedBy.length} parties
                    </span>
                    {contract.parties.agent && (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#8b5cf6',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: '500'
                      }}>
                        Agent: {contract.parties.agent.name} ({contract.parties.agent.commissionRate}%)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => setSelectedContract(contract)}
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
                      <Eye size={14} />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        const downloadUrl = contract.documents.contractFile;
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = `contract-${contract.reference}.pdf`;
                        link.click();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#3b82f6',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={14} />
                      Download
                    </button>
                    {contract.status === 'pending' && (
                      <button
                        onClick={() => handleApproveContract(contract.id)}
                        style={{
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
                        }}
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                    )}
                    {contract.status === 'active' && (
                      <button
                        onClick={() => handleTerminateContract(contract.id, 'Mutual agreement')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          borderRadius: '4px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                        Terminate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
              Contract Templates
            </h3>
            <button
              onClick={() => setShowTemplateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#c9a84c',
                color: '#080808',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {templates.map((template) => (
              <div key={template.id} style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(201, 168, 76, 0.06)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: template.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    border: template.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={24} style={{ color: template.isActive ? '#10b981' : '#6b7280' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
                      {template.name}
                    </h4>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: template.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      border: template.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
                      color: template.isActive ? '#10b981' : '#6b7280',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: '500'
                    }}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <p style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {template.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: `${getTypeColor(template.type)}15`,
                    border: `1px solid ${getTypeColor(template.type)}30`,
                    color: getTypeColor(template.type),
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {template.type}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(201, 168, 76, 0.15)',
                    border: '1px solid rgba(201, 168, 76, 0.2)',
                    color: '#c9a84c',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: '500'
                  }}>
                    {template.variables.length} variables
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
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
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      borderRadius: '4px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: '0 0 24px' }}>
            Contract Analytics
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(201, 168, 76, 0.06)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 16px' }}>
                Contract Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        Renewal Rate
                      </span>
                      <span style={{ color: '#10b981', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {stats.renewalRate}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        Termination Rate
                      </span>
                      <span style={{ color: '#ef4444', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {stats.terminationRate}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        Contracts This Month
                      </span>
                      <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {stats.contractsThisMonth}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(201, 168, 76, 0.06)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 16px' }}>
                Contract Types
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['rental', 'sale', 'commission', 'service'].map((type) => {
                  const count = contracts.filter(c => c.type === type).length;
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                      <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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

export default ContractsManagement;
