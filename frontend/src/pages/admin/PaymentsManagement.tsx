import { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Plus, Edit, Trash2, Eye, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, CheckCircle, X, AlertTriangle, Clock, User, Home, Banknote, Receipt, FileText, ArrowUpDown, Grid, List, BarChart3, PieChart, Activity, Users, Building, DollarSign, Shield, Bell, Settings, Link2, Smartphone, Wallet } from 'lucide-react';
import Api from '../../services/api';

interface PaymentMethod {
  id: number;
  name: string;
  type: 'card' | 'bank_transfer' | 'mobile_money' | 'cash' | 'wallet';
  provider: string;
  isActive: boolean;
  supportedCurrencies: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
  limits: {
    min: number;
    max: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaymentTransaction {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: PaymentMethod;
  user: {
    id: number;
    name: string;
    email: string;
    type: string;
  };
  property?: {
    id: number;
    title: string;
    address: string;
  };
  description: string;
  metadata: {
    gateway?: string;
    transactionId?: string;
    fees?: number;
    netAmount?: number;
    ipAddress?: string;
    userAgent?: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

interface PaymentStats {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  netVolume: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  avgTransactionAmount: number;
  volumeThisMonth: number;
  volumeGrowth: number;
  topPaymentMethod: string;
  conversionRate: number;
}

const PaymentsManagement = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'methods' | 'analytics'>('transactions');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'created' | 'amount' | 'status' | 'method'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateMethodModal, setShowCreateMethodModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [activeTab]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      const [transactionsRes, statsRes] = await Promise.all([
        Api.getAdminTransactions({
          search: searchTerm,
          status: statusFilter,
          type: methodFilter,
        }),
        Api.getAdminTransactionStats(),
      ]);

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
      // if (methodsRes.data) setPaymentMethods(methodsRes.data);
      // if (transactionsRes.data) setTransactions(transactionsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load payment data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (transactionId: number) => {
    try {
      setLoading(true);
      
      // Mock processing
      setTransactions(transactions.map(t => 
        t.id === transactionId ? { ...t, status: 'processing' as const } : t
      ));
      
      // Simulate completion
      setTimeout(() => {
        setTransactions(prev => prev.map(t => 
          t.id === transactionId ? { 
            ...t, 
            status: 'completed' as const,
            completedAt: new Date().toISOString()
          } : t
        ));
      }, 3000);
      
      // Uncomment when API is ready:
      // await Api.processPayment(transactionId);
      
      setLoading(false);
    } catch (e) {
      console.error('Failed to process payment:', e);
      setLoading(false);
    }
  };

  const handleRefundPayment = async (transactionId: number) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;
    
    try {
      setLoading(true);
      
      // Mock refund
      setTransactions(transactions.map(t => 
        t.id === transactionId ? { 
          ...t, 
          status: 'refunded' as const,
          refundedAt: new Date().toISOString()
        } : t
      ));
      
      // Uncomment when API is ready:
      // await Api.refundPayment(transactionId);
      
      setLoading(false);
    } catch (e) {
      console.error('Failed to refund payment:', e);
      setLoading(false);
    }
  };

  const handleToggleMethod = async (methodId: number) => {
    try {
      setLoading(true);
      
      // Mock toggle
      setPaymentMethods(methods.map(m => 
        m.id === methodId ? { ...m, isActive: !m.isActive } : m
      ));
      
      // Uncomment when API is ready:
      // await Api.togglePaymentMethod(methodId);
      
      setLoading(false);
    } catch (e) {
      console.error('Failed to toggle payment method:', e);
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
      case 'completed': return '#10b981';
      case 'processing': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'cancelled': return '#6b7280';
      case 'refunded': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'card': return '#3b82f6';
      case 'bank_transfer': return '#10b981';
      case 'mobile_money': return '#f59e0b';
      case 'cash': return '#6b7280';
      case 'wallet': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'card': return CreditCard;
      case 'bank_transfer': return Building;
      case 'mobile_money': return Smartphone;
      case 'cash': return Banknote;
      case 'wallet': return Wallet;
      default: return FileText;
    }
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <CreditCard size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Payments Management
          </h1>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage payment methods, transactions, and financial operations
        </p>
      </div>

      {/* Payment Stats */}
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
              {stats.totalTransactions}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Transactions
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
              {fmt(stats.totalVolume)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Volume
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
              {fmt(stats.netVolume)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Net Volume
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
              {stats.pendingTransactions}
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
              {stats.completedTransactions}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed
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
              {stats.failedTransactions}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Failed
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
              {fmt(stats.avgTransactionAmount)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Amount
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
              {stats.conversionRate}%
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conversion Rate
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
        {['transactions', 'methods', 'analytics'].map((tab) => (
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

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
              Payment Transactions
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transactions
              .filter(transaction => statusFilter === 'all' || transaction.status === statusFilter)
              .map((transaction) => {
                const MethodIcon = getTypeIcon(transaction.paymentMethod.type);
                
                return (
                  <div key={transaction.id} style={{
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
                      backgroundColor: `${getStatusColor(transaction.status)}15`,
                      border: `1px solid ${getStatusColor(transaction.status)}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <MethodIcon size={24} style={{ color: getStatusColor(transaction.status) }} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
                            {transaction.description}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={14} />
                              {transaction.user.name} ({transaction.user.type})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FileText size={14} />
                              {transaction.reference}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                            {fmt(transaction.amount)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: `${getStatusColor(transaction.status)}15`,
                              border: `1px solid ${getStatusColor(transaction.status)}30`,
                              color: getStatusColor(transaction.status),
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: '500',
                              textTransform: 'capitalize'
                            }}>
                              {transaction.status}
                            </span>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: `${getTypeColor(transaction.paymentMethod.type)}15`,
                              border: `1px solid ${getTypeColor(transaction.paymentMethod.type)}30`,
                              color: getTypeColor(transaction.paymentMethod.type),
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: '500',
                              textTransform: 'capitalize'
                            }}>
                              {transaction.paymentMethod.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} />
                          {formatDate(transaction.createdAt)}
                        </div>
                        {transaction.metadata.gateway && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} />
                            {transaction.metadata.gateway}
                          </div>
                        )}
                        {transaction.metadata.fees && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Receipt size={14} />
                            Fees: {fmt(transaction.metadata.fees)}
                          </div>
                        )}
                        {transaction.metadata.netAmount && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <DollarSign size={14} />
                            Net: {fmt(transaction.metadata.netAmount)}
                          </div>
                        )}
                      </div>

                      {transaction.property && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                          <Home size={14} />
                          {transaction.property.title}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowTransactionModal(true);
                          }}
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
                        {transaction.status === 'pending' && (
                          <button
                            onClick={() => handleProcessPayment(transaction.id)}
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
                            <RefreshCw size={14} />
                            Process
                          </button>
                        )}
                        {transaction.status === 'completed' && (
                          <button
                            onClick={() => handleRefundPayment(transaction.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              color: '#8b5cf6',
                              borderRadius: '4px',
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <RefreshCw size={14} />
                            Refund
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
              Payment Methods
            </h3>
            <button
              onClick={() => setShowCreateMethodModal(true)}
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
              Add Method
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {paymentMethods.map((method) => {
              const MethodIcon = getTypeIcon(method.type);
              
              return (
                <div key={method.id} style={{
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
                      backgroundColor: method.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      border: method.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MethodIcon size={24} style={{ color: method.isActive ? '#10b981' : '#6b7280' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
                        {method.name}
                      </h4>
                      <p style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                        {method.provider}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: method.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      border: method.isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
                      color: method.isActive ? '#10b981' : '#6b7280',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {method.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: `${getTypeColor(method.type)}15`,
                      border: `1px solid ${getTypeColor(method.type)}30`,
                      color: getTypeColor(method.type),
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {method.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        Fees:
                      </span>
                      <span style={{ color: '#e8e4dc', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {method.fees.percentage}% + {fmt(method.fees.fixed)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        Limits:
                      </span>
                      <span style={{ color: '#e8e4dc', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {fmt(method.limits.min)} - {fmt(method.limits.max)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        Currencies:
                      </span>
                      <span style={{ color: '#e8e4dc', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                        {method.supportedCurrencies.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleMethod(method.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: method.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: method.isActive ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                        color: method.isActive ? '#ef4444' : '#10b981',
                        borderRadius: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {method.isActive ? 'Disable' : 'Enable'}
                    </button>
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
                  </div>
                </div>
              );
            })}
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
            Payment Analytics
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(201, 168, 76, 0.06)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 16px' }}>
                Top Payment Methods
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {paymentMethods.map((method) => (
                  <div key={method.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(() => {
                        const MethodIcon = getTypeIcon(method.type);
                        return <MethodIcon size={16} style={{ color: getTypeColor(method.type) }} />;
                      })()}
                      <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        {method.name}
                      </span>
                    </div>
                    <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                      {method.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(201, 168, 76, 0.06)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h4 style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 16px' }}>
                Performance Metrics
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        Conversion Rate
                      </span>
                      <span style={{ color: '#10b981', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {stats.conversionRate}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        Volume Growth
                      </span>
                      <span style={{ color: '#10b981', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {stats.volumeGrowth}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                        Top Method
                      </span>
                      <span style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {stats.topPaymentMethod}
                      </span>
                    </div>
                  </>
                )}
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

export default PaymentsManagement;
