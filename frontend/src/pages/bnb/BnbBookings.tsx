import { useState, useEffect } from 'react';
import { Calendar, Users, Star, MessageSquare, Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Api from '../../services/api';

interface Booking {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  guest_count: number;
  special_requests?: string;
}

const BnbBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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
      pending: 'rgba(245, 158, 11, 0.1)',
      confirmed: 'rgba(16, 185, 129, 0.1)',
      cancelled: 'rgba(239, 68, 68, 0.1)',
      completed: 'rgba(34, 197, 94, 0.1)',
    };
    return colors[status as keyof typeof colors] || 'rgba(107, 114, 128, 0.1)';
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
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: '#c9a84c',
            border: 'none',
            borderRadius: '8px',
            color: '#080808',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          New Booking
        </button>
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
                  <div className="booking-property">{booking.property_title}</div>
                  <div className="booking-guest">
                    <Users size={14} style={{ marginRight: '6px' }} />
                    {booking.guest_name}
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
                {formatCurrency(booking.total_amount)}
              </div>

              {booking.special_requests && (
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  marginTop: '8px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                }}>
                  <MessageSquare size={14} style={{ marginRight: '6px' }} />
                  {booking.special_requests}
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
              <p><strong>Property:</strong> {selectedBooking.property_title}</p>
              <p><strong>Guest:</strong> {selectedBooking.guest_name}</p>
              <p><strong>Email:</strong> {selectedBooking.guest_email}</p>
              <p><strong>Check-in:</strong> {formatDate(selectedBooking.check_in)}</p>
              <p><strong>Check-out:</strong> {formatDate(selectedBooking.check_out)}</p>
              <p><strong>Guests:</strong> {selectedBooking.guest_count}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedBooking.total_amount)}</p>
              {selectedBooking.special_requests && (
                <p><strong>Special Requests:</strong> {selectedBooking.special_requests}</p>
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

      {/* Add Booking Modal */}
      {showAddModal && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#e8e4dc', fontSize: '20px' }}>Create New Booking</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '24px',
                }}
              >
                ×
              </button>
            </div>

            <AddBookingForm 
              onClose={() => setShowAddModal(false)}
              onSuccess={() => {
                setShowAddModal(false);
                loadBookings();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Add Booking Form Component
const AddBookingForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    property_id: '',
    guest_name: '',
    guest_email: '',
    check_in: '',
    check_out: '',
    guest_count: '1',
    special_requests: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {};
      if (!formData.property_id) newErrors.property_id = 'Property is required';
      if (!formData.guest_name.trim()) newErrors.guest_name = 'Guest name is required';
      if (!formData.guest_email.trim()) newErrors.guest_email = 'Guest email is required';
      if (!formData.check_in) newErrors.check_in = 'Check-in date is required';
      if (!formData.check_out) newErrors.check_out = 'Check-out date is required';
      if (!formData.guest_count || parseInt(formData.guest_count) < 1) {
        newErrors.guest_count = 'Valid guest count is required';
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.guest_email && !emailRegex.test(formData.guest_email)) {
        newErrors.guest_email = 'Valid email is required';
      }

      // Validate dates
      if (formData.check_in && formData.check_out) {
        const checkInDate = new Date(formData.check_in);
        const checkOutDate = new Date(formData.check_out);
        if (checkOutDate <= checkInDate) {
          newErrors.check_out = 'Check-out date must be after check-in date';
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Prepare data for API
      const bookingData = {
        property_id: parseInt(formData.property_id),
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        check_in: formData.check_in,
        check_out: formData.check_out,
        guest_count: parseInt(formData.guest_count),
        special_requests: formData.special_requests || null,
      };

      await Api.createBnbBooking(bookingData);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ submit: 'Failed to create booking. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock properties for dropdown - in real app, this would come from API
  const mockProperties = [
    { id: 1, title: 'Luxury Beach Villa' },
    { id: 2, title: 'City Center Apartment' },
    { id: 3, title: 'Mountain Retreat' },
    { id: 4, title: 'Garden Cottage' },
    { id: 5, title: 'Ocean View Suite' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ color: '#e8e4dc' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Property *
          </label>
          <select
            value={formData.property_id}
            onChange={(e) => handleInputChange('property_id', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${errors.property_id ? '#ef4444' : '#374151'}`,
              borderRadius: '8px',
              color: '#e8e4dc',
              fontSize: '14px',
            }}
          >
            <option value="">Select a property</option>
            {mockProperties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
          {errors.property_id && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.property_id}</div>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Guest Name *
          </label>
          <input
            type="text"
            value={formData.guest_name}
            onChange={(e) => handleInputChange('guest_name', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${errors.guest_name ? '#ef4444' : '#374151'}`,
              borderRadius: '8px',
              color: '#e8e4dc',
              fontSize: '14px',
            }}
            placeholder="John Doe"
          />
          {errors.guest_name && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.guest_name}</div>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Guest Email *
          </label>
          <input
            type="email"
            value={formData.guest_email}
            onChange={(e) => handleInputChange('guest_email', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${errors.guest_email ? '#ef4444' : '#374151'}`,
              borderRadius: '8px',
              color: '#e8e4dc',
              fontSize: '14px',
            }}
            placeholder="john@example.com"
          />
          {errors.guest_email && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.guest_email}</div>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Number of Guests *
          </label>
          <input
            type="number"
            min="1"
            value={formData.guest_count}
            onChange={(e) => handleInputChange('guest_count', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${errors.guest_count ? '#ef4444' : '#374151'}`,
              borderRadius: '8px',
              color: '#e8e4dc',
              fontSize: '14px',
            }}
          />
          {errors.guest_count && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.guest_count}</div>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Check-in Date *
          </label>
          <input
            type="date"
            value={formData.check_in}
            onChange={(e) => handleInputChange('check_in', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${errors.check_in ? '#ef4444' : '#374151'}`,
              borderRadius: '8px',
              color: '#e8e4dc',
              fontSize: '14px',
            }}
          />
          {errors.check_in && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.check_in}</div>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Check-out Date *
          </label>
          <input
            type="date"
            value={formData.check_out}
            onChange={(e) => handleInputChange('check_out', e.target.value)}
            min={formData.check_in || new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${errors.check_out ? '#ef4444' : '#374151'}`,
              borderRadius: '8px',
              color: '#e8e4dc',
              fontSize: '14px',
            }}
          />
          {errors.check_out && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.check_out}</div>}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Special Requests
        </label>
        <textarea
          value={formData.special_requests}
          onChange={(e) => handleInputChange('special_requests', e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#e8e4dc',
            fontSize: '14px',
            resize: 'vertical',
          }}
          placeholder="Any special requests or notes..."
        />
      </div>

      {errors.submit && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ color: '#ef4444', fontSize: '14px' }}>{errors.submit}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '12px 20px',
            backgroundColor: 'transparent',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#e8e4dc',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: '#c9a84c',
            border: 'none',
            borderRadius: '8px',
            color: '#080808',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
};

export default BnbBookings;
