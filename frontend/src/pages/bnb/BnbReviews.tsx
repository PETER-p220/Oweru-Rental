import { useState, useEffect } from 'react';
import { Star, Reply, XCircle, MessageSquare } from 'lucide-react';
import Api from '../../services/api';

interface Review {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  rating: number;
  comment: string;
  response?: string;
  created_at: string;
  booking_id: number;
}

/* ─── TOKENS ─────────────────────────────────────────── */
/* Same warm-paper / brass identity as the properties page */
const t = {
  gold:     '#8B5E34', // brass accent
  goldLt:   '#7A5230', // deeper brass for text on light tinted chips
  bg:       '#FAF9F6', // page background
  surface:  '#FFFFFF', // card background
  surface2: '#F4F1EA', // inset surface: inputs, modal shells, info tiles
  ink:      '#1C1917', // primary text
  onAccent: '#FFFFFF', // text placed on solid brass/accent backgrounds
  muted:    '#78716C',
  border:   '#E7E2D9',
  green:    '#2F6844',
  red:      '#9F1D1D',
  blue:     '#33448C',
  orange:   '#92400E',
} as const;

const body: React.CSSProperties   = { fontFamily: 'Inter, sans-serif' };
const serif: React.CSSProperties  = { fontFamily: 'Fraunces, Georgia, serif' };
const card: React.CSSProperties   = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(28,25,23,0.04)' };
const btn: React.CSSProperties    = { ...body, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s' };

const BnbReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [searchTerm, ratingFilter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await Api.getBnbReviews({
        search: searchTerm,
        rating: ratingFilter,
      });
      setReviews(response.data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          fill={star <= rating ? t.gold : 'none'}
          color={star <= rating ? t.gold : t.border}
        />
      ))}
    </div>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', backgroundColor: t.bg, minHeight: '100vh', ...body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .search-input {
          font-family: Inter, sans-serif;
          padding: 10px 14px;
          border: 1px solid ${t.border};
          border-radius: 8px;
          background: ${t.surface2};
          color: ${t.ink};
          font-size: 14px;
          min-width: 0;
          width: min(100%, 280px);
          flex: 1 1 200px;
        }
        .search-input::placeholder { color: ${t.muted}; }
        .rating-select {
          font-family: Inter, sans-serif;
          padding: 10px 14px;
          border: 1px solid ${t.border};
          border-radius: 8px;
          background: ${t.surface2};
          color: ${t.ink};
          font-size: 14px;
        }
        .reviews-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
        }
        .review-card {
          background: ${t.surface};
          border: 1px solid ${t.border};
          border-radius: 12px;
          padding: 18px;
          transition: all 0.2s ease;
          color: ${t.ink};
          box-shadow: 0 1px 2px rgba(28,25,23,0.04);
          cursor: pointer;
          animation: fadeIn 0.35s ease;
        }
        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(28,25,23,0.08);
          border-color: ${t.gold}50;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 10px;
        }
        .review-property {
          font-family: Fraunces, Georgia, serif;
          font-weight: 600;
          font-size: 15px;
          color: ${t.ink};
          margin-bottom: 4px;
        }
        .review-guest {
          font-size: 13px;
          color: ${t.muted};
        }
        .review-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .review-comment {
          color: ${t.ink};
          font-size: 14px;
          line-height: 1.55;
          margin-bottom: 12px;
        }
        .review-response {
          background: ${t.green}0f;
          border-left: 3px solid ${t.green};
          padding: 10px 12px;
          border-radius: 4px;
          color: ${t.ink};
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .review-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid ${t.border};
          font-size: 12px;
          color: ${t.muted};
        }
        .reply-btn {
          background: ${t.blue}18;
          border: none;
          color: ${t.blue};
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          font-family: Inter, sans-serif;
          transition: background 0.2s;
        }
        .reply-btn:hover { background: ${t.blue}28; }

        @media (max-width: 640px) {
          .reviews-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

      {/* Header */}
      <div className="reviews-header">
        <div>
          <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, color: t.ink, margin: '0 0 6px' }}>Reviews</h1>
          <p style={{ fontSize: 15, color: t.muted, margin: 0 }}>
            {loading ? 'Loading…' : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search reviews…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="rating-select"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: t.muted }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 60, animation: 'fadeIn 0.4s ease' }}>
          <MessageSquare size={48} style={{ color: t.muted, marginBottom: 16 }} />
          <div style={{ ...serif, fontSize: 20, color: t.ink, marginBottom: 8 }}>No reviews found</div>
          <div style={{ color: t.muted }}>Reviews from guests will appear here</div>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="review-card"
              onClick={() => {
                setSelectedReview(review);
                setShowDetailModal(true);
              }}
            >
              <div className="review-header">
                <div>
                  <div className="review-property">{review.property_title}</div>
                  <div className="review-guest">{review.guest_name}</div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                  <span style={{ color: t.muted, fontSize: 13 }}>{review.rating}.0</span>
                </div>
              </div>

              <div className="review-comment">{review.comment}</div>

              {review.response && (
                <div className="review-response">
                  <strong>Response:</strong> {review.response}
                </div>
              )}

              <div className="review-footer">
                <span>{formatDate(review.created_at)}</span>
                <button
                  className="reply-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const response = prompt('Write your reply (min 10 characters):');
                    if (!response || response.trim().length < 10) return;
                    try {
                      await Api.respondToBnbReview(review.id, response.trim());
                      await loadReviews();
                    } catch (err: any) {
                      alert(err?.response?.data?.message || 'Could not send reply');
                    }
                  }}
                >
                  <Reply size={13} />
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {showDetailModal && selectedReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,25,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ ...card, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', animation: 'fadeIn 0.25s ease' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}` }}>
              <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.ink, margin: 0 }}>Review Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Property', value: selectedReview.property_title },
                { label: 'Guest', value: selectedReview.guest_name },
              ].map(({ label, value }) => (
                <div key={label} style={{ backgroundColor: t.surface2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 11, color: t.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>{value}</div>
                </div>
              ))}

              <div style={{ backgroundColor: t.surface2, borderRadius: 8, padding: '12px 14px', border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, color: t.muted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {renderStars(selectedReview.rating)}
                  <span style={{ fontSize: 14, color: t.ink, fontWeight: 500 }}>{selectedReview.rating}.0</span>
                </div>
              </div>

              <div>
                <h3 style={{ ...serif, fontSize: 15, fontWeight: 600, color: t.gold, margin: '0 0 8px' }}>Comment</h3>
                <p style={{ color: t.ink, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{selectedReview.comment}</p>
              </div>

              {selectedReview.response && (
                <div>
                  <h3 style={{ ...serif, fontSize: 15, fontWeight: 600, color: t.gold, margin: '0 0 8px' }}>Response</h3>
                  <div className="review-response" style={{ margin: 0 }}>{selectedReview.response}</div>
                </div>
              )}

              <div style={{ fontSize: 12, color: t.muted }}>{formatDate(selectedReview.created_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BnbReviews;