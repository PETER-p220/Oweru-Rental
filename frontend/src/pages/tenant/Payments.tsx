import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Clock, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate } from './tenantPageStyles';

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon: Icon, accent = false }: {
  label: string; value: string | number; icon: any; accent?: boolean;
}) => (
  <div style={{
    padding: '22px 20px',
    background: accent ? 'rgba(200,145,40,0.10)' : '#FFFFFF',
    border: `1px solid ${accent ? 'rgba(200,145,40,0.28)' : '#E2E8F0'}`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    fontFamily: "'DM Sans', sans-serif",
  }}>
    {accent && (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#C89128' }} />
    )}
    <div style={{
      width: 36, height: 36,
      background: accent ? 'rgba(200,145,40,0.2)' : '#F1F5F9',
      border: `1px solid ${accent ? 'rgba(200,145,40,0.28)' : '#E2E8F0'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: accent ? '#C89128' : '#64748B',
    }}>
      <Icon size={16} />
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748B', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent ? '#C89128' : '#0F172A', letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  </div>
);

/* ─── Status badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    paid: '#C89128', completed: '#C89128', pending: '#f59e0b',
    failed: '#ef4444', cancelled: '#ef4444',
  };
  const color = colorMap[status] ?? '#94A3B8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel' | 'halopesa'>('tigo');

  const load = async () => {
    try {
      setLoading(true);
      const [paymentsRes, methodsRes, statsRes] = await Promise.all([
        Api.getMyPayments(), Api.getPaymentMethods(), Api.getPaymentStats(),
      ]);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);
      setStats(statsRes.data || {});
      if (methodsRes.data?.[0]?.id) {
        setPaymentProvider(methodsRes.data[0].id as typeof paymentProvider);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payments.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const nextPending = useMemo(() => payments.find((p) => p.status === 'pending') || null, [payments]);

  const openPayModal = () => {
    setPayModalOpen(true);
    setPayMessage('');
    setPhoneNumber('');
  };

  const handlePay = async () => {
    if (!nextPending) return;
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPayMessage('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    setPaying(true);
    setPayMessage('');
    try {
      await Api.makePayment(nextPending.id, {
        phoneNumber: phoneNumber.trim(),
        provider: paymentProvider,
      });
      setPayMessage(`Payment request sent! Check your ${paymentProvider.toUpperCase()} prompt.`);
      await load();
      setTimeout(() => setPayModalOpen(false), 2000);
    } catch (err: any) {
      setPayMessage(err?.response?.data?.message || err?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .pay-panel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .pay-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #C89128;
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }

        .pay-tag::before { content: ''; width: 20px; height: 1px; background: #C89128; }

        table.pay-table { width: 100%; border-collapse: collapse; }
        table.pay-table thead th {
          font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: #C89128;
          padding: 10px 16px; text-align: left;
          border-bottom: 1px solid #E2E8F0;
          background: #F1F5F9;
        }
        table.pay-table tbody td {
          padding: 14px 16px; font-size: 14px;
          border-bottom: 1px solid #F1F5F9;
          color: #334155; vertical-align: middle;
        }
        table.pay-table tbody tr:last-child td { border-bottom: none; }
        table.pay-table tbody tr:hover td { background: rgba(200,145,40,0.03); }

        .pay-method-select {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          padding: 9px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          outline: none;
          cursor: pointer;
          max-width: 220px;
          transition: border-color 0.2s;
        }
        .pay-method-select:focus { border-color: #C89128; }

        .pay-btn-gold {
          display: inline-flex; align-items: center; gap: 6px;
          background: #C89128; color: #FFFFFF;
          padding: 10px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .pay-btn-gold:hover { background: '#D4A84B'; }

        .pay-empty {
          text-align: center;
          padding: 60px 24px;
          color: #64748B;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Tenant Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Rent Payments</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>Current payment obligations and available payment methods.</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 40px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Total Paid"  value={formatCurrency(stats.total_paid)}   icon={TrendingUp} accent />
        <StatCard label="Pending"     value={stats.pending_payments ?? 0}         icon={Clock} />
        <StatCard label="This Month"  value={formatCurrency(stats.this_month)}    icon={Calendar} />
      </div>

      {/* ── Payments Panel ── */}
      <div className="pay-panel" style={{ maxWidth: '1280px', margin: '24px auto 0' }}>
        <div className="pay-tag">Payment Records</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          All Payments
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748B', padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: '2px solid #E2E8F0', borderTopColor: '#C89128', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading payments…
          </div>
        ) : (
          <>
            {/* Next payment banner */}
            {nextPending && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: '16px 20px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#C89128' }} />
                <CreditCard size={16} style={{ color: '#C89128', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                  Next payment due: <span style={{ color: '#C89128', fontWeight: 700 }}>{formatCurrency(nextPending.amount)}</span>
                </span>
                <button className="pay-btn-gold" onClick={openPayModal}>
                  Pay Now
                </button>
              </div>
            )}

            {payments.length === 0 ? (
              <div className="pay-empty">
                <CreditCard size={40} style={{ color: '#C89128', opacity: 0.3, margin: '0 auto 14px', display: 'block' }} />
                <div style={{ fontSize: 16, fontWeight: 500, color: '#0F172A', marginBottom: 6 }}>No payments yet</div>
                <div style={{ fontSize: 13, fontWeight: 300 }}>Browse properties and set up your payment method.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0' }}>
                <table className="pay-table">
                  <thead>
                    <tr>
                      {['Description', 'Amount', 'Due Date', 'Property', 'Status'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((item) => (
                      <tr key={item.id}>
                        <td><div style={{ fontWeight: 500 }}>{item.description || item.type || 'Payment'}</div></td>
                        <td><div style={{ fontWeight: 700, color: '#C89128' }}>{formatCurrency(item.amount)}</div></td>
                        <td><div style={{ fontSize: 13, fontWeight: 300, color: '#64748B' }}>{formatDate(item.due_date || item.created_at)}</div></td>
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

      {payModalOpen && nextPending && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget && !paying) setPayModalOpen(false); }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', maxWidth: 440, width: '100%', padding: 28, position: 'relative' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Pay Rent</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              Amount: <strong style={{ color: '#C89128' }}>{formatCurrency(nextPending.amount)}</strong>
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>Mobile Money Provider</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentProvider(p.id as typeof paymentProvider)}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${paymentProvider === p.id ? '#C89128' : '#E2E8F0'}`,
                      background: paymentProvider === p.id ? 'rgba(200,145,40,0.10)' : '#FFFFFF',
                      color: paymentProvider === p.id ? '#C89128' : '#334155',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
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
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07XXXXXXXX"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
              />
            </div>

            {payMessage && (
              <div style={{ marginBottom: 14, padding: '10px 12px', fontSize: 13, color: payMessage.includes('sent') ? '#059669' : '#dc2626', background: payMessage.includes('sent') ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${payMessage.includes('sent') ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                {payMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                disabled={paying}
                style={{ flex: 1, padding: '11px 14px', border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={paying || phoneNumber.length < 10}
                className="pay-btn-gold"
                style={{ flex: 2, opacity: paying || phoneNumber.length < 10 ? 0.6 : 1 }}
              >
                {paying ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;