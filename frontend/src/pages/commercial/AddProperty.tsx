import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Plus, X, Upload, MapPin, DollarSign,
  Home, Car, Calendar, Save, ArrowLeft
} from 'lucide-react';
import { PAYMENT_DURATION_OPTIONS, formatPaymentPeriodLabel, periodRentTotal } from '../../utils/paymentDuration';

const TOKEN_KEY = 'token';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Amenity { id: number; name: string; icon: string; }

interface FormData {
  title: string; description: string; type: string;
  location: string; address: string; district: string; ward: string; street: string;
  price: number; price_type: string; payment_duration_months: number;
  parking_spaces: number; furnished: boolean;
  bedrooms: number; bathrooms: number;
  available_from: string; contact_phone: string; contact_email: string;
  amenities: number[];
}

const AddProperty: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', type: 'office',
    location: '', address: '', district: '', ward: '', street: '',
    price: 0, price_type: 'monthly', payment_duration_months: 3,
    parking_spaces: 0, furnished: false,
    bedrooms: 0, bathrooms: 0,
    available_from: '', contact_phone: '', contact_email: '',
    amenities: [],
  });

  useEffect(() => { fetchAmenities(); }, []);

  const fetchAmenities = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/commercial/amenities`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAmenities(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch (e) {
      console.error('fetchAmenities error:', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(p => ({
      ...p,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number' ? Number(value) : value,
    }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const toggleAmenity = (id: number) =>
    setFormData(p => ({
      ...p,
      amenities: p.amenities.includes(id)
        ? p.amenities.filter(x => x !== id)
        : [...p.amenities, id],
    }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    setImages(p => [...p, ...files]);
    files.forEach(file => {
      const r = new FileReader();
      r.onload = ev => setImagePreviews(p => [...p, ev.target?.result as string]);
      r.readAsDataURL(file);
    });
    if (errors.images) setErrors(p => ({ ...p, images: '' }));
  };

  const removeImage = (i: number) => {
    setImages(p => p.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    if (!formData.location.trim()) e.location = 'Location is required';
    if (!formData.district.trim()) e.district = 'District is required';
    if (!formData.ward.trim()) e.ward = 'Ward is required';
    if (!formData.street.trim()) e.street = 'Street is required';
    if (!formData.address.trim()) e.address = 'Address is required';
    if (!formData.price || formData.price <= 0) e.price = 'Price must be greater than 0';
    if (formData.price_type !== 'sale' && !formData.payment_duration_months) {
      e.payment_duration_months = 'Payment period is required for rentals';
    }
    if (!formData.available_from) e.available_from = 'Available date is required';
    if (!formData.contact_phone.trim()) e.contact_phone = 'Contact phone is required';
    if (!formData.contact_email.trim()) e.contact_email = 'Contact email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.contact_email)) e.contact_email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const fd = new FormData();

      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'amenities') {
          (v as number[]).forEach(id => fd.append('amenities[]', String(id)));
        } else if (typeof v === 'boolean') {
          fd.append(k, v ? '1' : '0');
        } else {
          fd.append(k, String(v));
        }
      });

      images.forEach((img, i) => fd.append(`images[${i}]`, img));

      const res = await fetch(`${API_BASE}/api/commercial/properties`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: fd,
      });

      if (res.ok) {
        navigate('/dashboard/commercial/my-properties', {
          state: { message: 'Property created successfully!' }
        });
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.errors)) {
            mapped[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
          }
          setErrors(mapped);
        } else {
          setErrors({ submit: err.message || 'Failed to create property' });
        }
      }
    } catch (e) {
      console.error(e);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'office', label: 'Office Space' },
    { value: 'retail', label: 'Retail Space' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'commercial', label: 'Commercial Building' },
    { value: 'industrial', label: 'Industrial Space' },
  ];

  const priceTypes = [
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly', label: 'Per Year' },
    { value: 'sale', label: 'For Sale' },
  ];

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; }
        .cd-header-inner { max-width: 1280px; margin: 0 auto; padding: 32px 40px 24px; display: flex; align-items: center; justify-content: space-between; }
        
        .cd-wrap { max-width: 820px; margin: 0 auto; padding: 32px 40px 80px; }
        
        .cd-form-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
          margin-bottom: 24px; 
        }
        
        .cd-form-header { 
          padding: 18px 24px; 
          border-bottom: 1px solid #F1F5F9; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          background: #FAFBFC; 
        }
        
        .cd-form-body { padding: 28px 24px; }
        
        .cd-form-label { 
          display: block; 
          font-size: 12px; 
          font-weight: 600; 
          color: #475569; 
          margin-bottom: 6px; 
        }
        
        .cd-form-input { 
          width: 100%; 
          padding: 11px 14px; 
          background: #FFFFFF; 
          border: 1px solid #CBD5E1; 
          border-radius: 10px; 
          font-size: 14px; 
          color: #0F172A; 
        }
        
        .cd-form-input:focus { 
          outline: none; 
          border-color: #3B82F6; 
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); 
        }
        
        .cd-form-textarea { min-height: 110px; resize: vertical; }
        
        .cd-field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .cd-field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
        .cd-field-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        
        .cd-error { color: #EF4444; font-size: 12.5px; margin-top: 4px; }
        
        .cd-toggle { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
        .cd-toggle-track { width: 46px; height: 24px; background: #E2E8F0; border-radius: 9999px; position: relative; transition: background 0.2s; }
        .cd-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .cd-toggle.active .cd-toggle-track { background: #10B981; }
        .cd-toggle.active .cd-toggle-thumb { transform: translateX(22px); }
        
        .cd-amenity-chip { 
          display: flex; align-items: center; gap: 8px; 
          padding: 10px 14px; border: 1px solid #E2E8F0; 
          border-radius: 10px; background: white; font-size: 13px; 
          cursor: pointer; transition: all 0.15s; 
        }
        .cd-amenity-chip.active { border-color: #10B981; background: #F0FDF4; color: #166534; }
        
        .cd-upload-zone { 
          border: 2px dashed #CBD5E1; border-radius: 12px; 
          padding: 48px 20px; text-align: center; cursor: pointer; 
          transition: all 0.2s;
        }
        .cd-upload-zone:hover { border-color: #3B82F6; background: #F0F9FF; }
        
        .cd-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-top: 16px; }
        .cd-img-thumb { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0; }
        .cd-img-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cd-img-remove { 
          position: absolute; top: 6px; right: 6px; 
          width: 26px; height: 26px; background: rgba(239,68,68,0.95); 
          border-radius: 6px; display: flex; align-items: center; 
          justify-content: center; opacity: 0; transition: opacity 0.2s; 
          border: none; cursor: pointer; 
        }
        .cd-img-thumb:hover .cd-img-remove { opacity: 1; }
        
        .cd-btn { 
          padding: 12px 24px; 
          font-weight: 600; 
          font-size: 14px; 
          border-radius: 10px; 
          cursor: pointer; 
          transition: all 0.2s; 
          display: inline-flex; 
          align-items: center; 
          gap: 8px; 
        }
        .cd-btn-cancel { background: white; border: 1px solid #CBD5E1; color: #475569; }
        .cd-btn-cancel:hover { background: #F8FAFC; border-color: #94A3B8; }
        .cd-btn-submit { background: #0F172A; color: white; border: none; }
        .cd-btn-submit:hover:not(:disabled) { background: #1E2937; transform: translateY(-1px); }
        .cd-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div className="cd-header-inner">
          <div>
            <Link 
              to="/dashboard/commercial/my-properties" 
              style={{ color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, textDecoration: 'none' }}
            >
              <ArrowLeft size={16} /> Back to My Properties
            </Link>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: '12px 0 4px 0' }}>
              Add New Property
            </h1>
            <p style={{ color: '#64748B', margin: 0 }}>List your commercial space</p>
          </div>
        </div>
      </div>

      <div className="cd-wrap">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <Building2 size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Basic Information</span>
            </div>
            <div className="cd-form-body">
              <div className="cd-field-grid-2">
                <div>
                  <label className="cd-form-label">Property Title <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="cd-form-input" placeholder="Modern Office Space in Dar" />
                  {errors.title && <p className="cd-error">{errors.title}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Property Type <span style={{ color: '#EF4444' }}>*</span></label>
                  <select name="type" value={formData.type} onChange={handleChange} className="cd-form-input">
                    {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <label className="cd-form-label">Description <span style={{ color: '#EF4444' }}>*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="cd-form-input cd-form-textarea" placeholder="Describe your property in detail..." />
                {errors.description && <p className="cd-error">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <MapPin size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Location</span>
            </div>
            <div className="cd-form-body">
              <div className="cd-field-grid-2">
                <div>
                  <label className="cd-form-label">City / Region <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="cd-form-input" placeholder="Dar es Salaam" />
                  {errors.location && <p className="cd-error">{errors.location}</p>}
                </div>
                <div>
                  <label className="cd-form-label">District <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="district" value={formData.district} onChange={handleChange} className="cd-form-input" placeholder="Kinondoni" />
                  {errors.district && <p className="cd-error">{errors.district}</p>}
                </div>
              </div>
              <div className="cd-field-grid-3" style={{ marginTop: 16 }}>
                <div>
                  <label className="cd-form-label">Ward <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="ward" value={formData.ward} onChange={handleChange} className="cd-form-input" placeholder="Masaki" />
                  {errors.ward && <p className="cd-error">{errors.ward}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Street <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange} className="cd-form-input" placeholder="Ohio Street" />
                  {errors.street && <p className="cd-error">{errors.street}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Full Address <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="cd-form-input" placeholder="Building or plot details" />
                  {errors.address && <p className="cd-error">{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <DollarSign size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Pricing</span>
            </div>
            <div className="cd-form-body">
              <div className="cd-field-grid-3">
                <div>
                  <label className="cd-form-label">Price (TZS) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className="cd-form-input" placeholder="500000" min="1" />
                  {errors.price && <p className="cd-error">{errors.price}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Price Type <span style={{ color: '#EF4444' }}>*</span></label>
                  <select name="price_type" value={formData.price_type} onChange={handleChange} className="cd-form-input">
                    {priceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {formData.price_type !== 'sale' && (
                  <div>
                    <label className="cd-form-label">Payment Period</label>
                    <select name="payment_duration_months" value={formData.payment_duration_months} onChange={handleChange} className="cd-form-input">
                      {PAYMENT_DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.payment_duration_months && <p className="cd-error">{errors.payment_duration_months}</p>}
                  </div>
                )}
              </div>

              {formData.price_type !== 'sale' && formData.price > 0 && (
                <p style={{ marginTop: 16, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                  Tenant pays TZS {periodRentTotal(formData.price, formData.payment_duration_months).toLocaleString()} {formatPaymentPeriodLabel(formData.payment_duration_months)}
                </p>
              )}
            </div>
          </div>

          {/* Property Features */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <Home size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Property Features</span>
            </div>
            <div className="cd-form-body">
              <div className="cd-field-grid-4">
                <div>
                  <label className="cd-form-label">Bedrooms</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} min="0" className="cd-form-input" />
                </div>
                <div>
                  <label className="cd-form-label">Bathrooms</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} min="0" className="cd-form-input" />
                </div>
                <div>
                  <label className="cd-form-label">Parking Spaces</label>
                  <input type="number" name="parking_spaces" value={formData.parking_spaces} onChange={handleChange} min="0" className="cd-form-input" />
                </div>
                <div>
                  <label className="cd-form-label">Furnished</label>
                  <div className={`cd-toggle ${formData.furnished ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, furnished: !p.furnished }))}>
                    <div className="cd-toggle-track">
                      <div className="cd-toggle-thumb" />
                    </div>
                    <span style={{ fontWeight: 500 }}>{formData.furnished ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Contact */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <Calendar size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Availability & Contact</span>
            </div>
            <div className="cd-form-body">
              <div className="cd-field-grid-2">
                <div>
                  <label className="cd-form-label">Available From <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="date" name="available_from" value={formData.available_from} onChange={handleChange} className="cd-form-input" />
                  {errors.available_from && <p className="cd-error">{errors.available_from}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Contact Phone <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="cd-form-input" placeholder="+255712345678" />
                  {errors.contact_phone && <p className="cd-error">{errors.contact_phone}</p>}
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label className="cd-form-label">Contact Email <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="cd-form-input" placeholder="contact@company.com" />
                {errors.contact_email && <p className="cd-error">{errors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="cd-form-card">
              <div className="cd-form-header">
                <Plus size={18} style={{ color: '#3B82F6' }} />
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Amenities</span>
              </div>
              <div className="cd-form-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {amenities.map(a => {
                    const active = formData.amenities.includes(a.id);
                    return (
                      <div key={a.id} className={`cd-amenity-chip ${active ? 'active' : ''}`} onClick={() => toggleAmenity(a.id)}>
                        {active && <span>✓</span>}
                        {a.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <Upload size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Property Images</span>
            </div>
            <div className="cd-form-body">
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload" />
              <label htmlFor="image-upload" className="cd-upload-zone">
                <Upload size={32} style={{ marginBottom: 12, color: '#64748B' }} />
                <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Click to upload images</p>
                <p style={{ color: '#64748B', fontSize: 13 }}>PNG, JPG — max 5MB each</p>
              </label>

              {imagePreviews.length > 0 && (
                <div className="cd-img-grid">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="cd-img-thumb">
                      <img src={src} alt="" />
                      <button type="button" className="cd-img-remove" onClick={() => removeImage(i)}>
                        <X size={14} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errors.submit && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '14px 18px', borderRadius: 10, marginBottom: 24 }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="cd-btn cd-btn-cancel" onClick={() => navigate('/dashboard/commercial/my-properties')}>
              Cancel
            </button>
            <button type="submit" className="cd-btn cd-btn-submit" disabled={loading}>
              {loading ? 'Creating Property...' : <> <Save size={18} /> Create Property </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;