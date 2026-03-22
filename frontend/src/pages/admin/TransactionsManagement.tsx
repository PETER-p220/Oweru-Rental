import { useState, useEffect } from 'react';
import {
  DollarSign, Search, Plus, Edit, Trash2, Eye, Download,
  RefreshCw, Calendar, CheckCircle, X, AlertTriangle, Clock,
  User, Home, CreditCard, Banknote, Receipt, FileText,
  ArrowUpDown, BarChart3, Users, Building, Smartphone,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ───────────────────────────────────────────────── */
interface Transaction {
  id: number;
  type: 'rent_payment' | 'commission' | 'refund' | 'deposit' | 'withdrawal' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  description: string;
  reference: string;
  paymentMethod: 'card' | 'bank_transfer' | 'mobile_money' | 'cash' | 'wallet';
  user: { id: number; name: string; email: string; type: string };
  property?: { id: number; title: string; address: string };
  agent?: { id: number; name: string; email: string; commissionRate: number };
  metadata: {
    invoiceNumber?: string;
    receiptNumber?: string;
    transactionId?: string;
    gateway?: string;
    fees?: number;
    netAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  avgTransactionAmount: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  transactionGrowth: number;
}

/* ─── Shared style tokens ────────────────────────────────── */
const tk = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark2:  '#0e0e0e',
  cream:  '#e8e4dc',
  muted:  '#7a7060',
  border: 'rgba(201,168,76,0.12)',
  green:  '#10b981',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  red:    '#ef4444',
  purple: '#8b5cf6',
} as const;

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Cormorant Garamond, Georgia, serif' };

const card: React.CSSProperties = {
  backgroundColor: tk.dark2,
  border: `1px solid ${tk.border}`,
  borderRadius: 10,
};

const innerRow: React.CSSProperties = {
  border: '1px solid rgba(201,168,76,0.07)',
  borderRadius: 8,
  padding: 20,
  transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
  ...body, fontSize: 10, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: tk.muted,
};

const pill = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 9px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color, borderRadius: 999,
  fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

const ghostBtn = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px',
  backgroundColor: `${color}10`,
  border: `1px solid ${color}25`,
  color, borderRadius: 6,
  fontSize: 12, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.18s',
});

const selectStyle: React.CSSProperties = {
  ...body,
  padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

const inputStyle: React.CSSProperties = {
  ...body,
  padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: tk.cream, borderRadius: 6,
  fontSize: 13, outline: 'none',
};

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusColor = (s: string): string =>
  ({ completed: tk.green, pending: tk.amber, failed: tk.red, cancelled: tk.muted, refunded: tk.purple }[s] ?? tk.muted);

const typeColor = (t: string): string =>
  ({ rent_payment: tk.green, commission: tk.blue, refund: tk.purple, deposit: tk.amber, withdrawal: tk.red, fee: tk.muted }[t] ?? tk.muted);

const getTypeIcon = (type: string) =>
  ({ rent_payment: Home, commission: Users, refund: RefreshCw, deposit: Banknote, withdrawal: CreditCard, fee: Receipt }[type] ?? FileText);

const getMethodIcon = (method: string) =>
  ({ card: CreditCard, bank_transfer: Building, mobile_money: Smartphone, cash: Banknote, wallet: Receipt }[method] ?? FileText);

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const TransactionsManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState<'created' | 'amount' | 'status' | 'type'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { loadTransactions(); }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const [transactionsRes, statsRes] = await Promise.all([
        Api.getAdminTransactions({
          search: searchTerm,
          type: typeFilter,
          status: statusFilter,
        }),
        Api.getAdminTransactionStats(),
      ]);

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await Api.deleteAdminTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const statsRes = await Api.getAdminTransactionStats();
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to delete transaction:', e);
    } finally {
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: Transaction['status']) => {
    try {
      const response = await Api.updateAdminTransactionStatus(id, newStatus);
      setTransactions((prev) => prev.map((t) => t.id === id ? response.data : t));
      const statsRes = await Api.getAdminTransactionStats();
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to update transaction:', e);
    }
  };

  /* ── Open modals — named functions avoid the semicolon-in-JSX bug ── */
  const openDeleteModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const openDetailModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleDownload = (transaction: Transaction) => {
    const content =
      `Transaction Details\n\n` +
      `Reference: ${transaction.reference}\n` +
      `Type: ${transaction.type}\n` +
      `Amount: ${fmt(transaction.amount)}\n` +
      `Status: ${transaction.status}\n` +
      `User: ${transaction.user.name}\n` +
      `Payment Method: ${transaction.paymentMethod}\n` +
      `Created: ${fmtDate(transaction.createdAt)}\n` +
      `Description: ${transaction.description}`;
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-${transaction.reference}.txt`;
    a.click();
  };

  /* ── Filtering + sorting ── */
  const filtered = transactions
    .filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        t.description.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.user.name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q);
      const matchType   = typeFilter === 'all' || t.type === typeFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchMethod = paymentMethodFilter === 'all' || t.paymentMethod === paymentMethodFilter;
      const matchAmount = t.amount >= amountRange[0] && t.amount <= amountRange[1];
      let matchDate = true;
      if (dateRange[0] && dateRange[1]) {
        const d = new Date(t.createdAt);
        matchDate = d >= new Date(dateRange[0]) && d <= new Date(dateRange[1]);
      }
      return matchSearch && matchType && matchStatus && matchMethod && matchAmount && matchDate;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'amount')  cmp = a.amount - b.amount;
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'type')   cmp = a.type.localeCompare(b.type);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(201,168,76,0.15)',
            borderTop: `3px solid ${tk.gold}`,
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ color: tk.muted, ...body, fontSize: 13 }}>Loading transactions…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        .txn-row:hover { border-color: rgba(201,168,76,0.15) !important; background: rgba(201,168,76,0.015) !important; }
        .txn-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .txn-btn:active { transform: scale(.97); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <DollarSign size={22} style={{ color: tk.gold }} />
          <h1 style={{ ...serif, fontSize: 26, fontWeight: 600, color: tk.cream, margin: 0, letterSpacing: '-0.02em' }}>
            Transactions
          </h1>
        </div>
        <p style={{ color: tk.muted, ...body, fontSize: 13, margin: 0 }}>
          Monitor and manage all financial transactions across the platform.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',      value: stats.totalTransactions,       color: tk.cream  },
            { label: 'Revenue',    value: fmt(stats.totalRevenue),        color: tk.green  },
            { label: 'Net',        value: fmt(stats.netRevenue),          color: tk.green  },
            { label: 'Pending',    value: stats.pendingTransactions,      color: tk.amber  },
            { label: 'Completed',  value: stats.completedTransactions,    color: tk.green  },
            { label: 'Failed',     value: stats.failedTransactions,       color: tk.red    },
            { label: 'Avg. Amount',value: fmt(stats.avgTransactionAmount),color: tk.gold   },
            { label: 'Growth',     value: `+${stats.revenueGrowth}%`,     color: tk.green  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ ...body, fontSize: 18, fontWeight: 700, color, marginBottom: 3, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
              <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ ...card, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ color: tk.muted, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search transactions…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Types</option>
            <option value="rent_payment">Rent Payment</option>
            <option value="commission">Commission</option>
            <option value="refund">Refund</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="fee">Fee</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Methods</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="cash">Cash</option>
            <option value="wallet">Wallet</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={selectStyle}>
            <option value="created">Date</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
            <option value="type">Type</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={ghostBtn(tk.gold)}
            className="txn-btn"
          >
            <ArrowUpDown size={13} />
            {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </button>

          {/* Amount range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...body, fontSize: 11, color: tk.muted, whiteSpace: 'nowrap' }}>Amount:</span>
            <input type="number" placeholder="Min" value={amountRange[0]}
              onChange={(e) => setAmountRange([+e.target.value, amountRange[1]])}
              style={{ ...inputStyle, width: 90 }} />
            <span style={{ color: tk.muted }}>–</span>
            <input type="number" placeholder="Max" value={amountRange[1]}
              onChange={(e) => setAmountRange([amountRange[0], +e.target.value])}
              style={{ ...inputStyle, width: 90 }} />
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...body, fontSize: 11, color: tk.muted, whiteSpace: 'nowrap' }}>Date:</span>
            <input type="date" value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              style={{ ...inputStyle, colorScheme: 'dark' }} />
            <span style={{ color: tk.muted }}>–</span>
            <input type="date" value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
        </div>
      </div>

      {/* ── Transactions list ── */}
      <div style={{ ...card, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>
            Transactions
          </h3>
          <span style={{ ...body, fontSize: 12, color: tk.muted }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <DollarSign size={40} style={{ color: tk.muted, marginBottom: 12 }} />
            <p style={{ ...body, fontSize: 14, color: tk.muted, margin: 0 }}>No transactions match your filters.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((txn) => {
            const TypeIcon   = getTypeIcon(txn.type);
            const MethodIcon = getMethodIcon(txn.paymentMethod);
            const tColor = typeColor(txn.type);
            const sColor = statusColor(txn.status);

            return (
              <div key={txn.id} className="txn-row" style={innerRow}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                  {/* Icon */}
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: `${tColor}12`,
                    border: `1px solid ${tColor}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TypeIcon size={20} style={{ color: tColor }} />
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>

                    {/* Top row: title + amount */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ ...body, fontSize: 13.5, fontWeight: 600, color: tk.cream, margin: '0 0 4px', lineHeight: 1.4 }}>
                          {txn.description}
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                            <User size={11} /> {txn.user?.name || 'Unknown'} · {txn.user?.type || 'Unknown'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted, fontFamily: 'monospace' }}>
                            <FileText size={11} /> {txn.reference || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ ...body, fontSize: 19, fontWeight: 700, color: tk.cream, lineHeight: 1, marginBottom: 6 }}>
                          {fmt(txn.amount)}
                        </div>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <span style={pill(sColor)}>{txn.status}</span>
                          <span style={pill(tColor)}>{txn.type?.replace('_', ' ') || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                      {[
                        { Icon: MethodIcon, label: txn.paymentMethod?.replace('_', ' ') || 'Unknown' },
                        { Icon: Calendar,   label: fmtDate(txn.createdAt) },
                        txn.metadata?.gateway   ? { Icon: Building, label: txn.metadata.gateway }          : null,
                        txn.metadata?.fees      ? { Icon: Receipt,  label: `Fees: ${fmt(txn.metadata.fees)}` } : null,
                        txn.metadata?.netAmount ? { Icon: DollarSign, label: `Net: ${fmt(txn.metadata.netAmount)}` } : null,
                        txn.property           ? { Icon: Home,     label: txn.property.title }             : null,
                      ].filter(Boolean).map(({ Icon, label }: any) => (
                        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <Icon size={12} /> {label}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {/* ✅ FIX: was onClick={() => setShowDeleteModal(true); setSelectedTransaction(transaction)}
                             Now uses openDetailModal / openDeleteModal named functions */}
                      <button style={ghostBtn(tk.gold)}   className="txn-btn" onClick={() => openDetailModal(txn)}>
                        <Eye size={13} /> View Details
                      </button>
                      <button style={ghostBtn(tk.blue)}   className="txn-btn" onClick={() => handleDownload(txn)}>
                        <Download size={13} /> Download
                      </button>
                      {txn.status === 'pending' && (
                        <button style={ghostBtn(tk.green)} className="txn-btn" onClick={() => handleStatusChange(txn.id, 'completed')}>
                          <CheckCircle size={13} /> Complete
                        </button>
                      )}
                      <button style={ghostBtn(tk.red)}    className="txn-btn" onClick={() => openDeleteModal(txn)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>

                  </div>{/* /body */}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ DETAIL MODAL ══ */}
      {showDetailModal && selectedTransaction && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 999,
        }}>
          <div style={{ ...card, padding: 28, maxWidth: 520, width: '100%', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowDetailModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: tk.muted, cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <FileText size={15} style={{ color: tk.gold }} />
              <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Transaction Details</h3>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <span style={pill(statusColor(selectedTransaction.status))}>{selectedTransaction.status}</span>
              <span style={pill(typeColor(selectedTransaction.type))}>{selectedTransaction.type.replace('_', ' ')}</span>
              <span style={{ ...body, fontSize: 11, color: tk.muted, alignSelf: 'center', fontFamily: 'monospace' }}>
                {selectedTransaction.reference}
              </span>
            </div>

            {[
              { label: 'Amount',         value: fmt(selectedTransaction.amount) },
              { label: 'Net Amount',     value: selectedTransaction.metadata.netAmount ? fmt(selectedTransaction.metadata.netAmount) : '—' },
              { label: 'Fees',           value: selectedTransaction.metadata.fees ? fmt(selectedTransaction.metadata.fees) : '—' },
              { label: 'User',           value: `${selectedTransaction.user.name} (${selectedTransaction.user.type})` },
              { label: 'Payment Method', value: selectedTransaction.paymentMethod.replace('_', ' ') },
              { label: 'Gateway',        value: selectedTransaction.metadata.gateway ?? '—' },
              { label: 'Property',       value: selectedTransaction.property?.title ?? '—' },
              { label: 'Transaction ID', value: selectedTransaction.metadata.transactionId ?? '—' },
              { label: 'Invoice',        value: selectedTransaction.metadata.invoiceNumber ?? '—' },
              { label: 'Created',        value: fmtDate(selectedTransaction.createdAt) },
              selectedTransaction.completedAt ? { label: 'Completed', value: fmtDate(selectedTransaction.completedAt) } : null,
              selectedTransaction.failedAt    ? { label: 'Failed',    value: fmtDate(selectedTransaction.failedAt) }    : null,
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.07)',
              }}>
                <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...body, fontSize: 12.5, color: tk.cream, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            {selectedTransaction.description && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(201,168,76,0.04)', borderRadius: 6, border: '1px solid rgba(201,168,76,0.09)' }}>
                <div style={{ ...labelStyle, marginBottom: 6 }}>Description</div>
                <p style={{ ...body, fontSize: 12.5, color: '#b8b0a0', margin: 0, lineHeight: 1.6 }}>
                  {selectedTransaction.description}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button style={{ ...ghostBtn(tk.blue), flex: 1, justifyContent: 'center' }} className="txn-btn"
                onClick={() => handleDownload(selectedTransaction)}>
                <Download size={13} /> Download
              </button>
              <button style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }} className="txn-btn"
                onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {showDeleteModal && selectedTransaction && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 999,
        }}>
          <div style={{ ...card, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: tk.red, marginBottom: 14 }} />
            <h3 style={{ ...serif, fontSize: 20, fontWeight: 500, color: tk.cream, margin: '0 0 10px' }}>
              Delete Transaction
            </h3>
            <p style={{ ...body, fontSize: 13, color: tk.muted, lineHeight: 1.7, marginBottom: 22 }}>
              Are you sure you want to delete <strong style={{ color: tk.cream, fontFamily: 'monospace' }}>{selectedTransaction.reference}</strong>?<br />
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }}
                className="txn-btn"
                onClick={() => { setShowDeleteModal(false); setSelectedTransaction(null); }}
              >
                Cancel
              </button>
              <button
                style={{ ...ghostBtn(tk.red), flex: 1, justifyContent: 'center' }}
                className="txn-btn"
                onClick={() => handleDeleteTransaction(selectedTransaction.id)}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TransactionsManagement;
