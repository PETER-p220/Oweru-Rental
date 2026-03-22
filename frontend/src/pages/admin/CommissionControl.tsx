import { useState, useEffect } from 'react';
import {
  DollarSign, Eye, Calendar,
  CheckCircle, User, FileText, Percent, Target,
  Award, Trophy, Calculator, X,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ───────────────────────────────────────────────── */
interface CommissionRule {
  id: number;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  appliesTo: 'all' | 'rent' | 'sale' | 'commission' | 'referral';
  userType: 'agent' | 'landlord' | 'admin' | 'all';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommissionPayment {
  id: number;
  agent: { id: number; name: string; email: string; code: string };
  property: { id: number; title: string; address: string; price: number };
  type: 'rent' | 'sale' | 'referral';
  amount: number;
  percentage: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  dueDate: string;
  paidDate?: string;
  reference: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CommissionStats {
  totalCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  totalAmount: number;
  avgCommissionRate: number;
  topEarner: { name: string; totalEarned: number; transactions: number };
  thisMonth: { total: number; paid: number; pending: number };
}

/* ─── Shared style tokens ────────────────────────────────── */
const tk = {
  gold:   '#c9a84c',
  goldLt: '#e8c97a',
  dark:   '#080808',
  dark2:  '#0e0e0e',
  dark3:  '#141414',
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
  backgroundColor: 'transparent',
  border: 'rgba(201,168,76,0.07) solid 1px',
  borderRadius: 8,
  padding: 20,
};

const metaBox: React.CSSProperties = {
  backgroundColor: 'rgba(201,168,76,0.03)',
  border: '1px solid rgba(201,168,76,0.08)',
  borderRadius: 6,
  padding: '10px 14px',
};

const labelStyle: React.CSSProperties = {
  ...body, fontSize: 10, fontWeight: 500,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: tk.muted, marginBottom: 2,
};

const pill = (color: string): React.CSSProperties => ({
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 9px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 999,
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
  color,
  borderRadius: 6,
  fontSize: 12, fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.18s',
});

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px',
  background: `linear-gradient(135deg, ${tk.gold}, ${tk.goldLt})`,
  border: 'none', color: '#111',
  borderRadius: 6, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.03em',
  boxShadow: `0 3px 14px rgba(201,168,76,0.28)`,
};

const selectStyle: React.CSSProperties = {
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

const statusColor = (s: string) =>
  ({ paid: tk.green, approved: tk.blue, pending: tk.amber, cancelled: tk.red }[s] ?? tk.muted);

const typeColor = (t: string) =>
  ({ rent: tk.green, sale: tk.blue, referral: tk.purple }[t] ?? tk.muted);

const normalizeCommissionPayment = (payment: any): CommissionPayment => ({
  id: payment.id,
  agent: payment.agent,
  property: payment.property,
  type: payment.type,
  amount: Number(payment.amount || 0),
  percentage: Number(payment.percentage || 0),
  status: payment.status,
  dueDate: payment.dueDate || payment.due_date,
  paidDate: payment.paidDate || payment.paid_date,
  reference: payment.reference,
  notes: payment.notes,
  createdAt: payment.createdAt || payment.created_at,
  updatedAt: payment.updatedAt || payment.updated_at,
});

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const CommissionControl = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'payments' | 'analytics'>('rules');
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<CommissionPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => { loadCommissionData(); }, [activeTab]);

  const loadCommissionData = async () => {
    try {
      setLoading(true);

      const [rulesRes, paymentsRes, statsRes] = await Promise.all([
        Api.getCommissionRules(),
        Api.getCommissionPayments(),
        Api.getCommissionStats(),
      ]);

      if (rulesRes.data) {
        setRules(rulesRes.data);
      }
      if (paymentsRes.data) {
        setPayments(paymentsRes.data.map(normalizeCommissionPayment));
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (e) {
      console.error('Failed to load commission data:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshCommissionStats = async () => {
    const statsRes = await Api.getCommissionStats();
    setStats(statsRes.data);
  };

  const handleApprovePayment = async (id: number) => {
    try {
      const response = await Api.updateCommissionPaymentStatus(id, 'approved');
      setPayments((prev) => prev.map((p) => p.id === id ? normalizeCommissionPayment(response.data) : p));
      await refreshCommissionStats();
    } catch (e) {
      console.error('Failed to approve commission payment:', e);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      const response = await Api.updateCommissionPaymentStatus(id, 'paid');
      setPayments((prev) => prev.map((p) => p.id === id ? normalizeCommissionPayment(response.data) : p));
      await refreshCommissionStats();
    } catch (e) {
      console.error('Failed to mark commission as paid:', e);
    }
  };

  /* ── Open payment detail modal ── */
  const openPaymentModal = (payment: CommissionPayment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

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
          <p style={{ color: tk.muted, ...body, fontSize: 13 }}>Loading commission data…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const filteredPayments = payments.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        .cc-row:hover { border-color: rgba(201,168,76,0.15) !important; background: rgba(201,168,76,0.015) !important; }
        .cc-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .cc-btn:active { transform: scale(.97); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Percent size={22} style={{ color: tk.gold }} />
          <h1 style={{ ...serif, fontSize: 26, fontWeight: 600, color: tk.cream, margin: 0, letterSpacing: '-0.02em' }}>
            Commission Control
          </h1>
        </div>
        <p style={{ color: tk.muted, ...body, fontSize: 13, margin: 0 }}>
          Manage commission rules, process payments, and track agent earnings.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Commissions', value: stats.totalCommissions,         color: tk.cream  },
            { label: 'Total Amount',      value: fmt(stats.totalAmount),          color: tk.green  },
            { label: 'Pending',           value: stats.pendingCommissions,        color: tk.amber  },
            { label: 'Avg. Rate',         value: `${stats.avgCommissionRate}%`,   color: tk.gold   },
            { label: 'Top Earner',        value: stats.topEarner?.name || 'N/A',            color: tk.purple },
            { label: 'This Month',        value: fmt(stats.thisMonth?.total || 0),      color: tk.green  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ ...body, fontSize: 20, fontWeight: 700, color, marginBottom: 4, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
              <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab toggle ── */}
      <div style={{ ...card, padding: 4, marginBottom: 20, display: 'flex', gap: 4 }}>
        {(['rules', 'payments', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 14px',
              backgroundColor: activeTab === tab ? tk.gold : 'transparent',
              border: `1px solid ${activeTab === tab ? tk.gold : 'rgba(201,168,76,0.15)'}`,
              color: activeTab === tab ? '#111' : tk.muted,
              borderRadius: 6, ...body, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'capitalize', letterSpacing: '0.04em',
            }}
          >
            {tab === 'rules' ? 'Rules' : tab === 'payments' ? 'Payments' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* ══ RULES TAB ══ */}
      {activeTab === 'rules' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Commission Rules</h3>
            <div style={{ ...body, fontSize: 12, color: tk.muted }}>
              Default rule shown from live commission data
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map((rule) => (
              <div key={rule.id} className="cc-row" style={{
                ...innerRow,
                display: 'flex', alignItems: 'flex-start', gap: 18,
                transition: 'all 0.2s',
              }}>
                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: rule.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.10)',
                  border: `1px solid ${rule.isActive ? 'rgba(16,185,129,0.28)' : 'rgba(107,114,128,0.22)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calculator size={20} style={{ color: rule.isActive ? tk.green : tk.muted }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: 0 }}>{rule.name}</h4>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <span style={pill(rule.isActive ? tk.green : tk.muted)}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span style={pill(tk.gold)}>{rule.type}</span>
                    </div>
                  </div>

                  <p style={{ ...body, fontSize: 12.5, color: '#9a9080', margin: '0 0 12px', lineHeight: 1.55 }}>
                    {rule.description}
                  </p>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { icon: Percent,   label: rule.type === 'percentage' ? `${rule.value}%` : fmt(rule.value) },
                      rule.minAmount ? { icon: DollarSign, label: `Min: ${fmt(rule.minAmount)}` }  : null,
                      rule.maxAmount ? { icon: DollarSign, label: `Max: ${fmt(rule.maxAmount)}` }  : null,
                      { icon: User,      label: rule.userType },
                      { icon: Target,    label: rule.appliesTo },
                    ].filter(Boolean).map(({ icon: Icon, label }: any) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                        <Icon size={12} /> {label}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ ...pill(rule.isActive ? tk.green : tk.muted), fontSize: 11 }}>
                      System policy
                    </span>
                    <span style={{ ...body, fontSize: 12, color: tk.muted }}>
                      This default rule is derived from live commission records and is read-only here.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ PAYMENTS TAB ══ */}
      {activeTab === 'payments' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>Commission Payments</h3>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPayments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: tk.muted, ...body, fontSize: 13 }}>
                No payments match the selected filter.
              </div>
            )}

            {filteredPayments.map((payment) => (
              <div key={payment.id} className="cc-row" style={{
                ...innerRow,
                display: 'flex', alignItems: 'flex-start', gap: 18,
                transition: 'all 0.2s',
              }}>
                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: `${statusColor(payment.status)}12`,
                  border: `1px solid ${statusColor(payment.status)}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Award size={20} style={{ color: statusColor(payment.status) }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {payment.agent.name}
                      </h4>
                      <p style={{ ...body, fontSize: 12, color: tk.muted, margin: '0 0 6px' }}>
                        {payment.property.title}
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <User size={11} /> {payment.agent.code}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                          <FileText size={11} /> {payment.reference}
                        </span>
                      </div>
                    </div>

                    {/* Amount + badges */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ ...body, fontSize: 20, fontWeight: 700, color: tk.cream, marginBottom: 6, lineHeight: 1 }}>
                        {fmt(payment.amount)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <span style={pill(statusColor(payment.status))}>{payment.status}</span>
                        <span style={pill(typeColor(payment.type))}>{payment.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { icon: Percent,      label: `${payment.percentage}%` },
                      { icon: DollarSign,   label: `Property: ${fmt(payment.property.price)}` },
                      { icon: Calendar,     label: `Due: ${fmtDate(payment.dueDate)}` },
                      payment.paidDate ? { icon: CheckCircle, label: `Paid: ${fmtDate(payment.paidDate)}` } : null,
                    ].filter(Boolean).map(({ icon: Icon, label }: any) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: tk.muted }}>
                        <Icon size={12} /> {label}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {payment.status === 'pending' && (
                      <>
                        <button
                          style={ghostBtn(tk.blue)}
                          className="cc-btn"
                          onClick={() => handleApprovePayment(payment.id)}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          style={ghostBtn(tk.green)}
                          className="cc-btn"
                          onClick={() => handleMarkAsPaid(payment.id)}
                        >
                          <DollarSign size={13} /> Mark as Paid
                        </button>
                      </>
                    )}
                    {/* ✅ FIX: was onClick={() => setSelectedPayment(payment); setShowPaymentModal(true)}
                           Now uses a proper block body so both statements execute */}
                    <button
                      style={ghostBtn(tk.gold)}
                      className="cc-btn"
                      onClick={() => { openPaymentModal(payment); }}
                    >
                      <Eye size={13} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ ANALYTICS TAB ══ */}
      {activeTab === 'analytics' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: '0 0 22px' }}>Commission Analytics</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

            {/* Top performers */}
            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>Top Performer</h4>
              {stats && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: 'rgba(201,168,76,0.12)',
                    border: '1px solid rgba(201,168,76,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trophy size={18} style={{ color: tk.gold }} />
                  </div>
                  <div>
                    <div style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream }}>{stats.topEarner.name}</div>
                    <div style={{ ...body, fontSize: 12, color: tk.muted, marginTop: 2 }}>
                      {fmt(stats.topEarner.totalEarned)} · {stats.topEarner.transactions} deal{stats.topEarner.transactions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly summary */}
            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>This Month</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Total Commissions', value: fmt(stats.thisMonth.total), color: tk.cream },
                    { label: 'Paid',              value: fmt(stats.thisMonth.paid),   color: tk.green },
                    { label: 'Pending',           value: fmt(stats.thisMonth.pending),color: tk.amber },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ ...body, fontSize: 12, color: tk.muted }}>{label}</span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 600, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status breakdown */}
            <div style={{ border: '1px solid rgba(201,168,76,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: tk.cream, margin: '0 0 16px' }}>Status Breakdown</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Paid',     value: stats.paidCommissions,      color: tk.green },
                    { label: 'Approved', value: stats.approvedCommissions,   color: tk.blue  },
                    { label: 'Pending',  value: stats.pendingCommissions,    color: tk.amber },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                      <span style={{ ...body, fontSize: 12, color: tk.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {label}
                      </span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYMENT DETAIL MODAL ══ */}
      {showPaymentModal && selectedPayment && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 999,
        }}>
          <div style={{ ...card, padding: 28, maxWidth: 500, width: '100%', position: 'relative' }}>
            <button
              onClick={closePaymentModal}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: tk.muted, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Award size={16} style={{ color: tk.gold }} />
              <h3 style={{ ...serif, fontSize: 18, fontWeight: 500, color: tk.cream, margin: 0 }}>
                Payment Details
              </h3>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span style={pill(statusColor(selectedPayment.status))}>{selectedPayment.status}</span>
              <span style={pill(typeColor(selectedPayment.type))}>{selectedPayment.type}</span>
              <span style={{ ...body, fontSize: 11, color: tk.muted, alignSelf: 'center', fontFamily: 'monospace' }}>
                {selectedPayment.reference}
              </span>
            </div>

            {[
              { label: 'Agent',         value: `${selectedPayment.agent.name} (${selectedPayment.agent.code})` },
              { label: 'Property',      value: selectedPayment.property.title },
              { label: 'Location',      value: selectedPayment.property.address },
              { label: 'Property Price',value: fmt(selectedPayment.property.price) },
              { label: 'Commission',    value: `${fmt(selectedPayment.amount)} (${selectedPayment.percentage}%)` },
              { label: 'Due Date',      value: fmtDate(selectedPayment.dueDate) },
              selectedPayment.paidDate ? { label: 'Paid Date', value: fmtDate(selectedPayment.paidDate) } : null,
              selectedPayment.notes    ? { label: 'Notes',     value: selectedPayment.notes }               : null,
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                padding: '9px 0', borderBottom: '1px solid rgba(201,168,76,0.07)',
              }}>
                <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...body, fontSize: 12.5, color: tk.cream, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {selectedPayment.status === 'pending' && (
                <>
                  <button
                    style={{ ...ghostBtn(tk.blue), flex: 1, justifyContent: 'center' }}
                    className="cc-btn"
                    onClick={() => { handleApprovePayment(selectedPayment.id); closePaymentModal(); }}
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    style={{ ...ghostBtn(tk.green), flex: 1, justifyContent: 'center' }}
                    className="cc-btn"
                    onClick={() => { handleMarkAsPaid(selectedPayment.id); closePaymentModal(); }}
                  >
                    <DollarSign size={13} /> Mark Paid
                  </button>
                </>
              )}
              <button
                style={{ ...ghostBtn(tk.muted), flex: 1, justifyContent: 'center' }}
                className="cc-btn"
                onClick={closePaymentModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionControl;
