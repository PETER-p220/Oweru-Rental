import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DollarSign, Search, Trash2, Eye, Download, RefreshCw, Calendar,
  CheckCircle, X, AlertTriangle, Clock, User, Home, CreditCard,
  Banknote, Receipt, FileText, ArrowUpDown, Users, Building,
  Smartphone, TrendingUp, XCircle, Sparkles, Star,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss,
  btnPrimary, ADMIN_CSS, adminHeaderStyle, pill, ghostBtn, innerRow, labelStyle,
} from './adminTheme';

/* ─── Types ─────────────────────────────────────────────── */
interface TransactionUser {
  id?: number;
  name: string;
  email?: string;
  type?: string;
}

interface TransactionProperty {
  id?: number;
  title: string;
  address?: string;
}

interface TransactionMetadata {
  invoiceNumber?: string | null;
  receiptNumber?: string | null;
  transactionId?: string | null;
  gateway?: string | null;
  fees?: number;
  netAmount?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

interface Transaction {
  id: number;
  source: 'payment' | 'commission' | 'bnb';
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  reference: string;
  paymentMethod: string;
  user: TransactionUser;
  property?: TransactionProperty | null;
  metadata: TransactionMetadata;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
  failedAt?: string | null;
}

interface TransactionStats {
  total_transactions: number;
  total_revenue: number;
  total_fees: number;
  net_revenue: number;
  pending_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  refunded_transactions: number;
  avg_transaction_amount: number;
  revenue_this_month: number;
  revenue_growth: number;
  transaction_growth: number;
}

type QuickFilter = 'all' | 'pending' | 'failed' | 'completed' | 'commission' | 'bnb';

/* ─── Helpers ───────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-TZ', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const fmtPct = (n?: number) => {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
};

const statusColor = (s: string): string =>
  ({
    completed: C.green, pending: C.amber, failed: C.red,
    cancelled: C.textMuted, refunded: C.purple, approved: C.blue,
  }[s] ?? C.textMuted);

const typeColor = (t: string): string =>
  ({
    rent_payment: C.green, rent: C.green, first_month_rent: C.green, monthly_rent: C.green,
    commission: C.blue, refund: C.purple, deposit: C.amber, withdrawal: C.red,
    fee: C.textMuted, service_fee: C.amber, service_charge: C.amber,
    site_visit: C.blue, bnb_stay: C.purple, visit: C.blue,
  }[t] ?? C.gold);

const typeLabel = (t: string) =>
  ({
    rent_payment: 'Rent Payment', rent: 'Rent', first_month_rent: 'First Month Rent',
    monthly_rent: 'Monthly Rent', commission: 'Commission', bnb_stay: 'BnB Stay',
    site_visit: 'Site Visit', service_fee: 'Service Fee', service_charge: 'Service Charge',
    deposit: 'Deposit', refund: 'Refund', fee: 'Fee',
  }[t] ?? t.replace(/_/g, ' '));

const sourceLabel = (s: string) =>
  ({ payment: 'Payment', commission: 'Commission', bnb: 'BnB' }[s] ?? s);

const sourceColor = (s: string) =>
  ({ payment: C.green, commission: C.blue, bnb: C.purple }[s] ?? C.textMuted);

const getTypeIcon = (type: string) =>
  ({
    rent_payment: Home, rent: Home, first_month_rent: Home, monthly_rent: Home,
    commission: Users, refund: RefreshCw, deposit: Banknote, withdrawal: CreditCard,
    fee: Receipt, service_fee: Receipt, service_charge: Receipt,
    site_visit: MapPinIcon, bnb_stay: Star, visit: MapPinIcon,
  }[type] ?? FileText);

function MapPinIcon(props: { size?: number; style?: React.CSSProperties }) {
  return <Building {...props} />;
}

const getMethodIcon = (method: string) =>
  ({
    card: CreditCard, bank_transfer: Building, mobile_money: Smartphone,
    cash: Banknote, wallet: Receipt, selcom: Smartphone,
  }[method?.toLowerCase?.()] ?? FileText);

const normalizeStats = (raw: any): TransactionStats | null => {
  if (!raw) return null;
  return {
    total_transactions: raw.total_transactions ?? raw.totalTransactions ?? 0,
    total_revenue: raw.total_revenue ?? raw.totalRevenue ?? 0,
    total_fees: raw.total_fees ?? raw.totalFees ?? 0,
    net_revenue: raw.net_revenue ?? raw.netRevenue ?? 0,
    pending_transactions: raw.pending_transactions ?? raw.pendingTransactions ?? 0,
    completed_transactions: raw.completed_transactions ?? raw.completedTransactions ?? 0,
    failed_transactions: raw.failed_transactions ?? raw.failedTransactions ?? 0,
    refunded_transactions: raw.refunded_transactions ?? raw.refundedTransactions ?? 0,
    avg_transaction_amount: raw.avg_transaction_amount ?? raw.avgTransactionAmount ?? 0,
    revenue_this_month: raw.revenue_this_month ?? raw.revenueThisMonth ?? 0,
    revenue_growth: raw.revenue_growth ?? raw.revenueGrowth ?? 0,
    transaction_growth: raw.transaction_growth ?? raw.transactionGrowth ?? 0,
  };
};

const exportCsv = (rows: Transaction[]) => {
  const headers = ['Reference', 'Source', 'Type', 'Status', 'Amount', 'User', 'Email', 'Method', 'Property', 'Created'];
  const lines = rows.map((t) => [
    t.reference,
    t.source,
    t.type,
    t.status,
    t.amount,
    t.user?.name ?? '',
    t.user?.email ?? '',
    t.paymentMethod,
    t.property?.title ?? '',
    t.createdAt,
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oweru-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const TransactionsManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [amountRange, setAmountRange] = useState<[string, string]>(['', '']);
  const [sortBy, setSortBy] = useState<'created' | 'amount' | 'status' | 'type'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const buildFilters = useCallback(() => {
    const filters: Record<string, string> = {
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (debouncedSearch) filters.search = debouncedSearch;
    if (typeFilter !== 'all') filters.type = typeFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (paymentMethodFilter !== 'all') filters.payment_method = paymentMethodFilter;
    if (sourceFilter !== 'all') filters.source = sourceFilter;
    if (dateRange[0]) filters.date_from = dateRange[0];
    if (dateRange[1]) filters.date_to = dateRange[1];
    if (amountRange[0]) filters.amount_min = amountRange[0];
    if (amountRange[1]) filters.amount_max = amountRange[1];

    if (quickFilter === 'pending') filters.status = 'pending';
    if (quickFilter === 'failed') filters.status = 'failed';
    if (quickFilter === 'completed') filters.status = 'completed';
    if (quickFilter === 'commission') filters.source = 'commission';
    if (quickFilter === 'bnb') filters.source = 'bnb';

    return filters;
  }, [
    debouncedSearch, typeFilter, statusFilter, paymentMethodFilter, sourceFilter,
    dateRange, amountRange, sortBy, sortOrder, quickFilter,
  ]);

  const loadTransactions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const filters = buildFilters();
      const [transactionsRes, statsRes] = await Promise.all([
        Api.getAdminTransactions(filters),
        Api.getAdminTransactionStats(),
      ]);

      setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
      setStats(normalizeStats(statsRes.data));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load transactions:', e);
      setError('Could not load transactions. Check your connection and try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildFilters]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleDeleteTransaction = async (id: number) => {
    try {
      setActionLoading(id);
      await Api.deleteAdminTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const statsRes = await Api.getAdminTransactionStats();
      setStats(normalizeStats(statsRes.data));
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      setError('Failed to delete transaction.');
    } finally {
      setActionLoading(null);
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: Transaction['status']) => {
    try {
      setActionLoading(id);
      const response = await Api.updateAdminTransactionStatus(id, newStatus);
      const updated = response.data as Transaction;
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      const statsRes = await Api.getAdminTransactionStats();
      setStats(normalizeStats(statsRes.data));
    } catch (e) {
      console.error('Failed to update transaction:', e);
      setError('Failed to update transaction status.');
    } finally {
      setActionLoading(null);
    }
  };

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
      `Source: ${sourceLabel(transaction.source)}\n` +
      `Type: ${typeLabel(transaction.type)}\n` +
      `Amount: ${fmt(transaction.amount)}\n` +
      `Status: ${transaction.status}\n` +
      `User: ${transaction.user?.name ?? 'Unknown'}\n` +
      `Payment Method: ${transaction.paymentMethod}\n` +
      `Created: ${fmtDate(transaction.createdAt)}\n` +
      `Description: ${transaction.description}`;
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-${transaction.reference}.txt`;
    a.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setSourceFilter('all');
    setDateRange(['', '']);
    setAmountRange(['', '']);
    setQuickFilter('all');
  };

  const hasActiveFilters = useMemo(() =>
    Boolean(
      debouncedSearch || typeFilter !== 'all' || statusFilter !== 'all' ||
      paymentMethodFilter !== 'all' || sourceFilter !== 'all' ||
      dateRange[0] || dateRange[1] || amountRange[0] || amountRange[1] ||
      quickFilter !== 'all',
    ),
  [debouncedSearch, typeFilter, statusFilter, paymentMethodFilter, sourceFilter, dateRange, amountRange, quickFilter]);

  const insights = useMemo(() => {
    const pendingAmount = transactions
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const completedToday = transactions.filter((t) => {
      if (t.status !== 'completed') return false;
      const d = new Date(t.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    const topType = transactions.reduce<Record<string, number>>((acc, t) => {
      acc[t.type] = (acc[t.type] ?? 0) + 1;
      return acc;
    }, {});
    const dominantType = Object.entries(topType).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { pendingAmount, completedToday, dominantType };
  }, [transactions]);

  const quickFilters: { id: QuickFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Needs Action', count: stats?.pending_transactions },
    { id: 'failed', label: 'Failed', count: stats?.failed_transactions },
    { id: 'completed', label: 'Completed' },
    { id: 'commission', label: 'Commissions' },
    { id: 'bnb', label: 'BnB Stays' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(201,168,76,0.15)',
            borderTop: `3px solid ${C.gold}`,
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ color: C.textMuted, ...body, fontSize: 13 }}>Loading transactions…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        .txn-row:hover { border-color: rgba(200,145,40,0.15) !important; background: ${C.goldBg} !important; }
        .txn-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .txn-chip { transition: all 0.2s; cursor: pointer; }
        .txn-chip:hover { border-color: rgba(200,145,40,0.45) !important; }
        .txn-chip.active { background: ${C.goldBg} !important; border-color: ${C.gold} !important; color: ${C.gold} !important; }
      `}</style>
      <div style={pageInner}>

        {/* Header */}
        <div style={adminHeaderStyle}>
          <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <DollarSign size={22} />
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · Finance</div>
                <h1 style={{ ...body, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Transactions</h1>
                <p style={{ color: C.textLight, ...body, fontSize: 14, margin: 0 }}>
                  Live payments, commissions &amp; BnB bookings across the platform.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {lastUpdated && (
                <span style={{ ...body, fontSize: 12, color: C.textLight }}>
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => loadTransactions(true)}
                disabled={refreshing}
                style={{ ...btnPrimary, opacity: refreshing ? 0.7 : 1 }}
              >
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.9s linear infinite' : 'none' }} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ ...card, padding: '12px 16px', marginBottom: 16, borderColor: 'rgba(220,38,38,0.25)', background: C.redBg, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} style={{ color: C.red, flexShrink: 0 }} />
            <span style={{ ...body, fontSize: 13, color: C.red, flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red }}><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total', value: stats.total_transactions.toLocaleString(), color: C.text, icon: FileText },
              { label: 'Revenue', value: fmt(stats.total_revenue), color: C.green, icon: DollarSign },
              { label: 'This Month', value: fmt(stats.revenue_this_month), color: C.gold, icon: TrendingUp },
              { label: 'Net', value: fmt(stats.net_revenue), color: C.green, icon: Banknote },
              { label: 'Pending', value: stats.pending_transactions.toLocaleString(), color: C.amber, icon: Clock },
              { label: 'Completed', value: stats.completed_transactions.toLocaleString(), color: C.green, icon: CheckCircle },
              { label: 'Failed', value: stats.failed_transactions.toLocaleString(), color: C.red, icon: XCircle },
              { label: 'Avg. Amount', value: fmt(stats.avg_transaction_amount), color: C.gold, icon: BarChartIcon },
              { label: 'Rev. Growth', value: fmtPct(stats.revenue_growth), color: stats.revenue_growth >= 0 ? C.green : C.red, icon: TrendingUp },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={13} style={{ color: C.textMuted }} />
                  <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
                </div>
                <div style={{ ...body, fontSize: 17, fontWeight: 700, color, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Smart insights */}
        <div style={{ ...card, padding: '14px 18px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={15} style={{ color: C.gold }} />
            <span style={{ ...body, fontSize: 13, fontWeight: 600, color: C.text }}>Smart Insights</span>
          </div>
          <span style={{ ...body, fontSize: 12, color: C.textSub }}>
            {stats?.pending_transactions ?? 0} pending · {fmt(insights.pendingAmount)} awaiting clearance
          </span>
          <span style={{ ...body, fontSize: 12, color: C.textSub }}>
            {insights.completedToday} completed today
          </span>
          {insights.dominantType && (
            <span style={{ ...body, fontSize: 12, color: C.textSub }}>
              Most common: {typeLabel(insights.dominantType)}
            </span>
          )}
          <span style={{ ...body, fontSize: 12, color: C.textSub }}>
            Txn growth: {fmtPct(stats?.transaction_growth)}
          </span>
        </div>

        {/* Quick filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {quickFilters.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              className={`txn-chip${quickFilter === id ? ' active' : ''}`}
              onClick={() => {
                setQuickFilter(id);
                if (id === 'all') {
                  setStatusFilter('all');
                  setSourceFilter('all');
                } else if (id === 'pending' || id === 'failed' || id === 'completed') {
                  setStatusFilter(id);
                  setSourceFilter('all');
                } else if (id === 'commission' || id === 'bnb') {
                  setSourceFilter(id);
                  setStatusFilter('all');
                }
              }}
              style={{
                ...ghostBtn(quickFilter === id ? C.gold : C.textMuted),
                padding: '6px 12px', fontSize: 12, borderRadius: 999,
              }}
            >
              {label}
              {count != null && count > 0 && (
                <span style={{ marginLeft: 6, opacity: 0.8 }}>({count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...card, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
              <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search reference, user, property…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputCss, flex: 1 }}
              />
            </div>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-input" style={selectCss}>
              <option value="all">All Types</option>
              <option value="rent_payment">Rent Payments</option>
              <option value="bnb_stay">BnB Stays</option>
              <option value="commission">Commissions</option>
              <option value="site_visit">Site Visits</option>
              <option value="service_fee">Service Fees</option>
              <option value="deposit">Deposits</option>
              <option value="refund">Refunds</option>
            </select>

            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setQuickFilter('all'); }} className="admin-input" style={selectCss}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setQuickFilter('all'); }} className="admin-input" style={selectCss}>
              <option value="all">All Sources</option>
              <option value="payment">Payments</option>
              <option value="commission">Commissions</option>
              <option value="bnb">BnB</option>
            </select>

            <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="admin-input" style={selectCss}>
              <option value="all">All Methods</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="admin-input" style={selectCss}>
              <option value="created">Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
              <option value="type">Type</option>
            </select>

            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={ghostBtn(C.gold)} className="txn-btn">
              <ArrowUpDown size={13} />
              {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...body, fontSize: 11, color: C.textMuted }}>Amount:</span>
              <input type="number" placeholder="Min" value={amountRange[0]}
                onChange={(e) => setAmountRange([e.target.value, amountRange[1]])}
                style={{ ...inputCss, width: 90 }} />
              <span style={{ color: C.textMuted }}>–</span>
              <input type="number" placeholder="Max" value={amountRange[1]}
                onChange={(e) => setAmountRange([amountRange[0], e.target.value])}
                style={{ ...inputCss, width: 90 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...body, fontSize: 11, color: C.textMuted }}>Date:</span>
              <input type="date" value={dateRange[0]}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                style={{ ...inputCss, colorScheme: 'dark' }} />
              <span style={{ color: C.textMuted }}>–</span>
              <input type="date" value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                style={{ ...inputCss, colorScheme: 'dark' }} />
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} style={ghostBtn(C.textMuted)} className="txn-btn">
                <X size={13} /> Clear
              </button>
            )}

            <button
              onClick={() => exportCsv(transactions)}
              disabled={transactions.length === 0}
              style={{ ...ghostBtn(C.blue), opacity: transactions.length === 0 ? 0.5 : 1 }}
              className="txn-btn"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>Transactions</h3>
            <span style={{ ...body, fontSize: 12, color: C.textMuted }}>
              {transactions.length} result{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {transactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 20px' }}>
              <DollarSign size={40} style={{ color: C.textMuted, marginBottom: 12 }} />
              <p style={{ ...body, fontSize: 14, color: C.textMuted, margin: '0 0 12px' }}>
                No transactions match your filters.
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} style={ghostBtn(C.gold)} className="txn-btn">Clear filters</button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transactions.map((txn) => {
              const TypeIcon = getTypeIcon(txn.type);
              const MethodIcon = getMethodIcon(txn.paymentMethod);
              const tColor = typeColor(txn.type);
              const sColor = statusColor(txn.status);
              const isLoading = actionLoading === txn.id;

              return (
                <div key={txn.id} className="txn-row" style={{ ...innerRow, opacity: isLoading ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: `${tColor}12`, border: `1px solid ${tColor}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TypeIcon size={20} style={{ color: tColor }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ ...body, fontSize: 13.5, fontWeight: 600, color: C.text, margin: '0 0 4px', lineHeight: 1.4 }}>
                            {txn.description}
                          </p>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted }}>
                              <User size={11} /> {txn.user?.name || 'Unknown'} · {txn.user?.type || '—'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted, fontFamily: 'monospace' }}>
                              <FileText size={11} /> {txn.reference || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ ...body, fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 6 }}>
                            {fmt(txn.amount)}
                          </div>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <span style={pill(sourceColor(txn.source))}>{sourceLabel(txn.source)}</span>
                            <span style={pill(sColor)}>{txn.status}</span>
                            <span style={pill(tColor)}>{typeLabel(txn.type)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                        {([
                          { Icon: MethodIcon, label: txn.paymentMethod?.replace(/_/g, ' ') || 'Unknown' },
                          { Icon: Calendar, label: fmtDate(txn.createdAt) },
                          txn.metadata?.gateway ? { Icon: Building, label: txn.metadata.gateway } : null,
                          txn.metadata?.fees ? { Icon: Receipt, label: `Fees: ${fmt(txn.metadata.fees)}` } : null,
                          txn.metadata?.netAmount ? { Icon: DollarSign, label: `Net: ${fmt(txn.metadata.netAmount)}` } : null,
                          txn.property ? { Icon: Home, label: txn.property.title } : null,
                          txn.metadata?.checkIn ? { Icon: Calendar, label: `${txn.metadata.checkIn} → ${txn.metadata.checkOut}` } : null,
                        ].filter((item): item is { Icon: typeof FileText; label: string } => item != null)).map(({ Icon, label }) => (
                          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted }}>
                            <Icon size={12} /> {label}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={ghostBtn(C.gold)} className="txn-btn" onClick={() => openDetailModal(txn)}>
                          <Eye size={13} /> View
                        </button>
                        <button style={ghostBtn(C.blue)} className="txn-btn" onClick={() => handleDownload(txn)}>
                          <Download size={13} /> Receipt
                        </button>
                        {txn.status === 'pending' && (
                          <>
                            <button style={ghostBtn(C.green)} className="txn-btn" disabled={isLoading}
                              onClick={() => handleStatusChange(txn.id, 'completed')}>
                              <CheckCircle size={13} /> Mark Paid
                            </button>
                            <button style={ghostBtn(C.red)} className="txn-btn" disabled={isLoading}
                              onClick={() => handleStatusChange(txn.id, 'failed')}>
                              <XCircle size={13} /> Mark Failed
                            </button>
                          </>
                        )}
                        <button style={ghostBtn(C.red)} className="txn-btn" disabled={isLoading}
                          onClick={() => openDeleteModal(txn)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail modal */}
        {showDetailModal && selectedTransaction && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999,
          }}>
            <div style={{ ...card, padding: 28, maxWidth: 520, width: '100%', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
              <button onClick={() => setShowDetailModal(false)}
                style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <FileText size={15} style={{ color: C.gold }} />
                <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>Transaction Details</h3>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={pill(sourceColor(selectedTransaction.source))}>{sourceLabel(selectedTransaction.source)}</span>
                <span style={pill(statusColor(selectedTransaction.status))}>{selectedTransaction.status}</span>
                <span style={pill(typeColor(selectedTransaction.type))}>{typeLabel(selectedTransaction.type)}</span>
                <span style={{ ...body, fontSize: 11, color: C.textMuted, alignSelf: 'center', fontFamily: 'monospace' }}>
                  {selectedTransaction.reference}
                </span>
              </div>

              {([
                { label: 'Amount', value: fmt(selectedTransaction.amount) },
                { label: 'Net Amount', value: selectedTransaction.metadata?.netAmount ? fmt(selectedTransaction.metadata.netAmount) : '—' },
                { label: 'Fees', value: selectedTransaction.metadata?.fees ? fmt(selectedTransaction.metadata.fees) : '—' },
                { label: 'User', value: `${selectedTransaction.user?.name ?? '—'} (${selectedTransaction.user?.type ?? '—'})` },
                { label: 'Email', value: selectedTransaction.user?.email ?? '—' },
                { label: 'Payment Method', value: selectedTransaction.paymentMethod?.replace(/_/g, ' ') ?? '—' },
                { label: 'Gateway', value: selectedTransaction.metadata?.gateway ?? '—' },
                { label: 'Property', value: selectedTransaction.property?.title ?? '—' },
                { label: 'Transaction ID', value: selectedTransaction.metadata?.transactionId ?? '—' },
                { label: 'Invoice', value: selectedTransaction.metadata?.invoiceNumber ?? '—' },
                { label: 'Created', value: fmtDate(selectedTransaction.createdAt) },
                selectedTransaction.completedAt ? { label: 'Completed', value: fmtDate(selectedTransaction.completedAt) } : null,
                selectedTransaction.metadata?.checkIn ? { label: 'Stay', value: `${selectedTransaction.metadata.checkIn} → ${selectedTransaction.metadata.checkOut}` } : null,
              ].filter((row): row is { label: string; value: string } => row != null)).map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                  padding: '8px 0', borderBottom: '1px solid rgba(201,168,76,0.07)',
                }}>
                  <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ ...body, fontSize: 12.5, color: C.text, textAlign: 'right' }}>{value}</span>
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
                <button style={{ ...ghostBtn(C.blue), flex: 1, justifyContent: 'center' }} className="txn-btn"
                  onClick={() => handleDownload(selectedTransaction)}>
                  <Download size={13} /> Download
                </button>
                <button style={{ ...ghostBtn(C.textMuted), flex: 1, justifyContent: 'center' }} className="txn-btn"
                  onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete modal */}
        {showDeleteModal && selectedTransaction && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999,
          }}>
            <div style={{ ...card, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
              <AlertTriangle size={40} style={{ color: C.red, marginBottom: 14 }} />
              <h3 style={{ ...body, fontSize: 20, fontWeight: 500, color: C.text, margin: '0 0 10px' }}>
                Delete Transaction
              </h3>
              <p style={{ ...body, fontSize: 13, color: C.textMuted, lineHeight: 1.7, marginBottom: 22 }}>
                Delete <strong style={{ color: C.text, fontFamily: 'monospace' }}>{selectedTransaction.reference}</strong>?<br />
                This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...ghostBtn(C.textMuted), flex: 1, justifyContent: 'center' }} className="txn-btn"
                  onClick={() => { setShowDeleteModal(false); setSelectedTransaction(null); }}>
                  Cancel
                </button>
                <button style={{ ...ghostBtn(C.red), flex: 1, justifyContent: 'center' }} className="txn-btn"
                  disabled={actionLoading === selectedTransaction.id}
                  onClick={() => handleDeleteTransaction(selectedTransaction.id)}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

function BarChartIcon(props: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={props.style}>
      <rect x="3" y="12" width="4" height="9" /><rect x="10" y="8" width="4" height="13" /><rect x="17" y="4" width="4" height="17" />
    </svg>
  );
}

export default TransactionsManagement;
