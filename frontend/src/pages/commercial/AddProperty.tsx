import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, X, Upload, MapPin, DollarSign,
  Home, Car, Calendar, Save, ChevronRight
} from 'lucide-react';

// ── Must match the TOKEN_KEY in Api.ts ────────────────────────────────────────
const TOKEN_KEY = 'token';
const API_BASE  = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Amenity { id: number; name: string; icon: string; }

interface FormData {
  title: string; description: string; type: string;
  location: string; address: string;
  price: number; price_type: string;
  parking_spaces: number; furnished: boolean;
  bedrooms: number; bathrooms: number; area: number;
  available_from: string; contact_phone: string; contact_email: string;
  amenities: number[];
}

const AddProperty: React.FC = () => {
  const navigate = useNavigate();

  const [loading,        setLoading]        = useState(false);
  const [amenities,      setAmenities]      = useState<Amenity[]>([]);
  const [images,         setImages]         = useState<File[]>([]);
  const [imagePreviews,  setImagePreviews]  = useState<string[]>([]);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', type: 'office',
    location: '', address: '',
    price: 0, price_type: 'monthly',
    parking_spaces: 0, furnished: false,
    bedrooms: 0, bathrooms: 0, area: 0,
    available_from: '', contact_phone: '', contact_email: '',
    amenities: [],
  });

  useEffect(() => { fetchAmenities(); }, []);

  // ── Fetch amenities ──────────────────────────────────────────────────────
  const fetchAmenities = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/commercial/amenities`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Backend may return { data: [...] } or a plain array
        setAmenities(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch (e) {
      console.error('fetchAmenities error:', e);
    }
  };

  // ── Form handlers ────────────────────────────────────────────────────────
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

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.title.trim())         e.title         = 'Title is required';
    if (!formData.description.trim())   e.description   = 'Description is required';
    if (!formData.location.trim())      e.location      = 'Location is required';
    if (!formData.address.trim())       e.address       = 'Address is required';
    if (!formData.price || formData.price <= 0)  e.price = 'Price must be greater than 0';
    if (!formData.area  || formData.area  <= 0)  e.area  = 'Area must be greater than 0';
    if (!formData.available_from)       e.available_from  = 'Available date is required';
    if (!formData.contact_phone.trim()) e.contact_phone   = 'Contact phone is required';
    if (!formData.contact_email.trim()) e.contact_email   = 'Contact email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.contact_email)) e.contact_email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      // Build FormData — do NOT set Content-Type; browser sets multipart boundary
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

      // Append images as images[0], images[1], …
      images.forEach((img, i) => fd.append(`images[${i}]`, img));

      const res = await fetch(`${API_BASE}/api/commercial/properties`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // ⚠️  Do NOT include Content-Type here — let the browser set it with the boundary
        },
        body: fd,
      });

      if (res.ok) {
        const body = await res.json();
        navigate('/dashboard/commercial/my-properties', {
          state: {
            message:  body.message || '🎉 Property created successfully!',
            property: body.property ?? body,
            type:     'success',
          },
        });
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.errors) {
          // Laravel validation errors are keyed objects
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.errors)) {
            mapped[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
          }
          setErrors(mapped);
        } else {
          setErrors({ submit: err.message || `Server error (${res.status})` });
        }
      }
    } catch (e: any) {
      console.error('Submit error:', e);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Options ──────────────────────────────────────────────────────────────
  const propertyTypes = [
    { value: 'office',      label: 'Office Space'       },
    { value: 'retail',      label: 'Retail Space'       },
    { value: 'warehouse',   label: 'Warehouse'          },
    { value: 'commercial',  label: 'Commercial Building'},
    { value: 'industrial',  label: 'Industrial Space'   },
  ];
  const priceTypes = [
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly',  label: 'Per Year'  },
    { value: 'sale',    label: 'For Sale'  },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        .form-input {
          width: 100%; padding: 11px 16px;
          background: #0C1420; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; color: #E2D5B0; font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
        }
        .form-input::placeholder { color: #2D3748; }
        .form-input:focus { border-color: rgba(212,175,55,0.5); box-shadow: 0 0 0 3px rgba(212,175,55,0.07); }
        .form-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #4A5568; margin-bottom: 8px; }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .panel-header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; gap: 10px; }
        .gold-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4AF37; flex-shrink: 0; box-shadow: 0 0 8px rgba(212,175,55,0.5); }
        .panel-body { padding: 22px; }
        .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
        .error-text { margin-top: 5px; font-size: 11px; color: #F87171; }
        .toggle-wrap { display: flex; align-items: center; gap: 12px; cursor: pointer; margin-top: 28px; }
        .toggle-track { width: 44px; height: 24px; border-radius: 12px; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-thumb { position: absolute; top: 4px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: left 0.2s; }
        .amenity-chip { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s; font-size: 12px; font-weight: 500; background: #0C1420; color: #64748B; }
        .amenity-chip.active { border-color: rgba(212,175,55,0.4); background: rgba(212,175,55,0.08); color: #D4AF37; }
        .amenity-chip:hover:not(.active) { border-color: rgba(212,175,55,0.2); color: #94A3B8; }
        .amenity-check { width: 16px; height: 16px; border-radius: 5px; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .upload-zone { border: 2px dashed rgba(255,255,255,0.06); border-radius: 14px; padding: 36px 20px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
        .upload-zone:hover { border-color: rgba(212,175,55,0.3); background: rgba(212,175,55,0.03); }
        .upload-icon-wrap { width: 52px; height: 52px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
        .img-thumb { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; }
        .img-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .img-remove { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; background: rgba(239,68,68,0.9); border-radius: 8px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border: none; cursor: pointer; }
        .img-thumb:hover .img-remove { opacity: 1; }
        .img-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
        .amenity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .btn-cancel { padding: 12px 24px; background: #0F1829; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: #94A3B8; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { border-color: rgba(212,175,55,0.3); color: #E2D5B0; }
        .btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: #080E1A; border: none; border-radius: 14px; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 24px rgba(212,175,55,0.25); letter-spacing: 0.3px; }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(212,175,55,0.35); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(8,14,26,0.3); border-top-color: #080E1A; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .err-banner { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 10px; }
        select option { background: #0C1420; color: #E2D5B0; }
        @media (max-width: 640px) {
          .field-grid-2, .field-grid-3 { grid-template-columns: 1fr !important; }
          .img-grid { grid-template-columns: repeat(3, 1fr); }
          .amenity-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#4A5568', fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/dashboard/commercial/my-properties')}>Properties</span>
            <ChevronRight size={12} color="#2D3748" />
            <span style={{ color: '#94A3B8', fontSize: 12 }}>Add New</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>New Listing</span>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 6 }}>
            Add Property
          </h1>
          <p style={{ color: '#4A5568', fontSize: 13 }}>List your commercial space on Oweru</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basic Info */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="gold-dot" /><Building2 size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Basic Information</span>
            </div>
            <div className="panel-body">
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="form-label">Property Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="e.g., Modern Office in Dar" />
                  {errors.title && <p className="error-text">{errors.title}</p>}
                </div>
                <div>
                  <label className="form-label">Property Type *</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="form-input">
                    {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="form-input" style={{ resize: 'none' }} placeholder="Describe your property in detail…" />
                {errors.description && <p className="error-text">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="gold-dot" /><MapPin size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Location</span>
            </div>
            <div className="panel-body">
              <div className="field-grid-2">
                <div>
                  <label className="form-label">Area / City *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="form-input" placeholder="e.g., Dar es Salaam" />
                  {errors.location && <p className="error-text">{errors.location}</p>}
                </div>
                <div>
                  <label className="form-label">Full Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-input" placeholder="e.g., Ohio St, Upanga" />
                  {errors.address && <p className="error-text">{errors.address}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Size */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="gold-dot" /><DollarSign size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Pricing & Size</span>
            </div>
            <div className="panel-body">
              <div className="field-grid-3">
                <div>
                  <label className="form-label">Price (TZS) *</label>
                  <input type="number" name="price" value={formData.price || ''} onChange={handleChange} className="form-input" placeholder="500000" min="1" />
                  {errors.price && <p className="error-text">{errors.price}</p>}
                </div>
                <div>
                  <label className="form-label">Price Type *</label>
                  <select name="price_type" value={formData.price_type} onChange={handleChange} className="form-input">
                    {priceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Area (m²) *</label>
                  <input type="number" name="area" value={formData.area || ''} onChange={handleChange} className="form-input" placeholder="120" min="1" />
                  {errors.area && <p className="error-text">{errors.area}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="gold-dot" /><Home size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Property Features</span>
            </div>
            <div className="panel-body">
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="form-label">Bedrooms</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} min="0" className="form-input" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Bathrooms</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} min="0" className="form-input" placeholder="0" />
                </div>
              </div>
              <div className="field-grid-2">
                <div>
                  <label className="form-label"><Car size={11} style={{ display: 'inline', marginRight: 4 }} />Parking Spaces</label>
                  <input type="number" name="parking_spaces" value={formData.parking_spaces} onChange={handleChange} min="0" className="form-input" placeholder="0" />
                </div>
                <div>
                  <div className="toggle-wrap" onClick={() => setFormData(p => ({ ...p, furnished: !p.furnished }))}>
                    <div className="toggle-track" style={{ background: formData.furnished ? '#D4AF37' : '#0C1420', border: `1px solid ${formData.furnished ? '#D4AF37' : 'rgba(255,255,255,0.1)'}` }}>
                      <div className="toggle-thumb" style={{ left: formData.furnished ? '24px' : '4px' }} />
                    </div>
                    <span style={{ fontSize: 13, color: formData.furnished ? '#D4AF37' : '#64748B', fontWeight: 500 }}>Furnished</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Contact */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="gold-dot" /><Calendar size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Availability & Contact</span>
            </div>
            <div className="panel-body">
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="form-label">Available From *</label>
                  <input type="date" name="available_from" value={formData.available_from} onChange={handleChange} className="form-input" />
                  {errors.available_from && <p className="error-text">{errors.available_from}</p>}
                </div>
                <div>
                  <label className="form-label">Contact Phone *</label>
                  <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="form-input" placeholder="+255712345678" />
                  {errors.contact_phone && <p className="error-text">{errors.contact_phone}</p>}
                </div>
              </div>
              <div>
                <label className="form-label">Contact Email *</label>
                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="form-input" placeholder="contact@company.com" />
                {errors.contact_email && <p className="error-text">{errors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="card-panel">
              <div className="panel-header">
                <div className="gold-dot" /><Plus size={14} color="#D4AF37" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Amenities</span>
              </div>
              <div className="panel-body">
                <div className="amenity-grid">
                  {amenities.map(a => {
                    const active = formData.amenities.includes(a.id);
                    return (
                      <div key={a.id} className={`amenity-chip ${active ? 'active' : ''}`} onClick={() => toggleAmenity(a.id)}>
                        <div className="amenity-check" style={{ borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.12)', background: active ? '#D4AF37' : 'transparent' }}>
                          {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#080E1A" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        {a.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="gold-dot" /><Upload size={14} color="#D4AF37" />
              <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Property Images</span>
            </div>
            <div className="panel-body">
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="img-up" />
              <label htmlFor="img-up" className="upload-zone">
                <div className="upload-icon-wrap"><Upload size={20} color="#D4AF37" /></div>
                <p style={{ color: '#E2D5B0', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Click to upload images</p>
                <p style={{ color: '#2D3748', fontSize: 11 }}>PNG, JPG, GIF — max 2MB each</p>
              </label>
              {errors.images && <p className="error-text">{errors.images}</p>}
              {imagePreviews.length > 0 && (
                <div className="img-grid">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="img-thumb">
                      <img src={src} alt="" />
                      <button type="button" className="img-remove" onClick={() => removeImage(i)}>
                        <X size={12} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error banner */}
          {errors.submit && (
            <div className="err-banner">
              <X size={14} color="#F87171" style={{ flexShrink: 0 }} />
              <p style={{ color: '#F87171', fontSize: 13 }}>{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
            <button type="button" className="btn-cancel" onClick={() => navigate('/dashboard/commercial/my-properties')}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating…</> : <><Save size={15} /> Create Property</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProperty;