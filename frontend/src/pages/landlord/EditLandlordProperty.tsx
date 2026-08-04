import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Home, Check, ArrowLeft, AlertCircle, Building, Save,
} from 'lucide-react';
import Api from '../../services/api';
import { PAYMENT_DURATION_OPTIONS, formatPaymentPeriodLabel, periodRentTotal } from '../../utils/paymentDuration';

const C = {
  pageBg: '#F1F5F9',
  headerBg: '#1E293B',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  slate100: '#F1F5F9',
  slate500: '#64748B',
  gold: '#C89128',
  goldGlow: '0 4px 14px rgba(200,145,40,0.26)',
  goldBg: 'rgba(200,145,40,0.08)',
  goldBorder: 'rgba(200,145,40,0.28)',
  green: '#16A34A',
  red: '#DC2626',
  redBg: '#FFE4E6',
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const propertyTypes = [
  { value: 'house', label: 'House', icon: Home },
  { value: 'Master-bedroom', label: 'Master Bedroom', icon: Building },
  { value: 'Single-room', label: 'Single Room', icon: Home },
];

const commonAmenities = [
  'Parking', 'Security', 'Gym', 'Pool', 'Garden', 'Balcony',
  'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Laundry',
  'Elevator', 'Storage', 'Pet Friendly', 'Furnished',
];

const toImageUrl = (img: string) =>
  img.startsWith('http') ? img : `${API_BASE}/storage/${img}`;

const EditLandlordProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'house',
    location: '',
    address: '',
    district: '',
    ward: '',
    street: '',
    price: '',
    payment_duration_months: 3,
    bedrooms: 1,
    bathrooms: 1,
    available: true,
    featured: false,
    amenities: [] as string[],
  });

  useEffect(() => {
    if (!id) return;
    loadProperty(Number(id));
  }, [id]);

  const loadProperty = async (propertyId: number) => {
    try {
      setLoading(true);
      setErrors([]);
      const response = await Api.getOwnerProperty(propertyId);
      const p = response.data || response;
      if (!p?.id) throw new Error('Property not found');

      const amenities = Array.isArray(p.amenities)
        ? p.amenities
        : typeof p.amenities === 'string'
          ? JSON.parse(p.amenities || '[]')
          : [];

      setFormData({
        title: p.title || '',
        description: p.description || '',
        type: p.type || 'house',
        location: p.location || '',
        address: p.address || '',
        district: p.district || '',
        ward: p.ward || '',
        street: p.street || '',
        price: p.price != null ? String(p.price) : '',
        payment_duration_months: Number(p.payment_duration_months) || 3,
        bedrooms: Number(p.bedrooms) || 0,
        bathrooms: Number(p.bathrooms) || 0,
        available: p.available !== false,
        featured: Boolean(p.featured),
        amenities,
      });
      setExistingImages((p.images || []).map(toImageUrl));
    } catch (err: any) {
      setErrors([err?.response?.data?.message || err?.message || 'Failed to load property.']);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const validate = () => {
    const errs: string[] = [];
    if (!formData.title.trim()) errs.push('Property title is required');
    if (!formData.description.trim()) errs.push('Description is required');
    if (!formData.location.trim()) errs.push('Location is required');
    if (!formData.price || Number(formData.price) <= 0) errs.push('Price must be greater than 0');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !validate()) return;

    setSaving(true);
    setErrors([]);
    try {
      await Api.updateOwnerProperty(Number(id), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        location: formData.location.trim(),
        address: formData.address.trim(),
        district: formData.district.trim(),
        ward: formData.ward.trim(),
        street: formData.street.trim(),
        price: Number(formData.price),
        payment_duration_months: formData.payment_duration_months,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        available: formData.available,
        featured: formData.featured,
        amenities: formData.amenities,
      });
      navigate('/dashboard/landlord/my-properties', { state: { success: 'Property updated successfully!' } });
    } catch (err: any) {
      const laravelErrors = err?.response?.data?.errors;
      if (laravelErrors) {
        setErrors(Object.values(laravelErrors).flat() as string[]);
      } else {
        setErrors([err?.response?.data?.message || err?.message || 'Failed to update property.']);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCss: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: C.cardBg, border: `1.5px solid ${C.border}`,
    color: C.text, fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', background: C.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading property…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .ep-input:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(200,145,40,0.12); }`}</style>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ background: C.headerBg, borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
                Property Management
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff' }}>
                Edit Property
              </h1>
              <p style={{ margin: '6px 0 0', color: C.textLight, fontSize: '14px' }}>
                Update listing details for your property.
              </p>
            </div>
            <Link to="/dashboard/landlord/my-properties" style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            }}>
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ background: C.redBg, border: '1px solid rgba(220,38,38,0.22)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
            {errors.map((err, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.red, fontSize: '13px', marginBottom: i < errors.length - 1 ? '6px' : 0 }}>
                <AlertCircle size={14} /> {err}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 800, color: C.text }}>Basic Information</h2>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Property Title *</label>
              <input className="ep-input" type="text" name="title" value={formData.title} onChange={handleInputChange} style={inputCss} required />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Description *</label>
              <textarea className="ep-input" name="description" value={formData.description} onChange={handleInputChange}
                style={{ ...inputCss, minHeight: '120px', resize: 'vertical' }} required />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Property Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {propertyTypes.map(type => {
                  const Icon = type.icon;
                  const selected = formData.type === type.value;
                  return (
                    <div key={type.value} onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      style={{
                        padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${selected ? C.gold : C.border}`,
                        background: selected ? C.goldBg : C.slate100,
                      }}>
                      <Icon size={22} style={{ color: selected ? C.gold : C.textMuted, marginBottom: '8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: selected ? C.gold : C.textSub }}>{type.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>City / Region *</label>
                <input className="ep-input" type="text" name="location" value={formData.location} onChange={handleInputChange} style={inputCss} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>District</label>
                <input className="ep-input" type="text" name="district" value={formData.district} onChange={handleInputChange} style={inputCss} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Ward</label>
                <input className="ep-input" type="text" name="ward" value={formData.ward} onChange={handleInputChange} style={inputCss} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Street</label>
                <input className="ep-input" type="text" name="street" value={formData.street} onChange={handleInputChange} style={inputCss} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Full Address</label>
                <input className="ep-input" type="text" name="address" value={formData.address} onChange={handleInputChange} style={inputCss} />
              </div>
            </div>
          </div>

          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 800, color: C.text }}>Pricing & Details</h2>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Monthly Price (TZS) *</label>
              <input className="ep-input" type="number" name="price" value={formData.price} onChange={handleInputChange} style={inputCss} min="0" required />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Payment Period *</label>
              <select className="ep-input" name="payment_duration_months" value={formData.payment_duration_months} onChange={handleInputChange} style={inputCss}>
                {PAYMENT_DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {formData.price && Number(formData.price) > 0 && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.gold, fontWeight: 600 }}>
                  Tenant pays TZS {periodRentTotal(Number(formData.price), formData.payment_duration_months).toLocaleString()} {formatPaymentPeriodLabel(formData.payment_duration_months)}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Bedrooms</label>
                <input className="ep-input" type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} style={inputCss} min="0" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Bathrooms</label>
                <input className="ep-input" type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} style={inputCss} min="0" />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
              <input type="checkbox" name="available" checked={formData.available} onChange={handleInputChange} />
              <span style={{ fontSize: '14px', color: C.textSub }}>Property is available for rent</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} />
              <span style={{ fontSize: '14px', color: C.textSub }}>Featured listing</span>
            </label>
          </div>

          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 800, color: C.text }}>Amenities</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginBottom: '24px' }}>
              {commonAmenities.map(amenity => {
                const selected = formData.amenities.includes(amenity);
                return (
                  <div key={amenity} onClick={() => handleAmenityToggle(amenity)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: `1.5px solid ${selected ? C.gold : C.border}`, background: selected ? C.goldBg : C.slate100,
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${selected ? C.gold : C.textMuted}`,
                      background: selected ? C.gold : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <Check size={11} color="#fff" />}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: selected ? C.gold : C.textSub }}>{amenity}</span>
                  </div>
                );
              })}
            </div>

            {existingImages.length > 0 && (
              <>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: C.text }}>Current Photos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {existingImages.map((src, index) => (
                    <img key={index} src={src} alt={`Property ${index + 1}`}
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: '10px', border: `1px solid ${C.border}` }} />
                  ))}
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '12px', color: C.textMuted }}>
                  Photo uploads are not editable here yet. Contact support if you need to replace images.
                </p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/dashboard/landlord/my-properties" style={{
              display: 'inline-flex', alignItems: 'center', padding: '11px 20px',
              background: C.cardBg, color: C.textSub, border: `1.5px solid ${C.border}`,
              borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}>
              Cancel
            </Link>
            <button type="submit" disabled={saving} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 24px', background: C.gold, color: '#fff', border: 'none',
              borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: C.goldGlow, opacity: saving ? 0.7 : 1,
            }}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLandlordProperty;
