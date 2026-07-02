import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, AlertCircle, ClipboardList, Clock, DollarSign, CheckCircle, Loader2, ShieldCheck, ArrowRight, Phone, Info } from 'lucide-react';
import Api from '../../services/api';
import { palette, formatCurrency, formatDate, getStatusColor } from './tenantPageStyles';

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  rent_paid?: boolean;
  can_pay_rent?: boolean;
  site_visit_paid?: boolean;
  next_step?: string;
  rejection_reason?: string;
  property?: {
    id?: number;
    title?: string;
    location?: string;
    price?: number | string;
  };
}


const StatusBadge = ({ status, rejectionReason }: { status?: string; rejectionReason?: string }) => {
  const s = status || 'unknown';
  const color = getStatusColor(status);

  return (
    <div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderRadius: '9999px',
        fontFamily: "'Jost', sans-serif",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
      {s === 'rejected' && rejectionReason && (
        <div style={{ marginTop: 8, fontSize: 12, color: palette.red, lineHeight: 1.4 }}>
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
  const [payResult, setPayResult] = useState<'success' | 'error' | 'waiting' | null>(null);
  const [payMessage, setPayMessage] = useState('');
  const [rentOrderId, setRentOrderId] = useState('');
  const rentPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (propertyId) handleApplyForProperty(propertyId);
  }, [propertyId]);

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

  useEffect(() => {
    if (payResult !== 'waiting' || !rentOrderId) return;

    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await Api.checkRentPaymentStatus(rentOrderId);
        const status = res.data?.rent_payment_status;
        if (status === 'paid') {
          if (rentPollRef.current) clearInterval(rentPollRef.current);
          setPayResult('success');
          setPayMessage('Rent payment confirmed! You can now proceed with your contract.');
          await refreshApplications();
        } else if (status === 'failed') {
          if (rentPollRef.current) clearInterval(rentPollRef.current);
          setPayResult('error');
          setPayMessage('Rent payment was not completed. Please try again.');
        } else if (attempts >= 40) {
          setPayMessage('Still waiting for payment confirmation. Keep this screen open or check back shortly.');
        }
      } catch { /* ignore transient errors */ }
    };

    poll();
    rentPollRef.current = setInterval(poll, 3000);
    return () => { if (rentPollRef.current) clearInterval(rentPollRef.current); };
  }, [payResult, rentOrderId]);

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
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPayResult('error');
      setPayMessage('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setPaying(true);
    setPayResult(null);
    setPayMessage('');

    try {
      const res = await Api.initiateRentPayment({
        applicationId: appId,
        phoneNumber: phoneNumber.trim(),
        provider: paymentProvider,
      });

      if (res.data?.order_id) {
        setRentOrderId(res.data.order_id);
        setPayResult('waiting');
        setPayMessage('USSD prompt sent. Waiting for confirmation...');
      } else {
        throw new Error(res.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      setPayResult('error');
      setPayMessage(err?.response?.data?.message || err?.message || 'Failed to process rent payment.');
    } finally {
      setPaying(false);
    }
  };

  const openPaymentModal = (appId: number) => {
    if (rentPollRef.current) clearInterval(rentPollRef.current);
    setPaymentModal(appId);
    setPayResult(null);
    setPayMessage('');
    setRentOrderId('');
    setPhoneNumber('');
  };

  const closePaymentModal = () => {
    if (payResult === 'waiting') return;
    if (rentPollRef.current) clearInterval(rentPollRef.current);
    setPaymentModal(null);
    setPayResult(null);
    setPayMessage('');
    setRentOrderId('');
    setPhoneNumber('');
  };

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

  const activeApp = paymentModal ? applications.find(a => a.id === paymentModal) : null;
  const modalAmount = activeApp ? parseRent(activeApp.property?.price) : 0;

  return (
    <div style={{ 
      fontFamily: "'DM Sans', system-ui, sans-serif", 
      background: '#F1F5F9', 
      color: '#0F172A', 
      minHeight: '100vh',
      paddingBottom: '80px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }

        .ap-panel {
          background: ${palette.slate800};
          border: 1px solid ${palette.slate200};
          border-radius: 16px;
          padding: 24px;
          margin: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .ap-search {
          width: 100%;
          background: ${palette.slate900};
          border: 1px solid ${palette.slate200};
          color: ${palette.white};
          padding: 14px 16px 14px 48px;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }
        .ap-search:focus {
          border-color: ${palette.gold};
          box-shadow: 0 0 0 3px ${palette.gold}20;
        }

        .mobile-card {
          background: ${palette.slate800};
          border: 1px solid ${palette.slate200};
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mobile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(200,145,40,0.08);
        }

        .pay-provider-btn {
          flex: 1;
          padding: 12px 10px;
          font-size: 12px;
          font-weight: 600;
          border: 2px solid ${palette.slate200};
          background: ${palette.slate900};
          color: ${palette.white};
          border-radius: 10px;
          transition: all 0.2s;
        }
        .pay-provider-btn[data-active='true'].tigo    { border-color: #00D4AA; background: rgba(0,212,170,.12); color: #00D4AA; }
        .pay-provider-btn[data-active='true'].mpesa   { border-color: #00C853; background: rgba(0,200,83,.12);  color: #00C853; }
        .pay-provider-btn[data-active='true'].airtel  { border-color: #FF6B35; background: rgba(255,107,53,.12); color: #FF6B35; }
        .pay-provider-btn[data-active='true'].halopesa{ border-color: #9C27B0; background: rgba(156,39,176,.12); color: #9C27B0; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Tenant Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>My Applications</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>Track and manage all your rental applications</p>
          </div>

          <div style={{ position: 'relative', minWidth: '280px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              style={{ width: '100%', background: '#0F172A', border: '1px solid #E2E8F0', color: '#FFFFFF', padding: '12px 16px 12px 48px', borderRadius: '12px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px', outline: 'none', transition: 'all 0.2s' }}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search properties or locations..." 
            />
          </div>
        </div>
      </div>

      {/* Applications List - Mobile Optimized */}
      <div style={{ padding: '0 16px' }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', padding: '14px 16px', borderRadius: 12, marginBottom: 20 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: palette.slate600 }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div>Loading your applications...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '90px 20px', color: palette.slate600 }}>
            <ClipboardList size={48} style={{ margin: '0 auto 20px', opacity: 0.6 }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: palette.white, marginBottom: 8 }}>No applications yet</div>
            <div style={{ maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
              Start exploring properties and submit your first application.
            </div>
          </div>
        ) : (
          <div>
            {filtered.map(item => (
              <div key={item.id} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16.5, lineHeight: 1.3 }}>
                      {item.property?.title || 'Untitled Property'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: palette.slate600, fontSize: 13, marginTop: 6 }}>
                      <MapPin size={14} />
                      {item.property?.location || 'Location not specified'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18, color: palette.gold }}>
                    {formatCurrency(item.property?.price)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <StatusBadge status={item.status} rejectionReason={item.rejection_reason} />
                  <div style={{ fontSize: 12.5, color: palette.slate600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} /> {formatDate(item.created_at)}
                  </div>
                </div>

                {item.message && (
                  <div style={{ 
                    background: palette.slate900, 
                    borderRadius: 10, 
                    padding: '12px 14px', 
                    fontSize: 13.5, 
                    color: palette.slate600, 
                    lineHeight: 1.55,
                    marginBottom: 18 
                  }}>
                    "{item.message}"
                  </div>
                )}

                <div>
                  {item.next_step && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      background: 'rgba(200,145,40,0.08)', border: '1px solid rgba(200,145,40,0.2)',
                      borderRadius: 12, padding: '12px 14px', marginBottom: 12,
                      fontSize: 13, color: palette.slate600, lineHeight: 1.5,
                    }}>
                      <Info size={16} style={{ color: palette.gold, flexShrink: 0, marginTop: 2 }} />
                      {item.next_step}
                    </div>
                  )}

                  {item.can_pay_rent ? (
                    <button 
                      onClick={() => openPaymentModal(item.id)}
                      style={{
                        width: '100%',
                        background: palette.gold,
                        color: palette.slate900,
                        border: 'none',
                        padding: '14px',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 14.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 15px rgba(200,145,40,0.3)'
                      }}
                    >
                      <DollarSign size={18} /> Pay Rent Now
                    </button>
                  ) : item.rent_paid ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 8, 
                      background: 'rgba(16,185,129,0.1)', 
                      color: '#10b981', 
                      padding: '12px', 
                      borderRadius: 12,
                      fontWeight: 600 
                    }}>
                      <CheckCircle size={18} /> Rent Paid Successfully
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal - Professional & Clean */}
      {paymentModal && activeApp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px 16px'
        }}>
          <div style={{
            background: palette.slate800,
            border: `1px solid ${palette.slate200}`,
            borderRadius: 20,
            width: '100%',
            maxWidth: 420,
            maxHeight: '94vh',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)'
          }}>
            {/* Header */}
            <div style={{ 
              background: `linear-gradient(135deg, ${palette.slate900}, #1a2a44)`, 
              padding: '24px 24px 20px',
              borderBottom: `1px solid ${palette.slate200}`
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: palette.gold, marginBottom: 4 }}>SECURE PAYMENT</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Pay Monthly Rent</div>
              <div style={{ color: palette.slate600, fontSize: 13, marginTop: 4 }}>Powered by Selcom • Oweru</div>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Property Summary */}
              <div style={{ 
                background: palette.slate900, 
                borderRadius: 14, 
                padding: 16, 
                marginBottom: 24,
                border: `1px solid ${palette.borderFaint}`
              }}>
                <div style={{ fontWeight: 600, fontSize: 15.5 }}>{activeApp.property?.title}</div>
                {activeApp.property?.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: palette.slate600, marginTop: 6, fontSize: 13 }}>
                    <MapPin size={15} /> {activeApp.property.location}
                  </div>
                )}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${palette.slate200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: palette.slate600, fontSize: 13 }}>Amount Due</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: palette.gold }}>
                    Tsh {modalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Provider Selection */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', color: palette.slate600, marginBottom: 10 }}>PAYMENT PROVIDER</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { value: 'tigo', label: 'Tigo Pesa' },
                    { value: 'mpesa', label: 'M-Pesa' },
                    { value: 'airtel', label: 'Airtel Money' },
                    { value: 'halopesa', label: 'Halopesa' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      className={`pay-provider-btn ${p.value}`}
                      data-active={paymentProvider === p.value ? 'true' : 'false'}
                      onClick={() => setPaymentProvider(p.value as any)}
                      disabled={paying}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Input */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', color: palette.slate600, marginBottom: 8 }}>PHONE NUMBER</div>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: palette.slate600 }} />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678"
                    disabled={paying}
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 52px',
                      background: palette.slate900,
                      border: `1px solid ${palette.slate200}`,
                      borderRadius: 12,
                      color: palette.white,
                      fontSize: 16,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Security */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                background: 'rgba(16,185,129,0.08)', 
                border: '1px solid rgba(16,185,129,0.25)', 
                borderRadius: 12, 
                padding: '12px 16px',
                marginBottom: 24,
                fontSize: 13,
                color: '#34d399'
              }}>
                <ShieldCheck size={18} /> 256-bit SSL Secured • Trusted by Selcom
              </div>

              {/* Result Messages */}
              {payResult && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  marginBottom: 20,
                  display: 'flex',
                  gap: 12,
                  background: payResult === 'success' ? 'rgba(16,185,129,0.1)' : payResult === 'waiting' ? 'rgba(200,145,40,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${payResult === 'success' ? '#10b98150' : payResult === 'waiting' ? 'rgba(200,145,40,0.3)' : '#ef444450'}`,
                  color: payResult === 'success' ? '#34d399' : payResult === 'waiting' ? palette.gold : '#f87171'
                }}>
                  {payResult === 'success' ? <CheckCircle size={20} /> : payResult === 'waiting' ? <Loader2 size={20} style={{ animation: 'spin 0.9s linear infinite' }} /> : <AlertCircle size={20} />}
                  <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{payMessage}</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={closePaymentModal} 
                  disabled={paying || payResult === 'waiting'}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: palette.slate900,
                    border: `1px solid ${palette.slate200}`,
                    color: palette.white,
                    borderRadius: 12,
                    fontWeight: 600,
                    cursor: paying ? 'not-allowed' : 'pointer',
                    opacity: paying ? 0.6 : 1
                  }}
                >
                  {payResult === 'success' ? 'Done' : 'Cancel'}
                </button>

                {payResult !== 'success' && payResult !== 'waiting' && (
                  <button
                    onClick={() => handlePayRent(paymentModal)}
                    disabled={paying || !phoneNumber || phoneNumber.length < 10}
                    style={{
                      flex: 1.8,
                      padding: '14px',
                      background: paying ? `${palette.gold}aa` : palette.gold,
                      color: palette.slate900,
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: paying || !phoneNumber || phoneNumber.length < 10 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: paying ? 'none' : '0 6px 20px rgba(200,145,40,0.35)'
                    }}
                  >
                    {paying ? (
                      <> <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} /> Processing... </>
                    ) : (
                      <> <DollarSign size={18} /> Pay Tsh {modalAmount.toLocaleString()} </>
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