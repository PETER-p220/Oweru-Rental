import { useState, useEffect } from 'react';
import {
  DollarSign, Eye, Calendar,
  CheckCircle, User, FileText, Percent, Target,
  Award, Trophy, Calculator, X, Download, Mail, RefreshCw,
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss, labelCss, btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle, pill, ghostBtn, innerRow, labelStyle,
} from './adminTheme';

const solidBtn: React.CSSProperties = {
  ...body,
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 18px',
  background: `linear-gradient(135deg, ${C.gold}, ${C.gold})`,
  border: 'none', color: '#111',
  borderRadius: 6, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.03em',
  boxShadow: `0 3px 14px rgba(37,99,235,0.28)`,
};

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusColor = (s: string) =>
  ({ paid: C.green, approved: C.blue, pending: C.amber, cancelled: C.red }[s] ?? C.textMuted);

const typeColor = (t: string) =>
  ({ rent: C.green, site_visit: C.purple, sale: C.blue, referral: C.purple }[t] ?? C.textMuted);

const SplitBar = ({ agentPct, oweruPct }: { agentPct: number; oweruPct: number }) => (
  <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: 'rgba(148,163,184,0.2)', marginTop: 10 }}>
    <div style={{ width: `${agentPct}%`, background: C.green }} title={`Agent ${agentPct}%`} />
    <div style={{ width: `${oweruPct}%`, background: C.gold }} title={`Oweru ${oweruPct}%`} />
  </div>
);

const normalizeCommissionPayment = (payment: any): CommissionPayment => ({
  id: payment.id,
  agent: payment.agent,
  property: payment.property,
  type: payment.type,
  amount: Number(payment.amount || 0),
  grossAmount: Number(payment.gross_amount ?? payment.grossAmount ?? payment.amount ?? 0),
  oweruAmount: Number(payment.oweru_amount ?? payment.oweruAmount ?? 0),
  percentage: Number(payment.percentage || 0),
  status: payment.status,
  dueDate: payment.dueDate || payment.due_date,
  paidDate: payment.paidDate || payment.paid_date,
  reference: payment.reference,
  notes: payment.notes,
  disbursementMethod: payment.disbursement_method ?? payment.disbursementMethod,
  disbursementReference: payment.disbursement_reference ?? payment.disbursementReference,
  disbursementBatchId: payment.disbursement_batch_id ?? payment.disbursementBatchId,
  autoDisbursed: Boolean(payment.auto_disbursed ?? payment.autoDisbursed),
  canMarkPaid: payment.can_mark_paid ?? payment.canMarkPaid ?? true,
  createdAt: payment.createdAt || payment.created_at,
  updatedAt: payment.updatedAt || payment.updated_at,
});

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const monthStartIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const CommissionControl = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'payments' | 'analytics' | 'reports'>('rules');
  const [reportView, setReportView] = useState<'oweru' | 'agents' | 'daily'>('oweru');
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<CommissionPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reportDate, setReportDate] = useState(yesterdayIso);
  const [reportPreview, setReportPreview] = useState<any>(null);
  const [reportRecipient, setReportRecipient] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportAction, setReportAction] = useState<'idle' | 'pdf' | 'email'>('idle');
  const [reportMessage, setReportMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [periodFrom, setPeriodFrom] = useState(monthStartIso);
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [oweruReport, setOweruReport] = useState<any>(null);
  const [agentReport, setAgentReport] = useState<any>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [payoutSummary, setPayoutSummary] = useState<any[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [batchPayingAgentId, setBatchPayingAgentId] = useState<number | null>(null);
  const [payoutMessage, setPayoutMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { loadCommissionData(); }, [activeTab]);

  const loadReportPreview = async (date = reportDate) => {
    try {
      setReportLoading(true);
      setReportMessage(null);
      const res = await Api.getCommissionReportPreview(date);
      const payload = res.data || {};
      setReportPreview(payload.report || payload);
      setReportRecipient(payload.recipient || '');
    } catch (e) {
      console.error('Failed to load report preview:', e);
      setReportMessage({ text: 'Could not load report preview.', ok: false });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      if (reportView === 'daily') loadReportPreview();
      else loadPeriodReports();
    }
    if (activeTab === 'payments') loadPayoutSummary();
  }, [activeTab, reportDate, reportView, periodFrom, periodTo]);

  const loadPeriodReports = async () => {
    try {
      setPeriodLoading(true);
      setReportMessage(null);
      const [oweruRes, agentRes] = await Promise.all([
        Api.getOweruPeriodReport(periodFrom, periodTo),
        Api.getAgentPeriodReport(periodFrom, periodTo),
      ]);
      setOweruReport(oweruRes.data || oweruRes);
      setAgentReport(agentRes.data || agentRes);
    } catch (e) {
      console.error('Failed to load period reports:', e);
      setReportMessage({ text: 'Could not load period reports.', ok: false });
    } finally {
      setPeriodLoading(false);
    }
  };

  const loadPayoutSummary = async () => {
    try {
      setPayoutLoading(true);
      const res = await Api.getAgentPayoutSummary();
      setPayoutSummary(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load payout summary:', e);
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleBatchPayAgent = async (agentRow: any) => {
    const ids = agentRow.payable_commission_ids || [];
    if (ids.length === 0) {
      setPayoutMessage({ text: 'No payable commissions for this agent.', ok: false });
      return;
    }
    try {
      setBatchPayingAgentId(agentRow.agent_id);
      setPayoutMessage(null);
      const res = await Api.processBatchAgentPayout(ids);
      setPayoutMessage({ text: res.message || 'Batch payout recorded.', ok: true });
      await loadCommissionData();
      await loadPayoutSummary();
    } catch (e: any) {
      setPayoutMessage({ text: e?.response?.data?.message || 'Batch payout failed.', ok: false });
    } finally {
      setBatchPayingAgentId(null);
    }
  };

  const loadCommissionData = async () => {
    try {
      setLoading(true);

      const [rulesRes, paymentsRes, statsRes, distRes] = await Promise.all([
        Api.getCommissionRules(),
        Api.getCommissionPayments(),
        Api.getCommissionStats(),
        Api.getCommissionDistribution(),
      ]);

      if (rulesRes.data) {
        setRules(
          (rulesRes.data || []).map((r: any) => ({
            ...r,
            isActive: r.is_active ?? r.isActive ?? true,
            appliesTo: r.applies_to ?? r.appliesTo,
            userType: r.user_type ?? r.userType,
            agentShare: r.agent_share ?? r.agentShare,
            oweruShare: r.oweru_share ?? r.oweruShare,
          })),
        );
      }
      if (paymentsRes.data) {
        setPayments(paymentsRes.data.map(normalizeCommissionPayment));
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
      if (distRes.data) {
        setDistribution(distRes.data);
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
    const payment = payments.find((p) => p.id === id);
    if (payment?.autoDisbursed) {
      setPayoutMessage({ text: 'Already sent via Selcom — syncing status only.', ok: true });
    }
    try {
      const response = await Api.updateCommissionPaymentStatus(id, 'paid');
      setPayments((prev) => prev.map((p) => p.id === id ? normalizeCommissionPayment(response.data) : p));
      await refreshCommissionStats();
      await loadPayoutSummary();
    } catch (e: any) {
      console.error('Failed to mark commission as paid:', e);
      setPayoutMessage({ text: e?.response?.data?.message || 'Could not mark as paid.', ok: false });
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

  const handleDownloadReport = async () => {
    try {
      setReportAction('pdf');
      setReportMessage(null);
      const blob = await Api.downloadCommissionReportPdf(reportDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oweru-commission-report-${reportDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setReportMessage({ text: 'PDF downloaded.', ok: true });
    } catch (e) {
      console.error('PDF download failed:', e);
      setReportMessage({ text: 'Failed to download PDF.', ok: false });
    } finally {
      setReportAction('idle');
    }
  };

  const handleSendReportEmail = async () => {
    try {
      setReportAction('email');
      setReportMessage(null);
      const res = await Api.sendCommissionReportEmail(reportDate);
      setReportMessage({ text: res.message || 'Report emailed successfully.', ok: true });
    } catch (e: any) {
      console.error('Send report failed:', e);
      setReportMessage({ text: e?.response?.data?.message || 'Failed to send report email.', ok: false });
    } finally {
      setReportAction('idle');
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(37,99,235,0.15)',
            borderTop: `3px solid ${C.gold}`,
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ color: C.textMuted, ...body, fontSize: 13 }}>Loading commission data…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const filteredPayments = payments.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  /* ── Render ── */
  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        .cc-row:hover { border-color: rgba(200,145,40,0.15) !important; background: ${C.goldBg} !important; }
        .cc-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
      `}</style>
      <div style={pageInner}>

      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#fff' }}>
          <Percent size={22} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · Commission</div>
            <h1 style={{ ...body, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Commission Control</h1>
            <p style={{ color: C.textLight, ...body, fontSize: 14, margin: 0 }}>
              Manage commission rules, process payments, and track agent earnings.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Commissions', value: stats.totalCommissions,         color: C.text  },
            { label: 'Total Amount',      value: fmt(stats.totalAmount),          color: C.green  },
            { label: 'Pending',           value: stats.pendingCommissions,        color: C.amber  },
            { label: 'Avg. Rate',         value: `${stats.avgCommissionRate}%`,   color: C.gold   },
            { label: 'Top Earner',        value: stats.topEarner?.name || 'N/A',            color: C.purple },
            { label: 'This Month',        value: fmt(stats.thisMonth?.total || 0),      color: C.green  },
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
        {(['rules', 'payments', 'analytics', 'reports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 14px',
              backgroundColor: activeTab === tab ? C.gold : 'transparent',
              border: `1px solid ${activeTab === tab ? C.gold : 'rgba(37,99,235,0.15)'}`,
              color: activeTab === tab ? '#111' : C.textMuted,
              borderRadius: 6, ...body, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'capitalize', letterSpacing: '0.04em',
            }}
          >
            {tab === 'rules' ? 'Rules' : tab === 'payments' ? 'Payments' : tab === 'analytics' ? 'Analytics' : 'Reports'}
          </button>
        ))}
      </div>

      {/* ══ RULES TAB ══ */}
      {activeTab === 'rules' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>Commission Rules</h3>
            <div style={{ ...body, fontSize: 12, color: C.textMuted }}>
              Platform policy (from config)
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
                  <Calculator size={20} style={{ color: rule.isActive ? C.green : C.textMuted }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{rule.name}</h4>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <span style={pill(rule.isActive ? C.green : C.textMuted)}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span style={pill(C.gold)}>{rule.type}</span>
                    </div>
                  </div>

                  <p style={{ ...body, fontSize: 12.5, color: '#9a9080', margin: '0 0 12px', lineHeight: 1.55 }}>
                    {rule.description}
                  </p>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                    {[
                      { icon: Percent, label: `Agent ${rule.agentShare ?? rule.agent_share ?? rule.value}%` },
                      { icon: Percent, label: `Oweru ${rule.oweruShare ?? rule.oweru_share ?? (100 - Number(rule.value || 0))}%` },
                      { icon: Target, label: rule.appliesTo ?? rule.applies_to },
                      { icon: User, label: rule.userType ?? rule.user_type },
                    ].map(({ icon: Icon, label }) => (
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted }}>
                        <Icon size={12} /> {label}
                      </span>
                    ))}
                  </div>
                  {(rule.agentShare != null || rule.agent_share != null) && (
                    <SplitBar
                      agentPct={Number(rule.agentShare ?? rule.agent_share ?? rule.value ?? 0)}
                      oweruPct={Number(rule.oweruShare ?? rule.oweru_share ?? 0)}
                    />
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ ...pill(rule.isActive ? C.green : C.textMuted), fontSize: 11 }}>
                      System policy
                    </span>
                    <span style={{ ...body, fontSize: 12, color: C.textMuted }}>
                      Totals on Analytics tab reflect completed payments using these rates.
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
            <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>Commission Payments</h3>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input" style={selectCss}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {payoutMessage && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13, ...body,
              background: payoutMessage.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: payoutMessage.ok ? C.green : C.red,
              border: `1px solid ${payoutMessage.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {payoutMessage.text}
            </div>
          )}

          <div style={{ marginBottom: 22, padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Smart agent payouts</h4>
              <button type="button" style={ghostBtn(C.textMuted)} className="cc-btn" onClick={loadPayoutSummary} disabled={payoutLoading}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <p style={{ ...body, fontSize: 12, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
              Pay each agent once per batch. Commissions already sent via Selcom are skipped automatically — no duplicate sends.
            </p>
            {payoutLoading ? (
              <div style={{ ...body, fontSize: 13, color: C.textMuted }}>Loading payout summary…</div>
            ) : payoutSummary.length === 0 ? (
              <div style={{ ...body, fontSize: 13, color: C.textMuted }}>No agent commissions yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {payoutSummary.filter((r) => r.pending_count > 0 || r.auto_disbursed_pending_sync > 0).slice(0, 8).map((row) => (
                  <div key={row.agent_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ ...body, fontSize: 13, fontWeight: 700, color: C.text }}>{row.agent_name}</div>
                      <div style={{ ...body, fontSize: 11, color: C.textMuted }}>
                        {row.agent_code} · Pending {fmt(row.pending_amount)} ({row.pending_count})
                        {row.auto_disbursed_pending_sync > 0 && ` · ${row.auto_disbursed_pending_sync} auto-paid (sync)`}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={solidBtn}
                      className="cc-btn"
                      disabled={batchPayingAgentId === row.agent_id || row.pending_count === 0}
                      onClick={() => handleBatchPayAgent(row)}
                    >
                      {batchPayingAgentId === row.agent_id ? 'Processing…' : row.pending_count === 0 ? 'Synced' : `Mark ${row.pending_count} paid`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPayments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: C.textMuted, ...body, fontSize: 13 }}>
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
                      <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {payment.agent.name}
                      </h4>
                      <p style={{ ...body, fontSize: 12, color: C.textMuted, margin: '0 0 6px' }}>
                        {payment.property.title} · Agent share {fmt(payment.amount)}
                        {payment.oweruAmount > 0 && (
                          <> · Oweru {fmt(payment.oweruAmount)}</>
                        )}
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted }}>
                          <User size={11} /> {payment.agent.code}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted }}>
                          <FileText size={11} /> {payment.reference}
                        </span>
                      </div>
                    </div>

                    {/* Amount + badges */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ ...body, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6, lineHeight: 1 }}>
                        {fmt(payment.amount)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <span style={pill(statusColor(payment.status))}>{payment.status}</span>
                        <span style={pill(typeColor(payment.type))}>{payment.type}</span>
                        {payment.autoDisbursed && (
                          <span style={pill(C.blue)}>Selcom auto</span>
                        )}
                        {payment.disbursementMethod === 'manual' && payment.status === 'paid' && (
                          <span style={pill(C.purple)}>Manual</span>
                        )}
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
                      <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, ...body, fontSize: 11.5, color: C.textMuted }}>
                        <Icon size={12} /> {label}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {payment.status === 'pending' && (
                      <>
                        <button
                          style={ghostBtn(C.blue)}
                          className="cc-btn"
                          onClick={() => handleApprovePayment(payment.id)}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        {payment.canMarkPaid !== false && (
                          <button
                            style={ghostBtn(C.green)}
                            className="cc-btn"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            <DollarSign size={13} /> {payment.autoDisbursed ? 'Sync paid' : 'Mark as Paid'}
                          </button>
                        )}
                      </>
                    )}
                    {/* ✅ FIX: was onClick={() => setSelectedPayment(payment); setShowPaymentModal(true)}
                           Now uses a proper block body so both statements execute */}
                    <button
                      style={ghostBtn(C.gold)}
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
          <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: '0 0 22px' }}>Commission Analytics</h3>

          {distribution?.totals && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { key: 'site_visit', title: 'Site visit (50 / 50)', accent: C.purple },
                { key: 'rental', title: 'Rental (70% agent / 30% Oweru)', accent: C.green },
              ].map(({ key, title, accent }) => {
                const block = distribution.totals[key] || { gross: 0, agent: 0, oweru: 0, count: 0 };
                return (
                  <div key={key} style={{ border: '1px solid rgba(37,99,235,0.08)', borderRadius: 8, padding: 18 }}>
                    <div style={{ ...body, fontSize: 13, fontWeight: 600, color: accent, marginBottom: 12 }}>{title}</div>
                    <div style={{ ...body, fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{block.count} payment(s)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', ...body, fontSize: 12, marginBottom: 6 }}>
                      <span>Gross collected</span>
                      <strong style={{ color: C.text }}>{fmt(block.gross)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', ...body, fontSize: 12, marginBottom: 6 }}>
                      <span>Agent share</span>
                      <strong style={{ color: C.green }}>{fmt(block.agent)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', ...body, fontSize: 12 }}>
                      <span>Oweru share</span>
                      <strong style={{ color: C.gold }}>{fmt(block.oweru)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>

            {/* Top performers */}
            <div style={{ border: '1px solid rgba(37,99,235,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Top Performer</h4>
              {stats && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: 'rgba(37,99,235,0.12)',
                    border: '1px solid rgba(37,99,235,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trophy size={18} style={{ color: C.gold }} />
                  </div>
                  <div>
                    <div style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text }}>{stats.topEarner.name}</div>
                    <div style={{ ...body, fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {fmt(stats.topEarner.totalEarned)} · {stats.topEarner.transactions} deal{stats.topEarner.transactions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly summary */}
            <div style={{ border: '1px solid rgba(37,99,235,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>This Month</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Total Commissions', value: fmt(stats.thisMonth.total), color: C.text },
                    { label: 'Paid',              value: fmt(stats.thisMonth.paid),   color: C.green },
                    { label: 'Pending',           value: fmt(stats.thisMonth.pending),color: C.amber },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
                      <span style={{ ...body, fontSize: 12, color: C.textMuted }}>{label}</span>
                      <span style={{ ...body, fontSize: 13, fontWeight: 600, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status breakdown */}
            <div style={{ border: '1px solid rgba(37,99,235,0.08)', borderRadius: 8, padding: 20 }}>
              <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Status Breakdown</h4>
              {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Paid',     value: stats.paidCommissions,      color: C.green },
                    { label: 'Approved', value: stats.approvedCommissions,   color: C.blue  },
                    { label: 'Pending',  value: stats.pendingCommissions,    color: C.amber },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(37,99,235,0.06)' }}>
                      <span style={{ ...body, fontSize: 12, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
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

      {/* ══ REPORTS TAB ══ */}
      {activeTab === 'reports' && (
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: '0 0 6px' }}>Commission Reports</h3>
              <p style={{ ...body, fontSize: 13, color: C.textMuted, margin: 0, maxWidth: 620 }}>
                View Oweru platform earnings and agent (dalali) commissions separately, or open the combined daily report for PDF/email.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
            {([
              { id: 'oweru' as const, label: 'Oweru Report' },
              { id: 'agents' as const, label: 'Agents Report' },
              { id: 'daily' as const, label: 'Daily Combined' },
            ]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setReportView(id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: reportView === id ? C.gold : 'transparent',
                  border: `1px solid ${reportView === id ? C.gold : 'rgba(37,99,235,0.15)'}`,
                  color: reportView === id ? '#111' : C.textMuted,
                  borderRadius: 6, ...body, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {reportMessage && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
              background: reportMessage.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: reportMessage.ok ? C.green : C.red,
              border: `1px solid ${reportMessage.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {reportMessage.text}
            </div>
          )}

          {reportView !== 'daily' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
              <div>
                <label style={labelCss}>From</label>
                <input type="date" className="admin-input" style={inputCss} value={periodFrom} max={periodTo} onChange={(e) => setPeriodFrom(e.target.value)} />
              </div>
              <div>
                <label style={labelCss}>To</label>
                <input type="date" className="admin-input" style={inputCss} value={periodTo} min={periodFrom} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPeriodTo(e.target.value)} />
              </div>
              <button type="button" style={ghostBtn(C.textMuted)} className="cc-btn" onClick={loadPeriodReports} disabled={periodLoading}>
                <RefreshCw size={13} /> {periodLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          )}

          {reportView === 'oweru' && (
            periodLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted, ...body, fontSize: 13 }}>Loading Oweru report…</div>
            ) : oweruReport ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
                  {[
                    { label: 'Transactions', value: oweruReport.totals?.transactions ?? 0 },
                    { label: 'Gross volume', value: fmt(oweruReport.totals?.gross ?? 0) },
                    { label: 'Oweru share', value: fmt(oweruReport.totals?.oweru ?? 0), color: C.gold },
                    { label: 'Agent share (ref)', value: fmt(oweruReport.totals?.agent ?? 0), color: C.green },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ ...statCard, padding: '14px 16px' }}>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>
                      <div style={{ ...body, fontSize: 18, fontWeight: 700, color: color ?? C.text }}>{value}</div>
                    </div>
                  ))}
                </div>
                {oweruReport.by_category && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 22 }}>
                    {[
                      { label: 'Site visits', data: oweruReport.by_category.site_visit },
                      { label: 'Rentals', data: oweruReport.by_category.rental },
                    ].map(({ label, data }) => (
                      <div key={label} style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{ ...body, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{label}</div>
                        <div style={{ ...body, fontSize: 13, color: C.textMuted }}>{data?.count ?? 0} tx · Oweru {fmt(data?.oweru ?? 0)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', ...body, fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#fff' }}>
                        {['Ref', 'Property', 'Type', 'Gross', 'Oweru', 'Agent', 'Paid'].map((h) => (
                          <th key={h} style={{ textAlign: ['Gross', 'Oweru', 'Agent'].includes(h) ? 'right' : 'left', padding: '8px 10px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(oweruReport.rows ?? []).map((row: any) => (
                        <tr key={row.reference} style={{ borderBottom: `1px solid rgba(37,99,235,0.08)` }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{row.reference}</td>
                          <td style={{ padding: '8px 10px' }}>{row.property}</td>
                          <td style={{ padding: '8px 10px' }}>{row.type}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.gross)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: C.gold }}>{fmt(row.oweru_amount)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.agent_amount)}</td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: C.textMuted }}>{row.paid_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted, ...body, fontSize: 13 }}>No Oweru report data for this period.</div>
            )
          )}

          {reportView === 'agents' && (
            periodLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted, ...body, fontSize: 13 }}>Loading agents report…</div>
            ) : agentReport ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
                  {[
                    { label: 'Transactions', value: agentReport.totals?.transactions ?? 0 },
                    { label: 'Gross volume', value: fmt(agentReport.totals?.gross ?? 0) },
                    { label: 'Agent commissions', value: fmt(agentReport.totals?.agent ?? 0), color: C.green },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ ...statCard, padding: '14px 16px' }}>
                      <div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>
                      <div style={{ ...body, fontSize: 18, fontWeight: 700, color: color ?? C.text }}>{value}</div>
                    </div>
                  ))}
                </div>

                {agentReport.agent_breakdown?.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>Per-agent breakdown</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', ...body, fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#1e293b', color: '#fff' }}>
                            {['Agent', 'Code', 'Site visit', 'Rental', 'Total'].map((h) => (
                              <th key={h} style={{ textAlign: h === 'Agent' || h === 'Code' ? 'left' : 'right', padding: '8px 10px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {agentReport.agent_breakdown.map((row: any) => (
                            <tr key={row.code} style={{ borderBottom: `1px solid rgba(37,99,235,0.08)` }}>
                              <td style={{ padding: '8px 10px' }}>{row.agent}</td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{row.code}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.site_visit_commission)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.rental_commission)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(row.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>Agent commission transactions</h4>
                <div style={{ overflowX: 'auto', marginBottom: 22 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', ...body, fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Ref', 'Property', 'Agent', 'Gross', 'Agent share', 'Oweru', 'Paid'].map((h) => (
                          <th key={h} style={{ textAlign: ['Gross', 'Agent share', 'Oweru'].includes(h) ? 'right' : 'left', padding: '8px 10px', color: C.textMuted, fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(agentReport.rows ?? []).map((row: any) => (
                        <tr key={row.reference} style={{ borderBottom: `1px solid rgba(37,99,235,0.06)` }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{row.reference}</td>
                          <td style={{ padding: '8px 10px' }}>{row.property}</td>
                          <td style={{ padding: '8px 10px' }}>{row.agent}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.gross)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: C.green }}>{fmt(row.agent_amount)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.oweru_amount)}</td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: C.textMuted }}>{row.paid_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(agentReport.commission_ledger ?? []).length > 0 && (
                  <>
                    <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>Commission ledger (payout status)</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', ...body, fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {['Ref', 'Agent', 'Property', 'Amount', 'Status', 'Method', 'Paid'].map((h) => (
                              <th key={h} style={{ textAlign: h === 'Amount' ? 'right' : 'left', padding: '8px 10px', color: C.textMuted, fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {agentReport.commission_ledger.map((row: any) => (
                            <tr key={row.id} style={{ borderBottom: `1px solid rgba(37,99,235,0.06)` }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{row.reference}</td>
                              <td style={{ padding: '8px 10px' }}>{row.agent}</td>
                              <td style={{ padding: '8px 10px' }}>{row.property}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(row.amount)}</td>
                              <td style={{ padding: '8px 10px' }}><span style={pill(statusColor(row.status))}>{row.status}</span></td>
                              <td style={{ padding: '8px 10px' }}>{row.disbursement_method || '—'}</td>
                              <td style={{ padding: '8px 10px', fontSize: 11, color: C.textMuted }}>{row.paid_at || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted, ...body, fontSize: 13 }}>No agent report data for this period.</div>
            )
          )}

          {reportView === 'daily' && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <p style={{ ...body, fontSize: 13, color: C.textMuted, margin: 0, maxWidth: 560 }}>
                  Combined daily report emailed to Oweru each morning. Preview, download PDF, or resend.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={ghostBtn(C.textMuted)} className="cc-btn" onClick={() => loadReportPreview()} disabled={reportLoading}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                  <button type="button" style={solidBtn} className="cc-btn" onClick={handleDownloadReport} disabled={reportAction !== 'idle' || reportLoading}>
                    <Download size={13} /> {reportAction === 'pdf' ? 'Downloading…' : 'Download PDF'}
                  </button>
                  <button type="button" style={solidBtn} className="cc-btn" onClick={handleSendReportEmail} disabled={reportAction !== 'idle' || reportLoading}>
                    <Mail size={13} /> {reportAction === 'email' ? 'Sending…' : 'Email report'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
                <div>
                  <label style={labelCss}>Report date</label>
                  <input
                    type="date"
                    className="admin-input"
                    style={inputCss}
                    value={reportDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
                {reportRecipient && (
                  <div style={{ ...body, fontSize: 12, color: C.textMuted, paddingBottom: 10 }}>
                    Scheduled recipient: <strong style={{ color: C.text }}>{reportRecipient}</strong>
                  </div>
                )}
              </div>

              {reportLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.textMuted, ...body, fontSize: 13 }}>Loading report…</div>
              ) : reportPreview ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
                    {[
                      { label: 'Site visits', value: reportPreview.site_visits?.totals?.count ?? 0, sub: fmt(reportPreview.site_visits?.totals?.gross ?? 0) },
                      { label: 'Rentals paid', value: reportPreview.rentals?.totals?.count ?? 0, sub: fmt(reportPreview.rentals?.totals?.gross ?? 0) },
                      { label: 'Oweru share', value: fmt(reportPreview.grand_totals?.oweru ?? 0), sub: 'Platform' },
                      { label: 'Dalali share', value: fmt(reportPreview.grand_totals?.agent ?? 0), sub: 'Agents' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} style={{ ...statCard, padding: '14px 16px' }}>
                        <div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>
                        <div style={{ ...body, fontSize: 18, fontWeight: 700, color: C.text }}>{value}</div>
                        <div style={{ ...body, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>
                      </div>
                    ))}
                  </div>

                  {reportPreview.agent_breakdown?.length > 0 && (
                    <div style={{ marginBottom: 22 }}>
                      <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>Dalali breakdown</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', ...body, fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: '#1e293b', color: '#fff' }}>
                              {['Agent', 'Code', 'Site visit', 'Rental', 'Total'].map((h) => (
                                <th key={h} style={{ textAlign: h === 'Agent' || h === 'Code' ? 'left' : 'right', padding: '8px 10px' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reportPreview.agent_breakdown.map((row: any) => (
                              <tr key={row.code} style={{ borderBottom: `1px solid rgba(37,99,235,0.08)` }}>
                                <td style={{ padding: '8px 10px' }}>{row.agent}</td>
                                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{row.code}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.site_visit_commission)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.rental_commission)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(row.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {[
                    { title: 'Site visit payments', rows: reportPreview.site_visits?.rows ?? [] },
                    { title: 'Rental payments', rows: reportPreview.rentals?.rows ?? [] },
                  ].map(({ title, rows }) => (
                    rows.length > 0 ? (
                      <div key={title} style={{ marginBottom: 20 }}>
                        <h4 style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>{title}</h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', ...body, fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                {['Ref', 'Property', 'Agent', 'Gross', 'Oweru', 'Dalali', 'Paid'].map((h) => (
                                  <th key={h} style={{ textAlign: h.includes('Gross') || h.includes('Oweru') || h.includes('Dalali') ? 'right' : 'left', padding: '8px 10px', color: C.textMuted, fontWeight: 600 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row: any) => (
                                <tr key={row.reference} style={{ borderBottom: `1px solid rgba(37,99,235,0.06)` }}>
                                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{row.reference}</td>
                                  <td style={{ padding: '8px 10px' }}>{row.property}</td>
                                  <td style={{ padding: '8px 10px' }}>{row.agent}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.gross)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.oweru)}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(row.agent_amount)}</td>
                                  <td style={{ padding: '8px 10px', fontSize: 11, color: C.textMuted }}>{row.paid_at}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null
                  ))}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: C.textMuted, ...body, fontSize: 13 }}>
                  No report data for this date.
                </div>
              )}
            </>
          )}
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
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Award size={16} style={{ color: C.gold }} />
              <h3 style={{ ...body, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>
                Payment Details
              </h3>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={pill(statusColor(selectedPayment.status))}>{selectedPayment.status}</span>
              <span style={pill(typeColor(selectedPayment.type))}>{selectedPayment.type}</span>
              {selectedPayment.autoDisbursed && <span style={pill(C.blue)}>Selcom auto</span>}
              {selectedPayment.disbursementMethod && (
                <span style={pill(C.purple)}>{selectedPayment.disbursementMethod}</span>
              )}
              <span style={{ ...body, fontSize: 11, color: C.textMuted, alignSelf: 'center', fontFamily: 'monospace' }}>
                {selectedPayment.reference}
              </span>
            </div>

            {[
              { label: 'Agent',         value: `${selectedPayment.agent.name} (${selectedPayment.agent.code})` },
              { label: 'Property',      value: selectedPayment.property.title },
              { label: 'Location',      value: selectedPayment.property.address },
              { label: 'Property Price',value: fmt(selectedPayment.property.price) },
              { label: 'Agent share',   value: `${fmt(selectedPayment.amount)} (${selectedPayment.percentage}%)` },
              selectedPayment.oweruAmount > 0 ? { label: 'Oweru share', value: fmt(selectedPayment.oweruAmount) } : null,
              { label: 'Due Date',      value: fmtDate(selectedPayment.dueDate) },
              selectedPayment.paidDate ? { label: 'Paid Date', value: fmtDate(selectedPayment.paidDate) } : null,
              selectedPayment.disbursementReference ? { label: 'Disbursement ref', value: selectedPayment.disbursementReference } : null,
              selectedPayment.disbursementBatchId ? { label: 'Batch ID', value: selectedPayment.disbursementBatchId } : null,
              selectedPayment.notes    ? { label: 'Notes',     value: selectedPayment.notes }               : null,
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                padding: '9px 0', borderBottom: '1px solid rgba(37,99,235,0.07)',
              }}>
                <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ ...body, fontSize: 12.5, color: C.text, textAlign: 'right' }}>{value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {selectedPayment.status === 'pending' && (
                <>
                  <button
                    style={{ ...ghostBtn(C.blue), flex: 1, justifyContent: 'center' }}
                    className="cc-btn"
                    onClick={() => { handleApprovePayment(selectedPayment.id); closePaymentModal(); }}
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  {selectedPayment.canMarkPaid !== false && (
                    <button
                      style={{ ...ghostBtn(C.green), flex: 1, justifyContent: 'center' }}
                      className="cc-btn"
                      onClick={() => { handleMarkAsPaid(selectedPayment.id); closePaymentModal(); }}
                    >
                      <DollarSign size={13} /> {selectedPayment.autoDisbursed ? 'Sync paid' : 'Mark Paid'}
                    </button>
                  )}
                </>
              )}
              <button
                style={{ ...ghostBtn(C.textMuted), flex: 1, justifyContent: 'center' }}
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
    </div>
  );
};

export default CommissionControl;
