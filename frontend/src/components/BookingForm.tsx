import { useState } from 'react';
import { X, Calendar, User, Phone, Mail, MessageSquare } from 'lucide-react';

interface BookingFormProps {
  property: any;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingForm = ({ property, onClose, onSuccess }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.phone || !formData.checkIn || !formData.checkOut) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create booking request (no authentication required)
      const bookingData = {
        property_id: property.id,
        property_title: property.title,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        guests: parseInt(formData.guests),
        message: formData.message,
        total_amount: calculateTotalAmount(),
        status: 'pending'
      };

      // Call public booking API (no auth required)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/bnb/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit booking request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return nights * (property.price || 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 6,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
      >
        <X size={20} />
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          color: '#fff', 
          marginBottom: 8 
        }}>
          Book Your Stay
        </h2>
        <div style={{ 
          fontSize: 16, 
          color: '#94a3b8',
          marginBottom: 16 
        }}>
          {property.title}
        </div>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          color: '#fbbf24' 
        }}>
          TZS {property.price?.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>per night</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Customer Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fff' 
            }}>
              <User size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fff' 
            }}>
              <Mail size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#fff' 
          }}>
            <Phone size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+255 XXX XXX XXX"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
          />
        </div>

        {/* Booking Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fff' 
            }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Check In *
            </label>
            <input
              type="date"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#fff' 
            }}>
              Check Out *
            </label>
            <input
              type="date"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleChange}
              min={formData.checkIn || new Date().toISOString().split('T')[0]}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
            />
          </div>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#fff' 
          }}>
            Number of Guests *
          </label>
          <select
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
          >
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4 Guests</option>
            <option value="5">5+ Guests</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#fff' 
          }}>
            <MessageSquare size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Special Requests (Optional)
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Any special requirements or requests..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
              resize: 'vertical'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#fbbf24')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
          />
        </div>

        {/* Price Calculation */}
        {formData.checkIn && formData.checkOut && (
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>Total Amount</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>
                TZS {calculateTotalAmount().toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
              {Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#dc2626',
            color: '#fff',
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#94a3b8' : '#fbbf24',
            color: '#1e293b',
            border: 'none',
            padding: '16px',
            fontWeight: 700,
            fontSize: 16,
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f59e0b')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#fbbf24')}
        >
          {loading ? 'Submitting...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
