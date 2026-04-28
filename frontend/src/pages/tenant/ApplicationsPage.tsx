import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, AlertCircle, ClipboardList, Clock, DollarSign, CheckCircle, Loader2, ShieldCheck, ArrowRight, Phone } from 'lucide-react';
import Api from '../../services/api';
import SelcomService from '../../services/selcom';
import { formatCurrency, formatDate } from './tenantPageStyles';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  rent_paid?: boolean;
  rejection_reason?: string;
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

const StatusBadge = ({ status, rejectionReason }: { status?: string; rejectionReason?: string }) => {
  const s = status || 'unknown';
  const color = statusColorMap[s] ?? B.slate;

  return (
    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px',
        background: `${color}15`,
        border: `1px solid ${color}35`,
        color,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderRadius: '9999px',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
      {s === 'rejected' && rejectionReason && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', lineHeight: 1.4 }}>
          {rejectionReason}
        </div>
      )}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseRent = (price?: number | string): number => {
  if (price == null) return 0;
  if (typeof price === 'number') return price;
  const cleaned = price.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const makeOrderId = (appId: number) => `RENT-${appId}-${Date.now()}`;

// ─────────────────────────────────────────────────────────────────────────────

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel' | 'halopesa'>('tigo');
  const [payResult, setPayResult] = useState<'success' | 'error' | null>(null);
  const [payMessage, setPayMessage] = useState('');

  // Auto-apply from URL
  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
  }, [propertyId]);

  // Load applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await Api.getTenantApplications();
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const refreshApplications = async () => {
    const res = await Api.getTenantApplications();
    setApplications(Array.isArray(res.data) ? res.data : []);
  };

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

  const handlePayRent = async (appId: number) => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setPayResult('error');
      setPayMessage('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    const application = applications.find(app => app.id === appId);
    const rentAmount = parseRent(application?.property?.price);

    if (!rentAmount) {
      setPayResult('error');
      setPayMessage('Unable to determine rent amount for this application.');
      return;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const tenantId = user?.id;

    if (!tenantId) {
      setPayResult('error');
      setPayMessage('Your session may have expired. Please log in again.');
      return;
    }

    setPaying(true);
    setPayResult(null);
    setPayMessage('');

    try {
      const paymentResponse = await SelcomService.initiateMobileMoneyPayment({
        amount: rentAmount,
        phone_number: phoneNumber,
        provider: paymentProvider,
        property_id: application?.property?.id ?? appId,
        tenant_id: tenantId,
        payment_type: 'rent_payment',
        customer_email: user?.email ?? '',
        customer_name: user?.first_name && user?.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user?.first_name ?? 'Tenant',
      });

      if (!paymentResponse.success || !paymentResponse.data?.transaction_id) {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }

      const transactionId = paymentResponse.data.transaction_id;

      await Api.updateApplicationPaymentStatus(appId, {
        payment_status: 'paid',
        payment_method: paymentProvider,
        transaction_id: transactionId,
        amount_paid: rentAmount,
      });

      setPayResult('success');
      setPayMessage(`Payment request sent! Check your ${paymentProvider.toUpperCase()} prompt. Ref: ${transactionId}`);
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

  // Filtering
  const filtered = useMemo(() =>
    applications.filter(item => {
      const hay = `${item.property?.title || ''} ${item.property?.location || ''} ${item.message || ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    }), [applications, search]
  );

  const activeApp = paymentModal ? applications.find(a => a.id === paymentModal) : null;
  const modalAmount = activeApp ? parseRent(activeApp.property?.price) : 0;

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: B.navy900, color: B.cream, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }

        .ap-panel {
          background: ${B.navy800};
          border: 1px solid ${B.border};
          border-radius: 16px;
          padding: 28px;
          margin: 20px;
        }

        table.ap-table {
          width: 100%;
          border-collapse: collapse;
          background: ${B.navy800};
          border-radius: 12px;
          overflow: hidden;
        }

        table.ap-table thead th {
          background: ${B.navy900};
          color: ${B.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 16px 20px;
          text-align: left;
          border-bottom: 1px solid ${B.border};
        }

        table.ap-table tbody td {
          padding: 18px 20px;
          border-bottom: 1px solid ${B.borderF};
          vertical-align: middle;
          font-size: 14.5px;
        }

        table.ap-table tbody tr:hover {
          background: rgba(200, 145, 40, 0.05);
        }

        .ap-search {
          width: 100%;
          padding: 14px 16px 14px 52px;
          background: ${B.navy900};
          border: 1px solid ${B.border};
          border-radius: 12px;
          color: ${B.cream};
          font-size: 15px;
          outline: none;
        }
        .ap-search:focus {
          border-color: ${B.gold};
        }
      `}</style>

      {/* Header Panel */}
      <div className="ap-panel">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: B.gold, borderRadius: '16px 16px 0 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', color: B.gold }}>TENANT WORKSPACE</div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: '8px 0 6px', letterSpacing: '-0.02em' }}>
              My Applications
            </h1>
            <p style={{ color: B.slate, fontSize: 15 }}>Track and manage all your rental applications in one place.</p>
          </div>

          <div style={{ position: 'relative', minWidth: 340 }}>
            <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: B.slate, pointerEvents: 'none' }} />
            <input
              className="ap-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by property, location or message..."
            />
          </div>
        </div>
      </div>

      {/* Table Panel */}
      <div className="ap-panel">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.01em' }}>All Applications</h2>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '14px 18px', borderRadius: 12, marginBottom: 24 }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: B.slate }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <div>Loading your applications...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: B.slate }}>
            <ClipboardList size={48} style={{ margin: '0 auto 20px', opacity: 0.6 }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: B.cream }}>No applications found</div>
            <p style={{ maxWidth: 300, margin: '12px auto 0' }}>You haven't submitted any rental applications yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>PROPERTY</th>
                  <th>LOCATION</th>
                  <th>MONTHLY RENT</th>
                  <th>STATUS</th>
                  <th>APPLIED ON</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 15.5 }}>
                        {item.property?.title || 'Untitled Property'}
                      </div>
                      {item.message && (
                        <div style={{ fontSize: 13, color: B.slate, marginTop: 6, lineHeight: 1.5 }}>
                          {item.message.length > 85 ? item.message.substring(0, 85) + '...' : item.message}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: B.slate }}>
                        <MapPin size={16} /> {item.property?.location || '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: B.gold, fontSize: 16.5 }}>
                        {formatCurrency(item.property?.price)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.status} rejectionReason={item.rejection_reason} />
                    </td>
                    <td style={{ color: B.slate, fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={15} />
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td>
                      {item.status === 'approved' && !item.rent_paid ? (
                        <button
                          onClick={() => openPaymentModal(item.id)}
                          style={{
                            background: B.gold,
                            color: B.navy900,
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 13.5,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            boxShadow: '0 4px 12px rgba(200,145,40,0.25)'
                          }}
                        >
                          <DollarSign size={17} /> Pay Rent
                        </button>
                      ) : item.rent_paid ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600 }}>
                          <CheckCircle size={18} /> Paid
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================== PAYMENT MODAL ====================== */}
      {paymentModal && activeApp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px'
        }}>
          <div style={{
            background: B.navy800,
            border: `1px solid ${B.border}`,
            borderRadius: 20,
            width: '100%',
            maxWidth: 440,
            maxHeight: '94vh',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${B.navy900} 0%, #1a2a44 100%)`,
              padding: '24px 28px 20px',
              borderBottom: `1px solid ${B.border}`
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: B.gold }}>SECURE PAYMENT</div>
              <div style={{ fontSize: 23, fontWeight: 700, marginTop: 4 }}>Pay Monthly Rent</div>
              <div style={{ color: B.slate, fontSize: 13.5, marginTop: 4 }}>Powered by Selcom Gateway</div>
            </div>

            <div style={{ padding: '28px' }}>
              {/* Property Info */}
              <div style={{
                background: B.navy900,
                border: `1px solid ${B.borderF}`,
                borderRadius: 14,
                padding: 18,
                marginBottom: 24
              }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{activeApp.property?.title}</div>
                {activeApp.property?.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: B.slate, marginTop: 8 }}>
                    <MapPin size={15} /> {activeApp.property.location}
                  </div>
                )}
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `1px solid ${B.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: B.slate }}>Amount Due</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: B.gold }}>
                    Tsh {modalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Provider Selection */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', color: B.slate, marginBottom: 10 }}>MOBILE MONEY PROVIDER</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { value: 'tigo', label: 'Tigo Pesa' },
                    { value: 'mpesa', label: 'M-Pesa' },
                    { value: 'airtel', label: 'Airtel Money' },
                    { value: 'halopesa', label: 'Halopesa' },
                  ].map((p: any) => (
                    <button
                      key={p.value}
                      className={`pay-provider-btn ${p.value}`}
                      data-active={paymentProvider === p.value ? 'true' : 'false'}
                      onClick={() => setPaymentProvider(p.value)}
                      disabled={paying}
                      style={{
                        padding: '12px 10px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        border: `2px solid ${B.border}`,
                        background: B.navy900,
                        color: B.cream,
                        borderRadius: 10,
                        cursor: paying ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', color: B.slate, marginBottom: 8 }}>PHONE NUMBER</div>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: B.slate }} />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678"
                    disabled={paying}
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 54px',
                      background: B.navy900,
                      border: `1px solid ${B.border}`,
                      borderRadius: 12,
                      color: B.cream,
                      fontSize: 16,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Security Note */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 24, color: '#34d399', fontSize: 13
              }}>
                <ShieldCheck size={18} /> Secured by Selcom • 256-bit encrypted
              </div>

              {/* Payment Result */}
              {payResult === 'success' && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b98150', color: '#34d399', padding: '14px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 12 }}>
                  <CheckCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{payMessage}</span>
                </div>
              )}
              {payResult === 'error' && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444450', color: '#f87171', padding: '14px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 12 }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{payMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={closePaymentModal}
                  disabled={paying}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: B.navy900,
                    border: `1px solid ${B.border}`,
                    color: B.cream,
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: paying ? 'not-allowed' : 'pointer'
                  }}
                >
                  {payResult === 'success' ? 'Close' : 'Cancel'}
                </button>

                {payResult !== 'success' && (
                  <button
                    onClick={() => handlePayRent(paymentModal)}
                    disabled={paying || !phoneNumber || phoneNumber.length < 10}
                    style={{
                      flex: 1.7,
                      padding: '14px',
                      background: paying ? `${B.gold}aa` : B.gold,
                      color: B.navy900,
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: paying || !phoneNumber || phoneNumber.length < 10 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {paying ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} />
                        Sending Prompt...
                      </>
                    ) : (
                      <>
                        <DollarSign size={18} /> Pay Tsh {modalAmount.toLocaleString()}
                      </>
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