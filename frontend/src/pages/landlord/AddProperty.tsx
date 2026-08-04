import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Check, X, Plus, Upload, ArrowLeft, ArrowRight,
  AlertCircle, Building, CheckCircle, Video,
} from 'lucide-react';
import Api from '../../services/api';
import { PAYMENT_DURATION_OPTIONS, formatPaymentPeriodLabel, periodRentTotal } from '../../utils/paymentDuration';

// ── Design tokens — 1:1 with landlordPageStyles / MyProperties
const C = {
  pageBg:    '#F1F5F9',
  headerBg:  '#1E293B',
  cardBg:    '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate500:  '#64748B',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  goldBg:    'rgba(200,145,40,0.08)',
  goldBorder:'rgba(200,145,40,0.28)',
  green:     '#16A34A', greenBg: '#DCFCE7',
  red:       '#DC2626', redBg:   '#FFE4E6',
};

interface ImageFile {
  file: File;
  preview: string;
}

interface VideoFile {
  file: File;
  preview: string;
}

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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
    amenities: [] as string[],
    images: [] as ImageFile[],
    videos: [] as VideoFile[],
    featured: false,
  });

  const propertyTypes = [
    { value: 'house',          label: 'House',        icon: Home },
    { value: 'Master-bedroom', label: 'Master Bedroom', icon: Building },
    { value: 'Single-room',    label: 'Single Room',  icon: Home },
  ];

  const commonAmenities = [
    'Parking', 'Security', 'Gym', 'Pool', 'Garden', 'Balcony',
    'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Laundry',
    'Elevator', 'Storage', 'Pet Friendly', 'Furnished',
  ];

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          setFormData(prev => ({ ...prev, images: [...prev.images, { file, preview }] }));
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        const preview = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, videos: [...prev.videos, { file, preview }] }));
      }
    });
    e.target.value = '';
  };

  const removeVideo = (index: number) => {
    setFormData(prev => {
      const item = prev.videos[index];
      if (item) URL.revokeObjectURL(item.preview);
      return { ...prev, videos: prev.videos.filter((_, i) => i !== index) };
    });
  };

  const validateStep = () => {
    const errs: string[] = [];
    if (step === 1) {
      if (!formData.title.trim())       errs.push('Property title is required');
      if (!formData.description.trim()) errs.push('Description is required');
      if (!formData.location.trim())    errs.push('Location is required');
      if (!formData.address.trim())     errs.push('Address is required');
      if (!formData.district.trim())    errs.push('District is required');
      if (!formData.ward.trim())        errs.push('Ward is required');
      if (!formData.street.trim())      errs.push('Street is required');
    }
    if (step === 2) {
      if (!formData.price || Number(formData.price) <= 0) errs.push('Price must be greater than 0');
      if (!formData.payment_duration_months) errs.push('Payment period is required');
    }
    if (step === 3) {
      if (formData.images.length === 0 && formData.videos.length === 0) {
        errs.push('At least one image or video is required');
      }
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => { if (validateStep()) { setErrors([]); setStep(step + 1); } };
  const handleBack = () => { setErrors([]); setStep(step - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setIsLoading(true);
    setErrors([]);

    try {
      const isOweruProperty = window.location.pathname === '/dashboard/admin/add-oweru-property';
      const isAdmin = user?.user_type === 'admin' || user?.role === 'admin';
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('payment_duration_months', String(formData.payment_duration_months));
      formDataToSend.append('location', formData.location);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('district', formData.district);
      formDataToSend.append('ward', formData.ward);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('type', isOweruProperty ? 'oweru_rental' : formData.type);
      formDataToSend.append('bedrooms', formData.bedrooms.toString());
      formDataToSend.append('bathrooms', formData.bathrooms.toString());
      formDataToSend.append('featured', formData.featured.toString());
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));
      formData.images.forEach((imageFile, index) => {
        formDataToSend.append(`images[${index}]`, imageFile.file);
      });

      let response;
      if (isAdmin) {
        let uploadedImages: string[] = [];
        let uploadedVideos: string[] = [];
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

        if (formData.images.length > 0) {
          const imageFormData = new FormData();
          formData.images.forEach((imageFile, index) => {
            imageFormData.append(`images[${index}]`, imageFile.file);
          });
          try {
            const imageResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/properties/upload-images`, {
              method: 'POST', headers, body: imageFormData,
            });
            if (imageResponse.ok) {
              const imageResult = await imageResponse.json();
              uploadedImages = imageResult.images || [];
            }
          } catch (error) { console.error('Error uploading images:', error); }
        }

        if (formData.videos.length > 0) {
          const videoFormData = new FormData();
          formData.videos.forEach((videoFile, index) => {
            videoFormData.append(`videos[${index}]`, videoFile.file);
          });
          try {
            const videoResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/properties/upload-videos`, {
              method: 'POST', headers, body: videoFormData,
            });
            if (videoResponse.ok) {
              const videoResult = await videoResponse.json();
              uploadedVideos = videoResult.videos || [];
            }
          } catch (error) { console.error('Error uploading videos:', error); }
        }

        const propertyData = {
          title: formData.title, description: formData.description,
          price: formData.price, payment_duration_months: formData.payment_duration_months,
          location: formData.location, address: formData.address,
          type: isOweruProperty ? 'oweru_rental' : formData.type,
          bedrooms: formData.bedrooms, bathrooms: formData.bathrooms,
          featured: formData.featured,
          district: formData.district, ward: formData.ward, street: formData.street,
          amenities: formData.amenities,
          owner_id: user?.id || 1,
          landlord_name: 'Oweru Rental',
          landlord_phone: '+255 712 345 678',
          images: uploadedImages,
          videos: uploadedVideos,
        };
        response = await Api.createAdminProperty(propertyData);
      } else {
        response = await Api.createOwnerProperty(formDataToSend);
      }

      if (response.data) {
        if (isAdmin) {
          navigate('/dashboard/admin/properties', { state: { success: 'Oweru property added successfully!' } });
        } else {
          navigate('/dashboard/landlord/my-properties', { state: { success: 'Property added successfully!' } });
        }
      } else {
        throw new Error('Failed to create property');
      }
    } catch (err: any) {
      const laravelErrors = err?.response?.data?.errors;
      if (laravelErrors) {
        setErrors(Object.values(laravelErrors).flat() as string[]);
      } else {
        setErrors([err?.response?.data?.message || err?.message || 'Failed to create property. Please try again.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Shared input style
  const inputCss: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: C.cardBg, border: `1.5px solid ${C.border}`,
    color: C.text, fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  };

  const steps = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Features' },
  ];

  return (
    <div style={{ backgroundColor: C.pageBg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .ap-input:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(200,145,40,0.12); } .amenity-item:hover { border-color: ${C.gold} !important; } .type-card:hover { border-color: ${C.gold} !important; }`}</style>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* ── Slate-800 Header ── */}
        <div style={{ background: C.headerBg, borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
                Property Management
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Add New Property
              </h1>
              <p style={{ margin: '6px 0 0', color: C.textLight, fontSize: '14px', lineHeight: 1.6 }}>
                Fill in the details below to list your property.
              </p>
            </div>
            <Link to="/dashboard/landlord/my-properties" style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.20)', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 600, alignSelf: 'flex-start',
            }}>
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        </div>

        {/* ── Step Indicators ── */}
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          {steps.map((s, i) => {
            const done    = step > s.n;
            const current = step === s.n;
            return (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '13px',
                  background: done ? C.green : current ? C.gold : C.slate100,
                  color: done || current ? '#fff' : C.textMuted,
                  border: `2px solid ${done ? C.green : current ? C.gold : C.border}`,
                  transition: 'all 0.3s',
                }}>
                  {done ? <Check size={14} /> : s.n}
                </div>
                <span style={{ fontSize: '13px', fontWeight: current ? 700 : 500, color: current ? C.gold : done ? C.green : C.textMuted }}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div style={{ width: 40, height: 2, background: step > s.n ? C.gold : C.border, borderRadius: '2px', transition: 'background 0.3s', margin: '0 4px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Error Banner ── */}
        {errors.length > 0 && (
          <div style={{ background: C.redBg, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
            {errors.map((err, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.red, fontSize: '13px', marginBottom: i < errors.length - 1 ? '6px' : 0 }}>
                <AlertCircle size={14} /> {err}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ══ Step 1: Basic Information ══ */}
          {step === 1 && (
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.slate500, fontWeight: 700, marginBottom: '4px' }}>Step 1 of 3</div>
              <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Basic Information</h2>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Property Title *</label>
                <input className="ap-input" type="text" name="title" value={formData.title} onChange={handleInputChange}
                  style={inputCss} placeholder="e.g., Modern 2BR Apartment in Masaki" required />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Description *</label>
                <textarea className="ap-input" name="description" value={formData.description} onChange={handleInputChange}
                  style={{ ...inputCss, minHeight: '120px', resize: 'vertical' }}
                  placeholder="Describe your property, highlighting key features and amenities..." required />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Property Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {propertyTypes.map(type => {
                    const Icon = type.icon;
                    const selected = formData.type === type.value;
                    return (
                      <div key={type.value} className="type-card"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        style={{
                          padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                          border: `2px solid ${selected ? C.gold : C.border}`,
                          background: selected ? C.goldBg : C.slate100,
                          transition: 'all 0.2s',
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
                  <input className="ap-input" type="text" name="location" value={formData.location} onChange={handleInputChange}
                    style={inputCss} placeholder="e.g., Dar es Salaam" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>District *</label>
                  <input className="ap-input" type="text" name="district" value={formData.district} onChange={handleInputChange}
                    style={inputCss} placeholder="e.g., Kinondoni" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Ward *</label>
                  <input className="ap-input" type="text" name="ward" value={formData.ward} onChange={handleInputChange}
                    style={inputCss} placeholder="e.g., Masaki" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Street *</label>
                  <input className="ap-input" type="text" name="street" value={formData.street} onChange={handleInputChange}
                    style={inputCss} placeholder="e.g., Toure Drive" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Full Address *</label>
                  <input className="ap-input" type="text" name="address" value={formData.address} onChange={handleInputChange}
                    style={inputCss} placeholder="e.g., Plot 34, Toure Drive" required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                <button type="button" onClick={handleNext}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow }}>
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ══ Step 2: Property Details ══ */}
          {step === 2 && (
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.slate500, fontWeight: 700, marginBottom: '4px' }}>Step 2 of 3</div>
              <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Property Details</h2>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Monthly Price (TZS) *</label>
                <input className="ap-input" type="number" name="price" value={formData.price} onChange={handleInputChange}
                  style={inputCss} placeholder="e.g., 800000" min="0" required />
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMuted }}>
                  This is the rent amount per month. Tenants will pay this rate for the payment period you set below.
                </p>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Payment Period *</label>
                <select
                  className="ap-input"
                  name="payment_duration_months"
                  value={formData.payment_duration_months}
                  onChange={handleInputChange}
                  style={inputCss}
                  required
                >
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
                  <input className="ap-input" type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange}
                    style={inputCss} min="0" max="20" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '13px', color: C.text }}>Bathrooms</label>
                  <input className="ap-input" type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange}
                    style={inputCss} min="0" max="20" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                <button type="button" onClick={handleBack}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: C.cardBg, color: C.textSub, border: `1.5px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="button" onClick={handleNext}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow }}>
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ══ Step 3: Features ══ */}
          {step === 3 && (
            <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.slate500, fontWeight: 700, marginBottom: '4px' }}>Step 3 of 3</div>
              <h2 style={{ margin: '0 0 22px', fontSize: '20px', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Property Features</h2>

              {/* Amenities */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: C.text }}>Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {commonAmenities.map(amenity => {
                    const selected = formData.amenities.includes(amenity);
                    return (
                      <div key={amenity} className="amenity-item"
                        onClick={() => handleAmenityToggle(amenity)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                          border: `1.5px solid ${selected ? C.gold : C.border}`,
                          background: selected ? C.goldBg : C.slate100,
                          transition: 'all 0.15s',
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
              </div>

              {/* Images & Videos */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: C.text }}>Property Images</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {formData.images.map((imageFile, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <img src={imageFile.preview} alt={`Property ${index + 1}`}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} loading="lazy" decoding="async" />
                      <button type="button" onClick={() => removeImage(index)}
                        style={{ position: 'absolute', top: '8px', right: '8px', width: 28, height: 28, background: 'rgba(15,23,42,0.7)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label style={{
                    height: '140px', borderRadius: '10px', border: `2px dashed ${C.border}`,
                    background: C.slate100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    <Upload size={28} style={{ color: C.textMuted, marginBottom: '8px' }} />
                    <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 600 }}>Upload Images</span>
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div style={{ marginBottom: '16px', fontSize: '12px', color: C.textMuted }}>
                    {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} selected
                  </div>
                )}

                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: C.text }}>Property Videos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {formData.videos.map((videoFile, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <video src={videoFile.preview} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} muted />
                      <button type="button" onClick={() => removeVideo(index)}
                        style={{ position: 'absolute', top: '8px', right: '8px', width: 28, height: 28, background: 'rgba(15,23,42,0.7)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label style={{
                    height: '140px', borderRadius: '10px', border: `2px dashed ${C.border}`,
                    background: C.slate100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                    <input type="file" multiple accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                    <Video size={28} style={{ color: C.textMuted, marginBottom: '8px' }} />
                    <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 600 }}>Upload Videos</span>
                  </label>
                </div>
                {formData.videos.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: C.textMuted }}>
                    {formData.videos.length} video{formData.videos.length !== 1 ? 's' : ''} selected
                  </div>
                )}
                <div style={{ marginTop: '6px', fontSize: '12px', color: C.textMuted }}>
                  Add at least one image or video
                </div>
              </div>

              {/* Featured */}
              <div style={{ padding: '14px 16px', background: C.slate100, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="featured" id="featured" checked={formData.featured} onChange={handleInputChange}
                    style={{ width: 18, height: 18, accentColor: C.gold, cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>Feature this property</div>
                    <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '2px' }}>Featured properties appear at the top of search results</div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                <button type="button" onClick={handleBack}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: C.cardBg, color: C.textSub, border: `1.5px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="submit" disabled={isLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: isLoading ? C.slate500 : C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: isLoading ? 'none' : C.goldGlow, transition: 'all 0.2s' }}>
                  {isLoading ? (
                    <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating…</>
                  ) : (
                    <><Plus size={15} /> Create Property</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddProperty;