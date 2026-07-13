import { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Eye, Edit, Trash2, Plus,
  Calendar, DollarSign, CreditCard, CheckCircle, XCircle,
  Clock, AlertCircle, TrendingUp, BarChart3, PieChart,
  RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss,
  btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle,
} from './adminTheme';

/* ─────────────────────────────────────────────────────────────
   PAYMENTS MANAGEMENT COMPONENT
───────────────────────────────────────────────────────────── */
const PaymentsManagement = () => {
  const [payments, setPayments] = useState<Array<{
    id: number;
    tenant_id: number;
    property_id: number;
    amount: number;
    type: string;
    status: string;
    method: string;
    transaction_id: string;
    due_date: string;
    paid_date: string | null;
    created_at: string;
    updated_at: string;
    tenant?: { 
      name: string; 
      email: string;
    };
    property?: { 
      title: string; 
      address: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<{
    id: number;
    tenant_id: number;
    property_id: number;
    amount: number;
    type: string;
    status: string;
    method: string;
    transaction_id: string;
    due_date: string;
    paid_date: string | null;
    created_at: string;
    updated_at: string;
    tenant?: { 
      name: string; 
      email: string;
    };
    property?: { 
      title: string; 
      address: string;
    };
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadPayments();
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;

      const response = await Api.getAdminPayments(filters);
      setPayments(response.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setPayments([]);
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
      case 'completed': return C.green;
      case 'pending': return C.amber;
      case 'failed': return C.red;
      case 'cancelled': return C.textMuted;
      default: return C.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rent': return <DollarSign size={16} />;
      case 'deposit': return <CreditCard size={16} />;
      case 'fee': return <AlertCircle size={16} />;
      default: return <DollarSign size={16} />;
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

  const sortedPayments = [...payments].sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (aValue < bValue) return -1 * modifier;
    if (aValue > bValue) return 1 * modifier;
    return 0;
  });

  const filteredPayments = sortedPayments.filter((payment: any) => {
    const matchesSearch = !searchTerm || 
      payment.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleExport = () => {
    // CSV export logic
    const csv = [
      ['ID', 'Tenant', 'Property', 'Amount', 'Type', 'Status', 'Due Date', 'Paid Date'],
      ...filteredPayments.map((p: any) => [
        p.id,
        p.tenant?.name || 'N/A',
        p.property?.title || 'N/A',
        p.amount,
        p.type,
        p.status,
        p.due_date,
        p.paid_date || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
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
        backgroundColor: C.cardBg,
        borderRadius: 12,
        border: `1px solid ${C.border}`
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${C.border}`,
          borderTop: `3px solid ${C.gold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}</style>
      <div style={pageInner}>
      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, color: '#fff' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · Payments</div>
            <h1 style={{ ...body, fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
              Payments Management
            </h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight, margin: 0 }}>
              Manage and monitor all payment transactions
            </p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleExport} style={{ ...btnGhost, backgroundColor: C.greenBg, color: C.green, borderColor: `${C.green}30` }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={loadPayments} style={{ ...btnGhost, backgroundColor: C.blueBg, color: C.blue, borderColor: `${C.blue}30` }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-row" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.green}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={24} style={{ color: C.green }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Total Revenue</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {formatCurrency(filteredPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0))}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.blue}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={24} style={{ color: C.blue }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Completed</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredPayments.filter((p: any) => p.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.amber}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={24} style={{ color: C.amber }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Pending</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredPayments.filter((p: any) => p.status === 'pending').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.red}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <XCircle size={24} style={{ color: C.red }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Failed</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredPayments.filter((p: any) => p.status === 'failed').length}
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
                color: C.textMuted 
              }} />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...body,
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  backgroundColor: C.slate100,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
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
              backgroundColor: C.slate100,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: C.slate100,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Types</option>
            <option value="rent">Rent</option>
            <option value="deposit">Deposit</option>
            <option value="fee">Fee</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div style={card}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
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
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Tenant</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Property</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('amount')}>
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Type</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Status</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('due_date')}>
                  Due Date {sortBy === 'due_date' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ 
                    ...body, 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: C.textMuted 
                  }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment: any) => (
                  <tr key={payment.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      #{payment.id}
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div>
                        <div>{payment.tenant?.name || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>
                          {payment.tenant?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div>
                        <div>{payment.property?.title || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>
                          {payment.property?.address || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text, fontWeight: 600 }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getTypeIcon(payment.type)}
                        <span>{payment.type}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getStatusColor(payment.status)
                      }}>
                        {getStatusIcon(payment.status)}
                        <span>{payment.status}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      {formatDate(payment.due_date)}
                    </td>
                    <td style={{ ...body, padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleViewDetails(payment)}
                          style={{
                            ...btnGhost,
                            padding: '6px',
                            backgroundColor: `${C.blue}20`,
                            color: C.blue,
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

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
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
          <div style={{ ...card, maxWidth: 600, width: '100%', position: 'relative' }}>
            <button
              onClick={() => setShowDetails(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: C.textMuted,
                cursor: 'pointer',
              }}
            >
              <XCircle size={18} />
            </button>

            <h2 style={{ ...body, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 20px' }}>
              Payment Details
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Payment ID:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>#{selectedPayment.id}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Tenant:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {selectedPayment.tenant?.name || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Property:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {selectedPayment.property?.title || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Amount:</div>
                <div style={{ ...body, fontSize: 14, color: C.text, fontWeight: 600 }}>
                  {formatCurrency(selectedPayment.amount)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Type:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {selectedPayment.type}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Status:</div>
                <div style={{ 
                  ...body, 
                  fontSize: 14, 
                  color: getStatusColor(selectedPayment.status),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {getStatusIcon(selectedPayment.status)}
                  {selectedPayment.status}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Transaction ID:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {selectedPayment.transaction_id || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Payment Method:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {selectedPayment.method || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Due Date:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {formatDate(selectedPayment.due_date)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Paid Date:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {selectedPayment.paid_date ? formatDate(selectedPayment.paid_date) : 'Not paid'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Created:</div>
                <div style={{ ...body, fontSize: 14, color: C.text }}>
                  {formatDate(selectedPayment.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default PaymentsManagement;
