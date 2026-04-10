import { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Eye, Edit, Trash2, Plus,
  Calendar, FileText, CheckCircle, XCircle, Clock,
  AlertCircle, TrendingUp, BarChart3, PieChart,
  RefreshCw, ChevronDown, ChevronUp, User, Building,
  DollarSign, BookOpen, ShieldCheck, Mail
} from 'lucide-react';
import Api from '../../services/api';

/* ─────────────────────────────────────────────────────────────
   CONTRACTS MANAGEMENT STYLE TOKENS
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
   CONTRACTS MANAGEMENT COMPONENT
───────────────────────────────────────────────────────────── */
const ContractsManagement = () => {
  const [contracts, setContracts] = useState<Array<{
    id: number;
    tenant_id: number;
    property_id: number;
    landlord_id: number;
    agent_id: number;
    start_date: string;
    end_date: string;
    rent_amount: number;
    deposit_amount: number;
    status: string;
    type: string;
    terms: string;
    tenant_signature: string;
    landlord_signature: string;
    agent_signature: string;
    created_at: string;
    updated_at: string;
    tenant?: { 
      name: string; 
      email: string;
      phone: string;
    };
    property?: { 
      title: string; 
      address: string;
      type: string;
      bedrooms: number;
      bathrooms: number;
    };
    landlord?: { 
      name: string; 
      email: string;
      phone: string;
    };
    agent?: { 
      name: string; 
      email: string;
      phone: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState<{
    id: number;
    tenant_id: number;
    property_id: number;
    landlord_id: number;
    agent_id: number;
    start_date: string;
    end_date: string;
    rent_amount: number;
    deposit_amount: number;
    status: string;
    type: string;
    terms: string;
    tenant_signature: string;
    landlord_signature: string;
    agent_signature: string;
    created_at: string;
    updated_at: string;
    tenant?: { 
      name: string; 
      email: string;
      phone: string;
    };
    property?: { 
      title: string; 
      address: string;
      type: string;
      bedrooms: number;
      bathrooms: number;
    };
    landlord?: { 
      name: string; 
      email: string;
      phone: string;
    };
    agent?: { 
      name: string; 
      email: string;
      phone: string;
    };
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadContracts();
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      
      const response = await Api.getAdminContracts();
      setContracts(response.data || []);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      setContracts([]);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return t.green;
      case 'pending': return t.orange;
      case 'expired': return t.red;
      case 'terminated': return t.muted;
      case 'draft': return t.blue;
      default: return t.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'expired': return <XCircle size={16} />;
      case 'terminated': return <XCircle size={16} />;
      case 'draft': return <FileText size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'residential': return <Building size={16} />;
      case 'commercial': return <Building size={16} />;
      case 'vacation': return <Building size={16} />;
      default: return <Building size={16} />;
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

  const sortedContracts = [...contracts].sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (aValue < bValue) return -1 * modifier;
    if (aValue > bValue) return 1 * modifier;
    return 0;
  });

  const filteredContracts = sortedContracts.filter((contract: any) => {
    const matchesSearch = !searchTerm || 
      contract.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (contract: any) => {
    setSelectedContract(contract);
    setShowDetails(true);
  };

  const handleExport = () => {
    // CSV export logic
    const csv = [
      ['ID', 'Tenant', 'Property', 'Landlord', 'Agent', 'Rent Amount', 'Status', 'Start Date', 'End Date'],
      ...filteredContracts.map((c: any) => [
        c.id,
        c.tenant?.name || 'N/A',
        c.property?.title || 'N/A',
        c.landlord?.name || 'N/A',
        c.agent?.name || 'N/A',
        c.rent_amount,
        c.status,
        c.start_date,
        c.end_date
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-${new Date().toISOString().split('T')[0]}.csv`;
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
            Contracts Management
          </h1>
          <p style={{ ...body, fontSize: 16, color: t.muted, margin: 0 }}>
            Manage and monitor all rental contracts
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExport}
            style={{ ...button, backgroundColor: `${t.green}20`, color: t.green }}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={loadContracts}
            style={{ ...button, backgroundColor: `${t.blue}20`, color: t.blue }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
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
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Active Contracts</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredContracts.filter((c: any) => c.status === 'active').length}
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
              <Clock size={24} style={{ color: t.orange }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Pending</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredContracts.filter((c: any) => c.status === 'pending').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.red}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <XCircle size={24} style={{ color: t.red }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Expired</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {filteredContracts.filter((c: any) => c.status === 'expired').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${t.gold}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={24} style={{ color: t.gold }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: t.muted, marginBottom: 4 }}>Total Monthly Rent</div>
              <div style={{ ...serif, fontSize: 24, fontWeight: 600, color: t.cream }}>
                {formatCurrency(
                  filteredContracts
                    .filter((c: any) => c.status === 'active')
                    .reduce((sum: number, c: any) => sum + (c.rent_amount || 0), 0)
                )}
              </div>
            </div>
          </div>
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
                placeholder="Search contracts..."
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
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            <option value="all">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="vacation">Vacation</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('id')}>
                  ID {sortBy === 'id' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Tenant</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Property</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Rent Amount</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Type</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Status</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('start_date')}>
                  Start Date {sortBy === 'start_date' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: t.muted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ 
                    ...body, 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: t.muted 
                  }}>
                    No contracts found
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract: any) => (
                  <tr key={contract.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      #{contract.id}
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div>
                        <div>{contract.tenant?.name || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>
                          {contract.tenant?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div>
                        <div>{contract.property?.title || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>
                          {contract.property?.address || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream, fontWeight: 600 }}>
                      {formatCurrency(contract.rent_amount)}
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getTypeIcon(contract.type)}
                        <span>{contract.type}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getStatusColor(contract.status)
                      }}>
                        {getStatusIcon(contract.status)}
                        <span>{contract.status}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: t.cream }}>
                      {formatDate(contract.start_date)}
                    </td>
                    <td style={{ ...body, padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleViewDetails(contract)}
                          style={{
                            ...button,
                            padding: '6px',
                            backgroundColor: `${t.blue}20`,
                            color: t.blue,
                            borderRadius: 6,
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Details Modal */}
      {showDetails && selectedContract && (
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
          <div style={{ ...card, maxWidth: 700, width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowDetails(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: t.muted,
                cursor: 'pointer',
              }}
            >
              <XCircle size={18} />
            </button>

            <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.cream, margin: '0 0 20px' }}>
              Contract Details
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Basic Information */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Contract ID:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>#{selectedContract.id}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Type:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedContract.type}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Status:</div>
                    <div style={{ 
                      ...body, 
                      fontSize: 14, 
                      color: getStatusColor(selectedContract.status),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {getStatusIcon(selectedContract.status)}
                      {selectedContract.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties Involved */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Parties Involved
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Tenant:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      <div>{selectedContract.tenant?.name || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.tenant?.email || 'N/A'}
                      </div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.tenant?.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Landlord:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      <div>{selectedContract.landlord?.name || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.landlord?.email || 'N/A'}
                      </div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.landlord?.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Agent:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      <div>{selectedContract.agent?.name || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.agent?.email || 'N/A'}
                      </div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.agent?.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Property Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Property:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      <div>{selectedContract.property?.title || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: t.muted }}>
                        {selectedContract.property?.address || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Property Type:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedContract.property?.type || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Financial Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Rent Amount:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream, fontWeight: 600 }}>
                      {formatCurrency(selectedContract.rent_amount)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Deposit Amount:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream, fontWeight: 600 }}>
                      {formatCurrency(selectedContract.deposit_amount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Period */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Contract Period
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Start Date:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {formatDate(selectedContract.start_date)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>End Date:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {formatDate(selectedContract.end_date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Signatures
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Tenant Signature:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedContract.tenant_signature ? (
                        <span style={{ color: t.green }}>✓ Signed</span>
                      ) : (
                        <span style={{ color: t.orange }}>⏳ Pending</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Landlord Signature:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedContract.landlord_signature ? (
                        <span style={{ color: t.green }}>✓ Signed</span>
                      ) : (
                        <span style={{ color: t.orange }}>⏳ Pending</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Agent Signature:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {selectedContract.agent_signature ? (
                        <span style={{ color: t.green }}>✓ Signed</span>
                      ) : (
                        <span style={{ color: t.orange }}>⏳ Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Terms & Conditions
                </h3>
                <div style={{ 
                  ...body, 
                  fontSize: 14, 
                  color: t.cream,
                  padding: 12,
                  backgroundColor: t.dark3,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`
                }}>
                  {selectedContract.terms || 'No terms specified'}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 style={{ ...serif, fontSize: 16, fontWeight: 600, color: t.gold, margin: '0 0 12px' }}>
                  Timestamps
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Created:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {formatDate(selectedContract.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: t.muted }}>Last Updated:</div>
                    <div style={{ ...body, fontSize: 14, color: t.cream }}>
                      {formatDate(selectedContract.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsManagement;
