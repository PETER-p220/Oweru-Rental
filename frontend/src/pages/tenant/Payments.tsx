import { useEffect, useMemo, useState, useCallback } from 'react';
import { CreditCard, Clock, Calendar, AlertCircle, TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './tenantPageStyles';
import { usePaymentPolling } from '../../hooks/usePaymentPolling';
import { paymentConfirmationMessage } from '../../utils/paymentStatus';

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon: Icon, accent = false }: {
  label: string; value: string | number; icon: any; accent?: boolean;
}) => (
  <div className={`stat-card${accent ? ' accent' : ''}`}>
    <div className="stat-card-icon"><Icon size={16} /></div>
    <div className="stat-card-body">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  </div>
);

/* ─── Status badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    paid:      { color: '#166534', bg: '#DCFCE7', border: '#BBF7D0' },
    completed: { color: '#166534', bg: '#DCFCE7', border: '#BBF7D0' },
    pending:   { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
    failed:    { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
    cancelled: { color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
  };
  const s = map[status] ?? { color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   PAYMENTS COMPONENT
───────────────────────────────────────────────────────────── */
const Payments = () => {
  const [payments, setPayments]   = useState<any[]>([]);
  const [methods, setMethods]     = useState<any[]>([]);
  const [stats, setStats]         = useState<any>({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paying, setPaying]       = useState(false);
  const [payMessage, setPayMessage] = useState('');
  const [payResult, setPayResult] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [activePayment, setActivePayment] = useState<any | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel' | 'halopesa'>('tigo');
  const [rentableProps, setRentableProps] = useState<any[]>([]);
  const [extraPropertyId, setExtraPropertyId] = useState('');
  const [extraMonths, setExtraMonths] = useState(1);
  const [creatingExtra, setCreatingExtra] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [paymentsRes, methodsRes, statsRes, propsRes] = await Promise.all([
        Api.getMyPayments(), Api.getPaymentMethods(), Api.getPaymentStats(), Api.getRentableProperties(),
      ]);
      const list = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      setPayments(list.filter((p: any) => p.type !== 'site_visit'));
      setMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);
      setStats(statsRes.data || {});
      const props = Array.isArray(propsRes.data) ? propsRes.data : [];
      setRentableProps(props);
      if (props[0]?.id && !extraPropertyId) setExtraPropertyId(String(props[0].id));
      if (methodsRes.data?.[0]?.id) {
        setPaymentProvider(methodsRes.data[0].id as typeof paymentProvider);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payments.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const nextPending = useMemo(() => payments.find((p) => p.status === 'pending' || p.status === 'failed') || null, [payments]);
  const selectedExtraProp = useMemo(
    () => rentableProps.find((p) => String(p.id) === String(extraPropertyId)),
    [rentableProps, extraPropertyId],
  );
  const extraTotal = (selectedExtraProp?.monthly_rent || 0) * extraMonths;

  const openPayModal = (payment?: any) => {
    setActivePayment(payment || nextPending);
    setPayModalOpen(true);
    setPayMessage('');
    setPayResult('idle');
    setPendingPaymentId(null);
    setPhoneNumber('');
  };

  const handleCreateAdditionalMonths = async () => {
    if (!extraPropertyId) return;
    setCreatingExtra(true);
    setError('');
    try {
      const res = await Api.createAdditionalMonthsPayment(Number(extraPropertyId), extraMonths);
      const payment = res.data;
      await load();
      if (payment?.id) {
        openPayModal(payment);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to create additional months payment.');
    } finally {
      setCreatingExtra(false);
    }
  };

  const pollMonthly = useCallback(
    () => Api.checkMonthlyPaymentStatus(pendingPaymentId!),
    [pendingPaymentId],
  );

  usePaymentPolling(
    payResult === 'waiting' && pendingPaymentId != null,
    String(pendingPaymentId ?? ''),
    pollMonthly,
    {
      onPaid: async (message) => {
        setPayResult('success');
        setPayMessage(message || paymentConfirmationMessage('monthly', 'paid'));
        await load();
      },
      onFailed: (message) => {
        setPayResult('error');
        setPayMessage(message || paymentConfirmationMessage('monthly', 'failed'));
      },
      onTimeout: (msg) => setPayMessage(msg),
    },
  );

  const handlePay = async () => {
    const target = activePayment || nextPending;
    if (!target) return;
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPayMessage('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    setPaying(true);
    setPayMessage('');
    setPayResult('idle');
    try {
      const res = await Api.makePayment(target.id, {
        phoneNumber: phoneNumber.trim(),
        provider: paymentProvider,
      });
      const paymentId = res.data?.payment_id ?? target.id;
      setPendingPaymentId(paymentId);
      setPayResult('waiting');
      setPayMessage(res.message || `USSD prompt sent. Approve on your ${paymentProvider.toUpperCase()} phone.`);
    } catch (err: any) {
      setPayResult('error');
      setPayMessage(err?.response?.data?.message || err?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  const closePayModal = () => {
    if (payResult === 'waiting') return;
    setPayModalOpen(false);
    setPayResult('idle');
    setPendingPaymentId(null);
  };

  const providers = methods.length > 0
    ? methods
    : [
        { id: 'tigo', name: 'Tigo Pesa' },
        { id: 'mpesa', name: 'M-Pesa' },
        { id: 'airtel', name: 'Airtel Money' },
        { id: 'halopesa', name: 'Halopesa' },
      ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .pay-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .pay-header-inner { max-width: 1280px; margin: 0 auto; padding: 40px 40px 32px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .pay-eyebrow { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 5px 12px; border-radius: 20px; }
        .pay-heading { font-family: 'Inter', sans-serif; font-size: clamp(22px, 3.4vw, 30px); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; color: #0F172A; margin: 0; }
        .pay-tagline { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; color: #64748B; margin: 8px 0 0; }

        /* ── Stat cards — always one row, shrink on mobile ── */
        .stats-row { max-width: 1280px; margin: 0 auto; padding: 24px 40px 0; display: flex; gap: 14px; }
        .stat-card { flex: 1; min-width: 0; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(15,23,42,0.09); border-color: #CBD5E1; }
        .stat-card.accent { background: #0F172A; border-color: #0F172A; }
        .stat-card-icon { width: 34px; height: 34px; border-radius: 9px; background: #F1F5F9; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0; }
        .stat-card.accent .stat-card-icon { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.18); color: #FFFFFF; }
        .stat-card-body { min-width: 0; }
        .stat-card-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #64748B; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-card.accent .stat-card-label { color: rgba(255,255,255,0.6); }
        .stat-card-value { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-card.accent .stat-card-value { color: #FFFFFF; }

        .pay-panel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }

        .pay-tag {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #64748B;
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .pay-tag::before { content: ''; width: 20px; height: 1px; background: #CBD5E1; }

        table.pay-table { width: 100%; border-collapse: collapse; }
        table.pay-table thead th {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: #64748B;
          padding: 10px 16px; text-align: left;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
          white-space: nowrap;
        }
        table.pay-table tbody td {
          padding: 14px 16px; font-size: 13.5px;
          border-bottom: 1px solid #F1F5F9;
          color: #334155; vertical-align: middle;
        }
        table.pay-table tbody tr:last-child td { border-bottom: none; }
        table.pay-table tbody tr:hover td { background: #F8FAFC; }

        .pay-method-select {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #0F172A;
          padding: 9px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          outline: none;
          cursor: pointer;
          max-width: 220px;
          transition: border-color 0.2s;
        }
        .pay-method-select:focus { border-color: #94A3B8; }

        .pay-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: #0F172A; color: #FFFFFF;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .pay-btn-primary:hover { background: #1E293B; }

        .pay-empty {
          text-align: center;
          padding: 60px 24px;
          color: #64748B;
        }

        @media (max-width: 900px) {
          .pay-header-inner { padding: 32px 24px 26px; }
          .stats-row { padding: 20px 24px 0; }
          .pay-panel { margin-left: 24px; margin-right: 24px; width: auto; }
        }

        @media (max-width: 640px) {
          .pay-header-inner { padding: 22px 16px 18px; }
          .pay-heading { font-size: 21px; }
          .pay-tagline { font-size: 12.5px; }

          /* Force a single, compact row of stat cards on mobile */
          .stats-row { padding: 16px 12px 0; gap: 8px; }
          .stat-card { flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px 10px; border-radius: 10px; }
          .stat-card-icon { width: 26px; height: 26px; border-radius: 7px; }
          .stat-card-icon svg { width: 13px; height: 13px; }
          .stat-card-label { font-size: 8.5px; letter-spacing: 0.06em; margin-bottom: 2px; }
          .stat-card-value { font-size: 15px; }

          .pay-panel { margin-left: 12px; margin-right: 12px; padding: 18px; border-radius: 12px; }
        }

        @media (max-width: 380px) {
          .stat-card-value { font-size: 13px; }
          .stat-card-label { font-size: 8px; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="pay-header">
        <div className="pay-header-inner">
          <div>
            <div className="pay-eyebrow">Tenant Workspace</div>
            <h1 className="pay-heading">Rent Payments</h1>
            <p className="pay-tagline">Pay upcoming months and review your rent history.</p>
          </div>
        </div>
      </div>

      {/* ── Stats — always one horizontal row ── */}
      <div className="stats-row">
        <StatCard label="Total Paid"  value={formatCurrency(stats.total_paid)}   icon={TrendingUp} accent />
        <StatCard label="Pending"     value={stats.pending_payments ?? 0}         icon={Clock} />
        <StatCard label="This Month"  value={formatCurrency(stats.this_month)}    icon={Calendar} />
      </div>

      {/* ── Pay additional months ── */}
      {rentableProps.length > 0 && (
        <div className="pay-panel" style={{ maxWidth: '1280px', margin: '24px auto 0' }}>
          <div className="pay-tag">Continue Lease</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Pay additional months
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 18px' }}>
            After your first month is paid, choose how many more months to cover. The property owner (landlord, commercial, agent, or Oweru) will see the payment immediately.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Property</label>
              <select
                className="pay-method-select"
                style={{ maxWidth: '100%', width: '100%' }}
                value={extraPropertyId}
                onChange={(e) => setExtraPropertyId(e.target.value)}
              >
                {rentableProps.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Months</label>
              <select
                className="pay-method-select"
                style={{ maxWidth: '100%', width: '100%' }}
                value={extraMonths}
                onChange={(e) => setExtraMonths(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Total</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{formatCurrency(extraTotal)}</div>
            </div>
            <button
              className="pay-btn-primary"
              disabled={creatingExtra || !extraPropertyId || extraTotal <= 0}
              onClick={handleCreateAdditionalMonths}
              style={{ opacity: creatingExtra || !extraPropertyId || extraTotal <= 0 ? 0.6 : 1, justifyContent: 'center' }}
            >
              {creatingExtra ? 'Preparing…' : 'Continue to Pay'}
            </button>
          </div>
        </div>
      )}

      {/* ── Payments Panel ── */}
      <div className="pay-panel" style={{ maxWidth: '1280px', margin: '24px auto 0' }}>
        <div className="pay-tag">Payment Records</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          All Payments
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading payments…
          </div>
        ) : (
          <>
            {/* Next payment banner */}
            {nextPending && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: '16px 20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 24 }}>
                <CreditCard size={16} style={{ color: '#0F172A', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                  Next payment due: <span style={{ color: '#0F172A', fontWeight: 700 }}>{formatCurrency(nextPending.amount)}</span>
                </span>
                <button className="pay-btn-primary" onClick={() => openPayModal(nextPending)}>
                  Pay Now
                </button>
              </div>
            )}

            {payments.length === 0 ? (
              <div className="pay-empty">
                <CreditCard size={40} style={{ color: '#94A3B8', margin: '0 auto 14px', display: 'block' }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>No payments yet</div>
                <div style={{ fontSize: 13, fontWeight: 400 }}>Site visit fees, first-month rent, and monthly rent will appear here after you pay.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                <table className="pay-table">
                  <thead>
                    <tr>
                      {['Description', 'Amount', 'Due Date', 'Property', 'Status'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.description || item.type || 'Payment'}</div>
                          {item.reference && (
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontFamily: 'ui-monospace, monospace' }}>
                              {item.reference}
                            </div>
                          )}
                        </td>
                        <td><div style={{ fontWeight: 700, color: '#0F172A' }}>{formatCurrency(item.amount)}</div></td>
                        <td><div style={{ fontSize: 13, fontWeight: 400, color: '#64748B' }}>{formatDate(item.paid_at || item.due_date || item.created_at)}</div></td>
                        <td><div style={{ fontSize: 13, color: '#64748B' }}>{item.property?.title || '—'}</div></td>
                        <td><StatusBadge status={item.status || 'unknown'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {payModalOpen && (activePayment || nextPending) && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget && payResult !== 'waiting') closePayModal(); }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, maxWidth: 440, width: '100%', padding: 28, position: 'relative', boxShadow: '0 30px 70px rgba(15,23,42,0.25)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Pay Rent</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              {(activePayment || nextPending)?.description || 'Rent payment'} —{' '}
              <strong style={{ color: '#0F172A' }}>{formatCurrency((activePayment || nextPending)?.amount)}</strong>
            </p>

            {payResult !== 'success' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>Mobile Money Provider</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={payResult === 'waiting'}
                        onClick={() => setPaymentProvider(p.id as typeof paymentProvider)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1px solid ${paymentProvider === p.id ? '#0F172A' : '#E2E8F0'}`,
                          background: paymentProvider === p.id ? '#F1F5F9' : '#FFFFFF',
                          color: paymentProvider === p.id ? '#0F172A' : '#334155',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: payResult === 'waiting' ? 'not-allowed' : 'pointer',
                          opacity: payResult === 'waiting' ? 0.6 : 1,
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    disabled={payResult === 'waiting'}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07XXXXXXXX"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none' }}
                  />
                </div>
              </>
            )}

            {payMessage && (
              <div style={{
                marginBottom: 14, padding: '10px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8,
                color: payResult === 'success' ? '#166534' : payResult === 'error' ? '#991B1B' : '#0F172A',
                background: payResult === 'success' ? '#DCFCE7' : payResult === 'error' ? '#FEE2E2' : '#F1F5F9',
                border: `1px solid ${payResult === 'success' ? '#BBF7D0' : payResult === 'error' ? '#FECACA' : '#E2E8F0'}`,
              }}>
                {payResult === 'waiting' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, marginTop: 2 }} />}
                {payResult === 'success' && <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
                <span>{payMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={closePayModal}
                disabled={paying || payResult === 'waiting'}
                style={{ flex: 1, padding: '11px 14px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#FFFFFF', cursor: payResult === 'waiting' ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {payResult === 'success' ? 'Done' : 'Cancel'}
              </button>
              {payResult !== 'success' && payResult !== 'waiting' && (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying || phoneNumber.length < 10}
                  className="pay-btn-primary"
                  style={{ flex: 2, opacity: paying || phoneNumber.length < 10 ? 0.6 : 1, justifyContent: 'center' }}
                >
                  {paying ? 'Processing…' : 'Confirm Payment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;