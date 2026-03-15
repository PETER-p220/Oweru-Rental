import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Wallet, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp, DollarSign, Receipt, FileText, Bell } from 'lucide-react';
import Api from '../../services/api';

interface Payment {
  id: number;
  contractId: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paymentMethod: {
    type: string;
    name: string;
    details: string;
  };
  transactionId?: string;
  lateFee?: number;
  description: string;
  property: {
    title: string;
    address: string;
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'mobile';
  name: string;
  details: string;
  isDefault: boolean;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextPaymentDue: string;
  nextPaymentAmount: number;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockPayments: Payment[] = [
        {
          id: 1,
          contractId: 1,
          amount: 800000,
          dueDate: '2024-03-01',
          paidDate: '2024-03-01',
          status: 'paid',
          paymentMethod: {
            type: 'mobile',
            name: 'M-Pesa',
            details: '**** **** **** 1234'
          },
          transactionId: 'TXN123456789',
          description: 'March 2024 Rent',
          property: {
            title: 'Modern 2-Bedroom Apartment',
            address: '123 Kimweri Avenue, Masaki'
          }
        },
        {
          id: 2,
          contractId: 1,
          amount: 800000,
          dueDate: '2024-04-01',
          status: 'pending',
          paymentMethod: {
            type: 'mobile',
            name: 'M-Pesa',
            details: '**** **** **** 1234'
          },
          description: 'April 2024 Rent',
          property: {
            title: 'Modern 2-Bedroom Apartment',
            address: '123 Kimweri Avenue, Masaki'
          }
        }
      ];

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'mobile',
          name: 'M-Pesa',
          details: '**** **** **** 1234',
          isDefault: true
        },
        {
          id: '2',
          type: 'card',
          name: 'Visa Card',
          details: '**** **** **** 4567',
          isDefault: false
        }
      ];

      const mockStats: PaymentStats = {
        totalPaid: 800000,
        totalPending: 800000,
        totalOverdue: 0,
        nextPaymentDue: '2024-04-01',
        nextPaymentAmount: 800000
      };
      
      setPayments(mockPayments);
      setPaymentMethods(mockPaymentMethods);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [paymentsRes, methodsRes, statsRes] = await Promise.all([
      //   Api.getMyPayments(),
      //   Api.getPaymentMethods(),
      //   Api.getPaymentStats()
      // ]);
      // 
      // if (paymentsRes.data) setPayments(paymentsRes.data);
      // if (methodsRes.data) setPaymentMethods(methodsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load payment data:', e);
      setError('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (payment: Payment, methodId: string) => {
    try {
      await Api.makePayment(payment.id, { paymentMethodId: methodId });
      await loadPaymentData(); // Refresh data
      setShowPaymentModal(false);
      setSelectedPayment(null);
    } catch (e) {
      setError('Payment failed. Please try again.');
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

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card': return CreditCard;
      case 'bank': return Wallet;
      case 'mobile': return Receipt;
      default: return CreditCard;
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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <CreditCard size={28} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
            Rent Payments
          </h1>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Manage your rent payments and view payment history
        </p>
      </div>

      {/* Payment Stats */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next Payment Due
              </span>
              <Calendar size={16} style={{ color: '#c9a84c' }} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(stats.nextPaymentAmount)}
            </div>
            <div style={{ fontSize: '14px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              {formatDate(stats.nextPaymentDue)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Paid This Year
              </span>
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(stats.totalPaid)}
            </div>
            <div style={{ fontSize: '14px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Successfully paid
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(245, 158, 11, 0.12)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Payments
              </span>
              <Clock size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {fmt(stats.totalPending)}
            </div>
            <div style={{ fontSize: '14px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Awaiting payment
            </div>
          </div>

          {stats.totalOverdue > 0 && (
            <div style={{
              backgroundColor: '#0e0e0e',
              border: '1px solid rgba(239, 68, 68, 0.12)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Overdue Amount
                </span>
                <AlertCircle size={16} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                {fmt(stats.totalOverdue)}
              </div>
              <div style={{ fontSize: '14px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
                Immediate attention required
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Methods */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} style={{ color: '#c9a84c' }} />
            Payment Methods
          </h3>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(201, 168, 76, 0.1)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              color: '#c9a84c',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add Method
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {paymentMethods.map((method) => {
            const Icon = getPaymentMethodIcon(method.type);
            return (
              <div
                key={method.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(201, 168, 76, 0.05)',
                  border: method.isDefault ? '1px solid #c9a84c' : '1px solid rgba(201, 168, 76, 0.2)',
                  borderRadius: '6px',
                  position: 'relative'
                }}
              >
                {method.isDefault && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#c9a84c',
                    color: '#080808',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: '500'
                  }}>
                    Default
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Icon size={20} style={{ color: '#c9a84c' }} />
                  <div>
                    <div style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                      {method.name}
                    </div>
                    <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                      {method.details}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Receipt size={18} style={{ color: '#c9a84c' }} />
          Payment History
        </h3>

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
                  Due Date
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                return (
                  <tr key={payment.id} style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.06)' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
                          {payment.description}
                        </div>
                        {payment.transactionId && (
                          <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                            ID: {payment.transactionId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                          {formatDate(payment.dueDate)}
                        </div>
                        {payment.paidDate && payment.status === 'paid' && (
                          <div style={{ color: '#10b981', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                            Paid: {formatDate(payment.paidDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                        {fmt(payment.amount)}
                      </div>
                      {payment.lateFee && payment.lateFee > 0 && (
                        <div style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          +{fmt(payment.lateFee)} late fee
                        </div>
                      )}
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
                      {payment.status === 'pending' || payment.status === 'overdue' ? (
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPaymentModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(201, 168, 76, 0.1)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#c9a84c',
                            borderRadius: '4px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Pay Now
                        </button>
                      ) : payment.status === 'paid' ? (
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10b981',
                            borderRadius: '4px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '20px', fontWeight: '500', marginBottom: '20px' }}>
              Make Payment
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {selectedPayment.description}
                </span>
                <span style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                  {fmt(selectedPayment.amount)}
                </span>
              </div>
              {selectedPayment.lateFee && selectedPayment.lateFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#ef4444', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                    Late Fee
                  </span>
                  <span style={{ color: '#ef4444', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                    {fmt(selectedPayment.lateFee)}
                  </span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '12px', 
                borderTop: '1px solid rgba(201, 168, 76, 0.12)' 
              }}>
                <span style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                  Total
                </span>
                <span style={{ color: '#c9a84c', fontSize: '18px', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>
                  {fmt(selectedPayment.amount + (selectedPayment.lateFee || 0))}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '12px' }}>
                Select Payment Method
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {paymentMethods.map((method) => {
                  const Icon = getPaymentMethodIcon(method.type);
                  return (
                    <button
                      key={method.id}
                      onClick={() => handlePayment(selectedPayment, method.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: 'rgba(201, 168, 76, 0.05)',
                        border: '1px solid rgba(201, 168, 76, 0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.05)';
                      }}
                    >
                      <Icon size={18} style={{ color: '#c9a84c' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                          {method.name}
                        </div>
                        <div style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                          {method.details}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e8e4dc',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
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

export default Payments;
