import { useState, useEffect } from 'react';
import { Receipt, Download, Calendar, CheckCircle, AlertCircle, Clock, Filter, Search, TrendingUp, DollarSign, FileText, CreditCard } from 'lucide-react';
import Api from '../../services/api';

interface PaymentRecord {
  id: number;
  amount: number;
  description: string;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod: {
    type: string;
    name: string;
    details: string;
  };
  transactionId?: string;
  lateFee?: number;
  receiptUrl?: string;
  invoiceUrl?: string;
  property: {
    title: string;
    address: string;
  };
}

interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePayment: number;
  onTimePayments: number;
  latePayments: number;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockPayments: PaymentRecord[] = [
        {
          id: 1,
          amount: 800000,
          description: 'March 2024 Rent',
          dueDate: '2024-03-01',
          paidDate: '2024-03-01',
          status: 'paid',
          paymentMethod: {
            type: 'mobile',
            name: 'M-Pesa',
            details: '**** **** **** 1234'
          },
          transactionId: 'TXN123456789',
          receiptUrl: '/receipts/1.pdf',
          invoiceUrl: '/invoices/1.pdf',
          property: {
            title: 'Modern 2-Bedroom Apartment',
            address: '123 Kimweri Avenue, Masaki'
          }
        },
        {
          id: 2,
          amount: 800000,
          description: 'February 2024 Rent',
          dueDate: '2024-02-01',
          paidDate: '2024-02-01',
          status: 'paid',
          paymentMethod: {
            type: 'mobile',
            name: 'M-Pesa',
            details: '**** **** **** 1234'
          },
          transactionId: 'TXN123456788',
          receiptUrl: '/receipts/2.pdf',
          invoiceUrl: '/invoices/2.pdf',
          property: {
            title: 'Modern 2-Bedroom Apartment',
            address: '123 Kimweri Avenue, Masaki'
          }
        },
        {
          id: 3,
          amount: 800000,
          description: 'January 2024 Rent',
          dueDate: '2024-01-01',
          paidDate: '2024-01-02',
          status: 'paid',
          paymentMethod: {
            type: 'mobile',
            name: 'M-Pesa',
            details: '**** **** **** 1234'
          },
          transactionId: 'TXN123456787',
          receiptUrl: '/receipts/3.pdf',
          invoiceUrl: '/invoices/3.pdf',
          lateFee: 50000,
          property: {
            title: 'Modern 2-Bedroom Apartment',
            address: '123 Kimweri Avenue, Masaki'
          }
        }
      ];

      const mockSummary: PaymentSummary = {
        totalPaid: 3,
        totalPending: 0,
        totalOverdue: 0,
        averagePayment: 800000,
        onTimePayments: 2,
        latePayments: 1
      };
      
      setPayments(mockPayments);
      setSummary(mockSummary);
      
      // Uncomment when API is ready:
      // const [paymentsRes, summaryRes] = await Promise.all([
      //   Api.getPaymentHistory(),
      //   Api.getPaymentSummary()
      // ]);
      // 
      // if (paymentsRes.data) setPayments(paymentsRes.data);
      // if (summaryRes.data) setSummary(summaryRes.data);
    } catch (e) {
      console.error('Failed to load payment history:', e);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (paymentId: number) => {
    try {
      const response = await Api.downloadReceipt(paymentId);
      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError('Failed to download receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'partial': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertCircle;
      case 'partial': return TrendingUp;
      default: return Clock;
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

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.transactionId && payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesYear = yearFilter === 'all' || new Date(payment.dueDate).getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  const years = [...new Set(payments.map(p => new Date(p.dueDate).getFullYear().toString()))].sort((a, b) => b.localeCompare(a));

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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading payment history...</p>
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
            Payment History
          </h1>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          View your complete payment history and download receipts
        </p>
      </div>

      {/* Payment Summary */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {summary.totalPaid}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Payments
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
              {summary.onTimePayments}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              On-Time Payments
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
              {summary.latePayments}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Late Payments
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#c9a84c', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(summary.averagePayment)}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Average Payment
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <Search size={18} style={{ color: '#7a7060' }} />
            <input
              type="text"
              placeholder="Search payments..."
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
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
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
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment History Table */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: '#c9a84c' }} />
            Payment Records
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredPayments.length} records found
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.12)' }}>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  color: '#7a7060', 
                  fontSize: '12px', 
                  fontFamily: 'DM Sans, sans-serif', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  Date
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  color: '#7a7060', 
                  fontSize: '12px', 
                  fontFamily: 'DM Sans, sans-serif', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  Description
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  color: '#7a7060', 
                  fontSize: '12px', 
                  fontFamily: 'DM Sans, sans-serif', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  Amount
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  color: '#7a7060', 
                  fontSize: '12px', 
                  fontFamily: 'DM Sans, sans-serif', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  Method
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  color: '#7a7060', 
                  fontSize: '12px', 
                  fontFamily: 'DM Sans, sans-serif', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  Status
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px', 
                  color: '#7a7060', 
                  fontSize: '12px', 
                  fontFamily: 'DM Sans, sans-serif', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                return (
                  <tr key={payment.id} style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.06)' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                          {formatDate(payment.dueDate)}
                        </div>
                        {payment.paidDate && (
                          <div style={{ color: '#10b981', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                            Paid: {formatDate(payment.paidDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                          {payment.description}
                        </div>
                        <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          {payment.property.title}
                        </div>
                        {payment.transactionId && (
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            ID: {payment.transactionId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                          {fmt(payment.amount)}
                        </div>
                        {payment.lateFee && payment.lateFee > 0 && (
                          <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                            +{fmt(payment.lateFee)} late fee
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={14} style={{ color: '#7a7060' }} />
                        <div>
                          <div style={{ color: '#e8e4dc', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payment.paymentMethod.name}
                          </div>
                          <div style={{ color: '#7a7060', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                            {payment.paymentMethod.details}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StatusIcon size={14} style={{ color: getStatusColor(payment.status) }} />
                        <span style={{ 
                          color: getStatusColor(payment.status), 
                          fontSize: '13px', 
                          fontFamily: 'DM Sans, sans-serif',
                          textTransform: 'capitalize'
                        }}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {payment.status === 'paid' && payment.receiptUrl && (
                          <button
                            onClick={() => downloadReceipt(payment.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#10b981',
                              borderRadius: '4px',
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '11px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={12} />
                            Receipt
                          </button>
                        )}
                        {payment.invoiceUrl && (
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              backgroundColor: 'rgba(201, 168, 76, 0.1)',
                              border: '1px solid rgba(201, 168, 76, 0.3)',
                              color: '#c9a84c',
                              borderRadius: '4px',
                              fontFamily: 'DM Sans, sans-serif',
                              fontSize: '11px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            <FileText size={12} />
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Receipt size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No payment records found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentHistory;
