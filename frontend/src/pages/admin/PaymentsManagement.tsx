import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Eye, RefreshCw, Search } from 'lucide-react';
import Api from '../../services/api';

interface AdminPaymentTransaction {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  description: string;
  reference: string;
  paymentMethod: string;
  user: { id?: number; name: string; email: string; type: string };
  property?: { id?: number; title: string; address: string };
  metadata: { gateway?: string; fees?: number; netAmount?: number; transactionId?: string };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  refundedAt?: string;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0e0e0e',
  border: '1px solid rgba(201,168,76,0.12)',
  borderRadius: 12,
  padding: 20,
};

const pill = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 999,
  backgroundColor: `${color}18`,
  color,
  fontSize: 12,
  fontFamily: 'DM Sans, sans-serif',
});

const money = (value: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(value || 0);

const PaymentsManagement = () => {
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<AdminPaymentTransaction | null>(null);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, statsRes] = await Promise.all([
        Api.getAdminTransactions(),
        Api.getAdminTransactionStats(),
      ]);

      const paymentTransactions = (transactionsRes.data || []).filter((item: AdminPaymentTransaction) => item.type !== 'commission');
      setTransactions(paymentTransactions);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load payment data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  const handleProcessPayment = async (transactionId: number) => {
    try {
      const response = await Api.updateAdminTransactionStatus(transactionId, 'completed');
      setTransactions((prev) => prev.map((item) => item.id === transactionId ? response.data : item));
      const statsRes = await Api.getAdminTransactionStats();
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to process payment:', e);
    }
  };

  const handleRefundPayment = async (transactionId: number) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;

    try {
      const response = await Api.updateAdminTransactionStatus(transactionId, 'refunded');
      setTransactions((prev) => prev.map((item) => item.id === transactionId ? response.data : item));
      const statsRes = await Api.getAdminTransactionStats();
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to refund payment:', e);
    }
  };

  const filtered = useMemo(() => transactions.filter((transaction) => {
    if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const haystack = [transaction.description, transaction.reference, transaction.user?.name, transaction.user?.email, transaction.property?.title].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  }), [transactions, statusFilter, searchTerm]);

  const handleDownload = (transaction: AdminPaymentTransaction) => {
    const content = [
      `Reference: ${transaction.reference}`,
      `Amount: ${money(transaction.amount)}`,
      `Status: ${transaction.status}`,
      `Customer: ${transaction.user?.name}`,
      `Property: ${transaction.property?.title || 'N/A'}`,
      `Created: ${new Date(transaction.createdAt).toLocaleString()}`,
      `Description: ${transaction.description}`,
    ].join('\n');
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-${transaction.reference}.txt`;
    a.click();
  };

  if (loading) {
    return <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading payment operations...</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <CreditCard size={22} style={{ color: '#c9a84c' }} />
          <h1 style={{ margin: 0, color: '#e8e4dc', fontSize: 28, fontWeight: 600 }}>Payments Management</h1>
        </div>
        <p style={{ margin: 0, color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
          Process real payment transactions and refund completed payments from the Laravel backend.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          ['Total Transactions', stats?.total_transactions ?? 0, '#e8e4dc'],
          ['Revenue', money(stats?.total_revenue ?? 0), '#10b981'],
          ['Pending', stats?.pending_transactions ?? 0, '#f59e0b'],
          ['Refunded', stats?.refunded_transactions ?? 0, '#8b5cf6'],
        ].map(([label, value, color]) => (
          <div key={String(label)} style={cardStyle}>
            <div style={{ color, fontSize: 26, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{value as any}</div>
            <div style={{ marginTop: 8, color: '#7a7060', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ color: '#7a7060' }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8e4dc', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ backgroundColor: '#171717', color: '#e8e4dc', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '10px 12px' }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>No payment transactions matched the current filters.</div>
          )}

          {filtered.map((transaction) => {
            const statusColor = transaction.status === 'completed' ? '#10b981' : transaction.status === 'pending' ? '#f59e0b' : transaction.status === 'refunded' ? '#8b5cf6' : '#ef4444';
            return (
              <div key={transaction.id} style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#e8e4dc', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>{transaction.description}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>{transaction.reference} • {transaction.user?.name}</div>
                    <div style={{ color: '#7a7060', fontSize: 13, marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>{transaction.property?.title || 'No property linked'} • {new Date(transaction.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#e8e4dc', fontWeight: 700, fontSize: 20, fontFamily: 'DM Sans, sans-serif' }}>{money(transaction.amount)}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <span style={pill(statusColor)}>{transaction.status}</span>
                      <span style={pill('#3b82f6')}>{transaction.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setSelectedTransaction(transaction)} style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Eye size={14} /> View Details
                  </button>
                  <button onClick={() => handleDownload(transaction)} style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Download size={14} /> Download
                  </button>
                  {transaction.status === 'pending' && (
                    <button onClick={() => handleProcessPayment(transaction.id)} style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <RefreshCw size={14} /> Mark Completed
                    </button>
                  )}
                  {transaction.status === 'completed' && (
                    <button onClick={() => handleRefundPayment(transaction.id)} style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <RefreshCw size={14} /> Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTransaction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 }}>
          <div style={{ ...cardStyle, maxWidth: 520, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#e8e4dc' }}>Payment Details</h3>
              <button onClick={() => setSelectedTransaction(null)} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer', fontSize: 18 }}>x</button>
            </div>
            <div style={{ display: 'grid', gap: 10, color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif' }}>
              <div><strong>Reference:</strong> {selectedTransaction.reference}</div>
              <div><strong>Amount:</strong> {money(selectedTransaction.amount)}</div>
              <div><strong>Status:</strong> {selectedTransaction.status}</div>
              <div><strong>Method:</strong> {selectedTransaction.paymentMethod.replace('_', ' ')}</div>
              <div><strong>User:</strong> {selectedTransaction.user?.name} ({selectedTransaction.user?.email})</div>
              <div><strong>Gateway:</strong> {selectedTransaction.metadata?.gateway || 'N/A'}</div>
              <div><strong>Transaction ID:</strong> {selectedTransaction.metadata?.transactionId || 'N/A'}</div>
              <div><strong>Description:</strong> {selectedTransaction.description}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;
