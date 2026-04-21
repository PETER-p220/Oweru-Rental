import { useState, useEffect } from 'react';
import { Calendar, Users, MessageSquare } from 'lucide-react';
import Api from '../../services/api';

interface Booking {
  id: number;
  property_id: number;
  property?: {
    id: number;
    title: string;
    location?: string;
  };
  guest?: {
    id: number;
    name: string;
    email: string;
  };
  guest_id: number | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: string;
  special_requests?: string[] | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const BnbBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [searchTerm, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await Api.getBnbBookings({
        search: searchTerm,
        status: statusFilter,
      });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      cancelled: '#ef4444',
      completed: '#22c55e',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const statusBg = (status: string) => {
    const colors = {
      pending: 'var(--pending-bg)',
      confirmed: 'var(--confirmed-bg)',
      cancelled: 'var(--cancelled-bg)',
      completed: 'var(--completed-bg)',
    };
    return colors[status as keyof typeof colors] || 'var(--default-bg)';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
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
        .bookings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .bookings-title {
          font-size: 24px;
          font-weight: 600;
          color: #e8e4dc;
          margin: 0;
        }
        .bookings-filters {
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
        .status-select {
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: #e8e4dc;
          font-size: 14px;
        }
        .bookings-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
        .booking-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }
        .booking-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .booking-property {
          font-weight: 600;
          color: #c9a84c;
          margin-bottom: 4px;
        }
        .booking-guest {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 8px;
        }
        .booking-dates {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }
        .date-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }
        .booking-amount {
          font-size: 18px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 12px;
        }
        .booking-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>

      <div className="bookings-header">
        <h1 className="bookings-title">Bookings</h1>
      </div>

      <div className="bookings-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading bookings...</div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="booking-card"
              onClick={() => {
                setSelectedBooking(booking);
                setShowDetailModal(true);
              }}
            >
              <div className="booking-header">
                <div>
                  <div className="booking-property">{booking.property?.title || `Property #${booking.property_id}`}</div>
                  <div className="booking-guest">
                    <Users size={14} style={{ marginRight: '6px' }} />
                    {booking.guest?.name || (booking.notes ? booking.notes.split('by:')[1]?.split('(')[0]?.trim() : 'Guest')}
                  </div>
                </div>
                <div
                  className="booking-status"
                  style={{
                    background: statusBg(booking.status),
                    color: statusColor(booking.status),
                  }}
                >
                  {booking.status}
                </div>
              </div>

              <div className="booking-dates">
                <div className="date-info">
                  <Calendar size={14} />
                  Check-in: {formatDate(booking.check_in)}
                </div>
                <div className="date-info">
                  <Calendar size={14} />
                  Check-out: {formatDate(booking.check_out)}
                </div>
              </div>

              <div className="booking-amount">
                {formatCurrency(booking.total_price)}
              </div>

              {booking.special_requests && booking.special_requests.length > 0 && (
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  marginTop: '8px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                }}>
                  <MessageSquare size={14} style={{ marginRight: '6px' }} />
                  {booking.special_requests.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedBooking && (
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
              <h2 style={{ margin: 0, color: '#e8e4dc' }}>Booking Details</h2>
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
              <p><strong>Property:</strong> {selectedBooking.property?.title || `Property #${selectedBooking.property_id}`}</p>
              <p><strong>Guest:</strong> {selectedBooking.guest?.name || (selectedBooking.notes ? selectedBooking.notes.split('by:')[1]?.split('(')[0]?.trim() : 'Guest')}</p>
              <p><strong>Email:</strong> {selectedBooking.guest?.email || 'N/A'}</p>
              <p><strong>Check-in:</strong> {formatDate(selectedBooking.check_in)}</p>
              <p><strong>Check-out:</strong> {formatDate(selectedBooking.check_out)}</p>
              <p><strong>Guests:</strong> {selectedBooking.guests}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedBooking.total_price)}</p>
              {selectedBooking.special_requests && selectedBooking.special_requests.length > 0 && (
                <p><strong>Special Requests:</strong> {selectedBooking.special_requests.join(', ')}</p>
              )}
              <p><strong>Status:</strong> 
                <span style={{
                  color: statusColor(selectedBooking.status),
                  background: statusBg(selectedBooking.status),
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {selectedBooking.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BnbBookings;
