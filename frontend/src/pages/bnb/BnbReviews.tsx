import { useState, useEffect } from 'react';
import { Star, MessageSquare, Search, Filter, Eye, Reply, Trash2 } from 'lucide-react';
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
      // Fallback to mock data if API fails
      const mockReviews: Review[] = [
        {
          id: 1,
          property_id: 1,
          property_title: 'Luxury Beach Villa',
          guest_name: 'John Doe',
          rating: 5,
          comment: 'Amazing place! Beautiful views and excellent service.',
          created_at: '2026-03-15',
          booking_id: 1,
        },
        {
          id: 2,
          property_id: 2,
          property_title: 'City Center Apartment',
          guest_name: 'Jane Smith',
          rating: 4,
          comment: 'Great location, very clean and comfortable.',
          response: 'Thank you for your feedback! We appreciate your stay.',
          created_at: '2026-03-14',
          booking_id: 2,
        },
      ];
      setReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? '#f59e0b' : 'none'}
            color={star <= rating ? '#f59e0b' : '#4b5563'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: '#080808',
      color: '#e8e4dc',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <style>{`
        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .reviews-title {
          font-size: 24px;
          font-weight: 600;
          color: #e8e4dc;
          margin: 0;
        }
        .reviews-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .search-input {
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #e8e4dc;
          font-size: 14px;
          min-width: 250px;
        }
        .rating-select {
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #e8e4dc;
          font-size: 14px;
        }
        .reviews-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        }
        .review-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }
        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .review-property {
          font-weight: 600;
          color: #c9a84c;
          margin-bottom: 4px;
        }
        .review-guest {
          font-size: 14px;
          color: #9ca3af;
        }
        .review-rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .review-comment {
          color: #e8e4dc;
          lineHeight: 1.5;
          margin-bottom: 12px;
        }
        .review-response {
          background: rgba(16,185,129,0.1);
          border-left: 3px solid #10b981;
          padding: 12px;
          border-radius: 4px;
          color: #9ca3af;
          fontSize: 13px;
        }
      `}</style>

      <div className="reviews-header">
        <h1 className="reviews-title">Reviews</h1>
      </div>

      <div className="reviews-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search reviews..."
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
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading reviews...</div>
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
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {review.rating}.0
                  </span>
                </div>
              </div>

              <div className="review-comment">{review.comment}</div>

              {review.response && (
                <div className="review-response">
                  <strong>Response:</strong> {review.response}
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280',
              }}>
                <span>{formatDate(review.created_at)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Reply size={14} />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, color: '#e8e4dc' }}>Review Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ color: '#9ca3af', lineHeight: 1.6 }}>
              <p><strong>Property:</strong> {selectedReview.property_title}</p>
              <p><strong>Guest:</strong> {selectedReview.guest_name}</p>
              <p><strong>Rating:</strong> {renderStars(selectedReview.rating)} {selectedReview.rating}.0</p>
              <p><strong>Comment:</strong> {selectedReview.comment}</p>
              {selectedReview.response && (
                <p><strong>Response:</strong> {selectedReview.response}</p>
              )}
              <p><strong>Date:</strong> {formatDate(selectedReview.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BnbReviews;
