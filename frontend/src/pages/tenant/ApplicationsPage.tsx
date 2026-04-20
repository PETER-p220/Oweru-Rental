import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, AlertCircle, ClipboardList, Clock, DollarSign, CheckCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import Api from '../../services/api';
import SelcomService from '../../services/selcom';
import { formatCurrency, formatDate } from './tenantPageStyles';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  rent_paid?: boolean;
  property?: {
    id?: number;
    title?: string;
    location?: string;
    price?: number | string;
  };
}

const B = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold:    '#C89128',
  goldLt:  '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream:   '#F8F8F9',
  slate:   '#94A3B8',
  blue:    '#3B82F6',
  border:  'rgba(200,145,40,0.18)',
  borderF: 'rgba(200,145,40,0.08)',
};

const statusColorMap: Record<string, string> = {
  approved:  B.gold,
  pending:   '#f59e0b',
  rejected:  '#ef4444',
  cancelled: '#ef4444',
  active:    '#10b981',
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = status || 'unknown';
  const color = statusColorMap[s] ?? B.slate;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: `${color}18`, border: `1px solid ${color}40`,
      color, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: "'Jost', sans-serif",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse rent amount from string or number */
const parseRent = (price?: number | string): number => {
  if (price == null) return 0;
  if (typeof price === 'number') return price;
  return parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
};

/** Generate a unique order ID matching the Properties page pattern */
const makeOrderId = (appId: number) =>
  `RENT-${appId}-${Date.now()}`;

// ─────────────────────────────────────────────────────────────────────────────

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [searchParams]                  = useSearchParams();
  const propertyId                      = searchParams.get('property');

  // Payment modal state
  const [paymentModal, setPaymentModal]       = useState<number | null>(null);
  const [paying, setPaying]                   = useState(false);
  const [phoneNumber, setPhoneNumber]         = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel'>('tigo');
  const [payResult, setPayResult]             = useState<'success' | 'error' | null>(null);
  const [payMessage, setPayMessage]           = useState('');

  // ── Auto-apply from URL param ───────────────────────────────────────────────
  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
  }, [propertyId]);

  // ── Load applications ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getTenantApplications();
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshApplications = async () => {
    const res = await Api.getTenantApplications();
    setApplications(Array.isArray(res.data) ? res.data : []);
  };

  // ── Apply for property ──────────────────────────────────────────────────────
  const handleApplyForProperty = async (id: string) => {
    try {
      if (!id || isNaN(parseInt(id))) throw new Error('Invalid property ID');
      await Api.createApplication({
        property_id: parseInt(id),
        message: 'I am interested in this property and would like to schedule a viewing.',
      });
      alert('Application submitted successfully!');
      window.history.replaceState({}, '', window.location.pathname);
      await refreshApplications();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to submit application.');
    }
  };

  // ── Pay rent — mirrors Properties.handlePay() exactly ──────────────────────
  const handlePayRent = async (appId: number) => {
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPayResult('error');
      setPayMessage('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    const application = applications.find(app => app.id === appId);
    const rawPrice    = application?.property?.price;
    const rentAmount  = parseRent(rawPrice);
    
    // Debug logging
    console.log('Rent amount debug:', {
      applicationId: appId,
      rawPrice: rawPrice,
      rawPriceType: typeof rawPrice,
      parsedRent: rentAmount,
    });
    
    // Temporary fix: If rent amount seems too high (over 1 million), divide by 100
    // This handles cases where price is stored as cents (e.g., 500000 instead of 5000)
    let finalRentAmount = rentAmount;
    if (rentAmount > 1000000) {
      finalRentAmount = rentAmount / 100;
      console.log('Rent amount adjusted from', rentAmount, 'to', finalRentAmount);
    }
    
    if (!finalRentAmount) {
      setPayResult('error');
      setPayMessage('Unable to determine rent amount for this application.');
      return;
    }

    // Pull user context exactly as Properties page does
    const userStr  = localStorage.getItem('user');
    const user     = userStr ? JSON.parse(userStr) : null;
    const tenantId = user?.id;
    if (!tenantId) {
      setPayResult('error');
      setPayMessage('Your session may have expired. Please log in again.');
      return;
    }

    const orderId = makeOrderId(appId);
    setPaying(true);
    setPayResult(null);
    setPayMessage('');

    try {
      // Step 1 – Oweru USSD push (same service & payload shape as Properties page)
      const paymentResponse = await SelcomService.initiateMobileMoneyPayment({
        amount:         finalRentAmount,
        phone_number:   phoneNumber,
        provider:       paymentProvider,   // 'tigo' | 'mpesa' | 'airtel'
        property_id:    application?.property?.id ?? appId,
        tenant_id:      tenantId,
        payment_type:   'rent_payment',
        customer_email: user?.email        ?? '',
        customer_name:  user?.first_name && user?.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user?.first_name ?? 'Tenant',
      });

      if (!paymentResponse.success || !paymentResponse.data?.transaction_id) {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }

      const transactionId = paymentResponse.data.transaction_id;

      // Step 2 – Record the payment against the application
      await Api.updateApplicationPaymentStatus(appId, {
        payment_status: 'paid',
        payment_method: paymentProvider,
        transaction_id: transactionId,
        amount_paid: finalRentAmount,
      });

      setPayResult('success');
      setPayMessage(
        `Payment request sent! Check your ${paymentProvider.toUpperCase()} prompt on your phone to approve. Ref: ${transactionId}`
      );

      await refreshApplications();
    } catch (err: any) {
      setPayResult('error');
      setPayMessage(err?.message || 'Failed to process rent payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const openPaymentModal = (appId: number) => {
    setPaymentModal(appId);
    setPayResult(null);
    setPayMessage('');
    setPhoneNumber('');
  };

  const closePaymentModal = () => {
    if (paying) return;
    setPaymentModal(null);
    setPayResult(null);
    setPayMessage('');
    setPhoneNumber('');
  };

  // ── Filtering / counts ──────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    applications.filter(item => {
      const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    }),
    [applications, search]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(a => {
      const s = a.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [applications]);

  // ── Active application for the modal ───────────────────────────────────────
  const activeApp   = paymentModal ? applications.find(a => a.id === paymentModal) : null;
  const modalAmount = activeApp ? parseRent(activeApp.property?.price) : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .ap-panel {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          padding: 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .ap-tag {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: ${B.gold}; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ap-tag::before { content: ''; width: 20px; height: 1px; background: ${B.gold}; }
        .ap-search {
          width: 100%; max-width: 420px;
          background: ${B.navy900};
          border: 1px solid ${B.border};
          color: ${B.cream};
          padding: 10px 14px 10px 40px;
          font-family: 'Jost', sans-serif;
          font-size: 14px; font-weight: 400;
          outline: none; transition: border-color 0.2s;
        }
        .ap-search::placeholder { color: rgba(148,163,184,0.4); }
        .ap-search:focus { border-color: ${B.gold}; }
        .ap-count-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 12px;
          font-family: 'Jost', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        table.ap-table { width: 100%; border-collapse: collapse; }
        table.ap-table thead th {
          font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: ${B.gold};
          padding: 10px 16px; text-align: left;
          border-bottom: 1px solid ${B.border};
          background: ${B.navy900};
        }
        table.ap-table tbody td {
          padding: 16px; font-size: 14px;
          border-bottom: 1px solid ${B.borderF};
          color: ${B.cream}; vertical-align: middle;
        }
        table.ap-table tbody tr:last-child td { border-bottom: none; }
        table.ap-table tbody tr { transition: background 0.15s; }
        table.ap-table tbody tr:hover td { background: rgba(200,145,40,0.03); }
        .ap-mobile { display: none; }
        @media (max-width: 768px) {
          table.ap-table { display: none; }
          .ap-mobile { display: flex; flex-direction: column; gap: 1px; }
        }
        .ap-mob-card {
          background: ${B.navy900};
          border: 1px solid ${B.borderF};
          padding: 18px; margin-bottom: 1px;
          transition: border-color 0.2s;
        }
        .ap-mob-card:hover { border-color: rgba(200,145,40,0.3); }

        /* ── Payment modal ── */
        .pay-provider-btn {
          flex: 1; padding: 10px 8px;
          font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
          border: 2px solid ${B.border};
          background: ${B.navy900};
          color: ${B.cream};
          border-radius: 6px; cursor: pointer; transition: all 0.2s; text-align: center;
        }
        .pay-provider-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pay-provider-btn[data-active='true'].tigo   { border-color:#00D4AA; background:rgba(0,212,170,.10); color:#00D4AA; }
        .pay-provider-btn[data-active='true'].mpesa  { border-color:#00C853; background:rgba(0,200,83,.10);  color:#00C853; }
        .pay-provider-btn[data-active='true'].airtel { border-color:#FF6B35; background:rgba(255,107,53,.10);color:#FF6B35; }
      `}</style>

      {/* ── Header Panel ── */}
      <div className="ap-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: B.gold }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="ap-tag">Tenant Workspace</div>
            <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: B.cream, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              My Applications
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: B.slate, margin: 0 }}>
              Track the status of all your rental applications in one place.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const color = statusColorMap[status] ?? B.slate;
              return (
                <div key={status} className="ap-count-pill" style={{ background: `${color}14`, border: `1px solid ${color}35`, color }}>
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span style={{ background: `${color}22`, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 24, position: 'relative' as const, display: 'inline-block' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: B.slate, pointerEvents: 'none' }} />
          <input className="ap-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by property, location, or message…" />
        </div>
      </div>

      {/* ── Content Panel ── */}
      <div className="ap-panel">
        <div className="ap-tag">Application Records</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: B.cream, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          All Applications
        </h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '13px 16px', marginBottom: 20, fontSize: 13 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: B.slate, padding: '80px 0' }}>
            <div style={{ width: 18, height: 18, border: `2px solid ${B.border}`, borderTopColor: B.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 400 }}>Loading your applications…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: B.slate }}>
            <div style={{ width: 64, height: 64, background: B.goldDim, border: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ClipboardList size={28} style={{ color: B.gold }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: B.cream }}>No applications found</div>
            <div style={{ fontSize: 14, fontWeight: 300, maxWidth: 300, margin: '0 auto', lineHeight: 1.65 }}>
              You haven't submitted any applications yet. Start browsing properties to apply.
            </div>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div style={{ overflowX: 'auto', border: `1px solid ${B.border}` }}>
              <table className="ap-table">
                <thead>
                  <tr>
                    {['Property', 'Monthly Rent', 'Status', 'Message', 'Applied', 'Action'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14, color: B.cream }}>{item.property?.title || 'Untitled Property'}</div>
                        <div style={{ color: B.slate, fontSize: 12, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {item.property?.location || 'No location'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: B.gold, fontSize: 15 }}>
                          {formatCurrency(item.property?.price)}
                        </div>
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ color: B.slate, fontSize: 13, lineHeight: 1.55, fontWeight: 300 }}>{item.message || '—'}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' as const }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: B.slate, fontSize: 13, fontWeight: 300 }}>
                          <Clock size={12} /> {formatDate(item.created_at)}
                        </div>
                      </td>
                      <td>
                        {item.status === 'approved' && !item.rent_paid ? (
                          <button onClick={() => openPaymentModal(item.id)} style={{ padding: '6px 14px', background: B.gold, color: B.navy900, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <DollarSign size={12} /> Pay Rent
                          </button>
                        ) : item.rent_paid ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                            <CheckCircle size={14} /> Paid
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="ap-mobile">
              {filtered.map(item => (
                <div key={item.id} className="ap-mob-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: B.cream, marginBottom: 4 }}>{item.property?.title || 'Untitled Property'}</div>
                      <div style={{ color: B.slate, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {item.property?.location || 'No location'}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: B.gold, flexShrink: 0 }}>{formatCurrency(item.property?.price)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.gold }}>Status</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: B.gold, marginBottom: 5 }}>Message</div>
                      <div style={{ fontSize: 13, fontWeight: 300, color: B.slate, lineHeight: 1.55 }}>{item.message || 'No message provided'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: B.slate, fontSize: 12, fontWeight: 300 }}>
                      <Clock size={11} /> {formatDate(item.created_at)}
                    </div>
                    <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10 }}>
                      {item.status === 'approved' && !item.rent_paid ? (
                        <button onClick={() => openPaymentModal(item.id)} style={{ width: '100%', padding: '10px 12px', background: B.gold, color: B.navy900, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <DollarSign size={13} /> Pay Rent
                        </button>
                      ) : item.rent_paid ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                          <CheckCircle size={16} /> Payment Complete
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          PAYMENT MODAL  — mirrors Properties payment modal
      ══════════════════════════════════════════════ */}
      {paymentModal && activeApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: B.navy800, border: `1px solid ${B.border}`, borderRadius: 12, maxWidth: 440, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>

            {/* Modal header */}
            <div style={{ background: `linear-gradient(135deg, ${B.navy900} 0%, #0f2030 100%)`, padding: '22px 24px 18px', borderBottom: `1px solid ${B.border}`, borderRadius: '12px 12px 0 0', position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.gold, marginBottom: 6 }}>Secure Payment</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: B.cream }}>Pay Monthly Rent</div>
              <div style={{ fontSize: 12, color: B.slate, marginTop: 3 }}>Powered by Oweru · Selcom Gateway</div>
            </div>

            <div style={{ padding: '22px 24px' }}>

              {/* Property info */}
              <div style={{ background: B.navy900, border: `1px solid ${B.borderF}`, borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: B.cream, marginBottom: 4 }}>{activeApp.property?.title || 'Property'}</div>
                {activeApp.property?.location && (
                  <div style={{ fontSize: 12, color: B.slate, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <MapPin size={11} /> {activeApp.property.location}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${B.border}`, paddingTop: 10 }}>
                  <span style={{ fontSize: 12, color: B.slate }}>Monthly Rent</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: B.gold }}>Tsh {modalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Provider selector */}
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.slate, marginBottom: 10 }}>
                Mobile Money Provider
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {([
                  { value: 'tigo',   label: 'Tigo Pesa'    },
                  { value: 'mpesa',  label: 'M-Pesa'       },
                  { value: 'airtel', label: 'Airtel Money'  },
                ] as { value: 'tigo' | 'mpesa' | 'airtel'; label: string }[]).map(p => (
                  <button
                    key={p.value}
                    className={`pay-provider-btn ${p.value}`}
                    data-active={paymentProvider === p.value ? 'true' : 'false'}
                    onClick={() => setPaymentProvider(p.value)}
                    disabled={paying}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Phone number */}
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: B.slate, marginBottom: 8 }}>
                Phone Number
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0712 345 678"
                disabled={paying}
                style={{ width: '100%', padding: '12px 14px', background: B.navy900, border: `1px solid ${B.border}`, color: B.cream, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 6 }}
              />
              <div style={{ fontSize: 11, color: B.slate, marginBottom: 20 }}>
                Enter your {paymentProvider === 'tigo' ? 'Tigo Pesa' : paymentProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'} registered number
              </div>

              {/* Security badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 13px', marginBottom: 20, fontSize: 12, color: '#10b981' }}>
                <ShieldCheck size={14} /> Secured by Selcom · 256-bit encrypted
              </div>

              {/* Result feedback */}
              {payResult === 'success' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#10b981', lineHeight: 1.55 }}>
                  <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{payMessage}</span>
                </div>
              )}
              {payResult === 'error' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#f87171', lineHeight: 1.55 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{payMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={closePaymentModal} disabled={paying} style={{ flex: 1, padding: '11px 16px', background: B.navy900, border: `1px solid ${B.border}`, color: B.cream, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.5 : 1 }}>
                  {payResult === 'success' ? 'Close' : 'Cancel'}
                </button>

                {payResult !== 'success' && (
                  <button
                    onClick={() => handlePayRent(paymentModal)}
                    disabled={paying || !phoneNumber || phoneNumber.length < 10}
                    style={{ flex: 2, padding: '11px 16px', background: paying ? `${B.gold}aa` : B.gold, border: 'none', color: B.navy900, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: paying || !phoneNumber || phoneNumber.length < 10 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !phoneNumber || phoneNumber.length < 10 ? 0.5 : 1 }}
                  >
                    {paying ? (
                      <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending prompt…</>
                    ) : (
                      <><DollarSign size={14} /> Pay Tsh {modalAmount.toLocaleString()} <ArrowRight size={13} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;