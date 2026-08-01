import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useMatch } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Users, Calendar, CreditCard, Smartphone, MessageCircle } from 'lucide-react';
import Api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  getBrowseBnbPath,
  getBnbPropertyPath,
  getMyStaysPath,
  getPublicBnbPropertyPath,
  saveBnbBookingDraft,
  loadBnbBookingDraft,
  clearBnbBookingDraft,
  type BnbBookingDraft,
} from '../../utils/bnbNav';
import { DASHBOARD_LISTING_CSS } from '../../styles/dashboardListingStyles';
import BnbAvailabilityCalendar from '../../components/bnb/BnbAvailabilityCalendar';
import { usePaymentPolling } from '../../hooks/usePaymentPolling';
import { buildPropertyShareMessage, buildPropertyShareUrl, openWhatsAppShare } from '../../utils/propertyShare';

const GOLD = '#C89128';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);

type PayMode = 'mobile_money' | 'bank';
type Step = 'form' | 'payment' | 'pending' | 'success' | 'failed';

const PROVIDERS = [
  { value: 'tigo', label: 'Tigo Pesa' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'halopesa', label: 'Halopesa' },
] as const;

const BnbPropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isPublicPage = !!useMatch('/bnb/:id');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [resumingBooking, setResumingBooking] = useState(false);
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    check_in: '',
    check_out: '',
    guest_count: 1,
    special_requests: '',
  });
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [paymentMode, setPaymentMode] = useState<PayMode>('mobile_money');
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]['value']>('tigo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const draftHandledRef = useRef(false);

  useEffect(() => {
    draftHandledRef.current = false;
  }, [id]);

  useEffect(() => {
    if (user) {
      setBooking((p) => ({
        ...p,
        customer_name: p.customer_name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
        customer_email: p.customer_email || user.email || '',
        customer_phone: p.customer_phone || user.phone || '',
      }));
      setPhoneNumber((p) => p || user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getBnbPropertyDetails(Number(id));
        setProperty(res.data || res);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const nights = useMemo(() => {
    if (!booking.check_in || !booking.check_out) return 0;
    return Math.max(0, Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000));
  }, [booking.check_in, booking.check_out]);

  const total = useMemo(() => {
    if (!property || nights <= 0) return 0;
    const base = nights * (property.price || 0);
    return base + (property.cleaning_fee || 0) + (property.service_fee || 0);
  }, [property, nights]);

  const pollBnbPayment = useCallback(async () => {
    if (!pendingOrderId) return { data: {} };
    const res = await Api.checkBnbBookingPaymentStatus(pendingOrderId);
    return {
      data: {
        ...(res.data || {}),
        payment_status: res.data?.payment_status,
        message: res.message,
      },
      message: res.message,
    };
  }, [pendingOrderId]);

  usePaymentPolling(
    step === 'pending' && !!pendingOrderId,
    pendingOrderId,
    pollBnbPayment,
    {
      onPaid: (message) => {
        setStatusMessage(message || 'Payment confirmed. Your stay is booked.');
        setStep('success');
      },
      onFailed: (message) => {
        setError(message || 'Payment was not completed.');
        setStep('failed');
      },
      onTimeout: (message) => setStatusMessage(message),
    },
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user || !id || !isPublicPage) return;
    navigate(getBnbPropertyPath(user, id), { replace: true });
  }, [authLoading, isAuthenticated, user, id, isPublicPage, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated && (step === 'payment' || step === 'pending')) {
      setStep('form');
      setBookingId(null);
      setPendingOrderId('');
    }
  }, [authLoading, isAuthenticated, step]);

  const authRedirect = isPublicPage
    ? getPublicBnbPropertyPath(id!)
    : getBnbPropertyPath(user, id!);

  const redirectToAuth = (draft?: BnbBookingDraft) => {
    if (id) {
      saveBnbBookingDraft(id, draft ?? { booking, resumePayment: true });
    }
    navigate(`/login?redirect=${encodeURIComponent(authRedirect)}`);
  };

  const computeTotal = useCallback((bookingData: typeof booking) => {
    if (!property || !bookingData.check_in || !bookingData.check_out) return 0;
    const n = Math.max(0, Math.ceil(
      (new Date(bookingData.check_out).getTime() - new Date(bookingData.check_in).getTime()) / 86400000,
    ));
    if (n <= 0) return 0;
    return n * (property.price || 0) + (property.cleaning_fee || 0) + (property.service_fee || 0);
  }, [property]);

  const createBookingRequest = useCallback(async (bookingData: typeof booking) => {
    if (!property) throw new Error('Property not loaded');

    const res = await Api.createBnbBooking({
      property_id: property.id,
      property_title: property.title,
      customer_name: bookingData.customer_name,
      customer_email: bookingData.customer_email,
      customer_phone: bookingData.customer_phone,
      check_in: bookingData.check_in,
      check_out: bookingData.check_out,
      guest_count: bookingData.guest_count,
      special_requests: bookingData.special_requests,
      total_amount: computeTotal(bookingData),
    });

    const data = res.data || res;
    const newBookingId = data.booking_id ?? data.id;
    if (!newBookingId) throw new Error('Could not create booking');
    setBookingId(newBookingId);
    setStep('payment');
    clearBnbBookingDraft(property.id);
  }, [property, computeTotal]);

  useEffect(() => {
    if (draftHandledRef.current) return;
    if (authLoading || !isAuthenticated || !property || !id) return;

    const draft = loadBnbBookingDraft(id);
    if (!draft) return;

    draftHandledRef.current = true;
    setBooking((prev) => ({ ...prev, ...draft.booking }));

    if (!draft.resumePayment || !draft.booking.check_in || !draft.booking.check_out) {
      clearBnbBookingDraft(id);
      return;
    }

    clearBnbBookingDraft(id);
    setResumingBooking(true);
    setError('');

    createBookingRequest(draft.booking)
      .catch((err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Booking failed';
        if (err?.response?.status === 401 || err?.response?.data?.requires_auth) {
          setError('Your session expired. Please sign in again to continue.');
          saveBnbBookingDraft(id, draft);
          return;
        }
        setError(msg);
      })
      .finally(() => setResumingBooking(false));
  }, [authLoading, isAuthenticated, property, id, createBookingRequest]);

  const goBack = () => {
    if (isPublicPage) {
      navigate('/#bnb');
    } else {
      navigate(getBrowseBnbPath(user));
    }
  };

  const backLabel = isPublicPage ? 'Back to short stays' : 'Back to Browse BnB Stays';

  const handleWhatsAppShare = () => {
    if (!property?.id) return;
    const url = buildPropertyShareUrl(property.id, null, 'bnb');
    openWhatsAppShare(buildPropertyShareMessage(property.title || 'Short stay', url));
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    if (nights <= 0 || !booking.check_in || !booking.check_out) {
      setError('Please select check-in and check-out dates on the calendar.');
      return;
    }

    if (!isAuthenticated) {
      setError('');
      redirectToAuth({ booking, resumePayment: true });
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createBookingRequest(booking);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Booking failed';
      if (err?.response?.status === 401 || err?.response?.data?.requires_auth) {
        setError('Your session expired. Please sign in again to continue.');
        redirectToAuth({ booking, resumePayment: true });
        return;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!isAuthenticated) {
      redirectToAuth({ booking, resumePayment: true });
      return;
    }
    if (!bookingId) return;
    setPaying(true);
    setError('');
    try {
      const payload = paymentMode === 'bank'
        ? { payment_mode: 'bank' as const, phone_number: phoneNumber || booking.customer_phone }
        : {
            payment_mode: 'mobile_money' as const,
            phone_number: phoneNumber || booking.customer_phone,
            provider,
          };

      const res = await Api.initiateBnbBookingPayment(bookingId, payload);
      const data = res.data || {};
      const orderId = data.order_id || data.transaction_id;
      if (!orderId) throw new Error(res.message || 'Could not start payment');

      if (paymentMode === 'bank' && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      setPendingOrderId(orderId);
      setStatusMessage(res.message || `Approve the ${provider.toUpperCase()} prompt on your phone.`);
      setStep('pending');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Payment failed';
      if (err?.response?.status === 401 || err?.response?.data?.requires_auth) {
        setError('Your session expired. Please sign in again to complete payment.');
        saveBnbBookingDraft(id!, { booking, resumePayment: true });
        return;
      }
      setError(msg);
      setStep('failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>Loading stay…</div>;
  }

  if (!property) {
    return (
      <div className="dlp-page" style={{ padding: 48, textAlign: 'center' }}>
        <style>{DASHBOARD_LISTING_CSS}</style>
        <p style={{ color: '#DC2626', marginBottom: 16 }}>{error || 'Not found'}</p>
        <button type="button" className="dlp-btn" style={{ maxWidth: 220, margin: '0 auto' }} onClick={goBack}>
          {backLabel}
        </button>
      </div>
    );
  }

  const images = property.images?.length ? property.images : [property.main_image].filter(Boolean);

  return (
    <div className="dlp-page">
      <style>{DASHBOARD_LISTING_CSS}</style>
      <style>{`
        .bnb-detail-wrap { max-width: 1100px; margin: 0 auto; padding: 24px 20px 48px; }
        .bnb-detail-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; align-items: start; }
        .bnb-book-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; position: sticky; top: 20px; }
        .bnb-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .bnb-inp {
          width: 100%; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px;
          margin-bottom: 10px; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit;
          min-height: 44px; background: #fff; color: #0F172A;
        }
        .bnb-submit, .bnb-pay-btn {
          width: 100%; min-height: 48px; padding: 12px; background: ${GOLD}; color: #0F172A;
          border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px;
        }
        .bnb-mode-btn {
          flex: 1; padding: 10px; border: 1.5px solid #E2E8F0; border-radius: 10px; background: #fff;
          cursor: pointer; font-size: 12px; font-weight: 600; color: #475569; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .bnb-mode-btn[data-active='true'] { border-color: ${GOLD}; background: ${GOLD}12; color: #0F172A; }
        .bnb-provider { padding: 8px 10px; border: 1px solid #E2E8F0; border-radius: 8px; background: #fff; font-size: 12px; cursor: pointer; }
        .bnb-provider[data-active='true'] { border-color: ${GOLD}; background: ${GOLD}12; font-weight: 700; }
        @media (max-width: 860px) {
          .bnb-detail-grid { grid-template-columns: 1fr; gap: 16px; }
          .bnb-book-card { position: static; }
          .bnb-detail-wrap { padding: 16px 14px 40px; }
        }
        @media (max-width: 480px) {
          .bnb-date-grid { grid-template-columns: 1fr; }
          .bnb-hero-title { font-size: 22px !important; }
        }
      `}</style>

      <div className="bnb-detail-wrap">
        <button
          type="button"
          onClick={goBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--slate-600)', cursor: 'pointer', marginBottom: 16, minHeight: 44, padding: '8px 0', fontFamily: 'inherit' }}
        >
          <ArrowLeft size={16} /> {backLabel}
        </button>

        <div className="bnb-detail-grid">
          <div>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#E2E8F0', aspectRatio: '16/10', marginBottom: 16 }}>
              {images[0] ? <img src={images[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </div>
            <h1 className="bnb-hero-title" style={{ margin: '0 0 8px', fontSize: 28, color: '#0F172A', fontWeight: 800 }}>{property.title}</h1>
            <div style={{ display: 'flex', gap: 14, color: '#64748B', fontSize: 13, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={13} color={GOLD} />{property.location}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={13} />Up to {property.max_guests || '—'} guests</span>
              {property.rating_count > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={13} color={GOLD} fill={GOLD} />{property.rating_avg} ({property.rating_count})</span>
              )}
            </div>
            <p style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: 14, marginBottom: 20 }}>{property.description}</p>

            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Availability</h3>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B' }}>
                Live calendar — booked dates update automatically as guests reserve this stay.
              </p>
              <BnbAvailabilityCalendar propertyId={property.id} mode="guest" accent={GOLD} refreshIntervalMs={45000} />
            </div>
          </div>

          <div className="bnb-book-card">
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{fmt(property.price)}</span>
              <span style={{ color: '#64748B', fontSize: 13 }}> / night</span>
            </div>

            {!isAuthenticated && step === 'form' && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                Browse freely — sign in only when you continue to payment.
              </div>
            )}

            {step === 'form' ? (
              <form onSubmit={handleCreateBooking}>
                <input required className="bnb-inp" placeholder="Full name" value={booking.customer_name} onChange={(e) => setBooking((p) => ({ ...p, customer_name: e.target.value }))} />
                <input required type="email" className="bnb-inp" placeholder="Email" value={booking.customer_email} onChange={(e) => setBooking((p) => ({ ...p, customer_email: e.target.value }))} />
                <input required className="bnb-inp" placeholder="Phone (for payment)" value={booking.customer_phone} onChange={(e) => setBooking((p) => ({ ...p, customer_phone: e.target.value }))} />

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8 }}>Select dates on the calendar</div>
                  <BnbAvailabilityCalendar
                    propertyId={property.id}
                    mode="guest"
                    accent={GOLD}
                    checkIn={booking.check_in}
                    checkOut={booking.check_out}
                    refreshIntervalMs={45000}
                    onRangeChange={(checkIn, checkOut) => setBooking((p) => ({ ...p, check_in: checkIn, check_out: checkOut }))}
                  />
                  {(booking.check_in || booking.check_out) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                      <div style={{ fontSize: 12, color: '#475569' }}>
                        <span style={{ fontWeight: 700, color: '#64748B' }}>Check-in: </span>
                        {booking.check_in || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: '#475569' }}>
                        <span style={{ fontWeight: 700, color: '#64748B' }}>Check-out: </span>
                        {booking.check_out || '—'}
                      </div>
                    </div>
                  )}
                </div>

                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Guests
                  <input required type="number" min={1} max={property.max_guests || 20} className="bnb-inp" value={booking.guest_count} onChange={(e) => setBooking((p) => ({ ...p, guest_count: Number(e.target.value) }))} />
                </label>
                <textarea className="bnb-inp" style={{ minHeight: 80 }} placeholder="Special requests (optional)" value={booking.special_requests} onChange={(e) => setBooking((p) => ({ ...p, special_requests: e.target.value }))} />

                {nights > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                    <span style={{ color: '#64748B', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{nights} nights</span>
                    <strong style={{ color: GOLD }}>{fmt(total)}</strong>
                  </div>
                )}

                {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error}</div>}

                <button type="submit" className="bnb-submit" disabled={submitting || resumingBooking || nights <= 0} style={{ opacity: submitting || resumingBooking || nights <= 0 ? 0.6 : 1 }}>
                  {submitting || resumingBooking
                    ? 'Preparing booking…'
                    : isAuthenticated
                      ? 'Continue to payment'
                      : 'Sign in to continue to payment'}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  style={{
                    width: '100%', marginTop: 10, minHeight: 44, padding: '12px',
                    background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10,
                    color: '#15803D', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>

                {!isAuthenticated && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                    No account?{' '}
                    <Link to={`/register?redirect=${encodeURIComponent(authRedirect)}`} style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>
                      Create one free
                    </Link>
                  </p>
                )}
              </form>
            ) : null}

            {isAuthenticated && (step === 'payment' || step === 'failed') && (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#0F172A' }}>Pay {fmt(total)}</h3>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>Complete payment to confirm your stay.</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <button type="button" className="bnb-mode-btn" data-active={paymentMode === 'mobile_money'} onClick={() => setPaymentMode('mobile_money')}>
                    <Smartphone size={14} /> Mobile money
                  </button>
                  <button type="button" className="bnb-mode-btn" data-active={paymentMode === 'bank'} onClick={() => setPaymentMode('bank')}>
                    <CreditCard size={14} /> Bank / card
                  </button>
                </div>

                <input
                  className="bnb-inp"
                  placeholder="Payment phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />

                {paymentMode === 'mobile_money' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {PROVIDERS.map((p) => (
                      <button key={p.value} type="button" className="bnb-provider" data-active={provider === p.value} onClick={() => setProvider(p.value)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {paymentMode === 'bank' && (
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
                    You will be redirected to Selcom secure checkout to pay by bank transfer or card.
                  </p>
                )}

                {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error}</div>}

                <button type="button" className="bnb-pay-btn" disabled={paying} onClick={handlePay} style={{ opacity: paying ? 0.6 : 1, marginBottom: 8 }}>
                  {paying ? 'Processing…' : paymentMode === 'bank' ? 'Continue to bank checkout' : `Pay with ${provider.toUpperCase()}`}
                </button>
                <button type="button" onClick={() => { setStep('form'); setError(''); }} style={{ width: '100%', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13 }}>
                  Back to dates
                </button>
              </div>
            )}

            {isAuthenticated && step === 'pending' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <h3 style={{ margin: '0 0 8px', color: '#0F172A' }}>Waiting for payment</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{statusMessage}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>Ref: {pendingOrderId}</p>
              </div>
            )}

            {isAuthenticated && step === 'success' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
                <h3 style={{ margin: '0 0 8px', color: '#16A34A' }}>Booking confirmed</h3>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>{statusMessage}</p>
                <button type="button" className="bnb-submit" onClick={() => navigate(getMyStaysPath(user))}>
                  View My Stays
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BnbPropertyDetail;
