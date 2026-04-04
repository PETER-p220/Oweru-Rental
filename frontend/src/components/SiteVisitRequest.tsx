import { useState } from 'react';
import { Calendar, Clock, DollarSign, CreditCard, Smartphone, MapPin, Mail, AlertCircle } from 'lucide-react';
import Api from '../services/api';
import SelcomService from '../services/selcom';

interface SiteVisitRequestProps {
  property: any;
  onClose: () => void;
  onSuccess: () => void;
}

const SiteVisitRequest: React.FC<SiteVisitRequestProps> = ({ property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    property_id: property.id,
    requested_date: '',
    preferred_time: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
    payment_method: 'selcom',
    phone_number: '',
    provider: 'tigo' as 'tigo' | 'mpesa' | 'airtel',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'processing' | 'success'>('form');
  const [paymentUrl, setPaymentUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (paymentStep === 'form') {
        // Request site visit
        const response = await Api.requestSiteVisit(formData);
        
        if (response.data.payment_url) {
          // Redirect to payment
          setPaymentUrl(response.data.payment_url);
          setPaymentStep('payment');
        } else {
          // Cash payment - success
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to request site visit');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const visitFee = 10000; // 10,000 TZS

  if (paymentStep === 'payment' && paymentUrl) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#080808' }}>
            Complete Payment
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#666' }}>
            You'll be redirected to Selcom payment gateway to complete your site visit fee payment of {formatCurrency(visitFee)}.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.open(paymentUrl, '_blank')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#c9a84c',
                color: '#080808',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Pay with Selcom
            </button>
            <button
              onClick={() => {
                setPaymentStep('form');
                setPaymentUrl('');
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#080808', fontSize: '24px' }}>
            Request Site Visit
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {/* Property Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#080808', fontSize: '16px' }}>
            {property.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginBottom: '4px' }}>
            <MapPin size={16} />
            <span>{property.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
            <DollarSign size={16} />
            <span>Visit Fee: {formatCurrency(visitFee)}</span>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #dc2626',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contact Information */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#080808' }}>
                Contact Information
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Mail size={16} style={{ color: '#666' }} />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Smartphone size={16} style={{ color: '#666' }} />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Details */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#080808' }}>
                Visit Details
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Calendar size={16} style={{ color: '#666' }} />
                    <input
                      type="date"
                      placeholder="Preferred Date"
                      value={formData.requested_date}
                      onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Clock size={16} style={{ color: '#666' }} />
                    <input
                      type="time"
                      placeholder="Preferred Time"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#080808' }}>
                Additional Notes (Optional)
              </label>
              <textarea
                placeholder="Any special requirements or questions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#080808' }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="selcom"
                    checked={formData.payment_method === 'selcom'}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    style={{ margin: 0 }}
                  />
                  <CreditCard size={16} style={{ color: '#c9a84c' }} />
                  <span>Selcom (Card/Bank)</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="mobile_money"
                    checked={formData.payment_method === 'mobile_money'}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    style={{ margin: 0 }}
                  />
                  <Smartphone size={16} style={{ color: '#c9a84c' }} />
                  <span>Mobile Money</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={formData.payment_method === 'cash'}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    style={{ margin: 0 }}
                  />
                  <DollarSign size={16} style={{ color: '#c9a84c' }} />
                  <span>Cash on Visit Day</span>
                </label>
              </div>

              {/* Mobile Money Provider Selection */}
              {formData.payment_method === 'mobile_money' && (
                <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#080808' }}>
                    Select Provider
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="provider"
                        value="tigo"
                        checked={formData.provider === 'tigo'}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'tigo' | 'mpesa' | 'airtel' })}
                        style={{ margin: 0 }}
                      />
                      <span>Tigo Pesa</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="provider"
                        value="mpesa"
                        checked={formData.provider === 'mpesa'}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'tigo' | 'mpesa' | 'airtel' })}
                        style={{ margin: 0 }}
                      />
                      <span>M-Pesa</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="provider"
                        value="airtel"
                        checked={formData.provider === 'airtel'}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'tigo' | 'mpesa' | 'airtel' })}
                        style={{ margin: 0 }}
                      />
                      <span>Airtel Money</span>
                    </label>
                  </div>
                  
                  <input
                    type="tel"
                    placeholder="Mobile Money Number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    required={formData.payment_method === 'mobile_money'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginTop: '8px',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '16px 24px',
                backgroundColor: loading ? '#ccc' : '#c9a84c',
                color: '#080808',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? 'Processing...' : (
                <>
                  {formData.payment_method === 'selcom' && <CreditCard size={18} />}
                  {formData.payment_method === 'mobile_money' && <Smartphone size={18} />}
                  {formData.payment_method === 'cash' && <DollarSign size={18} />}
                  Request Site Visit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SiteVisitRequest;
