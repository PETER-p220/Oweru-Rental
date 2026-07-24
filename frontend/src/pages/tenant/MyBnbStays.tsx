import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Hotel, MapPin, Star, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getBrowseBnbPath, getBnbPropertyPath } from '../../utils/bnbNav';

const GOLD = '#C89128';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const MyBnbStays = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewFor, setReviewFor] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await Api.getMyBnbBookings(statusFilter !== 'all' ? { status: statusFilter } : undefined);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load your stays.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
    reviewable: bookings.filter((b) => b.can_review).length,
  }), [bookings]);

  const cancelBooking = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await Api.cancelMyBnbBooking(id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Could not cancel booking.');
    }
  };

  const submitReview = async () => {
    if (!reviewFor || comment.trim().length < 10) {
      alert('Please write at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await Api.submitMyBnbReview({
        property_id: reviewFor.property_id,
        booking_id: reviewFor.id,
        rating,
        comment: comment.trim(),
      });
      setReviewFor(null);
      setComment('');
      setRating(5);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9', minHeight: '100vh' }}>
      <style>{`
        .stays-header { background: #1E293B; padding: clamp(24px, 5vw, 48px) clamp(16px, 4vw, 40px) clamp(24px, 4vw, 40px); }
        .stays-inner { max-width: 1100px; margin: 0 auto; }
        .stays-stats { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; align-items: stretch; }
        .stays-stat { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 12px 16px; min-width: 110px; }
        .stays-cta {
          margin-left: auto; align-self: center; padding: 12px 18px; min-height: 44px;
          background: ${GOLD}; color: #0F172A; border-radius: 8px; font-weight: 700; font-size: 12px;
          text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
        }
        .stays-body { max-width: 1100px; margin: 0 auto; padding: 20px 16px 40px; }
        .stays-filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .stays-chip {
          padding: 10px 14px; min-height: 40px; border-radius: 999px; font-weight: 600; font-size: 12px;
          text-transform: capitalize; cursor: pointer; border: 1px solid #E2E8F0; background: #fff; color: #64748B;
        }
        .stays-chip.active { border-color: ${GOLD}; background: rgba(200,145,40,0.12); color: ${GOLD}; }
        .stays-card {
          background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px;
          display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-start;
        }
        .stays-actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; min-width: 120px; }
        .stays-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 12px; min-height: 42px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .star-hit { background: none; border: none; cursor: pointer; padding: 8px; min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
        @media (max-width: 640px) {
          .stays-cta { width: 100%; margin-left: 0; }
          .stays-stat { flex: 1 1 calc(50% - 10px); min-width: 0; }
          .stays-actions { width: 100%; flex-direction: row; flex-wrap: wrap; }
          .stays-btn { flex: 1 1 auto; }
          .stays-thumb { width: 64px !important; height: 64px !important; }
        }
      `}</style>

      <div className="stays-header">
        <div className="stays-inner">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
            {user?.userType || user?.user_type || 'Guest'} · Short stays
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800 }}>My Stays</h1>
          <p style={{ margin: '8px 0 0', color: '#94A3B8', fontSize: 13, lineHeight: 1.5 }}>
            Your BnB bookings and payments. Browse stays from the sidebar or book a new stay below.
          </p>
          <div className="stays-stats">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Upcoming', value: stats.upcoming },
              { label: 'To review', value: stats.reviewable },
            ].map((s) => (
              <div key={s.label} className="stays-stat">
                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              </div>
            ))}
            <Link to={getBrowseBnbPath(user)} className="stays-cta">Book a stay</Link>
          </div>
        </div>
      </div>

      <div className="stays-body">
        <div className="stays-filters">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button key={s} className={`stays-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 14, background: '#FEF2F2', color: '#DC2626', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: '#64748B', gap: 10 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading stays…
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
            <Hotel size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>No stays yet</div>
            <div style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>Book a short stay from Browse BnB Stays.</div>
            <button onClick={() => navigate(getBrowseBnbPath(user))} style={{ padding: '12px 18px', minHeight: 44, background: GOLD, color: '#0F172A', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
              Browse short stays
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map((b) => (
              <div key={b.id} className="stays-card">
                <div className="stays-thumb" style={{ width: 72, height: 72, borderRadius: 12, background: '#F1F5F9', overflow: 'hidden', flexShrink: 0 }}>
                  {(b.property?.main_image || b.property?.images?.[0]) ? (
                    <img src={b.property.main_image || b.property.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hotel size={22} color="#94A3B8" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{b.property?.title || 'Stay'}</div>
                  <div style={{ display: 'flex', gap: 10, color: '#64748B', fontSize: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} color={GOLD} />{b.property?.location || '—'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{fmtDate(b.check_in)} → {fmtDate(b.check_out)}</span>
                    <span>{b.guests} guest{b.guests > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: '#F1F5F9', color: '#475569' }}>{b.status}</span>
                    <span style={{ fontWeight: 700, color: GOLD }}>{fmt(b.total_price)}</span>
                  </div>
                </div>
                <div className="stays-actions">
                  {b.property_id && (
                    <Link to={getBnbPropertyPath(user, b.property_id)} className="stays-btn" style={{ border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A', textDecoration: 'none' }}>View</Link>
                  )}
                  {b.can_cancel && (
                    <button className="stays-btn" onClick={() => cancelBooking(b.id)} style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>
                      <XCircle size={13} /> Cancel
                    </button>
                  )}
                  {b.can_review && (
                    <button className="stays-btn" onClick={() => setReviewFor(b)} style={{ border: `1px solid rgba(200,145,40,0.3)`, background: 'rgba(200,145,40,0.1)', color: GOLD }}>
                      <Star size={13} /> Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={(e) => e.target === e.currentTarget && setReviewFor(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, maxWidth: 420, width: '100%' }}>
            <h3 style={{ margin: '0 0 6px', color: '#0F172A' }}>Review stay</h3>
            <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: 13 }}>{reviewFor.property?.title}</p>
            <div style={{ display: 'flex', gap: 2, marginBottom: 14, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className="star-hit" onClick={() => setRating(n)}>
                  <Star size={22} fill={n <= rating ? GOLD : 'none'} color={GOLD} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your stay? (min 10 characters)"
              style={{ width: '100%', minHeight: 100, padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setReviewFor(null)} style={{ flex: 1, padding: 12, minHeight: 44, border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={submitReview} disabled={submitting} style={{ flex: 2, padding: 12, minHeight: 44, border: 'none', background: GOLD, color: '#0F172A', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MyBnbStays;
