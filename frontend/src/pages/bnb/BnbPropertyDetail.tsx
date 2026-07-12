import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Users, Calendar } from 'lucide-react';
import Api, { TOKEN_KEY } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GOLD = '#C89128';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);

const BnbPropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setBooking((p) => ({
        ...p,
        customer_name: p.customer_name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
        customer_email: p.customer_email || user.email || '',
        customer_phone: p.customer_phone || user.phone || '',
      }));
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

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/public/bnb/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          property_id: property.id,
          property_title: property.title,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          customer_phone: booking.customer_phone,
          check_in: booking.check_in,
          check_out: booking.check_out,
          guest_count: booking.guest_count,
          special_requests: booking.special_requests,
          total_amount: total,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      setSuccess(data.message || 'Booking submitted!');
      const role = user?.userType || user?.user_type || user?.role;
      if (token && role === 'tenant') {
        setTimeout(() => navigate('/dashboard/tenant/bnb-stays'), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>Loading stay…</div>;
  }

  if (!property) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <p style={{ color: '#DC2626' }}>{error || 'Not found'}</p>
        <Link to="/" style={{ color: GOLD }}>Back home</Link>
      </div>
    );
  }

  const images = property.images?.length ? property.images : [property.main_image].filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'DM Sans, sans-serif' }}>
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
        .bnb-submit {
          width: 100%; min-height: 48px; padding: 12px; background: ${GOLD}; color: #0F172A;
          border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px;
        }
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
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', marginBottom: 16, minHeight: 44, padding: '8px 0', fontFamily: 'inherit' }}
        >
          <ArrowLeft size={16} /> Back
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
            <p style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: 14 }}>{property.description}</p>

            {property.reviews?.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ margin: '0 0 12px', color: '#0F172A' }}>Guest reviews</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {property.reviews.map((r: any) => (
                    <div key={r.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#0F172A' }}>{r.guest_name}</strong>
                        <span style={{ color: GOLD, fontSize: 12 }}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>{r.comment}</p>
                      {r.response && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569', background: '#F8FAFC', padding: 8, borderRadius: 8 }}>Owner: {r.response}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bnb-book-card">
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{fmt(property.price)}</span>
              <span style={{ color: '#64748B', fontSize: 13 }}> / night</span>
            </div>

            {!user && (
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
                Booking as a guest is fine. <Link to="/login" style={{ color: GOLD, fontWeight: 600 }}>Log in</Link> to track this stay under My Stays and leave a review later.
              </p>
            )}

            <form onSubmit={handleBook}>
              <input required className="bnb-inp" placeholder="Full name" value={booking.customer_name} onChange={(e) => setBooking((p) => ({ ...p, customer_name: e.target.value }))} />
              <input required type="email" className="bnb-inp" placeholder="Email" value={booking.customer_email} onChange={(e) => setBooking((p) => ({ ...p, customer_email: e.target.value }))} />
              <input required className="bnb-inp" placeholder="Phone" value={booking.customer_phone} onChange={(e) => setBooking((p) => ({ ...p, customer_phone: e.target.value }))} />
              <div className="bnb-date-grid">
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Check-in
                  <input required type="date" className="bnb-inp" value={booking.check_in} onChange={(e) => setBooking((p) => ({ ...p, check_in: e.target.value }))} />
                </label>
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Check-out
                  <input required type="date" className="bnb-inp" value={booking.check_out} onChange={(e) => setBooking((p) => ({ ...p, check_out: e.target.value }))} />
                </label>
              </div>
              <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Guests
                <input required type="number" min={1} max={property.max_guests || 20} className="bnb-inp" value={booking.guest_count} onChange={(e) => setBooking((p) => ({ ...p, guest_count: Number(e.target.value) }))} />
              </label>
              <textarea className="bnb-inp" style={{ minHeight: 80 }} placeholder="Special requests (optional)" value={booking.special_requests} onChange={(e) => setBooking((p) => ({ ...p, special_requests: e.target.value }))} />

              {nights > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, padding: 12, background: '#F8FAFC', borderRadius: 8, gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#64748B', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{nights} nights</span>
                  <strong style={{ color: GOLD }}>{fmt(total)}</strong>
                </div>
              )}

              {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error}</div>}
              {success && <div style={{ color: '#16A34A', fontSize: 13, marginBottom: 10 }}>{success}</div>}

              <button type="submit" className="bnb-submit" disabled={submitting || nights <= 0} style={{ opacity: submitting || nights <= 0 ? 0.6 : 1 }}>
                {submitting ? 'Submitting…' : user ? 'Book & save to My Stays' : 'Request booking'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BnbPropertyDetail;
