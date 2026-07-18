import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Building2, Plus, X, Upload, MapPin, DollarSign, Home, Car, Bed, Bath, Square, Calendar, Save, ArrowLeft, Check } from 'lucide-react';
import { PAYMENT_DURATION_OPTIONS, formatPaymentPeriodLabel, periodRentTotal } from '../../utils/paymentDuration';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Amenity { id: number; name: string; icon: string; }

interface Property {
  id: number; title: string; description: string; type: string; location: string;
  address: string; price: number; price_type: string; payment_duration_months?: number; area: number; bedrooms?: number;
  bathrooms?: number; parking_spaces?: number; furnished: boolean; available_from: string;
  contact_phone: string; contact_email: string; latitude?: number; longitude?: number;
  amenities: Array<{ id: number; name: string; icon: string }>;
  images: Array<{ id: number; image_path: string; is_primary: boolean }>;
}

interface FormData {
  title: string; description: string; type: string; location: string; address: string;
  price: number; price_type: string; payment_duration_months: number; area: number; bedrooms: number; bathrooms: number;
  parking_spaces: number; furnished: boolean; available_from: string;
  contact_phone: string; contact_email: string; latitude: number; longitude: number; amenities: number[];
}

const EditProperty: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', type: 'residential', location: '', address: '',
    price: 0, price_type: 'monthly', payment_duration_months: 3, area: 0, bedrooms: 0, bathrooms: 0,
    parking_spaces: 0, furnished: false, available_from: '',
    contact_phone: '', contact_email: '', latitude: 0, longitude: 0, amenities: []
  });

  useEffect(() => { if (id) { fetchProperty(); fetchAmenities(); } }, [id]);

  const fetchProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setErrors({
          submit: body.message || `Could not load property (${response.status}).`,
        });
        setFetchLoading(false);
        return;
      }

      const payload = await response.json();
      const data = payload?.property ?? payload?.data ?? payload;

      const amenityList = Array.isArray(data.property_amenities)
        ? data.property_amenities
        : Array.isArray(data.amenities)
          ? data.amenities
          : [];

      const imageList = Array.isArray(data.property_images)
        ? data.property_images
        : Array.isArray(data.images)
          ? data.images
          : [];

      const availableFrom = data.available_from
        ? String(data.available_from).slice(0, 10)
        : '';

      setProperty({
        ...data,
        amenities: amenityList,
        images: imageList,
      });

      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'commercial',
        location: data.location || '',
        address: data.address || '',
        price: Number(data.price) || 0,
        price_type: data.price_type || 'monthly',
        payment_duration_months: Number(data.payment_duration_months) || 3,
        area: Number(data.area) || 0,
        bedrooms: Number(data.bedrooms) || 0,
        bathrooms: Number(data.bathrooms) || 0,
        parking_spaces: Number(data.parking_spaces) || 0,
        furnished: Boolean(data.furnished),
        available_from: availableFrom,
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        amenities: amenityList.map((a: any) => Number(a.id)).filter(Boolean),
      });
    } catch (e) {
      console.error('Failed to load property for edit:', e);
      setErrors({ submit: 'Network error while loading property.' });
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/amenities`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) return;
      const body = await res.json();
      const list = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
      setAmenities(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(p => ({ 
      ...p, 
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? Number(value) 
          : value 
    }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const toggleAmenity = (amenityId: number) =>
    setFormData(p => ({ 
      ...p, 
      amenities: p.amenities.includes(amenityId) 
        ? p.amenities.filter(i => i !== amenityId) 
        : [...p.amenities, amenityId] 
    }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    setNewImages(p => [...p, ...files]);
    files.forEach(file => {
      const r = new FileReader();
      r.onload = (ev) => setImagePreviews(p => [...p, ev.target?.result as string]);
      r.readAsDataURL(file);
    });
    if (errors.images) setErrors(p => ({ ...p, images: '' }));
  };

  const removeNewImage = (index: number) => {
    setNewImages(p => p.filter((_, i) => i !== index));
    setImagePreviews(p => p.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => setDeletedImages(p => [...p, imageId]);
  
  const getExistingImages = () => {
    const imgs = property?.images || (property as any)?.property_images || [];
    return imgs.filter((img: { id: number }) => !deletedImages.includes(img.id));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    if (!formData.location.trim()) e.location = 'Location is required';
    if (!formData.address.trim()) e.address = 'Address is required';
    if (!formData.price || formData.price <= 0) e.price = 'Price must be greater than 0';
    if (!formData.area || formData.area <= 0) e.area = 'Area must be greater than 0';
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
      const token = localStorage.getItem('token');
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'amenities') (v as number[]).forEach(aId => fd.append('amenities[]', aId.toString()));
        else if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
        else fd.append(k, v.toString());
      });
      newImages.forEach((img, i) => fd.append(`images[${i}]`, img));
      deletedImages.forEach((imgId, i) => fd.append(`deleted_images[${i}]`, imgId.toString()));
      
      const res = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: fd
      });
      
      if (res.ok) {
        navigate('/dashboard/commercial/my-properties', { state: { message: 'Property updated successfully and is pending approval' } });
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.errors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.errors)) {
            mapped[key] = Array.isArray(msgs) ? String((msgs as string[])[0]) : String(msgs);
          }
          setErrors(mapped);
        } else {
          setErrors({ submit: err.message || 'Failed to update property' });
        }
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'residential', label: 'Residential' }, 
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Office' }, 
    { value: 'retail', label: 'Retail' },
    { value: 'warehouse', label: 'Warehouse' }, 
    { value: 'industrial', label: 'Industrial' }
  ];
  
  const priceTypes = [
    { value: 'monthly', label: 'Per Month' }, 
    { value: 'yearly', label: 'Per Year' }, 
    { value: 'sale', label: 'For Sale' }
  ];

  if (fetchLoading) {
    return (
      <div className="cd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="cd-skel-shimmer" style={{ width: 48, height: 48, borderRadius: '9999px', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property && errors.submit) {
    return (
      <div className="cd-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: 16 }}>{errors.submit}</p>
          <button
            onClick={() => navigate('/dashboard/commercial/my-properties')}
            className="cd-add-btn"
            style={{ background: '#0F172A', color: '#fff' }}
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { 
          background: #F1F5F9; 
          min-height: 100vh; 
          font-family: 'Inter', sans-serif; 
        }
        
        .cd-header { 
          background: #FFFFFF; 
          border-bottom: 1px solid #E2E8F0; 
        }
        
        .cd-header-inner { 
          max-width: 1280px; 
          margin: 0 auto; 
          padding: 32px 40px 24px; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 20px; 
          flex-wrap: wrap; 
        }
        
        .cd-heading { 
          font-size: clamp(22px, 3vw, 28px); 
          font-weight: 800; 
          line-height: 1.15; 
          letter-spacing: -0.02em; 
          color: #0F172A; 
          margin: 0; 
        }
        
        .cd-wrap { 
          max-width: 820px; 
          margin: 0 auto; 
          padding: 32px 40px 80px; 
        }
        
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
        
        .cd-form-body { 
          padding: 28px 24px; 
        }
        
        .cd-form-label { 
          display: block; 
          font-size: 12px; 
          font-weight: 600; 
          color: #475569; 
          margin-bottom: 6px; 
          letter-spacing: 0.02em; 
        }
        
        .cd-form-input { 
          width: 100%; 
          padding: 11px 14px; 
          background: #FFFFFF; 
          border: 1px solid #CBD5E1; 
          border-radius: 10px; 
          font-size: 14px; 
          color: #0F172A; 
          transition: all 0.2s; 
        }
        
        .cd-form-input:focus { 
          outline: none; 
          border-color: #3B82F6; 
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); 
        }
        
        .cd-form-textarea { 
          min-height: 110px; 
          resize: vertical; 
        }
        
        .cd-field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .cd-field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
        .cd-field-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        
        .cd-error { 
          color: #EF4444; 
          font-size: 12.5px; 
          margin-top: 4px; 
        }
        
        .cd-toggle { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          cursor: pointer; 
          user-select: none; 
        }
        
        .cd-toggle-track { 
          width: 46px; 
          height: 24px; 
          background: #E2E8F0; 
          border-radius: 9999px; 
          position: relative; 
          transition: background 0.2s; 
        }
        
        .cd-toggle-thumb { 
          position: absolute; 
          top: 3px; 
          left: 3px; 
          width: 18px; 
          height: 18px; 
          background: white; 
          border-radius: 9999px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          transition: transform 0.2s; 
        }
        
        .cd-toggle.active .cd-toggle-track { background: #10B981; }
        .cd-toggle.active .cd-toggle-thumb { transform: translateX(22px); }
        
        .cd-amenity-chip { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 10px 14px; 
          border: 1px solid #E2E8F0; 
          border-radius: 10px; 
          background: white; 
          font-size: 13px; 
          cursor: pointer; 
          transition: all 0.15s; 
        }
        
        .cd-amenity-chip.active { 
          border-color: #10B981; 
          background: #F0FDF4; 
          color: #166534; 
        }
        
        .cd-upload-zone { 
          border: 2px dashed #CBD5E1; 
          border-radius: 12px; 
          padding: 48px 20px; 
          text-align: center; 
          cursor: pointer; 
          transition: all 0.2s; 
        }
        
        .cd-upload-zone:hover { 
          border-color: #3B82F6; 
          background: #F0F9FF; 
        }
        
        .cd-img-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
          gap: 12px; 
          margin-top: 16px; 
        }
        
        .cd-img-thumb { 
          position: relative; 
          aspect-ratio: 1; 
          border-radius: 10px; 
          overflow: hidden; 
          border: 1px solid #E2E8F0; 
        }
        
        .cd-img-thumb img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }
        
        .cd-img-remove { 
          position: absolute; 
          top: 6px; 
          right: 6px; 
          width: 26px; 
          height: 26px; 
          background: rgba(239, 68, 68, 0.95); 
          border-radius: 6px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          opacity: 0; 
          transition: opacity 0.2s; 
          border: none; 
          cursor: pointer; 
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
        
        .cd-btn-cancel { 
          background: white; 
          border: 1px solid #CBD5E1; 
          color: #475569; 
        }
        
        .cd-btn-cancel:hover { 
          background: #F8FAFC; 
          border-color: #94A3B8; 
        }
        
        .cd-btn-submit { 
          background: #0F172A; 
          color: white; 
          border: none; 
        }
        
        .cd-btn-submit:hover:not(:disabled) { 
          background: #1E2937; 
          transform: translateY(-1px); 
        }
        
        .cd-btn-submit:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
        
        @media (max-width: 768px) {
          .cd-field-grid-2, .cd-field-grid-3, .cd-field-grid-4 { grid-template-columns: 1fr !important; }
          .cd-wrap { padding: 24px 20px 60px; }
          .cd-header-inner { padding: 24px 20px 20px; }
        }
      `}</style>

      {/* Header */}
      <div className="cd-header">
        <div className="cd-header-inner">
          <div>
            <Link 
              to="/dashboard/commercial/my-properties" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 14, textDecoration: 'none', marginBottom: 8 }}
            >
              <ArrowLeft size={16} /> Back to My Properties
            </Link>
            <h1 className="cd-heading">Edit Property</h1>
          </div>
          <Link to="/dashboard/commercial/properties/add" className="cd-add-btn">
            <Plus size={15} /> Add New Property
          </Link>
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
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    className="cd-form-input" 
                    placeholder="Modern Office Space in Kigali" 
                  />
                  {errors.title && <p className="cd-error">{errors.title}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Property Type <span style={{ color: '#EF4444' }}>*</span></label>
                  <select name="type" value={formData.type} onChange={handleChange} className="cd-form-input">
                    {propertyTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ marginTop: 20 }}>
                <label className="cd-form-label">Description <span style={{ color: '#EF4444' }}>*</span></label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={5} 
                  className="cd-form-input cd-form-textarea" 
                  placeholder="Describe the property in detail..." 
                />
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
                  <label className="cd-form-label">Location / Area <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="cd-form-input" placeholder="Kigali, Rwanda" />
                  {errors.location && <p className="cd-error">{errors.location}</p>}
                </div>
                <div>
                  <label className="cd-form-label">Full Address <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="cd-form-input" placeholder="KN 123 Street, Kigali" />
                  {errors.address && <p className="cd-error">{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Size */}
          <div className="cd-form-card">
            <div className="cd-form-header">
              <DollarSign size={18} style={{ color: '#3B82F6' }} />
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Pricing &amp; Size</span>
            </div>
            <div className="cd-form-body">
              <div className="cd-field-grid-3">
                <div>
                  <label className="cd-form-label">Price (TZS) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className="cd-form-input" placeholder="500000" />
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
                  </div>
                )}
                <div>
                  <label className="cd-form-label">Area (m²) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="number" name="area" value={formData.area} onChange={handleChange} className="cd-form-input" placeholder="120" />
                  {errors.area && <p className="cd-error">{errors.area}</p>}
                </div>
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
                  <div 
                    className={`cd-toggle ${formData.furnished ? 'active' : ''}`} 
                    onClick={() => setFormData(p => ({ ...p, furnished: !p.furnished }))}
                  >
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
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Availability &amp; Contact</span>
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
                  <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="cd-form-input" placeholder="+255 712 345 678" />
                  {errors.contact_phone && <p className="cd-error">{errors.contact_phone}</p>}
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label className="cd-form-label">Contact Email <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="cd-form-input" placeholder="contact@company.rw" />
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
                      <div 
                        key={a.id} 
                        className={`cd-amenity-chip ${active ? 'active' : ''}`} 
                        onClick={() => toggleAmenity(a.id)}
                      >
                        {active && <Check size={16} />}
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
              {getExistingImages().length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Current Images</p>
                  <div className="cd-img-grid">
                    {getExistingImages().map(img => (
                      <div key={img.id} className="cd-img-thumb">
                        <img src={`${API_BASE}/storage/${img.image_path}`} alt="" />
                        {img.is_primary && (
                          <div style={{ position: 'absolute', top: 8, left: 8, background: '#10B981', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                            PRIMARY
                          </div>
                        )}
                        <button type="button" className="cd-img-remove" onClick={() => removeExistingImage(img.id)}>
                          <X size={14} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Add New Images</p>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload" />
                <label htmlFor="image-upload" className="cd-upload-zone">
                  <Upload size={32} style={{ marginBottom: 12, color: '#64748B' }} />
                  <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Click to upload images</p>
                  <p style={{ color: '#64748B', fontSize: 13 }}>PNG, JPG up to 5MB each</p>
                </label>
                
                {imagePreviews.length > 0 && (
                  <div className="cd-img-grid" style={{ marginTop: 20 }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="cd-img-thumb">
                        <img src={src} alt="" />
                        <button type="button" className="cd-img-remove" onClick={() => removeNewImage(i)}>
                          <X size={14} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '14px 18px', borderRadius: 10, fontSize: 14, marginBottom: 24 }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="cd-btn cd-btn-cancel" onClick={() => navigate('/dashboard/commercial/my-properties')}>
              Cancel
            </button>
            <button type="submit" className="cd-btn cd-btn-submit" disabled={loading}>
              {loading ? 'Updating...' : <> <Save size={18} /> Update Property </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;